"""知识库 API — CRUD + 文档摄入 + 搜索测试

权限设计：
- owner: 全部权限（创建/删除 KB、摄入文档、查看所有 KB）
- interviewer: 只读（可搜索公开 KB）
- user: 只读（可搜索公开 KB）
- guest: 不可访问（需要登录才能使用 RAG）
"""
import asyncio
import httpx

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from core.auth.deps import UserContext, get_current_user_or_guest
from core.rag.kb_repo import (
    create_kb as repo_create_kb,
    get_kb,
    list_kbs,
    toggle_kb_link,
    delete_kb as repo_delete_kb,
    create_document,
    update_document_status,
    update_document_stats,
    get_document,
    get_documents_by_status,
    list_documents,
    delete_document,
)
from core.rag.chunk_repo import get_chunks_by_doc
from core.rag.chunker import chunk_text, profile_document
from core.rag.embedder import get_default_embedder
from core.rag.parser import parse_file, ParseError, get_supported_extensions
from core.rag.pipeline import (
    ingest_document,
    ingest_markdown,
    ingest_batch,
    get_pipeline_status,
    STATUS_READY,
    STATUS_ERROR,
)
from core.rag.retriever import hybrid_search, build_context

router = APIRouter(prefix="/api/kb", tags=["knowledge-base"])


def require_login(ctx: UserContext = Depends(get_current_user_or_guest)):
    """依赖：必须登录（任何角色均可）。"""
    if ctx.is_guest:
        raise HTTPException(status_code=401, detail="Login required")
    return ctx


def require_owner(ctx: UserContext = Depends(require_login)):
    """依赖：仅 owner 可访问。"""
    if ctx.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return ctx


# ── Pydantic 模型 ──


class CreateKBRequest(BaseModel):
    name: str
    description: str | None = None
    is_public: bool = False


class SearchRequest(BaseModel):
    query: str
    kb_id: str
    top_k: int | None = None
    final_k: int | None = None


# ── KB CRUD ──


@router.post("")
async def create_kb_endpoint(
    req: CreateKBRequest, ctx: UserContext = Depends(require_owner)
):
    """创建知识库（仅 owner）。"""
    kb_id = repo_create_kb(
        name=req.name,
        description=req.description,
        owner_id=ctx.user_id,
        is_public=req.is_public,
    )
    return {"id": kb_id, "message": "Knowledge base created"}


@router.get("")
async def list_kbs_endpoint(ctx: UserContext = Depends(require_login)):
    """列出知识库。owner 看自己的，其他角色看公开的。"""
    if ctx.role == "owner":
        kbs = list_kbs(owner_id=ctx.user_id, include_public=True)
    else:
        kbs = [kb for kb in list_kbs() if kb.get("is_public")]
    return kbs


@router.get("/linked")
async def list_linked_kbs_endpoint(ctx: UserContext = Depends(get_current_user_or_guest)):
    """公开接口：返回已链接到 AI 助手的知识库（访客/登录用户均可查看）。"""
    kbs = [
        {
            "id": kb["id"],
            "name": kb["name"],
            "description": kb.get("description"),
            "document_count": kb.get("document_count", 0),
            "linked_for_visitor": kb.get("linked_for_visitor", False),
            "linked_for_demo": kb.get("linked_for_demo", False),
            "is_public": kb.get("is_public", False),
        }
        for kb in list_kbs()
        if kb.get("linked_for_visitor") or kb.get("linked_for_demo")
    ]
    return kbs


@router.post("/{kb_id}/link")
async def toggle_kb_link_endpoint(
    kb_id: str,
    mode: str = "both",
    ctx: UserContext = Depends(require_owner),
):
    """切换知识库是否链接到 AI 助手（仅 owner）。

    mode: "visitor" | "demo" | "both"（默认 both，兼容旧调用）
    """
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if kb.get("owner_id") and kb["owner_id"] != ctx.user_id and not kb.get("is_public"):
        raise HTTPException(status_code=403, detail="Access denied")
    linked_v, linked_d = toggle_kb_link(kb_id, mode)
    from core.rag.rag_chat import reset_default_kb_cache
    reset_default_kb_cache()
    return {
        "kb_id": kb_id,
        "linked_for_visitor": linked_v,
        "linked_for_demo": linked_d,
        "is_linked": linked_v or linked_d,
    }


@router.delete("/{kb_id}")
async def delete_kb_endpoint(kb_id: str, ctx: UserContext = Depends(require_owner)):
    """删除知识库（仅 owner）。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if kb.get("owner_id") and kb["owner_id"] != ctx.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    repo_delete_kb(kb_id)
    from core.rag.rag_chat import reset_default_kb_cache
    reset_default_kb_cache()
    return {"message": "Knowledge base deleted"}


@router.get("/supported-types")
async def get_supported_types(ctx: UserContext = Depends(require_login)):
    """返回支持的文件类型列表。"""
    return {"extensions": get_supported_extensions()}


@router.get("/{kb_id}")
async def get_kb_endpoint(kb_id: str, ctx: UserContext = Depends(require_login)):
    """获取单个知识库详情。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    # 权限：非 owner 只能看公开 KB
    if ctx.role != "owner" and not kb.get("is_public"):
        raise HTTPException(status_code=403, detail="Access denied")
    return kb


# ── 文档管理 ──


@router.post("/{kb_id}/documents")
async def upload_document(
    kb_id: str,
    file: UploadFile = File(...),
    title: str = Form(None),
    ctx: UserContext = Depends(require_owner),
):
    """上传文档（支持 md/txt/html/json/pdf/docx）并自动走流水线：parsing → chunking → embedding → ready"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    raw_bytes = await file.read()
    filename = file.filename or "document.md"

    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    # 先解析验证（同步，快速失败）
    try:
        parse_result = parse_file(filename, raw_bytes)
    except ParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc_title = title or parse_result.title or filename
    content_text = parse_result.content

    # 创建文档记录，存储解析后的markdown文本（兼容现有字段类型）
    doc_id = create_document(
        kb_id=kb_id,
        source_type=parse_result.source_type,
        title=doc_title,
        source_path=filename,
        raw_content=content_text,
        embedding_model=get_default_embedder().model_name(),
    )

    # 异步走完整流水线，传入原始文件bytes进行正确解析
    asyncio.create_task(ingest_document(doc_id, kb_id, raw_bytes, filename))

    return {
        "doc_id": doc_id,
        "title": doc_title,
        "source_type": parse_result.source_type,
        "message": "Document uploaded, processing in background",
    }


@router.post("/{kb_id}/documents/batch")
async def upload_documents_batch(
    kb_id: str,
    files: list[UploadFile] = File(...),
    ctx: UserContext = Depends(require_owner),
):
    """批量上传文档。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Max 20 files per batch")

    embedder = get_default_embedder()
    items = []
    results = []

    for file in files:
        raw_bytes = await file.read()
        filename = file.filename or "document.md"
        try:
            parse_result = parse_file(filename, raw_bytes)
        except ParseError as e:
            results.append({"filename": filename, "error": str(e)})
            continue

        doc_id = create_document(
            kb_id=kb_id,
            source_type=parse_result.source_type,
            title=parse_result.title or filename,
            source_path=filename,
            raw_content=parse_result.content,
            embedding_model=embedder.model_name(),
        )
        items.append({
            "doc_id": doc_id,
            "kb_id": kb_id,
            "content": raw_bytes,
            "filename": filename,
        })
        results.append({"filename": filename, "doc_id": doc_id, "status": "queued"})

    # 异步批量处理
    asyncio.create_task(ingest_batch(items, max_concurrency=3))

    return {
        "total": len(files),
        "queued": len(items),
        "failed": len(files) - len(items),
        "results": results,
    }


class IngestURLRequest(BaseModel):
    url: str
    title: str | None = None


@router.post("/{kb_id}/documents/url")
async def ingest_url(
    kb_id: str,
    req: IngestURLRequest,
    ctx: UserContext = Depends(require_owner),
):
    """从 URL 抓取内容并摄入。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(req.url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")
            raw_bytes = resp.content
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Fetch failed: {e}")

    # 根据内容类型推断扩展名
    if "html" in content_type:
        filename = "fetched.html"
    elif "json" in content_type:
        filename = "fetched.json"
    elif "text/plain" in content_type:
        filename = "fetched.txt"
    else:
        filename = "fetched.md"

    try:
        parse_result = parse_file(filename, raw_bytes)
    except ParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc_title = req.title or parse_result.title or req.url
    doc_id = create_document(
        kb_id=kb_id,
        source_type=parse_result.source_type,
        title=doc_title,
        source_path=req.url,
        raw_content=parse_result.content,
        embedding_model=get_default_embedder().model_name(),
    )

    asyncio.create_task(ingest_markdown(doc_id, kb_id, parse_result.content, filename))

    return {
        "doc_id": doc_id,
        "title": doc_title,
        "url": req.url,
        "message": "URL fetched, processing in background",
    }


@router.get("/documents/{doc_id}/status")
async def get_document_status(
    doc_id: str, ctx: UserContext = Depends(require_login)
):
    """查询文档处理流水线状态。"""
    status = get_pipeline_status(doc_id)
    if not status.get("exists"):
        raise HTTPException(status_code=404, detail="Document not found")
    return status


@router.get("/{kb_id}/documents/status/{status}")
async def list_documents_by_status(
    kb_id: str,
    status: str,
    ctx: UserContext = Depends(require_login),
):
    """按状态查询文档（调试用）。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if ctx.role != "owner" and not kb.get("is_public"):
        raise HTTPException(status_code=403, detail="Access denied")
    return get_documents_by_status(status, kb_id)


@router.get("/{kb_id}/documents")
async def list_kb_documents(
    kb_id: str, ctx: UserContext = Depends(require_login)
):
    """列出 KB 下所有文档。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if ctx.role != "owner" and not kb.get("is_public"):
        raise HTTPException(status_code=403, detail="Access denied")
    return list_documents(kb_id)


@router.get("/documents/{doc_id}/chunks")
async def get_document_chunks(
    doc_id: str, ctx: UserContext = Depends(require_owner)
):
    """查看文档的分块（仅 owner，调试用）。"""
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "document": doc,
        "profile": profile_document(doc.get("raw_content") or ""),
        "chunks": get_chunks_by_doc(doc_id),
    }


@router.delete("/documents/{doc_id}")
async def delete_document_endpoint(
    doc_id: str, ctx: UserContext = Depends(require_owner)
):
    """删除文档及其所有分块。"""
    if not get_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    delete_document(doc_id)
    return {"message": "Document deleted"}


# ── 搜索 ──


@router.post("/search")
async def search_endpoint(
    req: SearchRequest, ctx: UserContext = Depends(require_login)
):
    """混合检索测试接口。"""
    kb = get_kb(req.kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if ctx.role != "owner" and not kb.get("is_public"):
        raise HTTPException(status_code=403, detail="Access denied")

    results = await hybrid_search(
        query=req.query,
        kb_id=req.kb_id,
        top_k=req.top_k or 30,
        final_k=req.final_k or 5,
    )
    return {
        "query": req.query,
        "kb_id": req.kb_id,
        "count": len(results),
        "results": [
            {
                "chunk_id": r.chunk_id,
                "content": r.content,
                "score": r.score,
                "source": r.source,
            }
            for r in results
        ],
    }

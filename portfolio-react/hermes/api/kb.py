"""知识库 API — CRUD + 文档摄入 + 搜索测试

权限设计：
- owner: 全部权限（创建/删除 KB、摄入文档、查看所有 KB）
- interviewer: 只读（可搜索公开 KB）
- user: 只读（可搜索公开 KB）
- guest: 不可访问（需要登录才能使用 RAG）
"""
import asyncio

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from core.auth.deps import UserContext, get_current_user_or_guest
from core.rag.kb_repo import (
    create_kb as repo_create_kb,
    get_kb,
    list_kbs,
    create_document,
    update_document_status,
    get_document,
    list_documents,
    delete_document,
)
from core.rag.chunk_repo import get_chunks_by_doc
from core.rag.chunker import chunk_text, profile_document
from core.rag.embedder import get_default_embedder
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
    """上传 Markdown 文档并自动分块 + 嵌入。"""
    kb = get_kb(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    content = (await file.read()).decode("utf-8", errors="ignore")
    doc_title = title or file.filename or "Untitled"

    # 创建文档记录
    doc_id = create_document(
        kb_id=kb_id,
        source_type="markdown",
        title=doc_title,
        source_path=file.filename,
        raw_content=content,
        embedding_model=get_default_embedder().model_name(),
    )

    # 异步摄入（不阻塞响应）
    asyncio.create_task(_ingest_document(doc_id, kb_id, content))

    return {"doc_id": doc_id, "message": "Document uploaded, ingesting in background"}


async def _ingest_document(doc_id: str, kb_id: str, content: str):
    """后台摄入文档：分块 + 嵌入 + 存储。"""
    try:
        update_document_status(doc_id, "processing")

        # 分块
        chunks = chunk_text(content, strategy="auto")
        if not chunks:
            update_document_status(doc_id, "empty")
            return

        # 批量嵌入
        embedder = get_default_embedder()
        texts = [c.content for c in chunks]
        embeddings = await embedder.embed(texts)

        # 存储
        from core.rag.chunk_repo import insert_chunk

        for chunk, emb in zip(chunks, embeddings):
            insert_chunk(
                doc_id=doc_id,
                kb_id=kb_id,
                content=chunk.content,
                chunk_index=chunk.chunk_index,
                token_count=chunk.token_count,
                embedding=emb,
            )

        update_document_status(doc_id, "ready")
    except Exception as e:
        print(f"[ingest] doc {doc_id} failed: {e}")
        update_document_status(doc_id, f"error: {e}")


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

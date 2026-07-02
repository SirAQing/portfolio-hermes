"""异步文档处理流水线 — pending → parsing → chunking → embedding → ready

设计参考 WeKnora internal/loader/loader.go 的状态机模式。

每个阶段：
1. 更新文档状态
2. 执行该阶段任务
3. 成功 → 进入下一阶段；失败 → status=error
"""
import asyncio
import traceback
from dataclasses import dataclass
from datetime import datetime, timezone

from core.rag.kb_repo import (
    update_document_status,
    update_document_stats,
    get_document,
)
from core.rag.parser import parse_file, ParseError, ParseResult
from core.rag.chunker import chunk_text, profile_document, count_tokens
from core.rag.embedder import get_default_embedder
from core.rag.chunk_repo import insert_chunk, delete_chunks_by_doc


# ── 状态常量 ──

STATUS_PENDING = "pending"
STATUS_PARSING = "parsing"
STATUS_CHUNKING = "chunking"
STATUS_EMBEDDING = "embedding"
STATUS_READY = "ready"
STATUS_ERROR = "error"
STATUS_EMPTY = "empty"

# 流水线阶段顺序
PIPELINE_STAGES = [
    STATUS_PARSING,
    STATUS_CHUNKING,
    STATUS_EMBEDDING,
    STATUS_READY,
]


@dataclass
class PipelineResult:
    """流水线执行结果"""
    doc_id: str
    success: bool
    stage: str  # 最后到达的阶段
    chunk_count: int = 0
    total_tokens: int = 0
    error: str = ""


class PipelineError(Exception):
    pass


# ── 阶段实现 ──

async def stage_parse(doc_id: str, raw_content: bytes, filename: str) -> ParseResult:
    """阶段 1: 解析文档 → Markdown 纯文本"""
    update_document_status(doc_id, STATUS_PARSING)
    try:
        result = parse_file(filename, raw_content)
        return result
    except ParseError as e:
        update_document_status(doc_id, STATUS_ERROR, error_message=str(e))
        raise
    except Exception as e:
        update_document_status(doc_id, STATUS_ERROR, error_message=f"Parse error: {e}")
        raise


async def stage_chunk(doc_id: str, content: str, strategy: str = "auto") -> list:
    """阶段 2: 分块"""
    update_document_status(doc_id, STATUS_CHUNKING)
    try:
        chunks = chunk_text(content, strategy=strategy)
        if not chunks:
            update_document_status(doc_id, STATUS_EMPTY)
            return []
        return chunks
    except Exception as e:
        update_document_status(doc_id, STATUS_ERROR, error_message=f"Chunk error: {e}")
        raise


async def stage_embed_and_store(
    doc_id: str,
    kb_id: str,
    chunks: list,
) -> tuple[int, int]:
    """阶段 3+4: 嵌入 + 存储。embedding 失败时降级为无向量存储（关键词检索仍可用）。"""
    update_document_status(doc_id, STATUS_EMBEDDING)
    embedder = get_default_embedder()
    texts = [c.content for c in chunks]

    embeddings = None
    try:
        embeddings = await embedder.embed(texts)
        if len(embeddings) != len(chunks):
            print(f"[pipeline] Embedding count mismatch: {len(embeddings)} != {len(chunks)}, skipping vectors")
            embeddings = None
    except Exception as e:
        print(f"[pipeline] Embedding failed for doc {doc_id}: {e}, storing chunks without vectors")
        embeddings = None

    total_tokens = 0
    for i, chunk in enumerate(chunks):
        emb = embeddings[i] if embeddings is not None else None
        insert_chunk(
            doc_id=doc_id,
            kb_id=kb_id,
            content=chunk.content,
            chunk_index=chunk.chunk_index,
            token_count=chunk.token_count,
            embedding=emb,
        )
        total_tokens += chunk.token_count

    return len(chunks), total_tokens


# ── 主流水线 ──

async def run_pipeline(
    doc_id: str,
    kb_id: str,
    raw_content: bytes,
    filename: str,
    chunk_strategy: str = "auto",
) -> PipelineResult:
    """运行完整流水线: parse → chunk → embed → ready

    任何阶段失败都会停止流水线，文档状态保持 error。
    """
    try:
        # 阶段 1: 解析
        parse_result = await stage_parse(doc_id, raw_content, filename)

        # 阶段 2: 分块
        chunks = await stage_chunk(doc_id, parse_result.content, strategy=chunk_strategy)
        if not chunks:
            return PipelineResult(
                doc_id=doc_id,
                success=True,
                stage=STATUS_EMPTY,
                chunk_count=0,
                total_tokens=0,
            )

        # 阶段 3+4: 嵌入 + 存储
        chunk_count, total_tokens = await stage_embed_and_store(
            doc_id, kb_id, chunks
        )

        # 完成
        update_document_stats(doc_id, chunk_count, total_tokens)
        update_document_status(doc_id, STATUS_READY)

        return PipelineResult(
            doc_id=doc_id,
            success=True,
            stage=STATUS_READY,
            chunk_count=chunk_count,
            total_tokens=total_tokens,
        )
    except Exception as e:
        error_msg = str(e)
        print(f"[pipeline] doc {doc_id} failed at stage: {error_msg}")
        traceback.print_exc()
        return PipelineResult(
            doc_id=doc_id,
            success=False,
            stage=STATUS_ERROR,
            error=error_msg,
        )


# ── 便捷入口 ──

async def ingest_document(
    doc_id: str,
    kb_id: str,
    content: bytes,
    filename: str,
) -> PipelineResult:
    """摄入文档的便捷入口（幂等：先清理旧分块）。"""
    # 幂等：清理旧的分块
    delete_chunks_by_doc(doc_id)
    update_document_status(doc_id, STATUS_PENDING)

    return await run_pipeline(doc_id, kb_id, content, filename)


async def ingest_markdown(
    doc_id: str,
    kb_id: str,
    text: str,
    filename: str = "document.md",
) -> PipelineResult:
    """摄入 Markdown 文本的便捷入口（兼容旧 API）。"""
    content_bytes = text.encode("utf-8")
    return await ingest_document(doc_id, kb_id, content_bytes, filename)


# ── 批量处理 ──

async def ingest_batch(
    items: list[dict],
    max_concurrency: int = 3,
) -> list[PipelineResult]:
    """批量摄入文档。

    items: [{"doc_id", "kb_id", "content", "filename"}, ...]
    max_concurrency: 最大并发数
    """
    semaphore = asyncio.Semaphore(max_concurrency)

    async def _process(item: dict) -> PipelineResult:
        async with semaphore:
            return await ingest_document(
                doc_id=item["doc_id"],
                kb_id=item["kb_id"],
                content=item["content"],
                filename=item.get("filename", "document"),
            )

    tasks = [_process(item) for item in items]
    return await asyncio.gather(*tasks)


# ── 状态查询 ──

def get_pipeline_status(doc_id: str) -> dict:
    """获取文档的流水线状态。"""
    doc = get_document(doc_id)
    if not doc:
        return {"doc_id": doc_id, "exists": False}

    return {
        "doc_id": doc_id,
        "exists": True,
        "status": doc.get("status", "unknown"),
        "chunk_count": doc.get("chunk_count", 0),
        "total_tokens": doc.get("total_tokens", 0),
        "error_message": doc.get("error_message"),
        "processed_at": doc.get("processed_at"),
        "created_at": doc.get("created_at"),
    }

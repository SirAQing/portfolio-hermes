"""混合检索器 — 向量 + 关键词并行 + RRF 融合

参考 WeKnora sqlite/repository.go
"""
import asyncio

from core.rag.chunk_repo import vector_search, keyword_search
from core.rag.fusion import rrf_fuse, SearchResult
from core.rag.embedder import get_default_embedder
from config import RAG_TOP_K, RAG_FINAL_K, RRF_K, RRF_VECTOR_WEIGHT, RRF_KEYWORD_WEIGHT


async def hybrid_search(
    query: str,
    kb_id: str,
    top_k: int = RAG_TOP_K,
    final_k: int = RAG_FINAL_K,
    embedder=None,
) -> list[SearchResult]:
    """
    混合检索：向量 + 关键词并行，RRF 融合。

    1. 向量检索 top_k
    2. 关键词检索 top_k
    3. RRF 融合
    4. 取 final_k
    """
    if embedder is None:
        embedder = get_default_embedder()

    # 并行执行两路检索
    vector_task = _vector_search_async(query, kb_id, top_k, embedder)
    keyword_task = asyncio.to_thread(keyword_search, query, kb_id, top_k)

    vector_results_raw, keyword_results_raw = await asyncio.gather(
        vector_task, keyword_task, return_exceptions=True
    )

    # 容错：单路失败不影响另一路
    vector_results: list[SearchResult] = []
    if not isinstance(vector_results_raw, Exception):
        for r in vector_results_raw:
            dist = r.get("distance")
            vector_results.append(
                SearchResult(
                    chunk_id=r["chunk_id"],
                    content=r["content"],
                    score=1.0 - (dist if dist is not None else 0.0),
                    source="vector",
                )
            )

    keyword_results: list[SearchResult] = []
    if not isinstance(keyword_results_raw, Exception):
        for r in keyword_results_raw:
            rank = r.get("rank")
            keyword_results.append(
                SearchResult(
                    chunk_id=r["chunk_id"],
                    content=r["content"],
                    score=-rank if rank is not None else 0.0,
                    source="keyword",
                )
            )

    # RRF 融合
    fused = rrf_fuse(
        vector_results,
        keyword_results,
        k=RRF_K,
        vector_weight=RRF_VECTOR_WEIGHT,
        keyword_weight=RRF_KEYWORD_WEIGHT,
    )

    return fused[:final_k]


async def _vector_search_async(query: str, kb_id: str, top_k: int, embedder) -> list[dict]:
    """向量检索异步包装。"""
    embeddings = await embedder.embed([query])
    if not embeddings:
        return []
    return vector_search(embeddings[0], kb_id, top_k)


def build_context(results: list[SearchResult], max_chars: int = 4000) -> str:
    """将检索结果构建为 LLM 上下文字符串。"""
    parts: list[str] = []
    total = 0
    for i, r in enumerate(results, 1):
        snippet = r.content.strip()
        if total + len(snippet) > max_chars:
            break
        parts.append(f"[知识库片段-{i}] {snippet}")
        total += len(snippet)
    return "\n\n".join(parts)

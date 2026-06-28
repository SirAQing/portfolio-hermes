"""RRF 融合算法 — Reciprocal Rank Fusion

参考 WeKnora search_fusion.go，核心 ~20 行
"""
from dataclasses import dataclass


@dataclass
class SearchResult:
    """检索结果项"""
    chunk_id: str
    content: str
    score: float = 0.0
    source: str = ""  # "vector" | "keyword"


def rrf_fuse(
    vector_results: list[SearchResult],
    keyword_results: list[SearchResult],
    k: int = 60,
    vector_weight: float = 1.0,
    keyword_weight: float = 1.0,
) -> list[SearchResult]:
    """
    RRF 融合：score = vw/(k+vr) + kw/(k+kr)

    返回按融合分数降序排列的结果。同一 chunk_id 在两个列表中出现会合并分数。
    """
    scores: dict[str, float] = {}
    items: dict[str, SearchResult] = {}

    for rank, r in enumerate(vector_results):
        scores[r.chunk_id] = scores.get(r.chunk_id, 0.0) + vector_weight / (k + rank)
        if r.chunk_id not in items:
            items[r.chunk_id] = r

    for rank, r in enumerate(keyword_results):
        scores[r.chunk_id] = scores.get(r.chunk_id, 0.0) + keyword_weight / (k + rank)
        if r.chunk_id not in items:
            items[r.chunk_id] = r

    # 按分数排序
    sorted_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)
    results = []
    for cid in sorted_ids:
        item = items[cid]
        results.append(
            SearchResult(
                chunk_id=cid,
                content=item.content,
                score=scores[cid],
                source=item.source,
            )
        )
    return results

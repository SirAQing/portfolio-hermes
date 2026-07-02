"""Chroma 向量存储封装层 — 替代 sqlite-vec 的向量索引。

职责：
- 管理 PersistentClient 与 Collection 单例
- 提供按 chunk 写入、按 doc/kb 删除、按 kb 检索
- 使用 cosine 距离，与原先 sqlite-vec 的 vec_distance_cosine 口径一致
"""

import chromadb
from chromadb.config import Settings

from config import CHROMA_PERSIST_DIR


_client: chromadb.ClientAPI | None = None
_collection: chromadb.Collection | None = None


def get_client() -> chromadb.ClientAPI:
    """获取 Chroma 持久化客户端（单例）。"""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def get_collection() -> chromadb.Collection:
    """获取 hermes_chunks 集合（单例）。"""
    global _collection
    if _collection is None:
        _collection = get_client().get_or_create_collection(
            name="hermes_chunks",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def reset_cache():
    """重置单例缓存（主要用于测试）。"""
    global _client, _collection
    _client = None
    _collection = None


def upsert_chunk_vector(
    chunk_id: str,
    kb_id: str,
    doc_id: str,
    content: str,
    embedding: list[float],
) -> None:
    """写入或更新一个 chunk 的向量、内容与元数据。"""
    get_collection().upsert(
        ids=[chunk_id],
        embeddings=[embedding],
        documents=[content],
        metadatas=[{"kb_id": kb_id, "doc_id": doc_id}],
    )


def delete_doc_vectors(doc_id: str) -> None:
    """删除某文档下的所有向量。"""
    get_collection().delete(where={"doc_id": doc_id})


def delete_kb_vectors(kb_id: str) -> None:
    """删除某知识库下的所有向量。"""
    get_collection().delete(where={"kb_id": kb_id})


def search_vectors(
    query_embedding: list[float],
    kb_id: str,
    top_k: int = 30,
) -> list[dict]:
    """在指定知识库中做向量检索。

    返回 list[dict]，字段与 chunk_repo.vector_search 兼容：
    chunk_id, distance, content, kb_id, doc_id
    """
    results = get_collection().query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"kb_id": {"$eq": kb_id}},
        include=["metadatas", "documents", "distances"],
    )

    out: list[dict] = []
    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    for cid, dist, doc, meta in zip(ids, distances, documents, metadatas):
        out.append(
            {
                "chunk_id": cid,
                "distance": dist,
                "content": doc,
                "kb_id": meta.get("kb_id"),
                "doc_id": meta.get("doc_id"),
            }
        )
    return out

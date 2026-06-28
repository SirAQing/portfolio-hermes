"""Chunk 数据访问层 — 存储分块、向量、FTS 索引"""
import struct
import uuid

from models import get_db
from core.rag.tokenizer import cjk_bigram_tokenize


def _serialize_vector(vec: list[float]) -> bytes:
    """将 float 列表序列化为 vec0 接受的 little-endian bytes。"""
    return struct.pack(f"{len(vec)}f", *vec)


def insert_chunk(
    doc_id: str,
    kb_id: str,
    content: str,
    chunk_index: int,
    token_count: int,
    embedding: list[float] | None = None,
) -> str:
    """插入分块，可选写入向量。返回 chunk_id。"""
    chunk_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO chunks (id, doc_id, kb_id, content, chunk_index, token_count)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (chunk_id, doc_id, kb_id, content, chunk_index, token_count),
        )
        # FTS5 索引（CJK 二元分词后存储）
        fts_content = cjk_bigram_tokenize(content)
        conn.execute(
            "INSERT INTO chunks_fts (chunk_id, content) VALUES (?, ?)",
            (chunk_id, fts_content),
        )
        # 向量索引
        if embedding is not None:
            try:
                conn.execute(
                    "INSERT INTO chunks_vec (chunk_id, embedding) VALUES (?, ?)",
                    (chunk_id, _serialize_vector(embedding)),
                )
            except Exception as e:
                print(f"[chunk_repo] vec insert skipped: {e}")
    return chunk_id


def vector_search(
    query_embedding: list[float], kb_id: str, top_k: int = 30
) -> list[dict]:
    """向量检索：sqlite-vec 余弦相似度。"""
    qv = _serialize_vector(query_embedding)
    with get_db() as conn:
        try:
            rows = conn.execute(
                """SELECT v.chunk_id, v.distance, c.content, c.kb_id, c.doc_id
                   FROM chunks_vec v
                   JOIN chunks c ON c.id = v.chunk_id
                   WHERE c.kb_id = ?
                   ORDER BY v.distance
                   LIMIT ?""",
                (kb_id, top_k),
            ).fetchall()
        except Exception:
            return []
        return [dict(r) for r in rows]


def keyword_search(query: str, kb_id: str, top_k: int = 30) -> list[dict]:
    """关键词检索：FTS5 + CJK 二元分词。"""
    from core.rag.tokenizer import build_fts_query

    fts_query = build_fts_query(query)
    if not fts_query:
        return []
    with get_db() as conn:
        try:
            rows = conn.execute(
                """SELECT f.chunk_id, f.rank, c.content, c.kb_id, c.doc_id
                   FROM chunks_fts f
                   JOIN chunks c ON c.id = f.chunk_id
                   WHERE c.kb_id = ? AND chunks_fts MATCH ?
                   ORDER BY f.rank
                   LIMIT ?""",
                (kb_id, fts_query, top_k),
            ).fetchall()
        except Exception:
            return []
        return [dict(r) for r in rows]


def get_chunks_by_doc(doc_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM chunks WHERE doc_id = ? ORDER BY chunk_index",
            (doc_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_chunks_by_doc(doc_id: str):
    """删除文档的所有分块及其索引。"""
    with get_db() as conn:
        chunk_ids = [
            r["id"]
            for r in conn.execute(
                "SELECT id FROM chunks WHERE doc_id = ?", (doc_id,)
            ).fetchall()
        ]
        for cid in chunk_ids:
            conn.execute("DELETE FROM chunks_fts WHERE chunk_id = ?", (cid,))
            try:
                conn.execute("DELETE FROM chunks_vec WHERE chunk_id = ?", (cid,))
            except Exception:
                pass
        conn.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))

"""Chunk 数据访问层 — 存储分块、FTS 索引、Chroma 向量索引"""
import uuid

from models import get_db
from core.rag import chroma_store
from core.rag.tokenizer import cjk_bigram_tokenize


def insert_chunk(
    doc_id: str,
    kb_id: str,
    content: str,
    chunk_index: int,
    token_count: int,
    embedding: list[float] | None = None,
) -> str:
    """插入分块，可选写入 Chroma 向量。返回 chunk_id。"""
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

    # Chroma 向量索引：在 SQLite 事务外写入，失败不影响元数据
    if embedding is not None:
        try:
            chroma_store.upsert_chunk_vector(
                chunk_id=chunk_id,
                kb_id=kb_id,
                doc_id=doc_id,
                content=content,
                embedding=embedding,
            )
        except Exception as e:
            print(f"[chunk_repo] chroma upsert skipped: {e}")
    return chunk_id


def vector_search(
    query_embedding: list[float], kb_id: str, top_k: int = 30
) -> list[dict]:
    """向量检索：Chroma cosine distance。"""
    try:
        return chroma_store.search_vectors(query_embedding, kb_id, top_k)
    except Exception as e:
        print(f"[chunk_repo] chroma search failed: {e}")
        return []


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
        conn.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))

    try:
        chroma_store.delete_doc_vectors(doc_id)
    except Exception as e:
        print(f"[chunk_repo] chroma delete_doc_vectors skipped: {e}")


def delete_chunks_by_kb(kb_id: str):
    """删除知识库的所有分块及其索引。"""
    with get_db() as conn:
        chunk_ids = [
            r["id"]
            for r in conn.execute(
                "SELECT id FROM chunks WHERE kb_id = ?", (kb_id,)
            ).fetchall()
        ]
        for cid in chunk_ids:
            conn.execute("DELETE FROM chunks_fts WHERE chunk_id = ?", (cid,))
        conn.execute("DELETE FROM chunks WHERE kb_id = ?", (kb_id,))

    try:
        chroma_store.delete_kb_vectors(kb_id)
    except Exception as e:
        print(f"[chunk_repo] chroma delete_kb_vectors skipped: {e}")

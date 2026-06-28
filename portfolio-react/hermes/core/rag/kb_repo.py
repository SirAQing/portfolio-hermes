"""知识库 + 文档 数据访问层"""
import uuid

from models import get_db


def create_kb(name: str, description: str = None, owner_id: str = None, is_public: bool = False) -> str:
    """创建知识库，返回 kb_id。"""
    kb_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO knowledge_bases (id, name, description, owner_id, is_public)
               VALUES (?, ?, ?, ?, ?)""",
            (kb_id, name, description, owner_id, 1 if is_public else 0),
        )
    return kb_id


def get_kb(kb_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)).fetchone()
        return dict(row) if row else None


def list_kbs(owner_id: str = None, include_public: bool = True) -> list[dict]:
    with get_db() as conn:
        if owner_id and include_public:
            rows = conn.execute(
                "SELECT * FROM knowledge_bases WHERE owner_id = ? OR is_public = 1 ORDER BY created_at DESC",
                (owner_id,),
            ).fetchall()
        elif owner_id:
            rows = conn.execute(
                "SELECT * FROM knowledge_bases WHERE owner_id = ? ORDER BY created_at DESC",
                (owner_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM knowledge_bases ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def create_document(
    kb_id: str,
    source_type: str,
    title: str,
    source_path: str = None,
    raw_content: str = None,
    embedding_model: str = None,
) -> str:
    """创建文档记录，返回 doc_id。"""
    doc_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO documents (id, kb_id, source_type, source_path, title, raw_content, status, embedding_model)
               VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)""",
            (doc_id, kb_id, source_type, source_path, title, raw_content, embedding_model),
        )
    return doc_id


def update_document_status(doc_id: str, status: str):
    with get_db() as conn:
        conn.execute(
            "UPDATE documents SET status = ? WHERE id = ?", (status, doc_id)
        )


def get_document(doc_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        return dict(row) if row else None


def list_documents(kb_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM documents WHERE kb_id = ? ORDER BY created_at DESC",
            (kb_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_document(doc_id: str):
    from core.rag.chunk_repo import delete_chunks_by_doc
    delete_chunks_by_doc(doc_id)
    with get_db() as conn:
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))

"""知识库 + 文档 数据访问层"""
import uuid
from datetime import datetime, timezone

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
                "SELECT kb.*, "
                "(SELECT COUNT(*) FROM documents d WHERE d.kb_id = kb.id) as document_count "
                "FROM knowledge_bases kb WHERE kb.owner_id = ? OR kb.is_public = 1 ORDER BY kb.created_at DESC",
                (owner_id,),
            ).fetchall()
        elif owner_id:
            rows = conn.execute(
                "SELECT kb.*, "
                "(SELECT COUNT(*) FROM documents d WHERE d.kb_id = kb.id) as document_count "
                "FROM knowledge_bases kb WHERE kb.owner_id = ? ORDER BY kb.created_at DESC",
                (owner_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT kb.*, "
                "(SELECT COUNT(*) FROM documents d WHERE d.kb_id = kb.id) as document_count "
                "FROM knowledge_bases kb ORDER BY kb.created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def toggle_kb_link(kb_id: str, mode: str = "both") -> tuple[bool, bool]:
    """切换知识库的 AI 助手链接状态，返回新状态 (linked_for_visitor, linked_for_demo)。

    mode: "visitor" | "demo" | "both"
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT is_linked, linked_for_visitor, linked_for_demo FROM knowledge_bases WHERE id = ?",
            (kb_id,),
        ).fetchone()
        if not row:
            return False, False

        new_v = row["linked_for_visitor"]
        new_d = row["linked_for_demo"]

        if mode in ("visitor", "both"):
            new_v = 0 if row["linked_for_visitor"] else 1
        if mode in ("demo", "both"):
            new_d = 0 if row["linked_for_demo"] else 1

        # 同步更新旧字段 is_linked（任一链接即为已链接）
        new_linked = 1 if (new_v or new_d) else 0
        conn.execute(
            "UPDATE knowledge_bases SET is_linked = ?, linked_for_visitor = ?, linked_for_demo = ? WHERE id = ?",
            (new_linked, new_v, new_d, kb_id),
        )
        return bool(new_v), bool(new_d)


def get_linked_kb_ids(mode: str = "both") -> list[str]:
    """获取已链接到指定助手的知识库 ID 列表。

    mode: "visitor" | "demo" | "both"
    - "visitor": 返回 linked_for_visitor=1 的 KB
    - "demo": 返回 linked_for_demo=1 的 KB
    - "both": 返回任一链接的 KB（兼容旧逻辑）
    """
    with get_db() as conn:
        if mode == "visitor":
            rows = conn.execute(
                "SELECT id FROM knowledge_bases WHERE linked_for_visitor = 1 ORDER BY created_at ASC"
            ).fetchall()
        elif mode == "demo":
            rows = conn.execute(
                "SELECT id FROM knowledge_bases WHERE linked_for_demo = 1 ORDER BY created_at ASC"
            ).fetchall()
        else:
            # 兼容旧逻辑：返回任一链接的 KB
            rows = conn.execute(
                "SELECT id FROM knowledge_bases WHERE is_linked = 1 "
                "OR linked_for_visitor = 1 OR linked_for_demo = 1 ORDER BY created_at ASC"
            ).fetchall()
        return [r["id"] for r in rows]


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


def update_document_status(doc_id: str, status: str, error_message: str = None):
    """更新文档状态。

    status: pending | parsing | chunking | embedding | ready | error | empty
    error_message: 失败时的错误信息（status=error 时设置）
    """
    with get_db() as conn:
        if error_message:
            conn.execute(
                "UPDATE documents SET status = ?, error_message = ? WHERE id = ?",
                (status, error_message, doc_id),
            )
        else:
            conn.execute(
                "UPDATE documents SET status = ? WHERE id = ?", (status, doc_id)
            )


def update_document_content(doc_id: str, title: str, raw_content: str) -> bool:
    """更新文档标题与原始内容，并将状态重置为 pending（用于重新走流水线）。"""
    with get_db() as conn:
        cursor = conn.execute(
            """UPDATE documents
               SET title = ?, raw_content = ?, status = 'pending',
                   error_message = NULL, processed_at = NULL
               WHERE id = ?""",
            (title, raw_content, doc_id),
        )
        return cursor.rowcount > 0


def update_document_stats(doc_id: str, chunk_count: int, total_tokens: int):
    """更新文档的分块统计信息。"""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            """UPDATE documents
               SET chunk_count = ?, total_tokens = ?, processed_at = ?
               WHERE id = ?""",
            (chunk_count, total_tokens, now, doc_id),
        )


def get_documents_by_status(status: str, kb_id: str = None) -> list[dict]:
    """按状态查询文档。"""
    with get_db() as conn:
        if kb_id:
            rows = conn.execute(
                "SELECT * FROM documents WHERE status = ? AND kb_id = ? ORDER BY created_at DESC",
                (status, kb_id),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM documents WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        return [dict(r) for r in rows]


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


def delete_kb(kb_id: str):
    """删除知识库及其所有文档和分块。"""
    from core.rag.chunk_repo import delete_chunks_by_kb
    delete_chunks_by_kb(kb_id)
    with get_db() as conn:
        conn.execute("DELETE FROM documents WHERE kb_id = ?", (kb_id,))
        conn.execute("DELETE FROM knowledge_bases WHERE id = ?", (kb_id,))

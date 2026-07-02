"""笔记数据访问层

- metadata / tags 以 JSON TEXT 形式存储在 SQLite 中
- Python 层统一使用 json.dumps / json.loads 序列化与反序列化
"""
import json
import re
import uuid
from datetime import datetime, timezone

from models import get_db


VALID_STATUSES = {"draft", "published", "archived"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _serialize_json(value) -> str:
    if value is None:
        return "[]" if isinstance(value, list) else "{}"
    return json.dumps(value, ensure_ascii=False)


def _parse_json(text: str | None, default):
    if text is None or text == "":
        return default
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return default


def _slugify(title: str) -> str:
    """根据标题生成 URL 友好 slug。"""
    s = title.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")[:120] or "note"


def _ensure_unique_slug(conn, slug: str, exclude_id: str | None = None) -> str:
    """保证 slug 唯一；如冲突则追加短后缀。"""
    candidate = slug
    suffix = 1
    while True:
        if exclude_id:
            row = conn.execute(
                "SELECT id FROM notes WHERE slug = ? AND id != ?",
                (candidate, exclude_id),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT id FROM notes WHERE slug = ?", (candidate,)
            ).fetchone()
        if not row:
            return candidate
        suffix += 1
        candidate = f"{slug}-{suffix}"


def _row_to_note(row) -> dict:
    """将 sqlite3.Row 转换为带解析后 JSON 字段的 dict。"""
    note = dict(row)
    note["tags"] = _parse_json(note.get("tags"), [])
    note["metadata"] = _parse_json(note.get("metadata"), {})
    note["is_kb_synced"] = bool(note.get("is_kb_synced", 0))
    return note


def create_note(
    title: str,
    content: str = "",
    created_by: str | None = None,
    slug: str | None = None,
    tags: list[str] | None = None,
    status: str = "draft",
    metadata: dict | None = None,
    category: str = "",
    description: str = "",
) -> str:
    """创建笔记，返回 note_id。"""
    if status not in VALID_STATUSES:
        status = "draft"
    note_id = str(uuid.uuid4())
    now = _now()
    raw_slug = _slugify(slug or title)
    tags_json = _serialize_json(tags or [])
    metadata_json = _serialize_json(metadata or {})

    with get_db() as conn:
        final_slug = _ensure_unique_slug(conn, raw_slug)
        published_at = now if status == "published" else None
        conn.execute(
            """INSERT INTO notes (
                id, title, slug, content, description, category, status, tags, metadata,
                published_at, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                note_id, title, final_slug, content, description or "", category or "",
                status, tags_json, metadata_json, published_at, created_by,
                now, now,
            ),
        )
    return note_id


def get_note(note_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        return _row_to_note(row) if row else None


def get_note_by_slug(slug: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM notes WHERE slug = ?", (slug,)).fetchone()
        return _row_to_note(row) if row else None


def update_note(note_id: str, **fields) -> bool:
    """更新笔记字段；返回是否成功。"""
    allowed = {
        "title", "slug", "content", "description", "category", "status", "summary", "ai_notes",
        "tags", "metadata", "is_kb_synced", "kb_id", "kb_doc_id",
        "published_at", "view_count", "likes",
    }
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return False

    if "status" in updates and updates["status"] not in VALID_STATUSES:
        updates.pop("status")

    # JSON 字段序列化
    if "tags" in updates:
        updates["tags"] = _serialize_json(updates["tags"])
    if "metadata" in updates:
        updates["metadata"] = _serialize_json(updates["metadata"])

    updates["updated_at"] = _now()

    with get_db() as conn:
        # 若更新 slug，保证唯一性
        if "slug" in updates:
            updates["slug"] = _ensure_unique_slug(conn, _slugify(updates["slug"]), note_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [note_id]
        cursor = conn.execute(
            f"UPDATE notes SET {set_clause} WHERE id = ?", values
        )
        return cursor.rowcount > 0


def delete_note(note_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        return cursor.rowcount > 0


def list_notes(
    q: str | None = None,
    status: str | None = None,
    tag: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """返回笔记列表与总数。"""
    where_clauses = []
    params = []

    if status:
        where_clauses.append("status = ?")
        params.append(status)
    if q:
        where_clauses.append("(title LIKE ? OR content LIKE ? OR slug LIKE ? OR description LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like, like, like])
    if tag:
        # tags 为 JSON 数组，使用 LIKE 匹配 '"tag_name"'
        where_clauses.append("tags LIKE ?")
        params.append(f'%"{tag}"%')
    if category:
        where_clauses.append("category = ?")
        params.append(category)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    with get_db() as conn:
        count_row = conn.execute(
            f"SELECT COUNT(*) AS total FROM notes {where_sql}", params
        ).fetchone()
        total = count_row["total"] if count_row else 0

        rows = conn.execute(
            f"""SELECT * FROM notes {where_sql}
                ORDER BY published_at DESC, updated_at DESC
                LIMIT ? OFFSET ?""",
            params + [limit, offset],
        ).fetchall()
        notes = [_row_to_note(row) for row in rows]
    return notes, total


def list_published_notes(
    q: str | None = None,
    tag: str | None = None,
    category: str | None = None,
    limit: int = 1000,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """返回已发布笔记列表（公开访问用）。"""
    return list_notes(
        q=q,
        status="published",
        tag=tag,
        category=category,
        limit=limit,
        offset=offset,
    )

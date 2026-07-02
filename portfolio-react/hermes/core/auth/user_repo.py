"""用户数据访问层"""
import uuid
from datetime import datetime, timezone

from models import get_db


def create_user(
    email: str,
    username: str,
    password_hash: str,
    role: str = "user",
    created_by: str = None,
    expires_at: str = None,
) -> str:
    """创建用户，返回 user_id。"""
    uid = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO users (id, email, username, password_hash, role, created_by, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (uid, email, username, password_hash, role, created_by, expires_at),
        )
    return uid


def get_user_by_email(email: str) -> dict | None:
    """按邮箱查询用户。"""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def get_user_by_id(uid: str) -> dict | None:
    """按 ID 查询用户。"""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
        return dict(row) if row else None


def update_last_login(uid: str):
    """更新最后登录时间。"""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET last_login_at = ? WHERE id = ?", (now, uid)
        )


def list_users(
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """列出用户，支持搜索/角色/状态筛选与分页。返回 (items, total)。"""
    where_clauses = []
    params = []

    if q:
        where_clauses.append("(email LIKE ? OR username LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like])

    if role:
        where_clauses.append("role = ?")
        params.append(role)

    if status == "active":
        where_clauses.append("is_active = 1")
    elif status == "disabled":
        where_clauses.append("is_active = 0")

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    with get_db() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) AS count FROM users {where_sql}", params
        ).fetchone()["count"]

        rows = conn.execute(
            f"""SELECT id, email, username, role, is_active, nickname, phone,
                       admin_notes, metadata, expires_at, created_by,
                       last_login_at, created_at
                FROM users {where_sql}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?""",
            params + [limit, offset],
        ).fetchall()

    return [dict(r) for r in rows], total


def update_user(user_id: str, **fields) -> bool:
    """更新用户字段，返回是否成功。"""
    allowed = {
        "email",
        "username",
        "role",
        "is_active",
        "nickname",
        "phone",
        "admin_notes",
        "metadata",
    }
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return False

    if "metadata" in updates and isinstance(updates["metadata"], dict):
        import json

        updates["metadata"] = json.dumps(updates["metadata"], ensure_ascii=False)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [user_id]

    with get_db() as conn:
        cursor = conn.execute(
            f"UPDATE users SET {set_clause} WHERE id = ?", values
        )
        return cursor.rowcount > 0


def delete_user(user_id: str) -> bool:
    """删除用户，返回是否成功。"""
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return cursor.rowcount > 0


def reset_user_password(user_id: str, password_hash: str) -> bool:
    """重置用户密码，返回是否成功。"""
    with get_db() as conn:
        cursor = conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (password_hash, user_id),
        )
        return cursor.rowcount > 0


def get_user_stats(user_id: str) -> dict:
    """获取用户统计：对话数、消息数、首次/最后活跃时间。"""
    user = get_user_by_id(user_id)
    if not user:
        return {
            "total_conversations": 0,
            "total_messages": 0,
            "first_seen": None,
            "last_active": None,
        }

    email = user.get("email") or ""
    with get_db() as conn:
        conv = conn.execute(
            """SELECT COUNT(*) AS total,
                      MIN(started_at) AS first_seen,
                      MAX(last_active) AS last_active
               FROM conversations
               WHERE visitor_id = ? OR visitor_name = ?""",
            (user_id, email),
        ).fetchone()

        msg = conn.execute(
            """SELECT COUNT(*) AS total
               FROM messages m
               JOIN conversations c ON m.conversation_id = c.id
               WHERE c.visitor_id = ? OR c.visitor_name = ?""",
            (user_id, email),
        ).fetchone()

    return {
        "total_conversations": conv["total"] or 0,
        "total_messages": msg["total"] or 0,
        "first_seen": conv["first_seen"],
        "last_active": conv["last_active"],
    }

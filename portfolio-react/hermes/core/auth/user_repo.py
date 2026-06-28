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

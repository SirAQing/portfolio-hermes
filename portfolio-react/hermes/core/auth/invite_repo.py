"""面试官邀请码数据访问层"""
import uuid
import secrets
from datetime import datetime, timedelta, timezone

from models import get_db


def create_invite(
    created_by: str,
    company: str = None,
    position: str = None,
    interview_date: str = None,
    max_uses: int = 1,
    expire_days: int = 3,
) -> dict:
    """创建邀请码，返回含 code 的字典。"""
    code = secrets.token_urlsafe(6).upper()[:8]
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=expire_days)
    ).isoformat()
    invite_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """INSERT INTO interviewer_invites
               (id, code, created_by, company, position, interview_date, max_uses, used_count, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (
                invite_id,
                code,
                created_by,
                company,
                position,
                interview_date,
                max_uses,
                expires_at,
            ),
        )
    return {"id": invite_id, "code": code, "expires_at": expires_at}


def get_invite_by_code(code: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM interviewer_invites WHERE code = ?", (code,)
        ).fetchone()
        return dict(row) if row else None


def increment_invite_usage(invite_id: str, linked_user_id: str):
    with get_db() as conn:
        conn.execute(
            "UPDATE interviewer_invites SET used_count = used_count + 1, linked_user_id = ? WHERE id = ?",
            (linked_user_id, invite_id),
        )


def list_invites(created_by: str = None) -> list[dict]:
    with get_db() as conn:
        if created_by:
            rows = conn.execute(
                "SELECT * FROM interviewer_invites WHERE created_by = ? ORDER BY created_at DESC",
                (created_by,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM interviewer_invites ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def is_invite_valid(invite: dict) -> bool:
    """检查邀请码是否有效：未用尽 + 未过期。"""
    if invite["used_count"] >= invite["max_uses"]:
        return False
    expires = datetime.fromisoformat(invite["expires_at"])
    if datetime.now(timezone.utc) > expires:
        return False
    return True

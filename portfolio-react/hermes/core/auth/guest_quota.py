"""访客配额管理 — 按 IP 每日限制"""
import hashlib
import uuid
from datetime import datetime, timezone

from models import get_db
from config import GUEST_DAILY_LIMIT


def _hash_ip(ip: str) -> str:
    """SHA256 哈希 IP，避免明文存储。"""
    return hashlib.sha256(ip.encode()).hexdigest()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def check_guest_quota(ip: str) -> tuple[bool, int]:
    """检查访客配额，返回 (允许, 剩余次数)。"""
    ip_hash = _hash_ip(ip)
    today = _today()
    with get_db() as conn:
        row = conn.execute(
            "SELECT query_count FROM guest_quotas WHERE ip_hash = ? AND query_date = ?",
            (ip_hash, today),
        ).fetchone()
    used = row["query_count"] if row else 0
    remaining = GUEST_DAILY_LIMIT - used
    return (remaining > 0), remaining


def increment_guest_quota(ip: str):
    """对话成功后调用，计数 +1。"""
    ip_hash = _hash_ip(ip)
    today = _today()
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            """INSERT INTO guest_quotas (id, ip_hash, query_date, query_count, last_query_at)
               VALUES (?, ?, ?, 1, ?)
               ON CONFLICT(ip_hash, query_date)
               DO UPDATE SET query_count = query_count + 1, last_query_at = ?""",
            (str(uuid.uuid4()), ip_hash, today, now, now),
        )

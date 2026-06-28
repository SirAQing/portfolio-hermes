"""FastAPI 依赖注入 — 统一用户/访客上下文"""
from dataclasses import dataclass

from fastapi import Request, Header

from core.auth.jwt_handler import decode_token
from core.auth.user_repo import get_user_by_id
from core.auth.guest_quota import check_guest_quota


@dataclass
class UserContext:
    """统一用户上下文：登录用户或访客。"""
    is_guest: bool
    user_id: str | None = None
    role: str = "guest"
    email: str | None = None
    ip: str | None = None
    quota_remaining: int | None = None


def get_client_ip(request: Request) -> str:
    """获取客户端 IP（支持代理转发）。"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get_current_user_or_guest(
    request: Request,
    authorization: str | None = Header(None),
) -> UserContext:
    """统一入口：有 Bearer Token 返回 User，无 Token 返回 Guest。"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user = get_user_by_id(payload["sub"])
            if user and user["is_active"]:
                return UserContext(
                    is_guest=False,
                    user_id=user["id"],
                    role=user["role"],
                    email=user["email"],
                )
    # 访客
    ip = get_client_ip(request)
    allowed, remaining = check_guest_quota(ip)
    return UserContext(
        is_guest=True, role="guest", ip=ip, quota_remaining=remaining
    )

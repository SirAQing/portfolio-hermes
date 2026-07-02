"""认证 API 路由 — 注册/登录/刷新/me/warmup/面试官兑换"""
import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr

from core.auth.password import hash_password, verify_password
from core.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from core.auth.user_repo import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_last_login,
)
from core.auth.deps import UserContext, get_current_user_or_guest
from core.auth.invite_repo import (
    get_invite_by_code,
    increment_invite_usage,
    is_invite_valid,
)
from models import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RedeemInviteRequest(BaseModel):
    code: str


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _build_auth_response(user: dict) -> dict:
    """构建登录/注册成功响应，含 access + refresh token。"""
    access = create_access_token(user["id"], user["role"])
    refresh = create_refresh_token(user["id"])
    token_hash = _hash_token(refresh)
    with get_db() as conn:
        conn.execute(
            """INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
               VALUES (?, ?, ?, ?)""",
            (
                str(uuid.uuid4()),
                user["id"],
                token_hash,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user["role"],
        },
    }


@router.post("/register")
async def register(req: RegisterRequest):
    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    uid = create_user(
        req.email, req.username, hash_password(req.password), role="user"
    )
    user = get_user_by_id(uid)
    return _build_auth_response(user)


@router.post("/login")
async def login(req: LoginRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account disabled")
    update_last_login(user["id"])
    return _build_auth_response(user)


@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = get_user_by_id(payload["sub"])
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    # 检查是否已撤销
    token_hash = _hash_token(req.refresh_token)
    with get_db() as conn:
        row = conn.execute(
            "SELECT revoked FROM refresh_tokens WHERE token_hash = ?",
            (token_hash,),
        ).fetchone()
        if row and row["revoked"]:
            raise HTTPException(status_code=401, detail="Token revoked")
    access = create_access_token(user["id"], user["role"])
    return {"access_token": access, "token_type": "bearer"}


@router.get("/me")
async def me(ctx: UserContext = Depends(get_current_user_or_guest)):
    if ctx.is_guest:
        return {
            "is_guest": True,
            "role": "guest",
            "quota_remaining": ctx.quota_remaining,
        }
    user = get_user_by_id(ctx.user_id)
    return {
        "is_guest": False,
        "user_id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
    }


@router.get("/warmup")
async def auth_warmup(ctx: UserContext = Depends(get_current_user_or_guest)):
    """前端探测登录状态 + 配额。"""
    if ctx.is_guest:
        return {
            "is_guest": True,
            "role": "guest",
            "quota_remaining": ctx.quota_remaining,
        }
    return {"is_guest": False, "role": ctx.role, "email": ctx.email}


@router.post("/interviewer/redeem")
async def redeem_interviewer_invite(req: RedeemInviteRequest):
    """凭邀请码登录面试官账号（免注册）。"""
    invite = get_invite_by_code(req.code.upper().strip())
    if not invite or not is_invite_valid(invite):
        raise HTTPException(
            status_code=404, detail="Invalid or expired invite code"
        )
    # 创建 interviewer 账号
    random_email = f"interviewer-{secrets.token_hex(4)}@hermes.local"
    uid = create_user(
        email=random_email,
        username=f"Interviewer-{(invite.get('company') or 'Guest')[:8]}",
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role="interviewer",
        created_by=invite["created_by"],
    )
    increment_invite_usage(invite["id"], uid)
    user = get_user_by_id(uid)
    return _build_auth_response(user)

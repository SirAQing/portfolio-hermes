"""管理后台 API — owner 专属（邀请码管理）"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth.deps import UserContext, get_current_user_or_guest
from core.auth.invite_repo import create_invite, list_invites

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateInviteRequest(BaseModel):
    company: str | None = None
    position: str | None = None
    interview_date: str | None = None
    max_uses: int = 1
    expire_days: int = 3


def require_owner(ctx: UserContext = Depends(get_current_user_or_guest)):
    """依赖：仅 owner 可访问。"""
    if ctx.is_guest or ctx.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return ctx


@router.post("/invites")
async def create_interviewer_invite(
    req: CreateInviteRequest, ctx: UserContext = Depends(require_owner)
):
    """生成面试邀请码。"""
    invite = create_invite(
        created_by=ctx.user_id,
        company=req.company,
        position=req.position,
        interview_date=req.interview_date,
        max_uses=req.max_uses,
        expire_days=req.expire_days,
    )
    return invite


@router.get("/invites")
async def list_all_invites(ctx: UserContext = Depends(require_owner)):
    """列出当前 owner 创建的所有邀请码。"""
    return list_invites(created_by=ctx.user_id)

"""管理后台 API — owner 专属（邀请码管理、系统配置、数据看板）"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Optional
from datetime import date, datetime, timedelta
import json

import httpx

from core.auth.deps import UserContext, get_current_user_or_guest
from core.auth.invite_repo import create_invite, list_invites
from core.auth import user_repo
from core.auth.password import hash_password
from core.settings_repo import (
    get_all_settings, get_setting, set_setting, delete_setting,
    SETTING_KEYS, init_default_settings
)
from core.notes import note_repo
from core.notes.note_service import ai_annotate_note, sync_note_to_kb
from core.notes.fetcher import fetch_url
from models import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateInviteRequest(BaseModel):
    company: str | None = None
    position: str | None = None
    interview_date: str | None = None
    max_uses: int = 1
    expire_days: int = 3


class UpdateSettingsRequest(BaseModel):
    # 全局配置
    system_prompt: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_base_url: Optional[str] = None
    llm_model: Optional[str] = None
    embedding_api_key: Optional[str] = None
    embedding_base_url: Optional[str] = None
    embedding_model: Optional[str] = None
    embedding_dimension: Optional[int] = None
    rag_top_k: Optional[int] = None
    rag_final_k: Optional[int] = None
    rrf_vector_weight: Optional[float] = None
    rrf_keyword_weight: Optional[float] = None
    # 访客助手专属配置
    visitor_system_prompt: Optional[str] = None
    visitor_llm_api_key: Optional[str] = None
    visitor_llm_base_url: Optional[str] = None
    visitor_llm_model: Optional[str] = None
    visitor_enable_web_search: Optional[bool] = None
    visitor_enable_tools: Optional[bool] = None
    visitor_max_tokens: Optional[int] = None
    visitor_temperature: Optional[float] = None
    # Demo助手专属配置
    demo_system_prompt: Optional[str] = None
    demo_llm_api_key: Optional[str] = None
    demo_llm_base_url: Optional[str] = None
    demo_llm_model: Optional[str] = None
    demo_enable_web_search: Optional[bool] = None
    demo_enable_tools: Optional[bool] = None
    demo_max_tokens: Optional[int] = None
    demo_temperature: Optional[float] = None


# ── 笔记管理请求模型 ──


class CreateNoteRequest(BaseModel):
    title: str
    content: str = ""
    slug: Optional[str] = None
    description: Optional[str] = ""
    category: Optional[str] = ""
    tags: list[str] = []
    status: str = "draft"
    metadata: dict = {}


class UpdateNoteRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    ai_notes: Optional[str] = None
    metadata: Optional[dict] = None


class SyncToKBRequest(BaseModel):
    kb_id: Optional[str] = None


class FetchUrlRequest(BaseModel):
    url: str


# ── 用户管理请求模型 ──


class CreateUserRequest(BaseModel):
    email: str
    username: str
    password: str
    role: str = "user"


class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    admin_notes: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


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


@router.get("/settings")
async def get_settings(ctx: UserContext = Depends(require_owner)):
    """获取所有系统配置（敏感字段如api_key会脱敏返回）。"""
    init_default_settings()
    settings = get_all_settings()

    sensitive_keys = {
        "llm_api_key", "embedding_api_key",
        "visitor_llm_api_key", "demo_llm_api_key",
    }
    result = {}
    for key, value in settings.items():
        if key in sensitive_keys and value:
            if len(str(value)) > 8:
                result[key] = str(value)[:4] + "****" + str(value)[-4:]
            else:
                result[key] = "****"
        else:
            result[key] = value

    return result


@router.put("/settings")
async def update_settings(req: UpdateSettingsRequest, ctx: UserContext = Depends(require_owner)):
    """更新系统配置。"""
    updates = {
        # 全局配置
        SETTING_KEYS["SYSTEM_PROMPT"]: req.system_prompt,
        SETTING_KEYS["LLM_API_KEY"]: req.llm_api_key,
        SETTING_KEYS["LLM_BASE_URL"]: req.llm_base_url,
        SETTING_KEYS["LLM_MODEL"]: req.llm_model,
        SETTING_KEYS["EMBEDDING_API_KEY"]: req.embedding_api_key,
        SETTING_KEYS["EMBEDDING_BASE_URL"]: req.embedding_base_url,
        SETTING_KEYS["EMBEDDING_MODEL"]: req.embedding_model,
        SETTING_KEYS["EMBEDDING_DIMENSION"]: req.embedding_dimension,
        SETTING_KEYS["RAG_TOP_K"]: req.rag_top_k,
        SETTING_KEYS["RAG_FINAL_K"]: req.rag_final_k,
        SETTING_KEYS["RRF_VECTOR_WEIGHT"]: req.rrf_vector_weight,
        SETTING_KEYS["RRF_KEYWORD_WEIGHT"]: req.rrf_keyword_weight,
        # 访客助手专属配置
        SETTING_KEYS["VISITOR_SYSTEM_PROMPT"]: req.visitor_system_prompt,
        SETTING_KEYS["VISITOR_LLM_API_KEY"]: req.visitor_llm_api_key,
        SETTING_KEYS["VISITOR_LLM_BASE_URL"]: req.visitor_llm_base_url,
        SETTING_KEYS["VISITOR_LLM_MODEL"]: req.visitor_llm_model,
        SETTING_KEYS["VISITOR_ENABLE_WEB_SEARCH"]: req.visitor_enable_web_search,
        SETTING_KEYS["VISITOR_ENABLE_TOOLS"]: req.visitor_enable_tools,
        SETTING_KEYS["VISITOR_MAX_TOKENS"]: req.visitor_max_tokens,
        SETTING_KEYS["VISITOR_TEMPERATURE"]: req.visitor_temperature,
        # Demo助手专属配置
        SETTING_KEYS["DEMO_SYSTEM_PROMPT"]: req.demo_system_prompt,
        SETTING_KEYS["DEMO_LLM_API_KEY"]: req.demo_llm_api_key,
        SETTING_KEYS["DEMO_LLM_BASE_URL"]: req.demo_llm_base_url,
        SETTING_KEYS["DEMO_LLM_MODEL"]: req.demo_llm_model,
        SETTING_KEYS["DEMO_ENABLE_WEB_SEARCH"]: req.demo_enable_web_search,
        SETTING_KEYS["DEMO_ENABLE_TOOLS"]: req.demo_enable_tools,
        SETTING_KEYS["DEMO_MAX_TOKENS"]: req.demo_max_tokens,
        SETTING_KEYS["DEMO_TEMPERATURE"]: req.demo_temperature,
    }

    for key, value in updates.items():
        if value is not None:
            if isinstance(value, str) and value.strip() == "":
                delete_setting(key)
            elif isinstance(value, str) and "****" in value:
                # 防止前端把脱敏后的 key 又存回数据库
                continue
            else:
                set_setting(key, value)

    return {"status": "ok", "message": "Settings updated successfully"}


@router.post("/settings/reset/{key}")
async def reset_setting(key: str, ctx: UserContext = Depends(require_owner)):
    """重置单个配置为默认值。"""
    valid_keys = set(SETTING_KEYS.values())
    if key not in valid_keys:
        raise HTTPException(status_code=400, detail=f"Invalid setting key: {key}")
    delete_setting(key)
    init_default_settings()
    return {"status": "ok", "key": key}


# ── 笔记管理 ──


@router.get("/notes")
async def list_notes_endpoint(
    q: Optional[str] = None,
    status: Optional[str] = None,
    tag: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: UserContext = Depends(require_owner),
):
    """笔记列表 + 搜索 + 状态/标签/分类筛选 + 分页。"""
    notes, total = note_repo.list_notes(
        q=q, status=status, tag=tag, category=category, limit=limit, offset=offset
    )
    return {"items": notes, "total": total, "limit": limit, "offset": offset}


@router.post("/notes")
async def create_note_endpoint(
    req: CreateNoteRequest, ctx: UserContext = Depends(require_owner)
):
    """创建笔记草稿。"""
    note_id = note_repo.create_note(
        title=req.title,
        content=req.content,
        created_by=ctx.user_id,
        slug=req.slug,
        description=req.description,
        category=req.category,
        tags=req.tags,
        status=req.status,
        metadata=req.metadata,
    )
    note = note_repo.get_note(note_id)
    return note


@router.get("/notes/{note_id}")
async def get_note_endpoint(
    note_id: str, ctx: UserContext = Depends(require_owner)
):
    """获取笔记详情。"""
    note = note_repo.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/notes/{note_id}")
async def update_note_endpoint(
    note_id: str,
    req: UpdateNoteRequest,
    ctx: UserContext = Depends(require_owner),
):
    """更新笔记内容/状态/标签等。"""
    note = note_repo.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = req.model_dump(exclude_unset=True)
    if not update_data:
        return note

    note_repo.update_note(note_id, **update_data)
    return note_repo.get_note(note_id)


@router.delete("/notes/{note_id}")
async def delete_note_endpoint(
    note_id: str, ctx: UserContext = Depends(require_owner)
):
    """删除笔记。"""
    note = note_repo.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note_repo.delete_note(note_id)
    return {"message": "Note deleted"}


@router.post("/notes/{note_id}/publish")
async def publish_note_endpoint(
    note_id: str, ctx: UserContext = Depends(require_owner)
):
    """发布笔记。"""
    note = note_repo.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    from datetime import datetime, timezone

    published_at = note.get("published_at") or datetime.now(timezone.utc).isoformat()
    note_repo.update_note(note_id, status="published", published_at=published_at)
    return note_repo.get_note(note_id)


@router.post("/notes/{note_id}/ai-annotate")
async def ai_annotate_note_endpoint(
    note_id: str, ctx: UserContext = Depends(require_owner)
):
    """触发 AI 摘要/批注/标签生成。"""
    note = note_repo.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    try:
        result = await ai_annotate_note(note_id, mode="demo")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI annotate failed: {e}")
    return result


@router.post("/notes/{note_id}/sync-to-kb")
async def sync_note_to_kb_endpoint(
    note_id: str,
    req: SyncToKBRequest = SyncToKBRequest(),
    ctx: UserContext = Depends(require_owner),
):
    """将笔记同步到知识库；默认使用/创建名为「笔记」的知识库。"""
    note = note_repo.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    try:
        result = await sync_note_to_kb(note_id, ctx.user_id, kb_id=req.kb_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Sync to KB failed: {e}")
    return result


@router.post("/notes/fetch-url")
async def fetch_url_endpoint(
    req: FetchUrlRequest,
    ctx: UserContext = Depends(require_owner),
):
    """根据 URL 抓取网页内容，返回 Markdown 格式供新建笔记使用。"""
    try:
        result = await fetch_url(req.url)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch URL: HTTP {e.response.status_code}"
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {e}")
    return result


# ── 用户管理 ──


def _serialize_user(user: dict) -> dict:
    """统一序列化用户字段，供管理后台返回。"""
    user = dict(user)
    user["status"] = "active" if user.get("is_active") else "disabled"
    metadata = user.get("metadata")
    if isinstance(metadata, str):
        try:
            user["metadata"] = json.loads(metadata)
        except Exception:
            pass
    return user


@router.get("/users")
async def list_users_endpoint(
    q: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(active|disabled)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: UserContext = Depends(require_owner),
):
    """用户列表 + 搜索 + 角色/状态筛选 + 分页。"""
    users, total = user_repo.list_users(
        q=q, role=role, status=status, limit=limit, offset=offset
    )
    return {
        "items": [_serialize_user(u) for u in users],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/users/{user_id}")
async def get_user_endpoint(
    user_id: str, ctx: UserContext = Depends(require_owner)
):
    """获取用户详情。"""
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(user)


@router.post("/users")
async def create_user_endpoint(
    req: CreateUserRequest, ctx: UserContext = Depends(require_owner)
):
    """创建新用户。"""
    existing = user_repo.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = hash_password(req.password)
    user_id = user_repo.create_user(
        email=req.email,
        username=req.username,
        password_hash=password_hash,
        role=req.role,
        created_by=ctx.user_id,
    )
    user = user_repo.get_user_by_id(user_id)
    return _serialize_user(user)


@router.put("/users/{user_id}")
async def update_user_endpoint(
    user_id: str,
    req: UpdateUserRequest,
    ctx: UserContext = Depends(require_owner),
):
    """更新用户信息/状态/角色等。"""
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") == "owner":
        raise HTTPException(
            status_code=400, detail="Cannot modify owner account"
        )

    update_data = req.model_dump(exclude_unset=True)
    if not update_data:
        return _serialize_user(user)

    if "status" in update_data:
        status = update_data.pop("status")
        if status not in ("active", "disabled"):
            raise HTTPException(
                status_code=400, detail="status must be 'active' or 'disabled'"
            )
        update_data["is_active"] = 1 if status == "active" else 0

    user_repo.update_user(user_id, **update_data)
    return _serialize_user(user_repo.get_user_by_id(user_id))


@router.delete("/users/{user_id}")
async def delete_user_endpoint(
    user_id: str, ctx: UserContext = Depends(require_owner)
):
    """删除用户。"""
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == "owner":
        raise HTTPException(
            status_code=400, detail="Cannot delete owner account"
        )
    user_repo.delete_user(user_id)
    return {"message": "User deleted"}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password_endpoint(
    user_id: str,
    req: ResetPasswordRequest,
    ctx: UserContext = Depends(require_owner),
):
    """重置用户密码。"""
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    password_hash = hash_password(req.new_password)
    user_repo.reset_user_password(user_id, password_hash)
    return {"status": "ok", "message": "Password reset successfully"}


@router.get("/users/{user_id}/stats")
async def get_user_stats_endpoint(
    user_id: str, ctx: UserContext = Depends(require_owner)
):
    """获取用户统计数据。"""
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_repo.get_user_stats(user_id)


# ── 标签聚合 ──


@router.get("/tags")
async def list_tags_endpoint(ctx: UserContext = Depends(require_owner)):
    """从 notes.tags 聚合标签使用次数。"""
    rows = note_repo.list_notes(limit=10000, offset=0)[0]
    tag_counts = {}
    for note in rows:
        tags = note.get("tags") or []
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = []
        if not isinstance(tags, list):
            continue
        for tag in tags:
            if not isinstance(tag, str):
                continue
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    def _tag_color(name: str) -> str:
        """根据标签名生成稳定的柔和色。"""
        import hashlib
        hue = int(hashlib.md5(name.encode("utf-8")).hexdigest(), 16) % 360
        return f"hsl({hue}, 70%, 85%)"

    return [
        {"name": name, "usage_count": count, "color": _tag_color(name)}
        for name, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    ]


@router.get("/analytics/dashboard")
async def get_dashboard_analytics(
    start_date: Optional[date] = Query(None, description="开始日期 ISO，默认 30 天前"),
    end_date: Optional[date] = Query(None, description="结束日期 ISO，默认今天"),
    ctx: UserContext = Depends(require_owner),
):
    """仪表盘数据聚合接口（owner 专属）。"""
    today = date.today()
    start = start_date or (today - timedelta(days=29))
    end = end_date or today

    # 保证 start <= end
    if start > end:
        start, end = end, start

    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end, datetime.max.time())
    start_ts = start_dt.timestamp()
    end_ts = end_dt.timestamp()

    with get_db() as conn:
        # ── KPIs ──
        today_ts_start = datetime.combine(today, datetime.min.time()).timestamp()
        today_ts_end = datetime.combine(today, datetime.max.time()).timestamp()

        kpis = conn.execute(
            """
            SELECT
                (SELECT COUNT(DISTINCT visitor_id) FROM conversations
                 WHERE started_at >= ? AND started_at <= ?) AS visitors_today,
                (SELECT COUNT(*) FROM conversations
                 WHERE started_at >= ? AND started_at <= ?) AS conversations_today,
                (SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id
                 WHERE m.created_at >= ? AND m.created_at <= ?) AS messages_today,
                (SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id
                 WHERE m.created_at >= ? AND m.created_at <= ? AND m.role = 'assistant') AS ai_replies_today,
                (SELECT COUNT(*) FROM users WHERE role != 'owner') AS registered_users,
                (SELECT COUNT(DISTINCT ip_hash) FROM guest_quotas
                 WHERE query_date = ?) AS active_guests_today
            """,
            (
                today_ts_start, today_ts_end,
                today_ts_start, today_ts_end,
                today_ts_start, today_ts_end,
                today_ts_start, today_ts_end,
                today.isoformat(),
            )
        ).fetchone()

        # ── 访问趋势：每日对话数 / 消息数 / 访客数 ──
        visitor_trend = conn.execute(
            """
            SELECT
                date(started_at, 'unixepoch', 'localtime') AS day,
                COUNT(*) AS conversations,
                COUNT(DISTINCT visitor_id) AS visitors,
                COALESCE(SUM(message_count), 0) AS messages
            FROM conversations
            WHERE started_at >= ? AND started_at <= ?
            GROUP BY day
            ORDER BY day
            """,
            (start_ts, end_ts)
        ).fetchall()

        # ── 用户增长：按角色分组 ──
        user_growth = conn.execute(
            """
            SELECT
                date(created_at) AS day,
                SUM(CASE WHEN role = 'owner' THEN 1 ELSE 0 END) AS owner,
                SUM(CASE WHEN role = 'interviewer' THEN 1 ELSE 0 END) AS interviewer,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS user_count
            FROM users
            WHERE date(created_at) >= ? AND date(created_at) <= ?
            GROUP BY day
            ORDER BY day
            """,
            (start.isoformat(), end.isoformat())
        ).fetchall()

        # ── AI 问答量：访客助手 vs Demo 助手 ──
        ai_usage = conn.execute(
            """
            SELECT
                date(m.created_at, 'unixepoch', 'localtime') AS day,
                SUM(CASE WHEN c.mode = 'visitor' THEN 1 ELSE 0 END) AS visitor_mode,
                SUM(CASE WHEN c.mode = 'demo' THEN 1 ELSE 0 END) AS demo_mode
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE m.created_at >= ? AND m.created_at <= ? AND m.role = 'assistant'
            GROUP BY day
            ORDER BY day
            """,
            (start_ts, end_ts)
        ).fetchall()

        # ── 24 小时峰值时段（使用 date_range 内的数据）──
        hourly_peak = conn.execute(
            """
            SELECT
                CAST(strftime('%H', datetime(created_at, 'unixepoch', 'localtime')) AS INTEGER) AS hour,
                COUNT(*) AS count
            FROM messages
            WHERE created_at >= ? AND created_at <= ?
            GROUP BY hour
            ORDER BY hour
            """,
            (start_ts, end_ts)
        ).fetchall()

        # ── 用户角色分布 ──
        role_distribution = conn.execute(
            """
            SELECT role, COUNT(*) AS count
            FROM users
            GROUP BY role
            ORDER BY count DESC
            """
        ).fetchall()

        # ── 最近动态 ──
        recent_activity = conn.execute(
            """
            SELECT
                c.id, c.visitor_name, c.started_at, c.message_count, c.mode,
                (SELECT content FROM messages
                 WHERE conversation_id = c.id AND role = 'visitor'
                 ORDER BY created_at DESC LIMIT 1) AS last_visitor_message
            FROM conversations c
            ORDER BY c.started_at DESC
            LIMIT 10
            """
        ).fetchall()

        # ── 邀请码状态 ──
        invite_status = conn.execute(
            """
            SELECT
                id, code, company, position, max_uses, used_count,
                expires_at, created_at,
                CASE
                    WHEN used_count >= max_uses THEN 'used_up'
                    WHEN expires_at < datetime('now') THEN 'expired'
                    ELSE 'active'
                END AS status
            FROM interviewer_invites
            WHERE created_by = ?
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (ctx.user_id,)
        ).fetchall()

    def fill_days(rows, keys, default=0):
        """把稀疏的按天聚合数据补全为日期范围内的每一天。"""
        result = {}
        current = start
        while current <= end:
            result[current.isoformat()] = {k: default for k in keys}
            current += timedelta(days=1)
        for row in rows:
            day = row["day"]
            if day in result:
                for k in keys:
                    result[day][k] = row[k]
        return [
            {"date": d, **vals}
            for d, vals in sorted(result.items())
        ]

    return {
        "dateRange": {"start": start.isoformat(), "end": end.isoformat()},
        "kpis": {
            "visitorsToday": kpis["visitors_today"] or 0,
            "conversationsToday": kpis["conversations_today"] or 0,
            "messagesToday": kpis["messages_today"] or 0,
            "aiRepliesToday": kpis["ai_replies_today"] or 0,
            "registeredUsers": kpis["registered_users"] or 0,
            "activeGuestsToday": kpis["active_guests_today"] or 0,
        },
        "visitorTrend": fill_days(
            visitor_trend, ["conversations", "visitors", "messages"]
        ),
        "userGrowth": fill_days(
            user_growth, ["owner", "interviewer", "user_count"]
        ),
        "aiUsage": fill_days(
            ai_usage, ["visitor_mode", "demo_mode"]
        ),
        "hourlyPeak": [
            {"hour": row["hour"], "count": row["count"]}
            for row in hourly_peak
        ],
        "roleDistribution": [
            {"role": row["role"], "count": row["count"]}
            for row in role_distribution
        ],
        "recentActivity": [
            {
                "id": row["id"],
                "visitorName": row["visitor_name"] or "匿名访客",
                "startedAt": row["started_at"],
                "messageCount": row["message_count"],
                "mode": row["mode"] or "visitor",
                "lastMessage": (row["last_visitor_message"] or "")[:60],
            }
            for row in recent_activity
        ],
        "inviteStatus": [
            {
                "id": row["id"],
                "code": row["code"],
                "company": row["company"],
                "position": row["position"],
                "maxUses": row["max_uses"],
                "usedCount": row["used_count"],
                "expiresAt": row["expires_at"],
                "status": row["status"],
            }
            for row in invite_status
        ],
    }

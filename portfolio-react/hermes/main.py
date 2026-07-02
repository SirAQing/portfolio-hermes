"""
Hermes Chat API — FastAPI entry point.
Handles visitor chat, SSE streaming, and background notification tasks.
"""
import asyncio
import json
import time
import uuid

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import URGENT_KEYWORDS, SUMMARY_SCHEDULE_HOURS, CORS_ORIGINS
from models import (
    init_db, create_conversation, get_conversation,
    add_message, get_conversation_messages, mark_urgent, get_db
)
from llm import get_response_stream, chat_completion
from notify import send_urgent_notification, send_periodic_summary, check_urgent_keywords, send_realtime_notification
from api.auth import router as auth_router
from api.admin import router as admin_router
from api.kb import router as kb_router
from api.notes import router as notes_router
from core.auth.init_owner import ensure_owner_account
from core.auth.deps import UserContext, get_current_user_or_guest
from core.auth.guest_quota import increment_guest_quota


# ── Background task for scheduled summaries ──

def _seconds_until_next_hour(target_hours: list[int]) -> float:
    """Calculate seconds until the next scheduled hour."""
    from datetime import datetime, timedelta
    now = datetime.now()
    next_times = []
    for h in target_hours:
        target = now.replace(hour=h, minute=0, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        next_times.append(target)
    nearest = min(next_times)
    return (nearest - now).total_seconds()


async def scheduled_summary_loop():
    """Background task: send summaries at fixed hours (e.g. 8:00, 12:00, 17:00)."""
    while True:
        wait = _seconds_until_next_hour(SUMMARY_SCHEDULE_HOURS)
        print(f"[hermes] Next summary in {wait/60:.0f} min (schedule: {SUMMARY_SCHEDULE_HOURS})")
        await asyncio.sleep(wait)
        try:
            await send_periodic_summary()
        except Exception as e:
            print(f"[summary-loop] Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[hermes] Database initialized.")
    ensure_owner_account()
    from core.settings_repo import init_default_settings, get_llm_config_for_mode, validate_llm_config
    init_default_settings()
    print("[hermes] Default settings initialized.")

    # 启动时校验 LLM 配置
    for mode in ("visitor", "demo"):
        try:
            cfg = get_llm_config_for_mode(mode)
            validate_llm_config(cfg)
            print(f"[hermes] LLM config OK for mode={mode} (model={cfg['model']}).")
        except ValueError as e:
            print(f"[hermes] WARNING: mode={mode} {e}")

    # Start background summary task
    summary_task = asyncio.create_task(scheduled_summary_loop())
    print(f"[hermes] Scheduled summary task started (hours: {SUMMARY_SCHEDULE_HOURS}).")

    yield

    summary_task.cancel()
    try:
        await summary_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Hermes Chat API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# 注册认证和管理路由
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(kb_router)
app.include_router(notes_router)


# ── Request/Response Models ──

class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str
    visitor_name: str | None = None
    web_search_enabled: bool = False
    mode: str = "visitor"  # "visitor" | "demo"


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    reply: str


# ── API Endpoints ──

@app.get("/")
async def root():
    return {"status": "ok", "service": "hermes", "message": "Hermes Chat API is running"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "hermes"}


@app.get("/api/warmup")
async def warmup():
    """
    Pre-warm endpoint for cold-start mitigation.
    Called by frontend on page load so the first real API call is fast.
    Touches DB and optionally pings the LLM provider.
    """
    import time as _time
    start = _time.time()

    # Touch SQLite to ensure DB file + schema are loaded in memory
    try:
        from models import get_db
        with get_db() as conn:
            conn.execute("SELECT 1")
    except Exception:
        pass

    elapsed_ms = round((_time.time() - start) * 1000)
    return {
        "status": "ok",
        "message": "Hermes is warm",
        "latency_ms": elapsed_ms,
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    ctx: UserContext = Depends(get_current_user_or_guest),
):
    """
    Non-streaming chat endpoint.
    Receives visitor message, gets AI reply, stores conversation.
    """
    # 访客配额检查
    if ctx.is_guest and ctx.quota_remaining <= 0:
        raise HTTPException(
            status_code=403,
            detail="Guest quota exhausted. Please log in to continue.",
        )

    # Get or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        visitor_id = str(uuid.uuid4())[:8]
        conv_id = create_conversation(visitor_id, req.visitor_name, mode=req.mode)

    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 如果是旧对话且无 mode，尝试从当前请求补齐（幂等）
    if conv.get("mode") is None:
        with get_db() as conn:
            conn.execute("UPDATE conversations SET mode = ? WHERE id = ?", (req.mode, conv_id))

    # Store visitor message
    msg_id = add_message(conv_id, "visitor", req.message)

    # Check for urgent keywords
    is_urgent = check_urgent_keywords(req.message, URGENT_KEYWORDS)
    if is_urgent:
        mark_urgent(conv_id)
        # Fire-and-forget urgent notification
        asyncio.create_task(send_urgent_notification(conv_id, req.message))

    # Build message history for LLM
    history = get_conversation_messages(conv_id, limit=20)
    llm_messages = [{"role": m["role"], "content": m["content"]} for m in history]

    # RAG 增强检索
    rag_context = ""
    from core.rag.rag_chat import should_use_rag, retrieve_context
    if should_use_rag(req.message):
        rag_context, _rag_results = await retrieve_context(req.message, mode=req.mode)

    # Get AI response
    reply = await chat_completion(llm_messages, stream=False, rag_context=rag_context, mode=req.mode)

    # Store AI response
    add_message(conv_id, "assistant", reply)

    # Send realtime notification (await directly for reliability)
    try:
        await send_realtime_notification(conv_id, req.message, reply)
    except Exception as e:
        print(f"[chat] Notification error: {e}")

    # 访客配额计数
    if ctx.is_guest:
        increment_guest_quota(ctx.ip)

    return ChatResponse(conversation_id=conv_id, message_id=msg_id, reply=reply)


@app.post("/api/chat/stream")
async def chat_stream(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    ctx: UserContext = Depends(get_current_user_or_guest),
):
    """
    Streaming chat endpoint using SSE.
    Streams AI response token-by-token.
    """
    # 访客配额检查
    if ctx.is_guest and ctx.quota_remaining <= 0:
        raise HTTPException(
            status_code=403,
            detail="Guest quota exhausted. Please log in to continue.",
        )

    # Get or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        visitor_id = str(uuid.uuid4())[:8]
        conv_id = create_conversation(visitor_id, req.visitor_name, mode=req.mode)

    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 如果是旧对话且无 mode，尝试从当前请求补齐（幂等）
    if conv.get("mode") is None:
        with get_db() as conn:
            conn.execute("UPDATE conversations SET mode = ? WHERE id = ?", (req.mode, conv_id))

    # Store visitor message
    add_message(conv_id, "visitor", req.message)

    # Check urgent keywords
    is_urgent = check_urgent_keywords(req.message, URGENT_KEYWORDS)
    if is_urgent:
        mark_urgent(conv_id)
        asyncio.create_task(send_urgent_notification(conv_id, req.message))

    # Build message history
    history = get_conversation_messages(conv_id, limit=20)
    llm_messages = [{"role": m["role"], "content": m["content"]} for m in history]

    # RAG 增强检索（在生成器外执行，避免每次流都重新检索）
    rag_context = ""
    from core.rag.rag_chat import should_use_rag, retrieve_context
    if should_use_rag(req.message):
        rag_context, _rag_results = await retrieve_context(req.message, mode=req.mode)

    async def event_generator():
        yield f"data: {json.dumps({'type': 'conv_id', 'conversation_id': conv_id})}\n\n"

        full_reply = ""
        async for chunk in get_response_stream(llm_messages, rag_context=rag_context, mode=req.mode):
            full_reply += chunk
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

        # Save full reply to DB
        add_message(conv_id, "assistant", full_reply)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # 访客配额计数
        if ctx.is_guest:
            increment_guest_quota(ctx.ip)

        # Send realtime notification (event loop is active during streaming)
        try:
            await send_realtime_notification(conv_id, req.message, full_reply)
        except Exception as e:
            print(f"[stream-notify] Error: {e}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/conversations/{conv_id}/messages")
async def get_messages(conv_id: str):
    """Get all messages in a conversation."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = get_conversation_messages(conv_id)
    return {"conversation_id": conv_id, "messages": messages}


@app.post("/api/chat/agent")
async def chat_agent_stream(
    req: ChatRequest,
    ctx: UserContext = Depends(get_current_user_or_guest),
):
    """
    ReAct Agent streaming endpoint using SSE.

    Streams full ReAct loop:
        think → tool_call → tool_result → chunk → done

    Different from /api/chat/stream: this endpoint uses the AgentEngine
    with function calling and parallel tool execution.
    """
    # 访客配额检查
    if ctx.is_guest and ctx.quota_remaining <= 0:
        raise HTTPException(
            status_code=403,
            detail="Guest quota exhausted. Please log in to continue.",
        )

    # Get or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        visitor_id = str(uuid.uuid4())[:8]
        conv_id = create_conversation(visitor_id, req.visitor_name)

    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Store visitor message
    add_message(conv_id, "visitor", req.message)

    # Check urgent keywords
    is_urgent = check_urgent_keywords(req.message, URGENT_KEYWORDS)
    if is_urgent:
        mark_urgent(conv_id)
        asyncio.create_task(send_urgent_notification(conv_id, req.message))

    # Build message history (exclude system, agent engine 会自己加)
    history_msgs = get_conversation_messages(conv_id, limit=20)
    llm_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in history_msgs
        if m["role"] != "system"
    ]

    # RAG 预检索：Agent 端点每次都先检索知识库，无结果时 Agent 会自动通过 web_search 联网
    from core.rag.rag_chat import retrieve_context
    rag_context, _ = await retrieve_context(req.message, mode=req.mode)

    # Lazy import 避免启动时加载 agent 模块
    from core.agent.engine import AgentEngine
    from core.agent.tools.registry import create_default_registry

    registry = create_default_registry(enable_web=req.web_search_enabled)
    engine = AgentEngine(
        registry=registry,
        web_search_enabled=req.web_search_enabled,
        assistant_mode=req.mode,
    )

    async def agent_event_generator():
        yield f"data: {json.dumps({'type': 'conv_id', 'conversation_id': conv_id})}\n\n"

        full_reply = ""
        try:
            async for event in engine.run(
                query=req.message,
                history=llm_messages,
                context=rag_context,
            ):
                data = event.to_sse_data()
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

                # 收集最终回复（chunk 类型）
                if event.type == "chunk":
                    full_reply += event.content

            # 如果 finalize 未生成 chunk（如 STUCK 直出 last_content），用 think 内容兜底
            if not full_reply:
                # 从 events 里无法回溯，这里简化处理
                pass

            # 保存完整回复到 DB
            if full_reply:
                add_message(conv_id, "assistant", full_reply)

            # 访客配额计数
            if ctx.is_guest:
                increment_guest_quota(ctx.ip)

            # Send realtime notification
            try:
                await send_realtime_notification(conv_id, req.message, full_reply)
            except Exception as e:
                print(f"[agent-notify] Error: {e}")

        except Exception as e:
            err_data = {"type": "error", "error": f"{type(e).__name__}: {e}"}
            yield f"data: {json.dumps(err_data, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        agent_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/agent/tools")
async def list_agent_tools(ctx: UserContext = Depends(get_current_user_or_guest)):
    """列出 Agent 可用的工具（供前端展示）。"""
    from core.agent.tools.registry import create_default_registry

    registry = create_default_registry()
    tools = []
    for tool in registry:
        tools.append({
            "name": tool.name(),
            "description": tool.description(),
            "parameters": tool.parameters_schema(),
        })
    return {"tools": tools, "count": len(tools)}


@app.post("/api/notify/test")
async def test_notification():
    """Manually trigger a test notification to verify Feishu/PushPlus setup."""
    from notify import send_feishu, send_pushplus
    title = "🧪 Hermes 通知测试"
    content = "如果你看到这条消息，说明飞书通知配置正确！\n\n— Hermes AI 助理"
    await send_feishu(title, content)
    await send_pushplus(title, content)
    return {"status": "sent", "message": "Test notification dispatched"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

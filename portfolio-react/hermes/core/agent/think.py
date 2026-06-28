"""Think 阶段 — LLM function calling

参考 WeKnora internal/agent/think.go

职责:
    1. 调用 LLM，传入 system prompt + history + tools schema
    2. 解析返回的 tool_calls（如有）
    3. 支持流式输出思考内容
    4. 失败重试（max 2 次）
"""
import json
from dataclasses import dataclass, field
from typing import Any

import httpx

from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL


@dataclass
class ThinkResult:
    """Think 阶段结果"""
    content: str = ""  # LLM 思考内容/回复
    tool_calls: list[dict] = field(default_factory=list)  # [{name, arguments}]
    finish_reason: str = "stop"
    tokens_used: int = 0
    raw: dict | None = None


class ThinkError(Exception):
    pass


def _build_think_messages(
    query: str,
    history: list[dict],
    context: str = "",
) -> list[dict]:
    """构建 LLM messages（system + history + user）。

    history 已包含 system prompt 在首位（由 engine 构建）。
    """
    messages: list[dict] = []

    # context 注入到 system 消息中（首个 system 消息末尾追加）
    system_added = False
    for m in history:
        role = m["role"]
        if role == "visitor":
            role = "user"
        content = m["content"]
        # 将 RAG context 注入到 system 消息
        if role == "system" and context and not system_added:
            content = f"{content}\n\n## 知识库参考资料\n\n{context}"
            system_added = True
        messages.append({"role": role, "content": content})

    # 确保 system 已注入 context（若 history 无 system）
    if context and not system_added:
        messages.insert(0, {"role": "system", "content": f"## 知识库参考资料\n\n{context}"})

    return messages


async def think(
    query: str,
    history: list[dict],
    tools_schema: list[dict] | None = None,
    context: str = "",
    max_retries: int = 2,
) -> ThinkResult:
    """调用 LLM，可能返回 tool_calls。

    tools_schema: OpenAI function calling 格式
        [{"type": "function", "function": {...}}]

    失败重试 max_retries 次。
    """
    messages = _build_think_messages(query, history, context)

    payload: dict[str, Any] = {
        "model": DEEPSEEK_MODEL,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 1024,
    }
    if tools_schema:
        payload["tools"] = [
            {"type": "function", "function": schema} for schema in tools_schema
        ]
        payload["tool_choice"] = "auto"

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
                resp = await client.post(
                    f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()

            choice = data["choices"][0]
            message = choice["message"]
            content = message.get("content") or ""
            tool_calls_raw = message.get("tool_calls") or []

            # 解析 tool_calls
            tool_calls: list[dict] = []
            for tc in tool_calls_raw:
                fn = tc.get("function", {})
                name = fn.get("name", "")
                args_str = fn.get("arguments", "{}")
                try:
                    args = json.loads(args_str) if isinstance(args_str, str) else args_str
                except json.JSONDecodeError:
                    args = {}
                if name:
                    tool_calls.append({"name": name, "arguments": args})

            usage = data.get("usage", {})
            tokens_used = usage.get("total_tokens", 0)

            return ThinkResult(
                content=content,
                tool_calls=tool_calls,
                finish_reason=choice.get("finish_reason", "stop"),
                tokens_used=tokens_used,
                raw=data,
            )
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(0.5 * (attempt + 1))
            continue

    raise ThinkError(f"Think failed after {max_retries + 1} attempts: {last_err}")

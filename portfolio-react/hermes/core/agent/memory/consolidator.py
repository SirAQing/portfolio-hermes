"""记忆整合模块

参考 WeKnora internal/agent/memory/consolidator.go

策略:
    - 触发: total_tokens > max_context * 0.5
    - LLM 总结旧消息，替换原始历史
    - 保留: system prompt + 最近几轮 + LLM 生成的摘要

MVP 实现: 跳过 LLM 总结，直接用规则压缩（避免额外 API 调用）。
"""
import json
from typing import Any

import httpx

from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from core.agent.token.compress import (
    estimate_tokens,
    DEFAULT_MAX_CONTEXT,
)

CONSOLIDATE_THRESHOLD = 0.5


def needs_consolidation(history: list[dict], max_context: int = DEFAULT_MAX_CONTEXT) -> bool:
    """判断是否需要记忆整合。"""
    return estimate_tokens(history) > max_context * CONSOLIDATE_THRESHOLD


async def consolidate_history(
    history: list[dict],
    max_context: int = DEFAULT_MAX_CONTEXT,
    keep_recent: int = 4,
) -> list[dict]:
    """整合历史消息。

    1. 用 LLM 总结旧消息
    2. 用摘要替换原始历史
    3. 保留 system + 摘要 + 最近 keep_recent 条
    """
    if not needs_consolidation(history, max_context):
        return history

    system_msgs = [m for m in history if m.get("role") == "system"]
    non_system = [m for m in history if m.get("role") != "system"]

    if len(non_system) <= keep_recent + 2:
        return history

    # 分割：旧的待总结 + 最近的保留
    to_consolidate = non_system[:-keep_recent]
    recent = non_system[-keep_recent:]

    if not to_consolidate:
        return history

    # LLM 总结
    summary = await _summarize_messages(to_consolidate)
    if not summary:
        # 总结失败，降级为简单截断
        return system_msgs + recent

    summary_msg = {
        "role": "system",
        "content": f"## 历史对话摘要\n\n{summary}",
    }
    return system_msgs + [summary_msg] + recent


async def _summarize_messages(messages: list[dict]) -> str:
    """调用 LLM 总结历史消息。"""
    # 构建总结用的 messages
    conversation = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        conversation.append(f"[{role}] {content}")

    conversation_text = "\n\n".join(conversation)
    if len(conversation_text) > 10000:
        conversation_text = conversation_text[-10000:]  # 截断

    summarize_messages = [
        {
            "role": "system",
            "content": "你是对话总结助手。请将以下历史对话总结为关键信息（不超过 500 字），保留重要的事实、决策和上下文。",
        },
        {
            "role": "user",
            "content": f"请总结以下对话:\n\n{conversation_text}",
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            resp = await client.post(
                f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": DEEPSEEK_MODEL,
                    "messages": summarize_messages,
                    "temperature": 0.3,
                    "max_tokens": 800,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""

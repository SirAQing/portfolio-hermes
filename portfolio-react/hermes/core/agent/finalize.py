"""Finalize 阶段 — 流式生成最终答案

参考 WeKnora internal/agent/finalize.go

职责:
    1. 当 think 无 tool_calls 时，直接流式输出 content
    2. 当达到 MAX_ITER 或 STUCK 时，组装兜底答案
    3. 流式调用 LLM 生成最终回复
"""
import json
from typing import AsyncGenerator

import httpx

from config import SYSTEM_PROMPT as DEFAULT_SYSTEM_PROMPT
from core.agent.events import IterOutcome
from core.settings_repo import get_setting, SETTING_KEYS, get_llm_config_for_mode, get_system_prompt_for_mode, validate_llm_config


def _get_llm_config(mode: str = "visitor"):
    """获取指定模式LLM配置"""
    config = get_llm_config_for_mode(mode)
    validate_llm_config(config)
    return config


def _get_system_prompt(mode: str = "visitor") -> str:
    return get_system_prompt_for_mode(mode)


async def finalize(
    query: str,
    history: list[dict],
    context: str = "",
    outcome: IterOutcome = IterOutcome.STOP,
    last_content: str = "",
    mode: str = "visitor",
) -> AsyncGenerator[str, None]:
    """流式生成最终答案。

    - STOP: last_content 已是答案，直接 yield（如果非空）；否则流式调用 LLM
    - STUCK/MAX_ITER: 调用 LLM 基于现有 context 生成兜底答案
    - mode: "visitor" | "demo" — 决定使用哪套助手配置
    """
    # 1. STOP 且有内容：分块流式输出（模拟打字效果）
    if outcome == IterOutcome.STOP and last_content:
        import asyncio
        chunk_size = 3
        for i in range(0, len(last_content), chunk_size):
            yield last_content[i:i + chunk_size]
            await asyncio.sleep(0.015)
        return

    # 2. 其他情况：调用 LLM 流式生成
    messages = _build_finalize_messages(query, history, context, outcome, mode)
    config = _get_llm_config(mode)

    async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
        async with client.stream(
            "POST",
            f"{config['base_url']}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config['api_key']}",
                "Content-Type": "application/json",
            },
            json={
                "model": config["model"],
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 4096,
                "stream": True,
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                payload = line[6:]
                if payload.strip() == "[DONE]":
                    break
                try:
                    chunk = json.loads(payload)
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


def _build_finalize_messages(
    query: str,
    history: list[dict],
    context: str,
    outcome: IterOutcome,
    mode: str = "visitor",
) -> list[dict]:
    """构建 finalize 阶段的 LLM messages。"""
    messages: list[dict] = []

    # system prompt
    system_prompt = _get_system_prompt(mode)
    system_content = system_prompt
    if context:
        system_content = f"{system_content}\n\n## 知识库参考资料\n\n{context}"
    messages.append({"role": "system", "content": system_content})

    # history（去掉已有的 system）
    for m in history:
        role = m["role"]
        if role == "system":
            continue
        if role == "visitor":
            role = "user"
        messages.append({"role": role, "content": m["content"]})

    # 兜底提示（针对 STUCK/MAX_ITER）
    if outcome == IterOutcome.MAX_ITER:
        messages.append({
            "role": "system",
            "content": "已达到最大迭代次数。请基于已有信息直接给出最终回答，不要继续调用工具。",
        })
    elif outcome == IterOutcome.STUCK:
        messages.append({
            "role": "system",
            "content": "检测到思考陷入循环。请基于已有信息直接给出最终回答。",
        })

    return messages

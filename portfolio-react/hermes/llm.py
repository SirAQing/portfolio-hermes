"""
DeepSeek API integration for Hermes Chat.
Uses OpenAI-compatible API format.
"""
import httpx
import json
from typing import AsyncGenerator
from config import SYSTEM_PROMPT as DEFAULT_SYSTEM_PROMPT
from core.settings_repo import get_setting, SETTING_KEYS, get_llm_config_for_mode, get_system_prompt_for_mode, validate_llm_config


def _get_llm_config(mode: str = "visitor"):
    """获取指定模式LLM配置（优先助手专属配置，fallback到全局）"""
    config = get_llm_config_for_mode(mode)
    validate_llm_config(config)
    return config


def _get_system_prompt(mode: str = "visitor") -> str:
    """获取指定模式系统提示词"""
    return get_system_prompt_for_mode(mode)


def _build_messages(messages: list[dict], rag_context: str = "", mode: str = "visitor") -> list[dict]:
    """Prepend system prompt and normalize roles for DeepSeek API.

    rag_context 非空时，注入到 system prompt 末尾。
    """
    normalized = []
    for m in messages:
        role = m["role"]
        if role == "visitor":
            role = "user"
        normalized.append({"role": role, "content": m["content"]})

    system_prompt = _get_system_prompt(mode)
    system_content = system_prompt
    if rag_context:
        from core.rag.rag_chat import build_rag_system_prompt
        system_content = build_rag_system_prompt(system_prompt, rag_context)

    return [{"role": "system", "content": system_content}] + normalized


async def chat_completion(messages: list[dict], stream: bool = False, rag_context: str = "", mode: str = "visitor"):
    """
    Non-streaming chat completion.
    Returns the complete response string.

    rag_context: RAG 检索到的上下文，非空时注入到 system prompt。
    mode: "visitor" | "demo" — 决定使用哪套助手配置
    """
    full_messages = _build_messages(messages, rag_context, mode)
    config = _get_llm_config(mode)

    async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
        return await _complete_response(client, full_messages, config)


async def chat_completion_with_system(
    messages: list[dict],
    system_prompt: str,
    mode: str = "demo",
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """
    非流式对话补全，允许调用方完全自定义 system prompt。

    用于 AI 批注等需要严格输出格式的场景，避免被全局助手 system prompt 干扰。
    """
    config = _get_llm_config(mode)
    full_messages = [{"role": "system", "content": system_prompt}] + [
        {"role": "user" if m["role"] == "visitor" else m["role"], "content": m["content"]}
        for m in messages
    ]

    async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
        resp = await client.post(
            f"{config['base_url']}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config['api_key']}",
                "Content-Type": "application/json",
            },
            json={
                "model": config["model"],
                "messages": full_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _complete_response(client: httpx.AsyncClient, messages: list[dict], config: dict) -> str:
    """Non-streaming completion."""
    resp = await client.post(
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
        },
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


async def get_response_stream(messages: list[dict], rag_context: str = "", mode: str = "visitor") -> AsyncGenerator[str, None]:
    """
    Streaming completion — creates its own client and yields chunks.
    The httpx client lifecycle is managed within this generator.

    rag_context: RAG 检索到的上下文，非空时注入到 system prompt。
    mode: "visitor" | "demo" — 决定使用哪套助手配置
    """
    full_messages = _build_messages(messages, rag_context, mode)
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
                "messages": full_messages,
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

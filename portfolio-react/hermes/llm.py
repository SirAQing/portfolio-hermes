"""
DeepSeek API integration for Hermes Chat.
Uses OpenAI-compatible API format.
"""
import httpx
import json
from typing import AsyncGenerator
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, SYSTEM_PROMPT


def _build_messages(messages: list[dict]) -> list[dict]:
    """Prepend system prompt and normalize roles for DeepSeek API."""
    normalized = []
    for m in messages:
        role = m["role"]
        if role == "visitor":
            role = "user"
        normalized.append({"role": role, "content": m["content"]})
    return [{"role": "system", "content": SYSTEM_PROMPT}] + normalized


async def chat_completion(messages: list[dict], stream: bool = False):
    """
    Non-streaming chat completion.
    Returns the complete response string.
    """
    full_messages = _build_messages(messages)

    async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
        return await _complete_response(client, full_messages)


async def _complete_response(client: httpx.AsyncClient, messages: list[dict]) -> str:
    """Non-streaming completion."""
    resp = await client.post(
        f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": DEEPSEEK_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


async def get_response_stream(messages: list[dict]) -> AsyncGenerator[str, None]:
    """
    Streaming completion — creates its own client and yields chunks.
    The httpx client lifecycle is managed within this generator.
    """
    full_messages = _build_messages(messages)

    async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
        async with client.stream(
            "POST",
            f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": full_messages,
                "temperature": 0.7,
                "max_tokens": 1024,
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

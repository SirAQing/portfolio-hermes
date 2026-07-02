"""Think 阶段 — LLM function calling（流式）

参考 WeKnora internal/agent/think.go

职责:
    1. 流式调用 LLM，逐字输出思考内容
    2. 解析返回的 tool_calls（如有）
    3. 失败重试（max 2 次）
"""
import json
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator

import httpx


from core.settings_repo import get_setting, SETTING_KEYS, get_llm_config_for_mode, get_system_prompt_for_mode, validate_llm_config


def _get_llm_config(mode: str = "visitor"):
    config = get_llm_config_for_mode(mode)
    validate_llm_config(config)
    return config


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


async def think_stream(
    query: str,
    history: list[dict],
    tools_schema: list[dict] | None = None,
    context: str = "",
    max_retries: int = 2,
    mode: str = "visitor",
) -> AsyncGenerator[dict, None]:
    """流式调用 LLM，逐字 yield 思考内容，最后 yield 完整结果。

    yield 格式:
        {"type": "chunk", "content": "思考片段"}  — 逐字思考内容
        {"type": "result", "result": ThinkResult}  — 最终完整结果

    失败重试 max_retries 次。
    mode: "visitor" | "demo" — 决定使用哪套助手配置
    """
    messages = _build_think_messages(query, history, context)
    config = _get_llm_config(mode)

    payload: dict[str, Any] = {
        "model": config["model"],
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 4096,
        "stream": True,
    }
    if tools_schema:
        payload["tools"] = [
            {"type": "function", "function": schema} for schema in tools_schema
        ]
        payload["tool_choice"] = "auto"

    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
    }

    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            # 累积变量
            full_content = ""
            full_reasoning = ""
            tool_calls_map: dict[int, dict] = {}  # {index: {"id":..., "name":..., "arguments":...}}
            finish_reason = "stop"
            usage: dict = {}

            async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
                async with client.stream(
                    "POST",
                    f"{config['base_url']}/v1/chat/completions",
                    headers=headers,
                    json=payload,
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        payload_str = line[6:]
                        if payload_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(payload_str)
                            choice = chunk["choices"][0]
                            delta = choice.get("delta", {})

                            # content 片段 — 累积但不 yield（避免正文泄露到思考过程）
                            content = delta.get("content", "")
                            if content:
                                full_content += content

                            # reasoning_content 片段（DeepSeek 思考过程）— 逐字 yield 为 think 事件
                            reasoning = delta.get("reasoning_content", "")
                            if reasoning:
                                full_reasoning += reasoning
                                yield {"type": "chunk", "content": reasoning}

                            # tool_calls 分片累积
                            tool_calls_delta = delta.get("tool_calls", [])
                            for tc in tool_calls_delta:
                                idx = tc.get("index", 0)
                                if idx not in tool_calls_map:
                                    tool_calls_map[idx] = {"id": "", "name": "", "arguments": ""}
                                fn = tc.get("function", {})
                                if "name" in fn:
                                    tool_calls_map[idx]["name"] = fn["name"]
                                if "arguments" in fn:
                                    tool_calls_map[idx]["arguments"] += fn["arguments"]
                                if "id" in tc:
                                    tool_calls_map[idx]["id"] = tc["id"]

                            if choice.get("finish_reason"):
                                finish_reason = choice["finish_reason"]

                            if chunk.get("usage"):
                                usage = chunk["usage"]
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

            # 解析最终 tool_calls
            tool_calls: list[dict] = []
            for idx in sorted(tool_calls_map.keys()):
                tc = tool_calls_map[idx]
                args_str = tc["arguments"]
                try:
                    args = json.loads(args_str) if args_str else {}
                except json.JSONDecodeError:
                    args = {}
                if tc["name"]:
                    tool_calls.append({"name": tc["name"], "arguments": args})

            # 构造 ThinkResult.content：
            # - 无 tool_calls 时：content 是最终答案，必须完整保留给 finalize 输出
            # - 有 tool_calls 时：content 是思考过程；如果模型没给 reasoning_content，就把 content 当作思考过程补发
            think_content = ""
            if tool_calls:
                if full_reasoning:
                    think_content = full_reasoning
                elif full_content:
                    # 有工具调用时，content 视为思考过程，需要补发给前端
                    think_content = full_content
                    # 将 content 作为 think chunk 补发
                    for i in range(0, len(full_content), 4):
                        yield {"type": "chunk", "content": full_content[i:i+4]}
                else:
                    tool_names = [tc["name"] for tc in tool_calls]
                    think_content = f"正在检索信息：{', '.join(tool_names)}"
                    yield {"type": "chunk", "content": think_content}
            else:
                # 没有 tool_calls：content 就是最终答案，不要作为 think 输出
                think_content = full_content or full_reasoning

            tokens_used = usage.get("total_tokens", 0)

            result = ThinkResult(
                content=think_content,
                tool_calls=tool_calls,
                finish_reason=finish_reason,
                tokens_used=tokens_used,
                raw=None,
            )
            yield {"type": "result", "result": result}
            return

        except Exception as e:
            last_err = e
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(0.5 * (attempt + 1))
            continue

    raise ThinkError(f"Think failed after {max_retries + 1} attempts: {last_err}")

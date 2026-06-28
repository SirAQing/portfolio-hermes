"""Token 压缩模块

参考 WeKnora internal/agent/token/compress.go

策略:
    - 触发: total_tokens > max_context * 0.8
    - 从头部按 tool_call/tool_result 分组整组删除
    - 保留: system prompt + 当前轮次

MVP 实现: 用消息条数估算 token（粗略 1 msg ≈ 200 tokens），无需精确计数。
"""
from typing import Any

# 估算：单条消息平均 200 tokens
TOKENS_PER_MSG = 200
DEFAULT_MAX_CONTEXT = 32000  # 32K context window
COMPRESS_THRESHOLD = 0.8


def estimate_tokens(history: list[dict]) -> int:
    """粗略估算 history 的 token 数。"""
    total = 0
    for m in history:
        content = m.get("content", "")
        # 粗略：1 个中文字符 ≈ 2 tokens，1 个英文单词 ≈ 1.3 tokens
        # 简化：字符数 / 2 + 50 (overhead)
        total += len(content) // 2 + 50
    return total


def needs_compression(history: list[dict], max_context: int = DEFAULT_MAX_CONTEXT) -> bool:
    """判断是否需要压缩。"""
    return estimate_tokens(history) > max_context * COMPRESS_THRESHOLD


def compress_history(
    history: list[dict],
    max_context: int = DEFAULT_MAX_CONTEXT,
    keep_recent: int = 6,
) -> list[dict]:
    """压缩 history。

    策略:
        1. 保留所有 system 消息
        2. 保留最近 keep_recent 条非 system 消息
        3. 中间的 tool_call/tool_result 整组删除
    """
    if not needs_compression(history, max_context):
        return history

    system_msgs = [m for m in history if m.get("role") == "system"]
    non_system = [m for m in history if m.get("role") != "system"]

    if len(non_system) <= keep_recent:
        return history

    # 保留最近 keep_recent 条
    recent = non_system[-keep_recent:]

    return system_msgs + recent


def compress_aggressive(history: list[dict]) -> list[dict]:
    """激进压缩 — 只保留 system + 最近 4 条。"""
    system_msgs = [m for m in history if m.get("role") == "system"]
    non_system = [m for m in history if m.get("role") != "system"]
    recent = non_system[-4:] if len(non_system) > 4 else non_system
    return system_msgs + recent

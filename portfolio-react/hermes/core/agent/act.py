"""Act 阶段 — 并行工具执行

参考 WeKnora internal/agent/act.go（errgroup → asyncio.gather）

职责:
    1. 接收 think 阶段的 tool_calls
    2. 并行执行所有工具
    3. 单个工具失败不影响其他工具
"""
import asyncio

from core.agent.tools.registry import ToolRegistry
from core.agent.tools.base import ToolResult


async def act(
    tool_calls: list[dict],
    registry: ToolRegistry,
) -> list[ToolResult]:
    """并行执行所有工具调用。

    tool_calls: [{"name": str, "arguments": dict}, ...]
    registry: ToolRegistry 实例

    返回 ToolResult 列表，顺序与 tool_calls 一致。
    """
    if not tool_calls:
        return []

    tasks = [
        registry.execute(tc["name"], tc.get("arguments", {}) or {})
        for tc in tool_calls
    ]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    return list(results)


def format_tool_results_for_llm(results: list[ToolResult]) -> str:
    """将工具结果格式化为 LLM 可读的字符串。

    用于下一轮 think 的 context 追加。
    """
    if not results:
        return ""
    parts: list[str] = []
    for r in results:
        if r.success:
            parts.append(f"[Tool: {r.name}] Output:\n{r.output}")
        else:
            parts.append(f"[Tool: {r.name}] Error: {r.error}")
    return "\n\n".join(parts)

"""Observe 阶段 — 停止条件判断

参考 WeKnora internal/agent/observe.go

停止条件:
    1. finish_reason == "stop" 且无 tool_calls → STOP（自然停止）
    2. finish_reason == "content_filter" → STOP（内容过滤）
    3. 连续 2 次返回相同内容 → STUCK（卡死检测）
    4. 达到 MaxIterations → MAX_ITER
"""
from core.agent.events import IterOutcome
from core.agent.think import ThinkResult
from core.agent.tools.base import ToolResult


def observe(
    think_result: ThinkResult,
    tool_results: list[ToolResult],
    iteration: int,
    max_iterations: int = 20,
    last_content: str = "",
) -> tuple[IterOutcome, str]:
    """判断停止条件。

    返回 (outcome, reason)。
    outcome:
        CONTINUE - 继续迭代
        STOP - 自然停止（无工具调用）
        STUCK - 卡死检测
        MAX_ITER - 达到最大迭代数

    last_content: 上一轮 think 的 content，用于卡死检测
    """
    # 1. 达到最大迭代数
    if iteration + 1 >= max_iterations:
        return IterOutcome.MAX_ITER, f"Reached max iterations ({max_iterations})"

    # 2. 内容过滤
    if think_result.finish_reason == "content_filter":
        return IterOutcome.STOP, "Content filter triggered"

    # 3. 卡死检测：连续 2 次相同内容
    if (
        last_content
        and think_result.content
        and think_result.content == last_content
        and not think_result.tool_calls
    ):
        return IterOutcome.STUCK, "Consecutive identical content detected"

    # 4. 自然停止：无工具调用
    if not think_result.tool_calls:
        return IterOutcome.STOP, "No tool calls, natural stop"

    # 5. 继续迭代
    return IterOutcome.CONTINUE, "Continue"


def all_tools_failed(results: list[ToolResult]) -> bool:
    """所有工具都失败时，agent 应停止（避免无限循环）。"""
    if not results:
        return False
    return all(not r.success for r in results)

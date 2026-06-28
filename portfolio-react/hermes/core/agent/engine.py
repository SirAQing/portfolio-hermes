"""AgentEngine 主循环 — ReAct 循环 + iterOutcome 控制流

参考 WeKnora internal/agent/engine.go 第 378-412 行

主循环:
    for iteration in range(MAX_ITERATIONS):
        1. Think: LLM + function calling
        2. yield think event
        3. if no tool_calls: break → Finalize
        4. Act: 并行工具执行
        5. yield tool_call/tool_result events
        6. Observe: 停止条件判断
        7. Token 压缩检查
    Finalize: 流式生成最终答案
"""
import json
from typing import AsyncGenerator

from config import SYSTEM_PROMPT
from core.agent.events import Event, IterOutcome
from core.agent.think import think, ThinkError
from core.agent.act import act, format_tool_results_for_llm
from core.agent.observe import observe, all_tools_failed
from core.agent.finalize import finalize
from core.agent.tools.registry import ToolRegistry


class AgentEngine:
    """ReAct Agent 引擎"""

    MAX_ITERATIONS = 20

    def __init__(
        self,
        registry: ToolRegistry | None = None,
        max_iterations: int | None = None,
    ):
        self.registry = registry or ToolRegistry()
        self.max_iterations = max_iterations or self.MAX_ITERATIONS
        self._tokens_used = 0
        self._last_content = ""

    async def run(
        self,
        query: str,
        history: list[dict],
        tools_schema: list[dict] | None = None,
        context: str = "",
    ) -> AsyncGenerator[Event, None]:
        """运行 ReAct 循环，流式 yield Event。"""
        # 构建完整 history（含 system prompt）
        full_history = self._build_history(history)
        tools_schema = tools_schema or self.registry.function_schemas()

        final_outcome = IterOutcome.STOP
        final_content = ""
        iteration = 0

        for iteration in range(self.max_iterations):
            # ── 1. Think ──
            try:
                think_result = await think(
                    query=query,
                    history=full_history,
                    tools_schema=tools_schema,
                    context=context,
                )
            except ThinkError as e:
                yield Event(type="error", error=str(e), iteration=iteration)
                return

            self._tokens_used += think_result.tokens_used

            # ── 2. yield think event ──
            if think_result.content:
                yield Event(
                    type="think",
                    content=think_result.content,
                    iteration=iteration,
                )

            # ── 3. 无工具调用 → 进入 Finalize ──
            if not think_result.tool_calls:
                final_outcome = IterOutcome.STOP
                final_content = think_result.content
                break

            # ── 4. Act: 并行工具执行 ──
            yield Event(
                type="iter",
                iteration=iteration,
                extra={"tool_count": len(think_result.tool_calls)},
            )

            tool_results = await act(think_result.tool_calls, self.registry)

            # ── 5. yield tool_call/tool_result events ──
            for tc, tr in zip(think_result.tool_calls, tool_results):
                yield Event(
                    type="tool_call",
                    tool=tr.name,
                    input=tr.input,
                    iteration=iteration,
                )
                yield Event(
                    type="tool_result",
                    tool=tr.name,
                    output=tr.output,
                    iteration=iteration,
                    error=tr.error if not tr.success else "",
                )

            # ── 6. Observe: 停止条件 ──
            outcome, reason = observe(
                think_result=think_result,
                tool_results=tool_results,
                iteration=iteration,
                max_iterations=self.max_iterations,
                last_content=self._last_content,
            )

            # 所有工具都失败 → 强制停止
            if all_tools_failed(tool_results):
                final_outcome = IterOutcome.STUCK
                final_content = ""
                break

            if outcome in (IterOutcome.STOP, IterOutcome.STUCK, IterOutcome.MAX_ITER):
                final_outcome = outcome
                final_content = think_result.content
                break

            # ── 7. 追加 tool_results 到 history 供下一轮使用 ──
            tool_summary = format_tool_results_for_llm(tool_results)
            if tool_summary:
                full_history.append({
                    "role": "assistant",
                    "content": f"I used tools. Results:\n\n{tool_summary}",
                })

            self._last_content = think_result.content

            # Token 压缩检查（简化版：history 过长时截断）
            if self._needs_compression(full_history):
                full_history = self._compress_history(full_history)

        # ── Finalize: 流式生成最终答案 ──
        async for chunk in finalize(
            query=query,
            history=full_history,
            context=context,
            outcome=final_outcome,
            last_content=final_content,
        ):
            yield Event(type="chunk", content=chunk)

        yield Event(
            type="done",
            iterations=iteration + 1,
            tokens_used=self._tokens_used,
        )

    def _build_history(self, history: list[dict]) -> list[dict]:
        """构建完整 history，确保首条是 system prompt。"""
        # 检查是否已有 system
        has_system = any(m.get("role") == "system" for m in history)
        if has_system:
            return list(history)
        return [{"role": "system", "content": SYSTEM_PROMPT}] + list(history)

    def _needs_compression(self, history: list[dict]) -> bool:
        """简化版：history 超过 20 条消息时压缩。"""
        return len(history) > 20

    def _compress_history(self, history: list[dict]) -> list[dict]:
        """简化版压缩：保留 system + 最近 10 条消息。"""
        if len(history) <= 12:
            return history
        # 保留 system + 最后 10 条
        system_msgs = [m for m in history if m.get("role") == "system"]
        recent = [m for m in history if m.get("role") != "system"][-10:]
        return system_msgs + recent

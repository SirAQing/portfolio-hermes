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

from config import SYSTEM_PROMPT as DEFAULT_SYSTEM_PROMPT
from core.agent.events import Event, IterOutcome
from core.agent.think import think_stream, ThinkError
from core.agent.act import act, format_tool_results_for_llm
from core.agent.observe import observe, all_tools_failed
from core.agent.finalize import finalize
from core.agent.tools.registry import ToolRegistry
from core.settings_repo import get_setting, SETTING_KEYS, get_system_prompt_for_mode, get_assistant_settings


class AgentEngine:
    """ReAct Agent 引擎"""

    MAX_ITERATIONS = 20

    def __init__(
        self,
        registry: ToolRegistry | None = None,
        max_iterations: int | None = None,
        system_prompt: str | None = None,
        agent_mode: str = "rag",
        web_search_enabled: bool = True,
        assistant_mode: str = "visitor",
    ):
        """
        registry: 工具注册表
        max_iterations: 最大迭代数
        system_prompt: 自定义 system prompt（None 时从 config_files 加载）
        agent_mode: "rag" 或 "pure"，用于加载默认 prompt
        web_search_enabled: 用户是否主动开启联网优先模式。
        assistant_mode: "visitor" | "demo" — 决定使用哪套助手配置（系统提示词、模型等）
        """
        self.registry = registry or ToolRegistry()
        self.max_iterations = max_iterations or self.MAX_ITERATIONS
        self._tokens_used = 0
        self._last_content = ""
        self._system_prompt = system_prompt
        self._agent_mode = agent_mode
        self.web_search_enabled = web_search_enabled
        self.assistant_mode = assistant_mode

    def _get_system_prompt(self) -> str:
        """获取 system prompt（优先自定义，否则按助手模式从数据库/配置加载）。"""
        if self._system_prompt:
            prompt = self._system_prompt
        else:
            # 优先按助手模式加载专属系统提示词
            prompt = get_system_prompt_for_mode(self.assistant_mode)
            if not prompt:
                try:
                    from core.config.prompt_loader import get_agent_system_prompt
                    prompt = get_agent_system_prompt(mode=self._agent_mode)
                except Exception:
                    prompt = get_setting(SETTING_KEYS["SYSTEM_PROMPT"], DEFAULT_SYSTEM_PROMPT)

        web_status = "auto" if not self.web_search_enabled else "forced"
        prompt = prompt.replace("{{web_search_status}}", web_status)
        if self.web_search_enabled:
            prompt = prompt.replace(
                "{{web_search_instruction}}",
                "Web search is in FORCED mode (user explicitly enabled it). You can prioritize web_search for this query. "
                "You may use web_search and web_fetch tools proactively, including for real-time information, latest news, "
                "or content that may benefit from up-to-date online sources. Knowledge base search is still available as a complement.",
            )
        else:
            prompt = prompt.replace(
                "{{web_search_instruction}}",
                "Web search is in AUTO mode (always available). Follow these rules:\n"
                "1. ALWAYS search the knowledge base first using knowledge_search.\n"
                "2. If knowledge_search returns [NO_RELEVANT_RESULTS], [NO_KNOWLEDGE_BASE], or [LOW_CONFIDENCE], "
                "you MUST automatically use web_search to find answers online — do NOT ask the user to enable web search.\n"
                "3. For questions clearly requiring real-time data (current events, latest news, live prices, weather, etc.), "
                "you may use web_search directly or in parallel with knowledge_search.\n"
                "4. After web search, synthesize results naturally without mentioning the automatic fallback.",
            )
        return prompt

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
            # ── 1. Think（流式） ──
            try:
                think_result = None
                async for item in think_stream(
                    query=query,
                    history=full_history,
                    tools_schema=tools_schema,
                    context=context,
                    mode=self.assistant_mode,
                ):
                    if item["type"] == "chunk":
                        # 逐字 yield think 事件
                        yield Event(
                            type="think",
                            content=item["content"],
                            iteration=iteration,
                        )
                    elif item["type"] == "result":
                        think_result = item["result"]
                        break
            except ThinkError as e:
                yield Event(type="error", error=str(e), iteration=iteration)
                return

            self._tokens_used += think_result.tokens_used

            # 3. 无工具调用 -> 前2轮强制继续思考，第3轮起允许直接回复
            if not think_result.tool_calls:
                if iteration < 2:
                    # 强制多轮思考：先补发本轮思考内容（让第1轮也能展示），
                    # 然后追加 user 提示要求继续检索验证
                    if think_result.content:
                        yield Event(
                            type="think",
                            content=think_result.content,
                            iteration=iteration,
                        )
                    full_history.append({
                        "role": "user",
                        "content": (
                            "你刚才没有调用任何工具。请继续执行六步闭环流程："
                            "使用 knowledge_search 检索知识库验证你的回答，"
                            "如果知识库无结果则使用 web_search 联网搜索。"
                            "至少经过3轮检索验证后才能输出最终答案。"
                        ),
                    })
                    self._last_content = think_result.content
                    continue
                else:
                    final_outcome = IterOutcome.STOP
                    final_content = think_result.content
                    break

            # 4. Act: 并行工具执行 ──
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
            mode=self.assistant_mode,
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
        return [{"role": "system", "content": self._get_system_prompt()}] + list(history)

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

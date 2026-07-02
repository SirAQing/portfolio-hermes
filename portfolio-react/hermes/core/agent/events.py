"""Agent 事件类型 — 用于 SSE 流式输出

参考 WeKnora internal/agent/engine.go 的 IterOutcome + Event
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class IterOutcome(Enum):
    """单次迭代结果"""
    CONTINUE = "continue"   # 继续迭代
    STOP = "stop"           # 自然停止（无工具调用）
    STUCK = "stuck"         # 卡死检测（连续相同内容）
    MAX_ITER = "max_iter"   # 达到最大迭代数


@dataclass
class Event:
    """Agent 流式事件"""
    type: str  # think | tool_call | tool_result | chunk | done | error | iter
    content: str = ""
    tool: str = ""
    input: dict | None = None
    output: str = ""
    iteration: int = 0
    iterations: int = 0
    tokens_used: int = 0
    error: str = ""
    extra: dict = field(default_factory=dict)

    def to_sse_data(self) -> dict:
        """转换为 SSE data 字段（不含 type 重复）"""
        data: dict[str, Any] = {"type": self.type}
        if self.content:
            data["content"] = self.content
        if self.tool:
            data["tool"] = self.tool
        if self.input is not None:
            data["input"] = self.input
        if self.output:
            data["output"] = self.output
        if self.iteration or self.type in ("think", "tool_call", "tool_result", "iter", "error"):
            data["iteration"] = self.iteration
        if self.iterations:
            data["iterations"] = self.iterations
        if self.tokens_used:
            data["tokens_used"] = self.tokens_used
        if self.error:
            data["error"] = self.error
        if self.extra:
            data.update(self.extra)
        return data

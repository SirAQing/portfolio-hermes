"""Tool 抽象基类 + 工具结果数据结构

参考 WeKnora internal/agent/tools/registry.go 的 Tool 接口（4 方法）
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolResult:
    """工具执行结果"""
    name: str
    input: dict
    output: str
    error: str | None = None
    success: bool = True

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "input": self.input,
            "output": self.output,
            "error": self.error,
            "success": self.success,
        }


class Tool(ABC):
    """Tool 抽象基类 — 4 个方法必须实现"""

    @abstractmethod
    def name(self) -> str:
        """工具名（唯一标识，用于 function calling）"""

    @abstractmethod
    def description(self) -> str:
        """工具描述（LLM 用来判断何时调用）"""

    @abstractmethod
    def parameters_schema(self) -> dict:
        """参数 JSON Schema（OpenAI function calling 格式）"""

    @abstractmethod
    async def execute(self, **kwargs) -> str:
        """执行工具，返回字符串结果。"""

    def to_function_schema(self) -> dict:
        """转换为 OpenAI function calling schema。"""
        return {
            "name": self.name(),
            "description": self.description(),
            "parameters": self.parameters_schema(),
        }


class SyncTool(Tool):
    """同步工具基类 — 内部 execute_sync 由 execute 包装为 async。"""

    def execute_sync(self, **kwargs) -> str:
        raise NotImplementedError

    async def execute(self, **kwargs) -> str:
        import asyncio
        return await asyncio.to_thread(self.execute_sync, **kwargs)

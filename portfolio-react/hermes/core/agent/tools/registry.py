"""ToolRegistry — 工具注册表（先到先得 + 16KB 截断）

参考 WeKnora internal/agent/tools/registry.go
"""
from typing import Iterator

from core.agent.tools.base import Tool, ToolResult


class ToolNotFoundError(Exception):
    pass


class ToolRegistry:
    """工具注册表。

    - 先到先得：同名工具只注册一次，后注册的会被忽略
    - 输出截断：所有工具输出统一截断到 OUTPUT_LIMIT (16KB)
    """

    OUTPUT_LIMIT = 16 * 1024  # 16KB

    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> bool:
        """注册工具。返回是否注册成功（先到先得）。

        如果同名工具已存在，返回 False。
        """
        name = tool.name()
        if name in self._tools:
            return False
        self._tools[name] = tool
        return True

    def unregister(self, name: str) -> bool:
        """注销工具。返回是否注销成功。"""
        if name in self._tools:
            del self._tools[name]
            return True
        return False

    def get(self, name: str) -> Tool | None:
        """获取工具。"""
        return self._tools.get(name)

    def has(self, name: str) -> bool:
        return name in self._tools

    def list_names(self) -> list[str]:
        """列出所有工具名。"""
        return list(self._tools.keys())

    def __iter__(self) -> Iterator[Tool]:
        return iter(self._tools.values())

    def __len__(self) -> int:
        return len(self._tools)

    def function_schemas(self) -> list[dict]:
        """返回所有工具的 OpenAI function calling schema。"""
        return [tool.to_function_schema() for tool in self._tools.values()]

    async def execute(self, name: str, params: dict) -> ToolResult:
        """执行工具。返回 ToolResult（已截断）。

        工具不存在或执行异常都会返回带 error 的 ToolResult。
        """
        tool = self._tools.get(name)
        if tool is None:
            return ToolResult(
                name=name,
                input=params,
                output="",
                error=f"Tool '{name}' not found",
                success=False,
            )

        try:
            raw_output = await tool.execute(**params)
            # 截断到 OUTPUT_LIMIT
            if isinstance(raw_output, str):
                output = raw_output[: self.OUTPUT_LIMIT]
                if len(raw_output) > self.OUTPUT_LIMIT:
                    output += f"\n...[truncated, original {len(raw_output)} bytes]"
            else:
                output = str(raw_output)[: self.OUTPUT_LIMIT]
            return ToolResult(
                name=name,
                input=params,
                output=output,
                success=True,
            )
        except Exception as e:
            return ToolResult(
                name=name,
                input=params,
                output="",
                error=f"{type(e).__name__}: {e}",
                success=False,
            )


def create_default_registry(enable_web: bool = True) -> ToolRegistry:
    """创建带内置工具的默认注册表。

    Args:
        enable_web: 是否启用联网搜索工具（web_search / web_fetch）。
    """
    from core.agent.tools.builtin import register_builtin_tools

    registry = ToolRegistry()
    register_builtin_tools(registry, enable_web=enable_web)
    return registry

"""Tool 基类 + ToolRegistry 测试"""
import pytest

from core.agent.tools.base import Tool, ToolResult, SyncTool
from core.agent.tools.registry import ToolRegistry


# ── 测试用工具实现 ──

class EchoTool(Tool):
    """回显工具 — 返回输入"""
    def name(self) -> str:
        return "echo"
    def description(self) -> str:
        return "Echo back the input"
    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {"text": {"type": "string"}},
            "required": ["text"],
        }
    async def execute(self, text: str = "", **kwargs) -> str:
        return f"Echo: {text}"


class ErrorTool(Tool):
    """总是抛异常的工具"""
    def name(self) -> str:
        return "error_tool"
    def description(self) -> str:
        return "Always fails"
    def parameters_schema(self) -> dict:
        return {"type": "object", "properties": {}}
    async def execute(self, **kwargs) -> str:
        raise RuntimeError("Intentional failure")


class LongOutputTool(Tool):
    """输出超过 16KB 的工具，测试截断"""
    def name(self) -> str:
        return "long_output"
    def description(self) -> str:
        return "Returns a long string"
    def parameters_schema(self) -> dict:
        return {"type": "object", "properties": {}}
    async def execute(self, **kwargs) -> str:
        return "x" * (20 * 1024)  # 20KB


# ── 测试用例 ──

def test_tool_to_function_schema():
    """工具能转换为 OpenAI function schema"""
    tool = EchoTool()
    schema = tool.to_function_schema()
    assert schema["name"] == "echo"
    assert schema["description"] == "Echo back the input"
    assert "properties" in schema["parameters"]
    assert "text" in schema["parameters"]["properties"]


def test_tool_result_dataclass():
    """ToolResult 数据类基础功能"""
    r = ToolResult(name="echo", input={"text": "hi"}, output="Echo: hi", success=True)
    assert r.success is True
    assert r.error is None
    d = r.to_dict()
    assert d["name"] == "echo"
    assert d["success"] is True


@pytest.mark.asyncio
async def test_echo_tool_execute():
    """回显工具执行"""
    tool = EchoTool()
    result = await tool.execute(text="hello")
    assert result == "Echo: hello"


def test_registry_register_first_wins():
    """先到先得：同名工具只注册一次"""
    registry = ToolRegistry()
    assert registry.register(EchoTool()) is True
    # 再次注册同名工具应失败
    assert registry.register(EchoTool()) is False
    assert len(registry) == 1


def test_registry_unregister():
    """注销工具"""
    registry = ToolRegistry()
    registry.register(EchoTool())
    assert registry.unregister("echo") is True
    assert registry.unregister("echo") is False  # 已注销
    assert len(registry) == 0


def test_registry_get_and_has():
    """获取和检查工具"""
    registry = ToolRegistry()
    registry.register(EchoTool())
    assert registry.has("echo") is True
    assert registry.has("nonexistent") is False
    tool = registry.get("echo")
    assert tool is not None
    assert tool.name() == "echo"
    assert registry.get("nonexistent") is None


def test_registry_list_names():
    """列出工具名"""
    registry = ToolRegistry()
    registry.register(EchoTool())
    registry.register(ErrorTool())
    names = registry.list_names()
    assert "echo" in names
    assert "error_tool" in names
    assert len(names) == 2


def test_registry_function_schemas():
    """获取所有 function schemas"""
    registry = ToolRegistry()
    registry.register(EchoTool())
    registry.register(ErrorTool())
    schemas = registry.function_schemas()
    assert len(schemas) == 2
    names = [s["name"] for s in schemas]
    assert "echo" in names
    assert "error_tool" in names


@pytest.mark.asyncio
async def test_registry_execute_success():
    """执行工具成功"""
    registry = ToolRegistry()
    registry.register(EchoTool())
    result = await registry.execute("echo", {"text": "world"})
    assert result.success is True
    assert result.output == "Echo: world"
    assert result.error is None


@pytest.mark.asyncio
async def test_registry_execute_tool_not_found():
    """执行不存在的工具"""
    registry = ToolRegistry()
    result = await registry.execute("nonexistent", {})
    assert result.success is False
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_registry_execute_tool_error():
    """工具执行抛异常"""
    registry = ToolRegistry()
    registry.register(ErrorTool())
    result = await registry.execute("error_tool", {})
    assert result.success is False
    assert "RuntimeError" in result.error
    assert "Intentional failure" in result.error


@pytest.mark.asyncio
async def test_registry_output_truncation():
    """输出超过 16KB 被截断"""
    registry = ToolRegistry()
    registry.register(LongOutputTool())
    result = await registry.execute("long_output", {})
    assert result.success is True
    # 截断后应小于原始 20KB
    assert len(result.output) < 20 * 1024
    # 应包含截断标记
    assert "truncated" in result.output


def test_registry_iter():
    """迭代注册表"""
    registry = ToolRegistry()
    registry.register(EchoTool())
    registry.register(ErrorTool())
    tools = list(registry)
    assert len(tools) == 2


def test_sync_tool_wrapper():
    """SyncTool 包装同步方法为 async"""
    class MySyncTool(SyncTool):
        def name(self) -> str:
            return "my_sync"
        def description(self) -> str:
            return "Sync tool"
        def parameters_schema(self) -> dict:
            return {"type": "object", "properties": {}}
        def execute_sync(self, **kwargs) -> str:
            return "sync result"

    import asyncio
    tool = MySyncTool()
    result = asyncio.run(tool.execute())
    assert result == "sync result"

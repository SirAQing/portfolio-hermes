"""act.py 并行工具执行测试"""
import pytest

from core.agent.tools.registry import ToolRegistry
from core.agent.tools.base import Tool, ToolResult
from core.agent.act import act, format_tool_results_for_llm


class SlowTool(Tool):
    """慢工具 — 模拟延迟"""
    def __init__(self, name: str, delay: float = 0.1):
        self._name = name
        self._delay = delay
    def name(self) -> str:
        return self._name
    def description(self) -> str:
        return f"Slow tool {self._name}"
    def parameters_schema(self) -> dict:
        return {"type": "object", "properties": {}}
    async def execute(self, **kwargs) -> str:
        import asyncio
        await asyncio.sleep(self._delay)
        return f"result from {self._name}"


@pytest.mark.asyncio
async def test_act_empty_calls():
    """空 tool_calls 返回空列表"""
    registry = ToolRegistry()
    results = await act([], registry)
    assert results == []


@pytest.mark.asyncio
async def test_act_single_tool():
    """单个工具执行"""
    registry = ToolRegistry()
    registry.register(SlowTool("tool1"))
    results = await act([{"name": "tool1", "arguments": {}}], registry)
    assert len(results) == 1
    assert results[0].success is True
    assert "tool1" in results[0].output


@pytest.mark.asyncio
async def test_act_parallel_execution():
    """多个工具并行执行（验证总耗时 < 串行耗时）"""
    import time

    registry = ToolRegistry()
    registry.register(SlowTool("tool1", delay=0.2))
    registry.register(SlowTool("tool2", delay=0.2))
    registry.register(SlowTool("tool3", delay=0.2))

    calls = [
        {"name": "tool1", "arguments": {}},
        {"name": "tool2", "arguments": {}},
        {"name": "tool3", "arguments": {}},
    ]
    start = time.monotonic()
    results = await act(calls, registry)
    elapsed = time.monotonic() - start

    assert len(results) == 3
    # 并行：总耗时应 < 0.5s（串行需 0.6s）
    assert elapsed < 0.5
    # 所有工具都成功
    assert all(r.success for r in results)


@pytest.mark.asyncio
async def test_act_results_order_preserved():
    """结果顺序与 tool_calls 一致"""
    registry = ToolRegistry()
    registry.register(SlowTool("aaa", delay=0.05))
    registry.register(SlowTool("bbb", delay=0.01))  # bbb 先完成
    registry.register(SlowTool("ccc", delay=0.05))

    calls = [
        {"name": "aaa", "arguments": {}},
        {"name": "bbb", "arguments": {}},
        {"name": "ccc", "arguments": {}},
    ]
    results = await act(calls, registry)
    # 顺序应与输入一致，不管完成顺序
    assert results[0].name == "aaa"
    assert results[1].name == "bbb"
    assert results[2].name == "ccc"


@pytest.mark.asyncio
async def test_act_tool_not_found():
    """工具不存在"""
    registry = ToolRegistry()
    results = await act([{"name": "nonexistent", "arguments": {}}], registry)
    assert len(results) == 1
    assert results[0].success is False
    assert "not found" in results[0].error


@pytest.mark.asyncio
async def test_act_mixed_success_failure():
    """混合成功失败"""
    class FailTool(Tool):
        def name(self) -> str:
            return "fail"
        def description(self) -> str:
            return "Always fails"
        def parameters_schema(self) -> dict:
            return {"type": "object", "properties": {}}
        async def execute(self, **kwargs) -> str:
            raise RuntimeError("fail")

    registry = ToolRegistry()
    registry.register(SlowTool("ok", delay=0.01))
    registry.register(FailTool())

    calls = [
        {"name": "ok", "arguments": {}},
        {"name": "fail", "arguments": {}},
    ]
    results = await act(calls, registry)
    assert results[0].success is True
    assert results[1].success is False


def test_format_tool_results_empty():
    """空结果格式化"""
    assert format_tool_results_for_llm([]) == ""


def test_format_tool_results_success():
    """成功结果格式化"""
    results = [
        ToolResult(name="search", input={"q": "test"}, output="Found 3 items", success=True),
    ]
    formatted = format_tool_results_for_llm(results)
    assert "search" in formatted
    assert "Found 3 items" in formatted
    assert "Output" in formatted


def test_format_tool_results_error():
    """错误结果格式化"""
    results = [
        ToolResult(name="search", input={}, output="", error="timeout", success=False),
    ]
    formatted = format_tool_results_for_llm(results)
    assert "search" in formatted
    assert "Error" in formatted
    assert "timeout" in formatted


def test_format_tool_results_multiple():
    """多个结果格式化"""
    results = [
        ToolResult(name="a", input={}, output="result a", success=True),
        ToolResult(name="b", input={}, output="result b", success=True),
    ]
    formatted = format_tool_results_for_llm(results)
    assert "result a" in formatted
    assert "result b" in formatted

"""observe.py 停止条件判断测试"""
import pytest

from core.agent.events import IterOutcome
from core.agent.think import ThinkResult
from core.agent.tools.base import ToolResult
from core.agent.observe import observe, all_tools_failed


def test_observe_no_tool_calls_stop():
    """无工具调用 → 自然停止"""
    tr = ThinkResult(content="最终答案", tool_calls=[], finish_reason="stop")
    outcome, reason = observe(tr, [], iteration=0, max_iterations=20)
    assert outcome == IterOutcome.STOP


def test_observe_has_tool_calls_continue():
    """有工具调用 → 继续"""
    tr = ThinkResult(
        content="需要搜索",
        tool_calls=[{"name": "search", "arguments": {}}],
        finish_reason="tool_calls",
    )
    outcome, reason = observe(tr, [], iteration=0, max_iterations=20)
    assert outcome == IterOutcome.CONTINUE


def test_observe_max_iter():
    """达到最大迭代数"""
    tr = ThinkResult(content="...", tool_calls=[])
    outcome, reason = observe(tr, [], iteration=19, max_iterations=20)
    assert outcome == IterOutcome.MAX_ITER


def test_observe_content_filter():
    """内容过滤触发停止"""
    tr = ThinkResult(content="", tool_calls=[], finish_reason="content_filter")
    outcome, reason = observe(tr, [], iteration=0, max_iterations=20)
    assert outcome == IterOutcome.STOP
    assert "filter" in reason.lower()


def test_observe_stuck_detection():
    """连续 2 次相同内容 → 卡死检测"""
    tr = ThinkResult(
        content="相同内容",
        tool_calls=[],
        finish_reason="stop",
    )
    outcome, reason = observe(
        tr, [], iteration=5, max_iterations=20, last_content="相同内容"
    )
    assert outcome == IterOutcome.STUCK


def test_observe_stuck_not_triggered_with_different_content():
    """内容不同时不触发卡死"""
    tr = ThinkResult(content="新内容", tool_calls=[])
    outcome, reason = observe(
        tr, [], iteration=5, max_iterations=20, last_content="旧内容"
    )
    assert outcome == IterOutcome.STOP


def test_observe_stuck_not_triggered_with_tool_calls():
    """有 tool_calls 时不触发卡死（即使内容相同）"""
    tr = ThinkResult(
        content="相同内容",
        tool_calls=[{"name": "search", "arguments": {}}],
    )
    outcome, reason = observe(
        tr, [], iteration=5, max_iterations=20, last_content="相同内容"
    )
    assert outcome == IterOutcome.CONTINUE


def test_all_tools_failed_empty():
    """空列表不算全失败"""
    assert all_tools_failed([]) is False


def test_all_tools_failed_all_failed():
    """所有工具失败"""
    results = [
        ToolResult(name="a", input={}, output="", error="err1", success=False),
        ToolResult(name="b", input={}, output="", error="err2", success=False),
    ]
    assert all_tools_failed(results) is True


def test_all_tools_failed_some_success():
    """部分成功"""
    results = [
        ToolResult(name="a", input={}, output="ok", success=True),
        ToolResult(name="b", input={}, output="", error="err", success=False),
    ]
    assert all_tools_failed(results) is False

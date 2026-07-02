"""Event 数据结构测试"""
import json

from core.agent.events import Event, IterOutcome


def test_event_basic_think():
    """think 事件"""
    e = Event(type="think", content="思考中", iteration=0)
    data = e.to_sse_data()
    assert data["type"] == "think"
    assert data["content"] == "思考中"
    assert data["iteration"] == 0


def test_event_tool_call():
    """tool_call 事件"""
    e = Event(
        type="tool_call",
        tool="knowledge_search",
        input={"query": "RAG"},
        iteration=1,
    )
    data = e.to_sse_data()
    assert data["type"] == "tool_call"
    assert data["tool"] == "knowledge_search"
    assert data["input"] == {"query": "RAG"}


def test_event_tool_result():
    """tool_result 事件"""
    e = Event(
        type="tool_result",
        tool="knowledge_search",
        output="Found 3 chunks",
        iteration=1,
    )
    data = e.to_sse_data()
    assert data["type"] == "tool_result"
    assert data["output"] == "Found 3 chunks"


def test_event_chunk():
    """chunk 事件"""
    e = Event(type="chunk", content="Hel")
    data = e.to_sse_data()
    assert data["type"] == "chunk"
    assert data["content"] == "Hel"


def test_event_done():
    """done 事件"""
    e = Event(type="done", iterations=3, tokens_used=1500)
    data = e.to_sse_data()
    assert data["type"] == "done"
    assert data["iterations"] == 3
    assert data["tokens_used"] == 1500


def test_event_error():
    """error 事件"""
    e = Event(type="error", error="LLM timeout")
    data = e.to_sse_data()
    assert data["type"] == "error"
    assert data["error"] == "LLM timeout"


def test_event_json_serializable():
    """事件可 JSON 序列化（SSE 传输）"""
    e = Event(type="tool_call", tool="search", input={"q": "test"}, iteration=2)
    data = e.to_sse_data()
    s = json.dumps(data, ensure_ascii=False)
    assert isinstance(s, str)
    # 可反序列化
    parsed = json.loads(s)
    assert parsed["tool"] == "search"


def test_event_extra_fields():
    """extra 字段"""
    e = Event(type="iter", iteration=0, extra={"tool_count": 3})
    data = e.to_sse_data()
    assert data["tool_count"] == 3


def test_iter_outcome_values():
    """IterOutcome 枚举值"""
    assert IterOutcome.CONTINUE.value == "continue"
    assert IterOutcome.STOP.value == "stop"
    assert IterOutcome.STUCK.value == "stuck"
    assert IterOutcome.MAX_ITER.value == "max_iter"


def test_event_minimal():
    """最小事件（仅 type）"""
    e = Event(type="ping")
    data = e.to_sse_data()
    assert data == {"type": "ping"}

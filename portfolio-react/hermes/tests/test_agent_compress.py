"""compress.py + consolidator.py token 管理测试"""
import pytest

from core.agent.token.compress import (
    estimate_tokens,
    needs_compression,
    compress_history,
    compress_aggressive,
    DEFAULT_MAX_CONTEXT,
    TOKENS_PER_MSG,
)


def test_estimate_tokens_empty():
    """空 history 估算 0 tokens"""
    assert estimate_tokens([]) == 0


def test_estimate_tokens_basic():
    """基本估算"""
    history = [
        {"role": "user", "content": "Hello world"},
        {"role": "assistant", "content": "Hi there"},
    ]
    tokens = estimate_tokens(history)
    assert tokens > 0
    # 每条至少 50 overhead
    assert tokens >= 100


def test_estimate_tokens_long_content():
    """长内容估算更多 tokens"""
    short = [{"role": "user", "content": "Hi"}]
    long = [{"role": "user", "content": "x" * 1000}]
    assert estimate_tokens(long) > estimate_tokens(short)


def test_needs_compression_small_history():
    """小 history 不需要压缩"""
    history = [{"role": "user", "content": "Hi"}]
    assert needs_compression(history) is False


def test_needs_compression_large_history():
    """大 history 需要压缩"""
    # 构造超过 0.8 * 32000 = 25600 tokens 的 history
    history = [
        {"role": "user", "content": "x" * 1000},
        {"role": "assistant", "content": "y" * 1000},
    ] * 50  # 100 条，每条 500+ tokens
    assert needs_compression(history) is True


def test_compress_history_preserves_system():
    """压缩保留 system 消息"""
    history = [
        {"role": "system", "content": "You are helpful"},
    ]
    history += [{"role": "user", "content": f"msg {i}"} for i in range(30)]
    compressed = compress_history(history, keep_recent=6)
    system_msgs = [m for m in compressed if m["role"] == "system"]
    assert len(system_msgs) == 1
    assert system_msgs[0]["content"] == "You are helpful"


def test_compress_history_keeps_recent():
    """压缩保留最近 N 条"""
    history = [{"role": "system", "content": "sys"}]
    # 构造足够长的内容触发 token 阈值（每条 ~550 tokens，50 条 = 27500 > 25600）
    history += [{"role": "user", "content": "x" * 1000} for i in range(50)]
    compressed = compress_history(history, keep_recent=6)
    # 应保留最近 6 条
    non_system = [m for m in compressed if m["role"] != "system"]
    assert len(non_system) == 6


def test_compress_history_no_change_if_small():
    """小 history 不压缩"""
    history = [
        {"role": "system", "content": "sys"},
        {"role": "user", "content": "hi"},
    ]
    result = compress_history(history)
    assert result == history


def test_compress_aggressive_keeps_only_4():
    """激进压缩只保留 4 条"""
    history = [{"role": "system", "content": "sys"}]
    history += [{"role": "user", "content": f"msg {i}"} for i in range(20)]
    compressed = compress_aggressive(history)
    non_system = [m for m in compressed if m["role"] != "system"]
    assert len(non_system) <= 4


def test_compress_aggressive_preserves_system():
    """激进压缩保留 system"""
    history = [
        {"role": "system", "content": "sys1"},
        {"role": "user", "content": "msg1"},
    ]
    compressed = compress_aggressive(history)
    system_msgs = [m for m in compressed if m["role"] == "system"]
    assert len(system_msgs) == 1

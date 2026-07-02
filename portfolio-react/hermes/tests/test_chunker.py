"""分块器测试"""
from core.rag.chunker import chunk_text, profile_document, count_tokens


def test_chunk_empty_text():
    assert chunk_text("") == []


def test_chunk_short_text_single_chunk():
    text = "这是一段简短的文本。"
    chunks = chunk_text(text, max_size=512)
    assert len(chunks) == 1
    assert chunks[0].content == text
    assert chunks[0].chunk_index == 0


def test_chunk_long_text_splits():
    """长文本会被切分"""
    text = "段落内容。\n\n" * 200  # 足够长
    chunks = chunk_text(text, max_size=100)
    assert len(chunks) > 1


def test_chunk_heading_strategy():
    text = "# 标题1\n\n内容1\n\n# 标题2\n\n内容2"
    chunks = chunk_text(text, strategy="heading", max_size=512)
    assert len(chunks) >= 2


def test_chunk_auto_strategy_fallback():
    """auto 策略对无标题文档降级到 heuristic"""
    text = "这是第一段内容。\n\n这是第二段内容。\n\n" * 50
    chunks = chunk_text(text, strategy="auto", max_size=100)
    assert len(chunks) >= 1


def test_chunk_ids_unique():
    text = "段落一。\n\n段落二。\n\n段落三。\n\n" * 50
    chunks = chunk_text(text, max_size=50)
    ids = [c.id for c in chunks]
    assert len(ids) == len(set(ids))  # 无重复


def test_chunk_index_sequential():
    text = "段落。\n\n" * 100
    chunks = chunk_text(text, max_size=50)
    indices = [c.chunk_index for c in chunks]
    assert indices == list(range(len(chunks)))


def test_count_tokens():
    assert count_tokens("hello") > 0
    assert count_tokens("") == 0


def test_profile_document():
    text = "# 标题1\n\n内容\n\n# 标题2\n\n内容2\n\n```python\ncode\n```"
    profile = profile_document(text)
    assert profile["headings"] == 2
    assert profile["code_blocks"] == 1
    assert profile["has_structure"] is True
    assert profile["total_tokens"] > 0

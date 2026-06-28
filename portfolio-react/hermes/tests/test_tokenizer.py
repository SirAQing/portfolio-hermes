"""CJK 二元分词测试"""
from core.rag.tokenizer import cjk_bigram_tokenize, build_fts_query


def test_cjk_bigram_basic():
    """'知识库' → '知识 识库'"""
    result = cjk_bigram_tokenize("知识库")
    tokens = result.split()
    assert "知识" in tokens
    assert "识库" in tokens


def test_single_cjk_char():
    """单个中文字符保留原样"""
    result = cjk_bigram_tokenize("中")
    assert "中" in result.split()


def test_mixed_cjk_and_ascii():
    """中英混合：CJK 二元分词，英文保持完整"""
    result = cjk_bigram_tokenize("RAG 知识库系统")
    tokens = result.split()
    assert "RAG" in tokens
    assert "知识" in tokens
    assert "识库" in tokens
    assert "库系" in tokens
    assert "系统" in tokens


def test_empty_input():
    assert cjk_bigram_tokenize("") == ""


def test_pure_ascii():
    result = cjk_bigram_tokenize("hello world foo")
    assert "hello" in result
    assert "world" in result


def test_build_fts_query():
    q = build_fts_query("知识库搜索")
    assert '"知识"' in q
    assert '"识库"' in q
    assert "OR" in q


def test_build_fts_query_empty():
    assert build_fts_query("") == ""

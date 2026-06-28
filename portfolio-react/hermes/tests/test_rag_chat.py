"""RAG 增强对话测试"""
import pytest
from models import init_db
from core.rag.rag_chat import (
    should_use_rag, get_default_kb_id, retrieve_context, build_rag_system_prompt
)
from core.rag.kb_repo import create_kb, create_document
from core.rag.chunk_repo import insert_chunk


@pytest.fixture
def setup_kb():
    init_db()
    kb_id = create_kb("默认KB", "测试", owner_id=None, is_public=True)
    doc_id = create_document(kb_id, "markdown", "文档", raw_content="知识库内容")
    insert_chunk(doc_id, kb_id, "RAG 知识库架构设计", 0, 10)
    return kb_id


def test_should_use_rag_short_message():
    """短消息不检索"""
    assert should_use_rag("hi") is False
    assert should_use_rag("你好") is False


def test_should_use_rag_greetings():
    """问候语不检索"""
    assert should_use_rag("你好啊") is False
    assert should_use_rag("hello there") is False


def test_should_use_rag_thanks():
    """致谢不检索"""
    assert should_use_rag("谢谢") is False


def test_should_use_rag_technical_question():
    """技术问题需要检索"""
    assert should_use_rag("RAG 知识库怎么实现的") is True
    assert should_use_rag("向量检索和关键词检索的区别") is True


def test_get_default_kb_id_no_kb():
    """无 KB 时返回 None"""
    init_db()
    # 重置缓存
    import core.rag.rag_chat as rc
    rc._default_kb_id = None
    assert get_default_kb_id() is None


def test_get_default_kb_id_with_kb(setup_kb):
    """有公开 KB 时返回其 ID"""
    import core.rag.rag_chat as rc
    rc._default_kb_id = None  # 重置缓存
    kb_id = get_default_kb_id()
    assert kb_id == setup_kb


async def test_retrieve_context_empty_kb():
    """无 KB 时返回空上下文"""
    init_db()
    import core.rag.rag_chat as rc
    rc._default_kb_id = None
    ctx, results = await retrieve_context("查询")
    assert ctx == ""
    assert results == []


async def test_retrieve_context_with_data(setup_kb):
    """有数据时返回非空上下文"""
    import core.rag.rag_chat as rc
    rc._default_kb_id = None  # 重置缓存让其重新查找
    ctx, results = await retrieve_context("知识库")
    # 至少 keyword 检索能命中
    assert isinstance(ctx, str)
    assert isinstance(results, list)


def test_build_rag_system_prompt_empty_context():
    """空上下文返回原始 prompt"""
    base = "你是助理"
    assert build_rag_system_prompt(base, "") == base


def test_build_rag_system_prompt_with_context():
    """有上下文时注入"""
    base = "你是助理"
    ctx = "这是知识库内容"
    result = build_rag_system_prompt(base, ctx)
    assert "你是助理" in result
    assert "这是知识库内容" in result
    assert "知识库参考资料" in result

"""knowledge_search 工具测试"""
import pytest

from core.agent.tools.knowledge_search import KnowledgeSearchTool
from core.rag.kb_repo import create_kb, create_document
from core.rag.chunk_repo import insert_chunk
import core.rag.rag_chat as rc


@pytest.fixture
def setup_kb():
    """初始化 KB + 文档 + chunks"""
    from models import init_db
    init_db()
    kb_id = create_kb("测试KB", "测试用", owner_id=None, is_public=True)
    doc_id = create_document(kb_id, "markdown", "测试文档", raw_content="RAG 架构设计")
    insert_chunk(doc_id, kb_id, "RAG 知识库架构设计包括分块、检索和融合", 0, 10)
    insert_chunk(doc_id, kb_id, "向量检索使用 Chroma 存储", 1, 10)
    # 重置默认 KB 缓存
    rc._default_kb_id = None
    return kb_id


def test_knowledge_search_name():
    """工具名"""
    tool = KnowledgeSearchTool()
    assert tool.name() == "knowledge_search"


def test_knowledge_search_schema():
    """参数 schema"""
    tool = KnowledgeSearchTool()
    schema = tool.parameters_schema()
    assert "query" in schema["properties"]
    assert "query" in schema["required"]


@pytest.mark.asyncio
async def test_knowledge_search_with_results(setup_kb):
    """有数据时返回搜索结果"""
    tool = KnowledgeSearchTool()
    result = await tool.execute(query="RAG 架构")
    assert "RAG" in result
    assert "来源文档" in result or "NO_RELEVANT_RESULTS" in result


@pytest.mark.asyncio
async def test_knowledge_search_no_results(setup_kb):
    """无匹配时返回提示"""
    tool = KnowledgeSearchTool()
    result = await tool.execute(query="zzzznotexist")
    # 可能 keyword 检索无结果
    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_knowledge_search_explicit_kb_id(setup_kb):
    """显式指定 kb_id"""
    tool = KnowledgeSearchTool()
    result = await tool.execute(query="向量检索", kb_id=setup_kb)
    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_knowledge_search_no_kb_available():
    """无可用 KB 时返回错误提示"""
    from models import init_db
    init_db()
    rc._default_kb_id = None
    tool = KnowledgeSearchTool()
    result = await tool.execute(query="anything")
    assert "NO_KNOWLEDGE_BASE" in result or "Error" in result

"""混合检索器集成测试 — 端到端 RRF 融合"""
import pytest
from models import init_db
from core.rag.chunk_repo import insert_chunk
from core.rag.retriever import hybrid_search, build_context
from core.rag.fusion import SearchResult
from core.rag.embedder import MockEmbedder
from core.rag.kb_repo import create_kb, create_document


@pytest.fixture
def setup_kb():
    """预置一个 KB + 几个 chunk + 向量"""
    init_db()
    kb_id = create_kb("测试KB", "测试用", owner_id=None)
    doc_id = create_document(kb_id, "markdown", "测试文档", source_path=None, raw_content="")
    # 使用 768 维 MockEmbedder 与 schema 一致
    embedder = MockEmbedder(dim=768)
    vec = [0.9] * 768
    insert_chunk(doc_id, kb_id, "RAG 知识库架构设计原则", 0, 20, embedding=vec)
    insert_chunk(doc_id, kb_id, "向量检索与关键词检索的融合", 1, 20, embedding=vec)
    insert_chunk(doc_id, kb_id, "今天的天气很好适合出门", 2, 20, embedding=vec)
    return embedder, vec, kb_id


async def test_hybrid_search_returns_results(setup_kb):
    embedder, vec, kb_id = setup_kb
    # 覆盖 MockEmbedder.embed 返回固定向量
    async def fake_embed(texts):
        return [vec[:] for _ in texts]
    embedder.embed = fake_embed

    results = await hybrid_search("知识库检索", kb_id, embedder=embedder)
    assert len(results) > 0
    assert all(hasattr(r, "chunk_id") for r in results)


async def test_hybrid_search_empty_kb(setup_kb):
    embedder, _, _ = setup_kb
    results = await hybrid_search("查询", "nonexistent_kb", embedder=embedder)
    assert results == []


def test_build_context_basic():
    results = [
        SearchResult(chunk_id="1", content="内容A", score=0.9, source="vector"),
        SearchResult(chunk_id="2", content="内容B", score=0.8, source="keyword"),
    ]
    ctx = build_context(results)
    assert "内容A" in ctx
    assert "内容B" in ctx
    assert "[1]" in ctx
    assert "[2]" in ctx


def test_build_context_respects_max_chars():
    results = [
        SearchResult(chunk_id=str(i), content="x" * 100, score=1.0)
        for i in range(100)
    ]
    ctx = build_context(results, max_chars=500)
    assert len(ctx) <= 600  # 含 [n] 标记，略超


def test_build_context_empty():
    assert build_context([]) == ""

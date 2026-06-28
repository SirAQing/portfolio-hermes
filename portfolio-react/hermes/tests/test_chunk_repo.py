"""chunk_repo 集成测试 — 向量 + FTS5 索引 + 检索"""
import pytest
from models import init_db
from core.rag.chunk_repo import insert_chunk, vector_search, keyword_search, delete_chunks_by_doc
from core.rag.kb_repo import create_kb, create_document


@pytest.fixture
def setup_db():
    init_db()
    # 预置 KB + document 以满足外键约束，返回 (kb_id, doc_id)
    kb1 = create_kb("测试KB1", "测试用", owner_id=None)
    kb2 = create_kb("测试KB2", "测试用", owner_id=None)
    doc1 = create_document(kb1, "markdown", "测试文档1", source_path=None, raw_content="")
    doc2 = create_document(kb2, "markdown", "测试文档2", source_path=None, raw_content="")
    return {"kb1": kb1, "kb2": kb2, "doc1": doc1, "doc2": doc2}


def test_insert_chunk_without_embedding(setup_db):
    ids = setup_db
    cid = insert_chunk(ids["doc1"], ids["kb1"], "这是一段中文内容", 0, 10)
    assert isinstance(cid, str) and len(cid) > 0


def test_insert_chunk_with_embedding(setup_db):
    ids = setup_db
    vec = [0.1, 0.2, 0.3] * 256  # 768 维
    cid = insert_chunk(ids["doc1"], ids["kb1"], "知识库内容", 0, 5, embedding=vec)
    assert cid


def test_keyword_search_finds_cjk(setup_db):
    """FTS5 + CJK 二元分词能检索中文"""
    ids = setup_db
    insert_chunk(ids["doc1"], ids["kb1"], "RAG 知识库系统设计", 0, 10)
    insert_chunk(ids["doc1"], ids["kb1"], "今天的天气真好", 1, 10)

    results = keyword_search("知识库", ids["kb1"], top_k=5)
    assert len(results) >= 1
    assert any("知识库" in r["content"] for r in results)


def test_keyword_search_filtered_by_kb(setup_db):
    """关键词检索按 kb_id 过滤"""
    ids = setup_db
    insert_chunk(ids["doc1"], ids["kb1"], "知识库内容", 0, 10)
    insert_chunk(ids["doc2"], ids["kb2"], "知识库内容", 0, 10)

    results = keyword_search("知识库", ids["kb1"], top_k=5)
    assert all(r["kb_id"] == ids["kb1"] for r in results)


def test_vector_search_returns_results(setup_db):
    """向量检索能返回结果"""
    ids = setup_db
    vec = [1.0] * 768
    insert_chunk(ids["doc1"], ids["kb1"], "内容A", 0, 5, embedding=vec)
    insert_chunk(ids["doc1"], ids["kb1"], "内容B", 1, 5, embedding=vec)

    results = vector_search(vec, ids["kb1"], top_k=10)
    assert len(results) >= 2


def test_vector_search_filtered_by_kb(setup_db):
    ids = setup_db
    vec = [0.5] * 768
    insert_chunk(ids["doc1"], ids["kb1"], "内容A", 0, 5, embedding=vec)
    insert_chunk(ids["doc2"], ids["kb2"], "内容B", 0, 5, embedding=vec)

    results = vector_search(vec, ids["kb1"], top_k=10)
    assert all(r["kb_id"] == ids["kb1"] for r in results)


def test_delete_chunks_by_doc(setup_db):
    ids = setup_db
    insert_chunk(ids["doc1"], ids["kb1"], "内容1", 0, 5)
    insert_chunk(ids["doc1"], ids["kb1"], "内容2", 1, 5)
    insert_chunk(ids["doc2"], ids["kb1"], "内容3", 0, 5)

    delete_chunks_by_doc(ids["doc1"])

    from core.rag.chunk_repo import get_chunks_by_doc

    assert get_chunks_by_doc(ids["doc1"]) == []
    assert len(get_chunks_by_doc(ids["doc2"])) == 1

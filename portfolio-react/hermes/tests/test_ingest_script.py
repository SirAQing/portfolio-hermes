"""摄入脚本单元测试 — 不调用真实嵌入 API"""
import pytest
from pathlib import Path
from models import init_db
from core.rag.kb_repo import create_kb, create_document, list_documents, get_document
from scripts.ingest_articles import find_existing_doc, ARTICLES_DIR


@pytest.fixture
def setup_kb():
    init_db()
    kb_id = create_kb("测试KB", "测试", owner_id=None, is_public=True)
    return kb_id


def test_find_existing_doc_returns_none_when_empty(setup_kb):
    assert find_existing_doc(setup_kb, "nonexistent.md") is None


def test_find_existing_doc_finds_match(setup_kb):
    kb_id = setup_kb
    doc_id = create_document(
        kb_id, "markdown", "标题", source_path="articles/zh/test.md", raw_content=""
    )
    found = find_existing_doc(kb_id, "articles/zh/test.md")
    assert found == doc_id


def test_find_existing_doc_returns_correct_one(setup_kb):
    """多个文档时返回匹配的那个"""
    kb_id = setup_kb
    doc1 = create_document(kb_id, "markdown", "A", source_path="a.md", raw_content="")
    doc2 = create_document(kb_id, "markdown", "B", source_path="b.md", raw_content="")
    assert find_existing_doc(kb_id, "a.md") == doc1
    assert find_existing_doc(kb_id, "b.md") == doc2


def test_articles_dir_exists():
    """脚本能正确定位文章目录"""
    assert ARTICLES_DIR.exists(), f"文章目录不存在: {ARTICLES_DIR}"
    zh_dir = ARTICLES_DIR / "zh"
    assert zh_dir.exists()
    md_files = list(zh_dir.glob("*.md"))
    assert len(md_files) > 0, "zh 目录下应有 markdown 文件"

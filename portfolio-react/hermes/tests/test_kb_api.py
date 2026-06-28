"""知识库 API 测试"""
import pytest
from fastapi.testclient import TestClient

from main import app
from core.rag.kb_repo import create_kb, create_document, list_kbs
from core.rag.chunk_repo import insert_chunk
from core.auth.user_repo import create_user, get_user_by_email
from core.auth.jwt_handler import create_access_token
from config import OWNER_EMAIL
from tests.conftest import fresh_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def owner_token(fresh_db):
    """创建 owner 用户并签发 token。"""
    from core.auth.init_owner import ensure_owner_account
    ensure_owner_account()
    user = get_user_by_email(OWNER_EMAIL)
    token = create_access_token(user["id"], user["role"])
    return token, user["id"]


@pytest.fixture
def auth_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token[0]}"}


def test_create_kb_requires_owner(client):
    """未登录用户不能创建 KB"""
    resp = client.post("/api/kb", json={"name": "test"})
    assert resp.status_code == 401


def test_create_kb(client, auth_headers):
    resp = client.post(
        "/api/kb",
        json={"name": "我的知识库", "description": "测试", "is_public": True},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    kb_id = data["id"]

    # 验证能列出
    resp = client.get("/api/kb", headers=auth_headers)
    assert resp.status_code == 200
    kbs = resp.json()
    assert any(kb["id"] == kb_id for kb in kbs)


def test_search_empty_kb(client, auth_headers):
    """对空 KB 搜索应返回空结果"""
    # 先创建 KB
    resp = client.post("/api/kb", json={"name": "搜索测试", "is_public": True}, headers=auth_headers)
    kb_id = resp.json()["id"]

    resp = client.post(
        "/api/kb/search",
        json={"query": "测试查询", "kb_id": kb_id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 0
    assert data["results"] == []


def test_search_with_data(client, auth_headers):
    """搜索有数据的 KB — 由于 mock embedder 返回随机向量，
    主要验证 keyword 检索路径能工作"""
    # 创建 KB + 文档 + chunk
    kb_id = create_kb("搜索KB", "测试", owner_id=None, is_public=True)
    doc_id = create_document(kb_id, "markdown", "文档", raw_content="知识库内容")
    insert_chunk(doc_id, kb_id, "RAG 知识库架构设计", 0, 10)
    insert_chunk(doc_id, kb_id, "向量检索与关键词检索融合", 1, 10)

    resp = client.post(
        "/api/kb/search",
        json={"query": "知识库", "kb_id": kb_id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] >= 1
    assert any("知识库" in r["content"] for r in data["results"])


def test_list_documents(client, auth_headers):
    kb_id = create_kb("文档列表KB", "测试", owner_id=None, is_public=True)
    create_document(kb_id, "markdown", "文档1", raw_content="内容1")
    create_document(kb_id, "markdown", "文档2", raw_content="内容2")

    resp = client.get(f"/api/kb/{kb_id}/documents", headers=auth_headers)
    assert resp.status_code == 200
    docs = resp.json()
    assert len(docs) == 2


def test_get_nonexistent_kb(client, auth_headers):
    resp = client.get("/api/kb/nonexistent-id", headers=auth_headers)
    assert resp.status_code == 404

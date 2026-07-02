"""笔记管理后台 API 基础连通性测试"""
import pytest
from fastapi.testclient import TestClient

from main import app
from core.auth.password import hash_password
from core.auth.user_repo import create_user


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def owner_token(client):
    """创建一个 owner 账号并登录，返回 access token。"""
    create_user("owner-test@example.com", "owner-test", hash_password("Pass1234"), role="owner")
    resp = client.post(
        "/api/auth/login",
        json={"email": "owner-test@example.com", "password": "Pass1234"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_create_and_get_note(client, owner_token):
    resp = client.post(
        "/api/admin/notes",
        json={
            "title": "测试笔记",
            "content": "这是测试内容。",
            "tags": ["测试", "草稿"],
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "测试笔记"
    assert data["content"] == "这是测试内容。"
    assert data["tags"] == ["测试", "草稿"]
    assert data["status"] == "draft"
    note_id = data["id"]

    resp = client.get(
        f"/api/admin/notes/{note_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == note_id


def test_list_notes(client, owner_token):
    client.post(
        "/api/admin/notes",
        json={"title": "列表测试", "content": "列表内容"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    resp = client.get(
        "/api/admin/notes?q=列表测试",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any(item["title"] == "列表测试" for item in data["items"])


def test_update_and_publish_note(client, owner_token):
    resp = client.post(
        "/api/admin/notes",
        json={"title": "更新测试", "content": "旧内容"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    note_id = resp.json()["id"]

    resp = client.put(
        f"/api/admin/notes/{note_id}",
        json={"content": "新内容", "tags": ["已更新"]},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["content"] == "新内容"
    assert data["tags"] == ["已更新"]

    resp = client.post(
        f"/api/admin/notes/{note_id}/publish",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "published"
    assert resp.json()["published_at"] is not None


def test_delete_note(client, owner_token):
    resp = client.post(
        "/api/admin/notes",
        json={"title": "待删除"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    note_id = resp.json()["id"]

    resp = client.delete(
        f"/api/admin/notes/{note_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200

    resp = client.get(
        f"/api/admin/notes/{note_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 404


def test_ai_annotate_note(client, owner_token, monkeypatch):
    resp = client.post(
        "/api/admin/notes",
        json={"title": "AI 批注测试", "content": "这是一段需要 AI 批注的笔记内容。"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    note_id = resp.json()["id"]

    async def mock_chat_completion(messages, stream=False, mode="demo"):
        return '{"summary": "摘要", "ai_notes": "点评", "suggested_tags": ["AI", "测试"]}'

    monkeypatch.setattr("core.notes.note_service.chat_completion", mock_chat_completion)

    resp = client.post(
        f"/api/admin/notes/{note_id}/ai-annotate",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["summary"] == "摘要"
    assert data["ai_notes"] == "点评"
    assert data["suggested_tags"] == ["AI", "测试"]

    # 笔记字段应被更新
    resp = client.get(
        f"/api/admin/notes/{note_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    note = resp.json()
    assert note["summary"] == "摘要"
    assert note["ai_notes"] == "点评"
    assert note["tags"] == ["AI", "测试"]


def test_sync_note_to_kb(client, owner_token):
    resp = client.post(
        "/api/admin/notes",
        json={
            "title": "知识库同步测试",
            "content": "## 标题\n\n这是一段用于同步到知识库的笔记内容。",
            "tags": ["RAG"],
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    note_id = resp.json()["id"]

    resp = client.post(
        f"/api/admin/notes/{note_id}/sync-to-kb",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["kb_id"]
    assert data["doc_id"]

    resp = client.get(
        f"/api/admin/notes/{note_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    note = resp.json()
    assert note["is_kb_synced"] is True
    assert note["kb_id"] == data["kb_id"]
    assert note["kb_doc_id"] == data["doc_id"]


def test_notes_require_owner(client):
    resp = client.get("/api/admin/notes")
    assert resp.status_code == 403

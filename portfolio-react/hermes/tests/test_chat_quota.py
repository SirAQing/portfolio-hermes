"""对话 API 配额集成测试"""
import pytest
from fastapi.testclient import TestClient
from main import app
from core.auth.password import hash_password
from core.auth.user_repo import create_user
from config import GUEST_DAILY_LIMIT


@pytest.fixture
def client():
    return TestClient(app)


def test_chat_requires_no_auth_but_counts_quota(client, monkeypatch):
    """访客可对话但消耗配额。mock LLM 避免真实调用。"""
    async def fake_completion(*args, **kwargs):
        return "mocked reply"
    async def fake_notify(*args, **kwargs):
        return None
    monkeypatch.setattr("main.chat_completion", fake_completion)
    monkeypatch.setattr("main.send_realtime_notification", fake_notify)

    # 连续调用 GUEST_DAILY_LIMIT 次
    for i in range(GUEST_DAILY_LIMIT):
        resp = client.post(
            "/api/chat",
            json={"message": f"hello {i}", "visitor_name": "guest"},
        )
        assert resp.status_code == 200, f"iteration {i} failed: {resp.text}"

    # 第 6 次应被拒绝
    resp = client.post(
        "/api/chat",
        json={"message": "should fail", "visitor_name": "guest"},
    )
    assert resp.status_code == 403
    assert "quota" in resp.json()["detail"].lower()


def test_logged_in_user_not_limited(client, monkeypatch):
    """登录用户不受配额限制。"""
    async def fake_completion(*args, **kwargs):
        return "mocked reply"
    async def fake_notify(*args, **kwargs):
        return None
    monkeypatch.setattr("main.chat_completion", fake_completion)
    monkeypatch.setattr("main.send_realtime_notification", fake_notify)

    create_user("u@x.com", "u", hash_password("Pass123"), role="user")
    resp = client.post(
        "/api/auth/login", json={"email": "u@x.com", "password": "Pass123"}
    )
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 超过配额数也允许
    for i in range(GUEST_DAILY_LIMIT + 2):
        resp = client.post(
            "/api/chat",
            json={"message": f"hi {i}"},
            headers=headers,
        )
        assert resp.status_code == 200, f"iteration {i} failed"

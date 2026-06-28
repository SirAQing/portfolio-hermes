"""面试官邀请码测试"""
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
    """创建 owner 账号并登录，返回 access_token。"""
    create_user(
        "owner@test.com", "owner", hash_password("Pass123"), role="owner"
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "owner@test.com", "password": "Pass123"},
    )
    return resp.json()["access_token"]


def test_create_invite(client, owner_token):
    resp = client.post(
        "/api/admin/invites",
        json={
            "company": "Acme Corp",
            "position": "Backend Engineer",
            "interview_date": "2026-07-01",
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "code" in data
    assert len(data["code"]) >= 6


def test_invite_requires_owner(client):
    """普通用户不能创建邀请码。"""
    create_user("user@test.com", "user", hash_password("Pass123"), role="user")
    resp = client.post(
        "/api/auth/login",
        json={"email": "user@test.com", "password": "Pass123"},
    )
    token = resp.json()["access_token"]
    resp = client.post(
        "/api/admin/invites",
        json={"company": "X"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


def test_redeem_invite(client, owner_token):
    # 创建邀请码
    resp = client.post(
        "/api/admin/invites",
        json={"company": "TestCo"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    code = resp.json()["code"]
    # 凭码登录
    resp = client.post(
        "/api/auth/interviewer/redeem", json={"code": code}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "interviewer"


def test_redeem_invalid_code(client):
    resp = client.post(
        "/api/auth/interviewer/redeem", json={"code": "INVALID"}
    )
    assert resp.status_code == 404


def test_list_invites(client, owner_token):
    # 创建两个邀请码
    client.post(
        "/api/admin/invites",
        json={"company": "A"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    client.post(
        "/api/admin/invites",
        json={"company": "B"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    resp = client.get(
        "/api/admin/invites", headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

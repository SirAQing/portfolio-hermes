"""认证 API 路由测试"""
import pytest
from fastapi.testclient import TestClient
from main import app
from core.auth.password import hash_password
from core.auth.user_repo import create_user


@pytest.fixture
def client():
    return TestClient(app)


def test_register_and_login(client):
    # 注册
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "username": "tester",
            "password": "Pass1234",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"

    # 登录
    resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "Pass1234"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "x@example.com",
            "username": "x",
            "password": "Right123",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "x@example.com", "password": "Wrong123"},
    )
    assert resp.status_code == 401


def test_me_with_token(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "me@example.com",
            "username": "me",
            "password": "Pass1234",
        },
    )
    token = resp.json()["access_token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


def test_me_without_token_returns_guest(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_guest"] is True


def test_refresh_token(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "r@example.com",
            "username": "r",
            "password": "Pass1234",
        },
    )
    refresh = resp.json()["refresh_token"]
    resp = client.post(
        "/api/auth/refresh", json={"refresh_token": refresh}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()

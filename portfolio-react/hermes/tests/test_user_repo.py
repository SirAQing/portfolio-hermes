"""用户数据访问层测试"""
import pytest
from models import init_db
from core.auth.password import hash_password
from core.auth.user_repo import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_last_login,
)


@pytest.fixture(autouse=True)
def db():
    init_db()


def test_create_and_get_user():
    uid = create_user("test@example.com", "tester", hash_password("pass123"), role="user")
    user = get_user_by_email("test@example.com")
    assert user is not None
    assert user["id"] == uid
    assert user["email"] == "test@example.com"
    assert user["role"] == "user"


def test_get_nonexistent_user():
    assert get_user_by_email("nobody@example.com") is None
    assert get_user_by_id("nonexistent") is None


def test_update_last_login():
    uid = create_user("login@example.com", "logger", hash_password("pass"), role="user")
    update_last_login(uid)
    user = get_user_by_id(uid)
    assert user["last_login_at"] is not None

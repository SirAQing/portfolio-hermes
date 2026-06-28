"""JWT 签发与验证测试"""
from core.auth.jwt_handler import create_access_token, create_refresh_token, decode_token


def test_access_token_contains_user_id():
    token = create_access_token("user-123", "owner")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "owner"
    assert payload["type"] == "access"


def test_refresh_token_has_jti():
    token = create_refresh_token("user-123")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "refresh"
    assert "jti" in payload


def test_invalid_token_returns_none():
    result = decode_token("invalid.token.here")
    assert result is None

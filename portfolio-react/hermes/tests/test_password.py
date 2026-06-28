"""密码哈希测试"""
from core.auth.password import hash_password, verify_password


def test_hash_and_verify():
    pw = "MyPass123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True


def test_verify_wrong_password():
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


def test_hash_is_unique():
    """bcrypt salt 保证每次哈希不同"""
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2

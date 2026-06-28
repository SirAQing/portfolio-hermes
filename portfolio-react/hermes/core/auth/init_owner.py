"""Owner 账号自动初始化"""
from config import OWNER_EMAIL, OWNER_INITIAL_PASSWORD
from core.auth.password import hash_password
from core.auth.user_repo import get_user_by_email, create_user


def ensure_owner_account():
    """首次启动时自动创建 owner 账号。已存在则跳过。"""
    existing = get_user_by_email(OWNER_EMAIL)
    if existing:
        return False
    create_user(
        email=OWNER_EMAIL,
        username="owner",
        password_hash=hash_password(OWNER_INITIAL_PASSWORD),
        role="owner",
    )
    print(f"[hermes] Owner account created: {OWNER_EMAIL}")
    print(
        f"[hermes] Initial password: {OWNER_INITIAL_PASSWORD} — change it after first login!"
    )
    return True

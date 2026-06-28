"""pytest 配置 — 测试数据库隔离"""
import sys
import os
import tempfile

# 将 hermes 目录添加到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 在导入任何模块前，覆盖 DATABASE_PATH 为临时文件
_hermes_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()
os.environ["DATABASE_PATH"] = _tmp_db.name

# 现在安全导入
import pytest
from models import init_db, get_db


@pytest.fixture(autouse=True)
def clean_db():
    """每个测试前初始化数据库，测试后清理所有表数据。"""
    init_db()
    yield
    # 测试后清理所有表（保留 schema）
    with get_db() as conn:
        for table in [
            "messages", "conversations",
            "guest_quotas", "refresh_tokens", "interviewer_invites", "users",
        ]:
            conn.execute(f"DELETE FROM {table}")

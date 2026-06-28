"""Pytest 全局 fixture — 测试数据库隔离"""
import os
import tempfile

# 在导入任何项目模块前，先设置临时数据库路径
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()
os.environ["DATABASE_PATH"] = _tmp_db.name

import pytest
from models import init_db


@pytest.fixture(autouse=True)
def fresh_db():
    """每个测试函数运行前重新初始化数据库。"""
    from models import get_db

    init_db()
    yield
    # 测试后清理所有表数据（保留表结构）
    with get_db() as conn:
        # 普通表
        tables = [
            "messages",
            "conversations",
            "chunks_fts",
            "chunks_vec",
            "chunks",
            "documents",
            "knowledge_bases",
            "refresh_tokens",
            "guest_quotas",
            "interviewer_invites",
            "users",
        ]
        for t in tables:
            try:
                conn.execute(f"DELETE FROM {t}")
            except Exception:
                pass
        conn.commit()

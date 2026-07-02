"""笔记模块数据库迁移脚本

幂等执行：可重复运行，不会破坏已有数据。
用法：
    python scripts/migrate_notes.py              # 直接执行迁移
    python scripts/migrate_notes.py --dry-run    # 仅打印待执行的 SQL
"""
import argparse
import sys
from pathlib import Path

# 确保能从 scripts 目录找到 hermes 根目录
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models import get_db


NOTES_DDL = """
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
    summary TEXT,
    ai_notes TEXT,
    tags TEXT DEFAULT '[]',
    metadata TEXT DEFAULT '{}',
    is_kb_synced INTEGER DEFAULT 0,
    kb_id TEXT,
    kb_doc_id TEXT,
    published_at TEXT,
    view_count INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
"""


def migrate(dry_run: bool = False):
    print("[migrate_notes] 开始笔记表迁移...")
    if dry_run:
        print("[migrate_notes] --dry-run 模式，仅打印 SQL：")
        print(NOTES_DDL)
        return

    with get_db() as conn:
        conn.executescript(NOTES_DDL)

        # 校验表是否已存在
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name='notes'"
        ).fetchone()
        if row and row["cnt"]:
            print("[migrate_notes] notes 表已就绪。")
        else:
            raise RuntimeError("notes 表创建失败")

    print("[migrate_notes] 迁移完成。")


def main():
    parser = argparse.ArgumentParser(description="笔记模块数据库迁移")
    parser.add_argument("--dry-run", action="store_true", help="仅打印 SQL，不执行")
    args = parser.parse_args()
    migrate(dry_run=args.dry_run)


if __name__ == "__main__":
    main()

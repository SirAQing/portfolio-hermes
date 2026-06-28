"""
SQLite database models and operations for Hermes Chat.
Uses raw sqlite3 for simplicity - no ORM needed for this scale.
"""
import sqlite3
import json
import time
import uuid
from contextlib import contextmanager
from config import DATABASE_PATH

try:
    import sqlite_vec  # type: ignore
    _HAVE_VEC = True
except ImportError:
    _HAVE_VEC = False


def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    if _HAVE_VEC:
        conn.enable_load_extension(True)
        try:
            sqlite_vec.load(conn)
        except Exception:
            pass
        conn.enable_load_extension(False)
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                visitor_id TEXT NOT NULL,
                visitor_name TEXT,
                started_at REAL NOT NULL,
                last_active REAL NOT NULL,
                summary TEXT,
                is_urgent INTEGER DEFAULT 0,
                notified_at REAL DEFAULT 0,
                message_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('visitor', 'assistant')),
                content TEXT NOT NULL,
                created_at REAL NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conversation
                ON messages(conversation_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_conversations_active
                ON conversations(last_active);

            -- 用户表
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                is_active INTEGER DEFAULT 1,
                expires_at TEXT,
                created_by TEXT REFERENCES users(id),
                last_login_at TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            -- 访客配额表
            CREATE TABLE IF NOT EXISTS guest_quotas (
                id TEXT PRIMARY KEY,
                ip_hash TEXT NOT NULL,
                query_date TEXT NOT NULL,
                query_count INTEGER DEFAULT 0,
                last_query_at TEXT,
                UNIQUE(ip_hash, query_date)
            );

            -- 刷新令牌表
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            -- 面试官邀请码
            CREATE TABLE IF NOT EXISTS interviewer_invites (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                created_by TEXT NOT NULL REFERENCES users(id),
                company TEXT,
                position TEXT,
                interview_date TEXT,
                max_uses INTEGER DEFAULT 1,
                used_count INTEGER DEFAULT 0,
                expires_at TEXT NOT NULL,
                linked_user_id TEXT REFERENCES users(id),
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_guest_quotas_lookup ON guest_quotas(ip_hash, query_date);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_invites_code ON interviewer_invites(code);

            -- ── RAG 表 ──
            CREATE TABLE IF NOT EXISTS knowledge_bases (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                owner_id TEXT REFERENCES users(id),
                is_public INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                kb_id TEXT NOT NULL REFERENCES knowledge_bases(id),
                source_type TEXT NOT NULL,
                source_path TEXT,
                title TEXT NOT NULL,
                raw_content TEXT,
                status TEXT DEFAULT 'pending',
                embedding_model TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            -- chunks 普通表存储元数据和内容（向量存在 vec0 虚拟表）
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                doc_id TEXT NOT NULL REFERENCES documents(id),
                kb_id TEXT NOT NULL,
                content TEXT NOT NULL,
                chunk_index INTEGER,
                token_count INTEGER,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
            CREATE INDEX IF NOT EXISTS idx_chunks_kb ON chunks(kb_id);
            CREATE INDEX IF NOT EXISTS idx_docs_kb ON documents(kb_id);
        """)

        # FTS5 关键词检索（CJK 二元分词由应用层处理，存储时已分词）
        conn.execute(
            """CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                chunk_id UNINDEXED, content, tokenize='unicode61'
            )"""
        )

        # vec0 向量表按需创建（不同 KB 可能用不同维度），此处创建默认 768 维
        if _HAVE_VEC:
            try:
                conn.execute(
                    """CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
                        chunk_id TEXT PRIMARY KEY,
                        embedding FLOAT[768]
                    )"""
                )
            except Exception as e:
                print(f"[models] vec0 table creation skipped: {e}")


def create_conversation(visitor_id: str, visitor_name: str = None) -> str:
    """Create a new conversation and return its ID."""
    conv_id = str(uuid.uuid4())[:8]
    now = time.time()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO conversations (id, visitor_id, visitor_name, started_at, last_active) VALUES (?, ?, ?, ?, ?)",
            (conv_id, visitor_id, visitor_name, now, now)
        )
    return conv_id


def get_conversation(conv_id: str) -> dict | None:
    """Get conversation by ID."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,)).fetchone()
        return dict(row) if row else None


def add_message(conv_id: str, role: str, content: str) -> str:
    """Add a message to a conversation."""
    msg_id = str(uuid.uuid4())[:8]
    now = time.time()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (msg_id, conv_id, role, content, now)
        )
        conn.execute(
            "UPDATE conversations SET last_active = ?, message_count = message_count + 1 WHERE id = ?",
            (now, conv_id)
        )
    return msg_id


def get_conversation_messages(conv_id: str, limit: int = 50) -> list[dict]:
    """Get messages in a conversation."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?",
            (conv_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]


def get_unnotified_messages(since: float) -> list[dict]:
    """Get conversations with new messages since a given timestamp."""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT c.id, c.visitor_id, c.visitor_name, c.started_at, c.last_active,
                   c.message_count, c.is_urgent
            FROM conversations c
            WHERE c.last_active > ? AND c.notified_at < c.last_active
            ORDER BY c.last_active DESC
        """, (since,)).fetchall()

        result = []
        for row in rows:
            conv = dict(row)
            msgs = conn.execute("""
                SELECT role, content, created_at
                FROM messages
                WHERE conversation_id = ? AND created_at > ?
                ORDER BY created_at ASC
            """, (conv['id'], since)).fetchall()
            conv['new_messages'] = [dict(m) for m in msgs]
            result.append(conv)

        return result


def mark_notified(conv_ids: list[str]):
    """Mark conversations as notified."""
    if not conv_ids:
        return
    now = time.time()
    with get_db() as conn:
        placeholders = ','.join('?' * len(conv_ids))
        conn.execute(
            f"UPDATE conversations SET notified_at = ? WHERE id IN ({placeholders})",
            [now] + conv_ids
        )


def mark_urgent(conv_id: str):
    """Mark a conversation as urgent."""
    with get_db() as conn:
        conn.execute("UPDATE conversations SET is_urgent = 1 WHERE id = ?", (conv_id,))

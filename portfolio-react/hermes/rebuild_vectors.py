"""重新生成所有已上传文档的向量嵌入。

用法：
    python rebuild_vectors.py

作用：
    1. 删除旧 chroma_data 持久化目录
    2. 清空 SQLite chunks 表
    3. 直接对 documents.raw_content 重新分块并生成新向量
"""
import asyncio
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import CHROMA_PERSIST_DIR
from core.rag.chunker import chunk_text
from core.rag.embedder import get_default_embedder
from core.rag.chunk_repo import insert_chunk
from models import get_db


def reset_vector_store():
    """清空向量存储和 chunks 表。"""
    if os.path.exists(CHROMA_PERSIST_DIR):
        shutil.rmtree(CHROMA_PERSIST_DIR)
        print(f"[rebuild] Removed {CHROMA_PERSIST_DIR}")
    else:
        print(f"[rebuild] {CHROMA_PERSIST_DIR} not found, skipping")

    with get_db() as conn:
        conn.execute("DELETE FROM chunks")
        try:
            conn.execute("DELETE FROM sqlite_sequence WHERE name='chunks'")
        except Exception:
            pass
        conn.commit()
        print("[rebuild] Cleared chunks table")


async def reprocess_documents():
    """重新处理所有文档（跳过解析，直接用 raw_content 分块 + 嵌入）。"""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, kb_id, source_path, title, raw_content FROM documents ORDER BY created_at"
        ).fetchall()

    if not rows:
        print("[rebuild] No documents found")
        return

    print(f"[rebuild] Found {len(rows)} documents to reprocess")
    embedder = get_default_embedder()

    for row in rows:
        doc_id = row["id"]
        kb_id = row["kb_id"]
        title = row["title"] or "untitled"
        raw_content = row["raw_content"] or ""
        print(f"[rebuild] Reprocessing: {title} ({doc_id})")

        if not raw_content.strip():
            print(f"[rebuild]   -> skipped: empty content")
            continue

        try:
            chunks = chunk_text(raw_content, strategy="auto")
            if not chunks:
                print(f"[rebuild]   -> skipped: no chunks generated")
                continue

            texts = [c.content for c in chunks]
            embeddings = await embedder.embed(texts)

            if len(embeddings) != len(chunks):
                print(
                    f"[rebuild]   -> failed: embedding count mismatch {len(embeddings)} != {len(chunks)}"
                )
                continue

            total_tokens = 0
            for i, chunk in enumerate(chunks):
                insert_chunk(
                    doc_id=doc_id,
                    kb_id=kb_id,
                    content=chunk.content,
                    chunk_index=chunk.chunk_index,
                    token_count=chunk.token_count,
                    embedding=embeddings[i],
                )
                total_tokens += chunk.token_count

            # 更新文档统计
            with get_db() as conn:
                conn.execute(
                    "UPDATE documents SET status = 'ready', chunk_count = ?, total_tokens = ? WHERE id = ?",
                    (len(chunks), total_tokens, doc_id),
                )
                conn.commit()

            print(
                f"[rebuild]   -> success: chunks={len(chunks)}, tokens={total_tokens}, dim={len(embeddings[0])}"
            )
        except Exception as e:
            print(f"[rebuild]   -> failed: {e}")
            with get_db() as conn:
                conn.execute(
                    "UPDATE documents SET status = 'error', error_message = ? WHERE id = ?",
                    (str(e), doc_id),
                )
                conn.commit()


async def main():
    reset_vector_store()
    await reprocess_documents()
    print("[rebuild] Done")


if __name__ == "__main__":
    asyncio.run(main())

"""摄入现有 Markdown 文章到 RAG 知识库

用法:
    python scripts/ingest_articles.py [--kb-id <id>] [--kb-name <name>]

行为:
    1. 如未指定 --kb-id，则创建一个名为 "Portfolio Articles" 的公开 KB
    2. 扫描 src/content/articles/zh/ 和 en/ 下所有 .md 文件
    3. 对每个文件：分块 + 嵌入 + 存储
    4. 打印摄入进度

设计要点（参考 WeKnora loader.go）:
    - 幂等：相同 source_path 的文档会被替换（先删后插）
    - 限流：嵌入 API 批量调用，单批 EMBEDDING_BATCH_SIZE
    - 容错：单个文件失败不阻塞其他文件
"""
import argparse
import asyncio
import os
import sys
from pathlib import Path

# 让脚本能 import hermes 包
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models import init_db
from core.rag.kb_repo import (
    create_kb, get_kb, list_kbs, create_document, update_document_status,
    get_document, list_documents, delete_document,
)
from core.rag.chunk_repo import insert_chunk, delete_chunks_by_doc
from core.rag.chunker import chunk_text, profile_document
from core.rag.embedder import get_default_embedder

ARTICLES_DIR = Path(__file__).resolve().parent.parent.parent / "src" / "content" / "articles"


def find_existing_doc(kb_id: str, source_path: str) -> str | None:
    """根据 source_path 查找已存在的文档。"""
    docs = list_documents(kb_id)
    for d in docs:
        if d.get("source_path") == source_path:
            return d["id"]
    return None


async def ingest_file(kb_id: str, file_path: Path) -> bool:
    """摄入单个 markdown 文件。返回是否成功。"""
    rel_path = str(file_path.relative_to(ARTICLES_DIR.parent.parent))
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [SKIP] 读取失败 {rel_path}: {e}")
        return False

    if not content.strip():
        print(f"  [SKIP] 空文件 {rel_path}")
        return False

    title = file_path.stem

    # 幂等：删除旧文档
    existing_doc_id = find_existing_doc(kb_id, rel_path)
    if existing_doc_id:
        delete_document(existing_doc_id)
        print(f"  [REPL] 替换已存在文档 {rel_path}")

    # 创建新文档
    embedder = get_default_embedder()
    doc_id = create_document(
        kb_id=kb_id,
        source_type="markdown",
        title=title,
        source_path=rel_path,
        raw_content=content,
        embedding_model=embedder.model_name(),
    )

    profile = profile_document(content)
    print(f"  [INGEST] {rel_path} | tokens={profile['total_tokens']} headings={profile['headings']}")

    update_document_status(doc_id, "processing")

    try:
        chunks = chunk_text(content, strategy="auto")
        if not chunks:
            update_document_status(doc_id, "empty")
            print(f"  [WARN] 无分块 {rel_path}")
            return True

        # 批量嵌入
        texts = [c.content for c in chunks]
        embeddings = await embedder.embed(texts)

        if len(embeddings) != len(chunks):
            update_document_status(doc_id, f"error: embedding count mismatch")
            print(f"  [FAIL] {rel_path} 嵌入数量不匹配")
            return False

        for chunk, emb in zip(chunks, embeddings):
            insert_chunk(
                doc_id=doc_id,
                kb_id=kb_id,
                content=chunk.content,
                chunk_index=chunk.chunk_index,
                token_count=chunk.token_count,
                embedding=emb,
            )

        update_document_status(doc_id, "ready")
        print(f"  [OK] {rel_path} | chunks={len(chunks)}")
        return True
    except Exception as e:
        update_document_status(doc_id, f"error: {e}")
        print(f"  [FAIL] {rel_path}: {e}")
        return False


async def main():
    parser = argparse.ArgumentParser(description="摄入 Markdown 文章到 RAG 知识库")
    parser.add_argument("--kb-id", help="已存在的 KB ID（不指定则新建）")
    parser.add_argument("--kb-name", default="Portfolio Articles", help="新 KB 的名称")
    parser.add_argument("--lang", choices=["zh", "en", "both"], default="both", help="摄入语言")
    args = parser.parse_args()

    init_db()

    # 获取或创建 KB
    kb_id = args.kb_id
    if not kb_id:
        # 默认创建一个公开 KB
        kb_id = create_kb(args.kb_name, "Portfolio 文章自动摄入", owner_id=None, is_public=True)
        print(f"[init] 创建新知识库: {kb_id}")
    else:
        if not get_kb(kb_id):
            print(f"[error] KB 不存在: {kb_id}")
            sys.exit(1)
        print(f"[init] 使用已有知识库: {kb_id}")

    # 收集文件
    files: list[Path] = []
    lang_dirs = ["zh", "en"] if args.lang == "both" else [args.lang]
    for lang in lang_dirs:
        lang_dir = ARTICLES_DIR / lang
        if lang_dir.exists():
            files.extend(sorted(lang_dir.glob("*.md")))

    if not files:
        print("[warn] 未找到任何 markdown 文件")
        return

    print(f"[scan] 发现 {len(files)} 个 markdown 文件")
    print(f"[scan] 嵌入模型: {get_default_embedder().model_name()} (dim={get_default_embedder().dimension()})")
    print()

    success = 0
    for f in files:
        ok = await ingest_file(kb_id, f)
        if ok:
            success += 1

    print()
    print(f"[done] 成功 {success}/{len(files)} 文件已摄入 KB {kb_id}")

    # 打印 KB 概况
    docs = list_documents(kb_id)
    print(f"[summary] KB 文档数: {len(docs)}")
    status_count: dict[str, int] = {}
    for d in docs:
        s = d.get("status", "unknown")
        status_count[s] = status_count.get(s, 0) + 1
    print(f"[summary] 状态分布: {status_count}")


if __name__ == "__main__":
    asyncio.run(main())

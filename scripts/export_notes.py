"""导出部署方案与学习笔记为可直接发布的 Markdown 文件。"""
import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "portfolio-react" / "src" / "content" / "articles" / "zh"
DST_DIR = ROOT / "docs" / "notes-export"
MANIFEST_PATH = ROOT / "portfolio-react" / "src" / "content" / "manifest.json"


def main():
    DST_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    articles = {a["slug"]: a for a in manifest.get("articles", [])}

    md_files = sorted([f for f in SRC_DIR.iterdir() if f.suffix == ".md"])

    rows = [
        "# 笔记导出目录\n",
        "> 以下 Markdown 文件可直接复制到笔记管理后台发布。\n",
        "| 文件 | 标题 | 分类 | 标签 | 描述 |",
        "| --- | --- | --- | --- | --- |",
    ]

    for file_path in md_files:
        slug = file_path.stem
        meta = articles.get(slug, {})
        title = meta.get("title", slug)
        category = meta.get("category", "-")
        tags = ", ".join(meta.get("tags", [])) or "-"
        description = meta.get("description", "")

        dst_file = DST_DIR / file_path.name
        shutil.copy2(file_path, dst_file)
        rows.append(f"| [{file_path.name}](./{file_path.name}) | {title} | {category} | {tags} | {description} |")
        print(f"  copied: {file_path.name}")

    (DST_DIR / "index.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(f"\nExported {len(md_files)} files to {DST_DIR}/")


if __name__ == "__main__":
    main()

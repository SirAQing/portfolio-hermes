"""笔记业务服务：AI 批注与知识库同步"""
import json
import re

from core.notes.note_repo import get_note, update_note
from core.rag.kb_repo import (
    create_kb,
    get_kb,
    list_kbs,
    create_document,
    get_document,
    update_document_content,
)
from core.rag.pipeline import ingest_markdown
from llm import chat_completion_with_system


_AI_ANNOTATE_SYSTEM_PROMPT = """你是一位专业的内容编辑助手。请仔细阅读用户提供的笔记，并生成摘要、点评和标签。

你必须严格返回如下 JSON 格式，不要输出 markdown 代码块、不要输出任何额外说明文字：
{
  "summary": "100-200 字的内容摘要，直接概括核心观点",
  "ai_notes": "对笔记亮点、结构或表达的简短点评（2-4 条），用换行分隔",
  "suggested_tags": ["tag1", "tag2", "tag3"]
}

注意：
- summary 和 ai_notes 必须是字符串。
- suggested_tags 必须是字符串数组，标签简洁，3-8 个。
- 只输出 JSON，不要任何其他文字。"""


def _extract_json(text: str) -> dict:
    """从 LLM 输出中提取 JSON 对象。"""
    text = text.strip()
    # 去除 markdown 代码块标记
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # 尝试直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 使用栈匹配第一个完整的 { ... }
    start = text.find("{")
    if start == -1:
        return {}

    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start : i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    return {}
    return {}


def _normalize_ai_result(result: dict) -> dict:
    """规范化 AI 批注结果，确保字段类型正确。"""
    summary = result.get("summary", "")
    if not isinstance(summary, str):
        summary = str(summary)

    ai_notes = result.get("ai_notes", "")
    if isinstance(ai_notes, list):
        ai_notes = "\n".join(str(item) for item in ai_notes)
    elif not isinstance(ai_notes, str):
        ai_notes = str(ai_notes)

    suggested_tags = result.get("suggested_tags", [])
    if isinstance(suggested_tags, str):
        suggested_tags = [t.strip() for t in suggested_tags.split(",") if t.strip()]
    elif not isinstance(suggested_tags, list):
        suggested_tags = []

    normalized_tags = []
    for tag in suggested_tags:
        if isinstance(tag, str) and tag.strip():
            normalized_tags.append(tag.strip())
        elif tag is not None:
            normalized_tags.append(str(tag).strip())

    return {
        "summary": summary.strip(),
        "ai_notes": ai_notes.strip(),
        "suggested_tags": normalized_tags[:8],
    }


async def ai_annotate_note(note_id: str, mode: str = "demo") -> dict:
    """调用 LLM 为笔记生成摘要、AI 批注和推荐标签。"""
    note = get_note(note_id)
    if not note:
        raise ValueError("Note not found")

    user_content = f"笔记标题：{note.get('title', '')}\n\n笔记内容：\n{note.get('content', '')}"
    messages = [{"role": "user", "content": user_content}]

    raw_output = await chat_completion_with_system(
        messages,
        system_prompt=_AI_ANNOTATE_SYSTEM_PROMPT,
        mode=mode,
        temperature=0.3,
        max_tokens=2048,
    )

    result = _extract_json(raw_output)
    if not result:
        raise ValueError(f"AI 批注返回格式无法解析: {raw_output[:200]}")

    normalized = _normalize_ai_result(result)

    update_note(
        note_id,
        summary=normalized["summary"],
        ai_notes=normalized["ai_notes"],
        tags=normalized["suggested_tags"] or None,
    )
    return normalized


def _ensure_notes_kb(owner_id: str) -> str:
    """获取或创建名为「笔记」的默认知识库。"""
    kbs = list_kbs(owner_id=owner_id, include_public=False)
    for kb in kbs:
        if kb.get("name") == "笔记":
            return kb["id"]
    return create_kb(
        name="笔记",
        description="笔记自动同步专用知识库",
        owner_id=owner_id,
        is_public=False,
    )


async def sync_note_to_kb(
    note_id: str,
    owner_id: str,
    kb_id: str | None = None,
) -> dict:
    """将笔记内容同步到知识库；默认使用/创建名为「笔记」的知识库。"""
    note = get_note(note_id)
    if not note:
        raise ValueError("Note not found")

    if kb_id:
        kb = get_kb(kb_id)
        if not kb:
            raise ValueError("Knowledge base not found")
        if kb.get("owner_id") and kb["owner_id"] != owner_id:
            raise PermissionError("Access denied")
    else:
        kb_id = _ensure_notes_kb(owner_id)

    doc_id = note.get("kb_doc_id")
    title = note.get("title", "未命名笔记")
    content = note.get("content", "")
    filename = f"{note.get('slug') or note_id}.md"

    if doc_id and get_document(doc_id):
        update_document_content(doc_id, title, content)
    else:
        doc_id = create_document(
            kb_id=kb_id,
            source_type="markdown",
            title=title,
            source_path=filename,
            raw_content=content,
        )

    # 直接等待流水线完成，返回时可拿到处理结果
    result = await ingest_markdown(doc_id, kb_id, content, filename)

    update_note(
        note_id,
        is_kb_synced=1,
        kb_id=kb_id,
        kb_doc_id=doc_id,
    )

    return {
        "kb_id": kb_id,
        "doc_id": doc_id,
        "stage": result.stage,
        "success": result.success,
        "chunk_count": result.chunk_count,
        "message": "Note synced to knowledge base",
    }

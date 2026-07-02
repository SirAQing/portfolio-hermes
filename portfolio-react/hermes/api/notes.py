"""公开笔记 API — 无需认证，所有人可见。"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from core.notes import note_repo

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("")
async def list_public_notes(
    q: Optional[str] = None,
    tag: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(1000, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """列出所有已发布的公开笔记。"""
    notes, total = note_repo.list_published_notes(
        q=q, tag=tag, category=category, limit=limit, offset=offset
    )
    return {"items": notes, "total": total, "limit": limit, "offset": offset}


@router.get("/{slug}")
async def get_public_note(slug: str):
    """根据 slug 获取单篇已发布笔记。"""
    note = note_repo.get_note_by_slug(slug)
    if not note or note.get("status") != "published":
        raise HTTPException(status_code=404, detail="Note not found")
    # 更新浏览量
    try:
        note_repo.update_note(note["id"], view_count=(note.get("view_count") or 0) + 1)
        note["view_count"] = (note.get("view_count") or 0) + 1
    except Exception:
        pass
    return note

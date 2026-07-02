"""分块器 — 三级策略链：Auto → Heading → Heuristic → Legacy

参考 WeKnora chunker/strategy.go + splitter.go
"""
import re
import uuid
from dataclasses import dataclass

import tiktoken

from config import CHUNK_SIZE, CHUNK_OVERLAP


@dataclass
class Chunk:
    """分块结果"""
    id: str
    content: str
    chunk_index: int
    token_count: int


# 使用 cl100k_base 作为通用 token 计数器（GPT/DeepSeek 近似）
_enc = None


def _get_encoder():
    global _enc
    if _enc is None:
        _enc = tiktoken.get_encoding("cl100k_base")
    return _enc


def count_tokens(text: str) -> int:
    """估算 token 数。"""
    return len(_get_encoder().encode(text))


# ── 标题分块 ──

_HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)


def _split_by_headings(text: str, max_size: int = CHUNK_SIZE) -> list[str]:
    """按 Markdown 标题分块。每个标题下的内容为一个块。"""
    matches = list(_HEADING_PATTERN.finditer(text))
    if len(matches) < 2:
        # 标题不足，不适用
        return []
    sections: list[str] = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        section = text[start:end].strip()
        if section:
            # 如果 section 过大，进一步递归切分
            if count_tokens(section) > max_size:
                sections.extend(_legacy_recursive_split(section, max_size))
            else:
                sections.append(section)
    return sections


# ── 启发式分块（段落 + 代码块保护） ──

_CODE_FENCE_PATTERN = re.compile(r"```[\s\S]*?```")
_PARAGRAPH_SPLIT = re.compile(r"\n\s*\n")


def _split_heuristic(text: str, max_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """启发式：先保护代码块/表格，再按段落合并到目标大小。"""
    # 提取代码块占位
    code_blocks: list[str] = []
    placeholder_text = text
    for m in _CODE_FENCE_PATTERN.finditer(text):
        placeholder = f"__CODE_BLOCK_{len(code_blocks)}__"
        code_blocks.append(m.group())
        placeholder_text = placeholder_text.replace(m.group(), placeholder, 1)

    # 按段落切分
    paragraphs = [p for p in _PARAGRAPH_SPLIT.split(placeholder_text) if p.strip()]
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        # 还原占位
        para_real = para
        for i, cb in enumerate(code_blocks):
            para_real = para_real.replace(f"__CODE_BLOCK_{i}__", cb)

        candidate = (current + "\n\n" + para_real).strip() if current else para_real
        if count_tokens(candidate) > max_size and current:
            chunks.append(current)
            # overlap：保留末尾部分
            if overlap > 0:
                tail_tokens = _get_encoder().encode(current)
                if len(tail_tokens) > overlap:
                    tail = _get_encoder().decode(tail_tokens[-overlap:])
                    current = tail + "\n\n" + para_real
                else:
                    current = para_real
            else:
                current = para_real
        else:
            current = candidate

    if current.strip():
        chunks.append(current)
    return chunks


# ── Legacy 递归兜底 ──

def _legacy_recursive_split(
    text: str, max_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP, depth: int = 0
) -> list[str]:
    """递归字符分割兜底。深度限制防止无限递归。"""
    if depth > 5 or count_tokens(text) <= max_size:
        return [text] if text.strip() else []

    # 优先按换行 → 句号 → 空格切分
    for sep in ["\n", "。", ". ", "；", "; ", " ", ""]:
        if not sep:
            parts = list(text)
        else:
            parts = text.split(sep)
        if len(parts) < 2:
            continue
        mid = len(parts) // 2
        left = sep.join(parts[:mid])
        right = sep.join(parts[mid:])
        if not left.strip() or not right.strip():
            continue
        return (
            _legacy_recursive_split(left, max_size, overlap, depth + 1)
            + _legacy_recursive_split(right, max_size, overlap, depth + 1)
        )
    return [text] if text.strip() else []


# ── 策略链主入口 ──

def chunk_text(
    text: str,
    strategy: str = "auto",
    max_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[Chunk]:
    """
    分块主入口。

    strategy:
        - auto: 先尝试 heading，失败降级 heuristic，再失败用 legacy
        - heading: 仅按标题
        - heuristic: 仅启发式
        - legacy: 仅递归兜底
    """
    text = text.strip()
    if not text:
        return []

    if strategy == "heading":
        sections = _split_by_headings(text, max_size)
    elif strategy == "heuristic":
        sections = _split_heuristic(text, max_size, overlap)
    elif strategy == "legacy":
        sections = _legacy_recursive_split(text, max_size, overlap)
    else:  # auto
        sections = _split_by_headings(text, max_size)
        if not sections:
            sections = _split_heuristic(text, max_size, overlap)
        if not sections:
            sections = _legacy_recursive_split(text, max_size, overlap)

    return [
        Chunk(
            id=str(uuid.uuid4()),
            content=s,
            chunk_index=i,
            token_count=count_tokens(s),
        )
        for i, s in enumerate(sections)
        if s.strip()
    ]


def profile_document(text: str) -> dict:
    """文档画像：分析结构，辅助策略选择。"""
    headings = len(_HEADING_PATTERN.findall(text))
    code_blocks = len(_CODE_FENCE_PATTERN.findall(text))
    total_tokens = count_tokens(text)
    return {
        "headings": headings,
        "code_blocks": code_blocks,
        "total_tokens": total_tokens,
        "has_structure": headings >= 2,
        "is_code_heavy": code_blocks >= 3,
    }

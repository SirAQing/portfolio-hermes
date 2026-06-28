"""CJK 二元分词 — 用于 FTS5 关键词检索"""
import re

# CJK Unicode 范围
_CJK_PATTERN = re.compile(
    r"[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff"
    r"\U00020000-\U0002a6df\U0002a700-\U0002b73f]"
)


def cjk_bigram_tokenize(text: str) -> str:
    """
    CJK 二元分词，用于 FTS5 索引和查询。

    "知识库" → "知识 识库"
    连续中文字符拆分为重叠二元组，非 CJK（英文/数字/标点）保持完整。

    返回空格分隔的 token 字符串，适合直接存入 FTS5 或作为 MATCH 查询。
    """
    if not text:
        return ""
    tokens: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if _CJK_PATTERN.match(ch):
            # 收集连续 CJK 字符
            j = i
            while j < n and _CJK_PATTERN.match(text[j]):
                j += 1
            cjk_run = text[i:j]
            if len(cjk_run) == 1:
                tokens.append(cjk_run)
            else:
                for k in range(len(cjk_run) - 1):
                    tokens.append(cjk_run[k : k + 2])
            i = j
        else:
            # 非 CJK：按空白/标点切分，保留英文单词
            j = i
            while j < n and not _CJK_PATTERN.match(text[j]):
                j += 1
            non_cjk = text[i:j]
            # 按空白分割
            for w in non_cjk.split():
                tokens.append(w)
            i = j
    return " ".join(tokens)


def build_fts_query(query: str) -> str:
    """
    构造 FTS5 MATCH 查询字符串。

    对 CJK 二元分词后的每个 token 加引号（短语匹配），用 OR 连接。
    例如 "知识库搜索" → '"知识" OR "识库" OR "搜索"'
    """
    tokens = cjk_bigram_tokenize(query).split()
    if not tokens:
        return ""
    # 去重保序
    seen = set()
    unique = []
    for t in tokens:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return " OR ".join(f'"{t}"' for t in unique)

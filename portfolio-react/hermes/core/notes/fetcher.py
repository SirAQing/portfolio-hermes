"""通过 URL 抓取网页并转换为 Markdown。"""
import re
from html.parser import HTMLParser

import httpx


class _HTMLToMarkdown(HTMLParser):
    """极简 HTML -> Markdown 转换器，保留标题、段落、列表、链接和代码块。"""

    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip_stack: list[str] = []
        self._link_href: str | None = None
        self._in_title = False
        self.title = ""
        self._heading_level = 0
        self._list_depth = 0
        self._in_pre = False
        self._in_code = False

    @property
    def _skip_depth(self) -> int:
        return len(self._skip_stack)

    def _should_skip(self, attrs: list[tuple[str, str | None]]) -> bool:
        """根据 class/id/aria-label 判断是否为导航或无关元素。"""
        attr_map = {k: (v or "").lower() for k, v in attrs if v is not None}
        cls = attr_map.get("class", "")
        id_ = attr_map.get("id", "")
        aria = attr_map.get("aria-label", "")
        skip_tokens = {
            "vpnav", "vpsidebar", "vpfooter", "vplocalnav", "vpskiplink",
            "nav", "navbar", "menu", "sidebar", "drawer",
            "skip-to-content", "return-to-top", "copy-page",
            "visually-hidden", "sr-only",
        }
        combined = f"{cls} {id_} {aria}"
        return any(token in combined for token in skip_tokens)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {
            "script", "style", "nav", "header", "footer", "aside",
            "form", "iframe", "noscript", "svg", "canvas",
        } or self._should_skip(attrs):
            self._skip_stack.append(tag)
            return
        if self._skip_depth:
            return
        attr_map = {k: v for k, v in attrs if v is not None}

        if tag == "title":
            self._in_title = True
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._heading_level = int(tag[1])
            self._chunks.append(f"\n\n{'#' * self._heading_level} ")
        elif tag == "p":
            self._chunks.append("\n\n")
        elif tag == "br":
            self._chunks.append("\n")
        elif tag == "a":
            href = attr_map.get("href", "")
            if href and not href.startswith(("#", "javascript:", "mailto:")):
                self._link_href = href
            else:
                self._link_href = None
        elif tag == "li":
            indent = "  " * max(self._list_depth - 1, 0)
            self._chunks.append(f"\n{indent}- ")
        elif tag in {"ul", "ol"}:
            self._list_depth += 1
        elif tag == "pre":
            self._in_pre = True
            self._chunks.append("\n\n```\n")
        elif tag == "code":
            if not self._in_pre:
                self._chunks.append("`")
            self._in_code = True
        elif tag == "blockquote":
            self._chunks.append("\n\n> ")
        elif tag in {"strong", "b"}:
            self._chunks.append("**")
        elif tag in {"em", "i"}:
            self._chunks.append("*")

    def handle_endtag(self, tag: str) -> None:
        if self._skip_stack and self._skip_stack[-1] == tag:
            self._skip_stack.pop()
            return
        if self._skip_depth:
            return

        if tag == "title":
            self._in_title = False
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._heading_level = 0
            self._chunks.append("\n\n")
        elif tag == "p":
            self._chunks.append("\n\n")
        elif tag == "a":
            self._link_href = None
        elif tag in {"ul", "ol"}:
            self._list_depth = max(self._list_depth - 1, 0)
        elif tag == "pre":
            self._in_pre = False
            self._chunks.append("\n```\n\n")
        elif tag == "code":
            self._in_code = False
            if not self._in_pre:
                self._chunks.append("`")
        elif tag in {"strong", "b"}:
            self._chunks.append("**")
        elif tag in {"em", "i"}:
            self._chunks.append("*")

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._skip_depth:
            return
        text = data.replace("\n", " ").replace("\r", " ")
        if self._heading_level or self._link_href:
            text = text.strip()
        if text:
            if self._link_href:
                self._chunks.append(f"[{text}]({self._link_href})")
            else:
                self._chunks.append(text)

    def get_markdown(self) -> str:
        md = "".join(self._chunks)
        md = re.sub(r"\n{3,}", "\n\n", md)
        lines = md.splitlines()
        # 移除开头/结尾的空白行
        while lines and not lines[0].strip():
            lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop()
        # 保留段落间最多一个空行
        cleaned: list[str] = []
        for line in lines:
            if line.strip():
                cleaned.append(line.rstrip())
            elif cleaned and cleaned[-1].strip():
                cleaned.append("")
        return "\n".join(cleaned).strip()


async def fetch_url(url: str, timeout: float = 20.0) -> dict:
    """抓取 URL 并返回 title/content/description/source_url。"""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }
    async with httpx.AsyncClient(
        timeout=timeout, trust_env=False, headers=headers, follow_redirects=True
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        html = resp.text

    parser = _HTMLToMarkdown()
    try:
        parser.feed(html)
    except Exception:
        # 容错：即使解析失败也尝试用正则兜底
        pass

    md = parser.get_markdown()

    title = parser.title.strip()
    if not title:
        m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
        if m:
            title = re.sub(r"<[^>]+>", "", m.group(1)).strip()

    plain = re.sub(r"\s+", " ", md).strip()
    description = plain[:200] + ("..." if len(plain) > 200 else "")

    return {
        "title": title,
        "content": md,
        "description": description,
        "source_url": url,
    }

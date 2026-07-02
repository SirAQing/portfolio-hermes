"""内置工具 — web_search + web_fetch

web_search: Bing CN 搜索引擎 HTML 解析（国内可访问）
web_fetch: 抓取网页内容（httpx + 简单 HTML 清洗）
"""
import re

import httpx

from core.agent.tools.base import Tool


class WebSearchTool(Tool):
    """网页搜索工具 — Bing CN HTML 解析"""

    def name(self) -> str:
        return "web_search"

    def description(self) -> str:
        return (
            "搜索互联网获取最新信息。当知识库无法回答时使用。"
            "输入搜索关键词，返回相关网页标题和摘要。"
        )

    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词",
                },
                "max_results": {
                    "type": "integer",
                    "description": "最大结果数（默认 5）",
                },
            },
            "required": ["query"],
        }

    async def execute(self, query: str, max_results: int = 5, **kwargs) -> str:
        """执行网页搜索（Bing CN HTML 解析）。"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://cn.bing.com/search",
                    params={"q": query},
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                    },
                )
                resp.raise_for_status()
                html = resp.text

            # 检测 CAPTCHA
            if "captcha" in html[:2000].lower() or "<title>Verification</title>" in html[:2000] or "verifyChallenge" in html[:2000]:
                return "Web search failed: Bing returned a CAPTCHA verification page. Please try again later."

            return self._parse_bing_results(html, query, max_results)
        except Exception as e:
            return f"Web search failed: {type(e).__name__}: {e}"

    def _parse_bing_results(self, html: str, query: str, max_results: int) -> str:
        """解析 Bing CN 搜索结果 HTML。"""
        # 匹配每个结果块：<h2 class=""><a ...href="URL"...>Title</a></h2> + <p class="b_lineclamp2">Snippet</p>
        h2_pattern = re.compile(
            r'<h2\s[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>\s*</h2>',
            re.DOTALL,
        )
        snippet_pattern = re.compile(
            r'<p\s[^>]*class="[^"]*b_lineclamp2[^"]*"[^>]*>(.*?)</p>',
            re.DOTALL,
        )

        # 在 h2 标签附近找到对应的 snippet
        results = []
        pos = 0
        while len(results) < max_results:
            m = h2_pattern.search(html, pos)
            if not m:
                break
            url, title_raw = m.group(1), m.group(2)
            title = re.sub(r"<[^>]+>", "", title_raw).strip()
            if not title:
                pos = m.end()
                continue

            # 在 h2 之后找最近的 snippet
            snip = ""
            sm = snippet_pattern.search(html, m.end(), m.end() + 2000)
            if sm:
                snip = re.sub(r"<[^>]+>", "", sm.group(1)).strip()
                snip = re.sub(r"&ensp;|&#0183;|&nbsp;|&hellip;|&#8230;", " ", snip)
                snip = re.sub(r"\s+", " ", snip).strip()

            results.append((title, url, snip))
            pos = m.end()

        if not results:
            return f"No web results found for: {query}"

        lines = [f"Web search results for '{query}':"]
        for i, (title, url, snippet) in enumerate(results, 1):
            lines.append(f"\n[{i}] {title}")
            lines.append(f"URL: {url}")
            if snippet:
                lines.append(f"{snippet}")

        return "\n".join(lines)


class WebFetchTool(Tool):
    """网页抓取工具 — 获取指定 URL 的文本内容"""

    MAX_CONTENT_LENGTH = 8000

    def name(self) -> str:
        return "web_fetch"

    def description(self) -> str:
        return (
            "抓取指定网页的内容。输入 URL，返回页面的文本内容（已清洗 HTML）。"
            "用于获取 web_search 结果中的完整页面内容。"
        )

    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "要抓取的网页 URL",
                },
            },
            "required": ["url"],
        }

    async def execute(self, url: str, **kwargs) -> str:
        """抓取网页内容。"""
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                resp.raise_for_status()
                html = resp.text

            text = self._clean_html(html)
            if not text.strip():
                return f"Empty content from: {url}"

            if len(text) > self.MAX_CONTENT_LENGTH:
                text = text[: self.MAX_CONTENT_LENGTH] + "\n...[truncated]"
            return f"Content from {url}:\n\n{text}"
        except Exception as e:
            return f"Web fetch failed: {type(e).__name__}: {e}"

    def _clean_html(self, html: str) -> str:
        html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
        html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return text

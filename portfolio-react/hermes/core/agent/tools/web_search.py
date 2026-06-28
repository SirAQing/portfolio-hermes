"""内置工具 — web_search + web_fetch

web_search: 网页搜索（预留 Tavily/SerpAPI 接口，MVP 用 DuckDuckGo HTML 兜底）
web_fetch: 抓取网页内容（httpx + 简单 HTML 清洗）
"""
import re
from urllib.parse import quote_plus

import httpx

from core.agent.tools.base import Tool


class WebSearchTool(Tool):
    """网页搜索工具 — MVP 用 DuckDuckGo HTML 接口兜底"""

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
        """执行网页搜索（DuckDuckGo HTML）。"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://html.duckduckgo.com/html/",
                    params={"q": query},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                html = resp.text

            # 简单解析结果
            results = self._parse_ddg_html(html, max_results)
            if not results:
                return f"No web results found for: {query}"

            parts = [f"Web search results for '{query}':"]
            for i, r in enumerate(results, 1):
                parts.append(f"\n[{i}] {r['title']}\n{r['snippet']}\nURL: {r['url']}")
            return "\n".join(parts)
        except Exception as e:
            return f"Web search failed: {type(e).__name__}: {e}"

    def _parse_ddg_html(self, html: str, max_results: int) -> list[dict]:
        """解析 DuckDuckGo HTML 结果（简单正则）。"""
        results = []
        # 结果块
        blocks = re.findall(
            r'<a[^>]+class="result__a"[^>]*>(.*?)</a>.*?'
            r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>.*?'
            r'<a[^>]+class="result__url"[^>]*>(.*?)</a>',
            html,
            re.DOTALL,
        )
        for title, snippet, url in blocks[:max_results]:
            # 清除 HTML 标签
            title_clean = re.sub(r"<[^>]+>", "", title).strip()
            snippet_clean = re.sub(r"<[^>]+>", "", snippet).strip()
            url_clean = re.sub(r"<[^>]+>", "", url).strip()
            if title_clean:
                results.append({
                    "title": title_clean,
                    "snippet": snippet_clean,
                    "url": url_clean,
                })
        return results


class WebFetchTool(Tool):
    """网页抓取工具 — 获取指定 URL 的文本内容"""

    MAX_CONTENT_LENGTH = 8000  # 字符数限制

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

            # 简单 HTML 清洗
            text = self._clean_html(html)
            if not text.strip():
                return f"Empty content from: {url}"

            # 截断
            if len(text) > self.MAX_CONTENT_LENGTH:
                text = text[: self.MAX_CONTENT_LENGTH] + "\n...[truncated]"
            return f"Content from {url}:\n\n{text}"
        except Exception as e:
            return f"Web fetch failed: {type(e).__name__}: {e}"

    def _clean_html(self, html: str) -> str:
        """简单 HTML 清洗：移除 script/style/标签，保留文本。"""
        # 移除 script 和 style
        html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
        html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)
        # 移除所有标签
        text = re.sub(r"<[^>]+>", " ", html)
        # 压缩空白
        text = re.sub(r"\s+", " ", text).strip()
        return text

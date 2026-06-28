"""内置工具 — knowledge_search

调用 RAG 混合检索管线。
"""
from core.agent.tools.base import Tool
from core.rag.retriever import hybrid_search, build_context
from core.rag.rag_chat import get_default_kb_id


class KnowledgeSearchTool(Tool):
    """知识库搜索工具 — 调用 RAG 混合检索"""

    def name(self) -> str:
        return "knowledge_search"

    def description(self) -> str:
        return (
            "搜索知识库获取相关信息。当用户询问技术细节、项目经验、文章内容时使用。"
            "输入查询语句，返回最相关的知识片段。"
        )

    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索查询语句",
                },
                "kb_id": {
                    "type": "string",
                    "description": "知识库 ID（可选，默认使用系统默认 KB）",
                },
            },
            "required": ["query"],
        }

    async def execute(self, query: str, kb_id: str = None, **kwargs) -> str:
        """执行知识库搜索。"""
        if kb_id is None:
            kb_id = get_default_kb_id()
        if not kb_id:
            return "Error: No knowledge base available. Please ingest documents first."

        results = await hybrid_search(query=query, kb_id=kb_id)
        if not results:
            return f"No relevant content found for query: {query}"

        # 格式化结果
        parts = [f"Found {len(results)} relevant chunks:"]
        for i, r in enumerate(results, 1):
            parts.append(f"\n[{i}] (score={r.score:.4f}, source={r.source})\n{r.content}")
        return "\n".join(parts)


class KnowledgeSearchWithKbTool(KnowledgeSearchTool):
    """带指定 KB 的知识库搜索工具（用于多 KB 场景）"""

    def __init__(self, kb_id: str):
        self._kb_id = kb_id

    async def execute(self, query: str, **kwargs) -> str:
        return await super().execute(query=query, kb_id=self._kb_id)

"""知识库检索工具 — Agent 可以调用此工具搜索已链接的知识库"""
import json

from core.agent.tools.base import Tool
from core.rag.retriever import hybrid_search, build_context
from core.rag.rag_chat import get_active_kb_ids


RAG_CONFIDENCE_THRESHOLD = 0.05


def _expand_query(query: str) -> str:
    """对宽泛查询做语义扩展，提升知识库召回率。"""
    q = query.strip()
    # 避免对已经完整的问题重复追加
    if "刘明青" in q or len(q) > 12:
        return q
    expansions = {
        "技术栈": "刘明青 技术栈 技能 编程语言 框架 工具",
        "项目": "刘明青 项目 作品 经验 代表作",
        "经历": "刘明青 工作经历 职业 履历",
        "技能": "刘明青 技能 技术栈 能力",
        "联系方式": "刘明青 联系方式 邮箱 X",
    }
    for key, expansion in expansions.items():
        if key in q:
            return expansion
    return f"刘明青 {q}"


class KnowledgeSearchTool(Tool):
    """搜索所有已链接到 AI 助理的知识库。

    Agent 可以通过 kb_id 参数指定特定知识库（可选），默认搜索所有已链接的 KB。
    """

    def name(self) -> str:
        return "knowledge_search"

    def description(self) -> str:
        return (
            "搜索知识库获取相关文档片段。当用户询问项目相关、技术细节或文档内容时使用。"
            "参数: query(必填,搜索关键词), kb_id(可选,指定特定知识库ID)。"
            "返回相关文档片段。如果返回[NO_RELEVANT_RESULTS]表示知识库中没有相关内容，请使用其他工具或告知用户。"
        )

    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词或问题",
                },
                "kb_id": {
                    "type": "string",
                    "description": "可选，指定知识库 ID，不传则搜索所有已链接的知识库",
                },
            },
            "required": ["query"],
        }

    async def execute(self, query: str, kb_id: str = None, **kwargs) -> str:
        kb_ids = [kb_id] if kb_id else get_active_kb_ids()
        if not kb_ids:
            return "[NO_KNOWLEDGE_BASE] 没有配置任何知识库。请基于你的内部知识回答，或明确告知用户当前没有足够资料。"

        expanded_query = _expand_query(query)
        if expanded_query != query:
            print(f"[KnowledgeSearchTool] query expanded: '{query}' -> '{expanded_query}'")

        from core.rag.embedder import get_default_embedder
        embedder = get_default_embedder()

        all_results = []
        for kid in kb_ids:
            try:
                results = await hybrid_search(query=expanded_query, kb_id=kid, embedder=embedder)
                all_results.extend(results)
            except Exception as e:
                print(f"[KnowledgeSearchTool] search failed for kb {kid}: {e}")

        if not all_results:
            return (
                "[NO_RELEVANT_RESULTS] 知识库中没有找到与查询相关的内容。"
                "请基于你的内部知识回答，或明确告知用户当前没有足够资料。"
            )

        if len(kb_ids) > 1:
            seen: dict = {}
            for r in all_results:
                if r.chunk_id not in seen or r.score > seen[r.chunk_id].score:
                    seen[r.chunk_id] = r
            all_results = sorted(seen.values(), key=lambda x: x.score, reverse=True)

        from config import RAG_FINAL_K
        all_results = all_results[:RAG_FINAL_K]

        # 查询文档标题用于引用出处
        from models import get_db
        doc_titles: dict[str, str] = {}
        with get_db() as conn:
            for r in all_results:
                if r.chunk_id not in doc_titles:
                    row = conn.execute(
                        "SELECT d.title FROM chunks c JOIN documents d ON c.doc_id = d.id WHERE c.id = ?",
                        (r.chunk_id,)
                    ).fetchone()
                    doc_titles[r.chunk_id] = row["title"] if row else "未知文档"

        if all_results and all_results[0].score < RAG_CONFIDENCE_THRESHOLD:
            context = build_context(all_results)
            sources = "\n".join(
                f"  [知识库片段-{i}] {doc_titles.get(r.chunk_id, '未知')}"
                for i, r in enumerate(all_results, 1)
            )
            return (
                f"[LOW_CONFIDENCE] 知识库中找到的内容相关性较低（最高分数: {all_results[0].score:.3f}），"
                "可能无法准确回答用户问题。以下是找到的内容供参考：\n\n"
                f"{context}\n\n"
                f"来源文档:\n{sources}\n\n"
                "请基于你的内部知识补充回答，或明确告知用户当前知识库资料不足。"
            )

        context = build_context(all_results)
        sources = "\n".join(
            f"  [知识库片段-{i}] {doc_titles.get(r.chunk_id, '未知')}"
            for i, r in enumerate(all_results, 1)
        )
        return f"{context}\n\n来源文档:\n{sources}"

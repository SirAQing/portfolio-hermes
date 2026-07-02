"""内置工具注册 — 将所有内置工具注册到 registry"""
from core.agent.tools.registry import ToolRegistry
from core.agent.tools.knowledge_search import KnowledgeSearchTool
from core.agent.tools.web_search import WebSearchTool, WebFetchTool
from core.agent.tools.todo_write import TodoWriteTool


def register_builtin_tools(registry: ToolRegistry, enable_web: bool = True) -> None:
    """注册所有内置工具到 registry。

    联网搜索工具始终注册，enable_web 参数保留用于控制 system prompt 行为指导。
    Web 搜索始终可用，Agent 根据知识库检索结果自动判断是否需要联网搜索。
    """
    registry.register(KnowledgeSearchTool())
    registry.register(TodoWriteTool())
    registry.register(WebSearchTool())
    registry.register(WebFetchTool())

"""内置工具注册 — 将所有内置工具注册到 registry"""
from core.agent.tools.registry import ToolRegistry
from core.agent.tools.knowledge_search import KnowledgeSearchTool
from core.agent.tools.web_search import WebSearchTool, WebFetchTool
from core.agent.tools.todo_write import TodoWriteTool


def register_builtin_tools(registry: ToolRegistry, enable_web: bool = True) -> None:
    """注册所有内置工具到 registry。

    enable_web: 是否注册 web_search/web_fetch（可配置关闭以避免外部网络调用）
    """
    registry.register(KnowledgeSearchTool())
    registry.register(TodoWriteTool())
    if enable_web:
        registry.register(WebSearchTool())
        registry.register(WebFetchTool())

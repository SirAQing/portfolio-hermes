"""内置工具注册 — 将所有内置工具注册到 registry"""
from core.agent.tools.registry import ToolRegistry
from core.agent.tools.knowledge_search import KnowledgeSearchTool
from core.agent.tools.todo_write import TodoWriteTool


def register_builtin_tools(registry: ToolRegistry) -> None:
    """注册所有内置工具到 registry。"""
    registry.register(KnowledgeSearchTool())
    registry.register(TodoWriteTool())

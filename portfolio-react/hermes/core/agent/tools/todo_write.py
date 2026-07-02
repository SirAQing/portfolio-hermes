"""内置工具 — todo_write

任务规划工具 — 多步任务管理。
Agent 可以用它规划复杂任务的步骤，跟踪进度。
"""
from core.agent.tools.base import Tool


class TodoWriteTool(Tool):
    """任务规划工具 — 写入/更新待办事项列表"""

    def name(self) -> str:
        return "todo_write"

    def description(self) -> str:
        return (
            "创建或更新任务清单。用于规划复杂任务的多步骤执行。"
            "传入完整的 todos 数组（会替换现有清单）。"
        )

    def parameters_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "todos": {
                    "type": "array",
                    "description": "完整的任务清单（会替换现有）",
                    "items": {
                        "type": "object",
                        "properties": {
                            "content": {
                                "type": "string",
                                "description": "任务内容描述",
                            },
                            "status": {
                                "type": "string",
                                "enum": ["pending", "in_progress", "completed"],
                                "description": "任务状态",
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["high", "medium", "low"],
                                "description": "优先级",
                            },
                        },
                        "required": ["content", "status", "priority"],
                    },
                },
            },
            "required": ["todos"],
        }

    def __init__(self):
        self._todos: list[dict] = []

    async def execute(self, todos: list, **kwargs) -> str:
        """更新任务清单。"""
        if not isinstance(todos, list):
            return "Error: todos must be an array"

        # 验证并规范化
        normalized = []
        for i, t in enumerate(todos):
            if not isinstance(t, dict):
                continue
            content = t.get("content", "").strip()
            if not content:
                continue
            normalized.append({
                "content": content,
                "status": t.get("status", "pending"),
                "priority": t.get("priority", "medium"),
                "index": i + 1,
            })

        self._todos = normalized

        # 格式化返回
        if not normalized:
            return "Todo list cleared."

        parts = ["Todo list updated:"]
        for t in normalized:
            status_icon = {"pending": "[ ]", "in_progress": "[~]", "completed": "[x]"}.get(
                t["status"], "[ ]"
            )
            parts.append(f"  {status_icon} #{t['index']} ({t['priority']}) {t['content']}")
        return "\n".join(parts)

"""todo_write 工具测试"""
import pytest

from core.agent.tools.todo_write import TodoWriteTool


def test_todo_write_name_and_description():
    """工具元信息"""
    tool = TodoWriteTool()
    assert tool.name() == "todo_write"
    assert "任务" in tool.description() or "todo" in tool.description().lower()


def test_todo_write_schema():
    """参数 schema"""
    tool = TodoWriteTool()
    schema = tool.parameters_schema()
    assert schema["type"] == "object"
    assert "todos" in schema["properties"]
    assert schema["properties"]["todos"]["type"] == "array"


@pytest.mark.asyncio
async def test_todo_write_basic():
    """基本写入"""
    tool = TodoWriteTool()
    result = await tool.execute(todos=[
        {"content": "Step 1", "status": "pending", "priority": "high"},
        {"content": "Step 2", "status": "in_progress", "priority": "medium"},
        {"content": "Step 3", "status": "completed", "priority": "low"},
    ])
    assert "updated" in result.lower()
    assert "Step 1" in result
    assert "Step 2" in result
    assert "Step 3" in result
    # 状态图标
    assert "[ ]" in result  # pending
    assert "[~]" in result  # in_progress
    assert "[x]" in result  # completed


@pytest.mark.asyncio
async def test_todo_write_replaces_existing():
    """新清单替换旧清单"""
    tool = TodoWriteTool()
    await tool.execute(todos=[
        {"content": "Old task", "status": "pending", "priority": "high"},
    ])
    assert len(tool.get_todos()) == 1

    await tool.execute(todos=[
        {"content": "New task 1", "status": "pending", "priority": "high"},
        {"content": "New task 2", "status": "pending", "priority": "medium"},
    ])
    assert len(tool.get_todos()) == 2
    contents = [t["content"] for t in tool.get_todos()]
    assert "Old task" not in contents
    assert "New task 1" in contents


@pytest.mark.asyncio
async def test_todo_write_empty_list():
    """空清单清空"""
    tool = TodoWriteTool()
    await tool.execute(todos=[
        {"content": "Task", "status": "pending", "priority": "high"},
    ])
    result = await tool.execute(todos=[])
    assert "cleared" in result.lower()
    assert len(tool.get_todos()) == 0


@pytest.mark.asyncio
async def test_todo_write_invalid_input():
    """非法输入"""
    tool = TodoWriteTool()
    result = await tool.execute(todos="not a list")
    assert "error" in result.lower()


@pytest.mark.asyncio
async def test_todo_write_missing_content_skipped():
    """缺少 content 的项被跳过"""
    tool = TodoWriteTool()
    await tool.execute(todos=[
        {"content": "Valid", "status": "pending", "priority": "high"},
        {"status": "pending", "priority": "medium"},  # 无 content
        {"content": "  ", "status": "pending", "priority": "medium"},  # 空 content
    ])
    assert len(tool.get_todos()) == 1


@pytest.mark.asyncio
async def test_todo_write_default_status():
    """缺省状态为 pending"""
    tool = TodoWriteTool()
    await tool.execute(todos=[
        {"content": "Task", "priority": "high"},  # 无 status
    ])
    todos = tool.get_todos()
    assert todos[0]["status"] == "pending"


@pytest.mark.asyncio
async def test_todo_write_default_priority():
    """缺省优先级为 medium"""
    tool = TodoWriteTool()
    await tool.execute(todos=[
        {"content": "Task", "status": "pending"},  # 无 priority
    ])
    todos = tool.get_todos()
    assert todos[0]["priority"] == "medium"

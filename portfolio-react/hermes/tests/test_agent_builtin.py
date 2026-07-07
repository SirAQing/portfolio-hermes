"""builtin.py 内置工具注册测试"""
from core.agent.tools.registry import ToolRegistry, create_default_registry
from core.agent.tools.builtin import register_builtin_tools


def test_register_builtin_tools_default():
    """默认注册所有工具"""
    registry = ToolRegistry()
    register_builtin_tools(registry)
    names = registry.list_names()
    assert "knowledge_search" in names
    assert "todo_write" in names
    assert "web_search" not in names
    assert "web_fetch" not in names
    assert len(names) == 2


def test_create_default_registry():
    """创建默认注册表"""
    registry = create_default_registry()
    assert len(registry) == 2
    schemas = registry.function_schemas()
    assert len(schemas) == 2
    names = [s["name"] for s in schemas]
    assert "knowledge_search" in names
    assert "web_search" not in names


def test_builtin_tools_first_wins():
    """重复注册同名工具被忽略"""
    registry = ToolRegistry()
    register_builtin_tools(registry)
    # 再次注册应不增加
    register_builtin_tools(registry)
    assert len(registry) == 2


def test_builtin_tools_have_valid_schemas():
    """所有工具 schema 有效"""
    registry = create_default_registry()
    for tool in registry:
        schema = tool.to_function_schema()
        assert "name" in schema
        assert "description" in schema
        assert "parameters" in schema
        assert schema["name"] == tool.name()

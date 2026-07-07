"""Phase 4 配置系统测试 — prompt 模板 + config + agents"""
import pytest

from core.config.prompt_loader import (
    render_template,
    render_template_strict,
    PromptRenderError,
    PromptNotFoundError,
    get_template,
    get_default_template,
    get_template_content,
    get_agent_system_prompt,
    list_available_prompts,
    clear_cache,
)
from core.config.config_loader import load_config, clear_config_cache
from core.config.agents_loader import (
    load_agents,
    get_agent_by_id,
    get_default_agent,
    list_agent_ids,
    clear_agents_cache,
)


class TestTemplateRendering:
    """模板渲染测试"""

    def test_simple_substitution(self):
        template = "Hello {{name}}, welcome to {{place}}!"
        result = render_template(template, {"name": "Alice", "place": "Wonderland"})
        assert result == "Hello Alice, welcome to Wonderland!"

    def test_no_variables(self):
        template = "Hello {{name}}!"
        result = render_template(template, None)
        assert result == "Hello {{name}}!"

    def test_partial_variables_keeps_placeholder(self):
        template = "Hello {{name}}, your score is {{score}}"
        result = render_template(template, {"name": "Bob"})
        assert "Bob" in result
        assert "{{score}}" in result  # 未提供的保留原样

    def test_whitespace_in_placeholder(self):
        template = "Value: {{  value  }}"
        result = render_template(template, {"value": "42"})
        assert result == "Value: 42"

    def test_multiple_occurrences(self):
        template = "{{x}} and {{x}} and {{x}}"
        result = render_template(template, {"x": "A"})
        assert result == "A and A and A"

    def test_strict_mode_success(self):
        template = "Hello {{name}}"
        result = render_template_strict(template, {"name": "World"})
        assert result == "Hello World"

    def test_strict_mode_missing_var(self):
        template = "Hello {{name}} and {{missing}}"
        with pytest.raises(PromptRenderError):
            render_template_strict(template, {"name": "World"})

    def test_no_placeholders(self):
        template = "Plain text without placeholders"
        result = render_template(template, {"unused": "value"})
        assert result == template


class TestPromptLoader:
    """Prompt 加载器测试"""

    def setup_method(self):
        clear_cache()

    def test_list_available_prompts(self):
        prompts = list_available_prompts()
        assert len(prompts) >= 1
        assert "agent_system.yaml" in prompts

    def test_agent_system_has_two_modes(self):
        prompts = list_available_prompts()
        ids = prompts["agent_system.yaml"]
        assert "pure_agent" in ids
        assert "rag_agent" in ids

    def test_get_template_by_id(self):
        t = get_template("agent_system.yaml", "rag_agent")
        assert t["id"] == "rag_agent"
        assert "content" in t
        assert "Hermes" in t["content"]

    def test_get_template_not_found(self):
        with pytest.raises(PromptNotFoundError):
            get_template("agent_system.yaml", "nonexistent_id")

    def test_get_default_template(self):
        t = get_default_template("agent_system.yaml")
        assert t.get("default") is True
        assert t["id"] == "rag_agent"

    def test_get_template_content_with_variables(self):
        content = get_agent_system_prompt(
            mode="rag",
            variables={"language": "zh-CN"},
        )
        assert "zh-CN" in content
        # 未提供的占位符保留
        assert "{{" not in content or "language" not in content

    def test_get_agent_system_prompt_pure_mode(self):
        content = get_agent_system_prompt(mode="pure")
        assert "Pure Agent" in content


class TestConfigLoader:
    """config.yaml 加载器测试"""

    def setup_method(self):
        clear_config_cache()

    def test_load_config_returns_appconfig(self):
        config = load_config()
        assert config is not None
        assert config.server.port == 8000
        assert config.server.host == "0.0.0.0"

    def test_conversation_config(self):
        config = load_config()
        assert config.conversation.max_rounds == 5
        assert config.conversation.fallback_strategy == "model"
        assert config.conversation.enable_rewrite is True
        assert config.conversation.rewrite_prompt_id == "default_rewrite"

    def test_summary_config(self):
        config = load_config()
        assert config.summary.max_input_chars == 16384
        assert config.summary.prompt_id == "default_kb"

    def test_knowledge_base_config(self):
        config = load_config()
        assert config.knowledge_base.chunk_size == 512
        assert config.knowledge_base.chunk_overlap == 50
        assert "\n\n" in config.knowledge_base.split_markers

    def test_rag_config(self):
        config = load_config()
        assert config.rag.vector_top_k == 10
        assert config.rag.fusion_weights["vector"] == 0.6

    def test_agent_config(self):
        config = load_config()
        assert config.agent.max_iterations == 20
        assert config.agent.default_system_prompt_id == "rag_agent"

    def test_guest_quota_config(self):
        config = load_config()
        assert config.guest_quota.daily_limit == 20

    def test_llm_config(self):
        config = load_config()
        assert config.llm.model == "deepseek-chat"


class TestAgentsLoader:
    """agents.yaml 加载器测试"""

    def setup_method(self):
        clear_agents_cache()

    def test_load_agents_returns_list(self):
        agents = load_agents()
        assert len(agents) >= 3
        ids = [a.id for a in agents]
        assert "builtin-quick-answer" in ids
        assert "builtin-smart-reasoning" in ids
        assert "builtin-pure-chat" in ids

    def test_get_agent_by_id(self):
        agent = get_agent_by_id("builtin-quick-answer")
        assert agent is not None
        assert agent.is_builtin is True
        # zh-CN 优先
        assert "快速" in agent.name or "Quick" in agent.name

    def test_get_agent_by_id_not_found(self):
        agent = get_agent_by_id("nonexistent")
        assert agent is None

    def test_smart_reasoning_config(self):
        agent = get_agent_by_id("builtin-smart-reasoning")
        assert agent.agent_mode == "smart-reasoning"
        assert agent.system_prompt_id == "rag_agent"
        assert agent.max_iterations == 20
        assert "knowledge_search" in agent.allowed_tools

    def test_quick_answer_config(self):
        agent = get_agent_by_id("builtin-quick-answer")
        assert agent.agent_mode == "quick-answer"
        assert agent.system_prompt_id == "default_kb"

    def test_pure_chat_config(self):
        agent = get_agent_by_id("builtin-pure-chat")
        assert agent.agent_mode == "pure-chat"
        assert agent.system_prompt_id == "pure_chat"

    def test_list_agent_ids(self):
        ids = list_agent_ids()
        assert len(ids) >= 3
        assert "builtin-quick-answer" in ids

    def test_get_default_agent(self):
        agent = get_default_agent()
        assert agent is not None


class TestAgentEngineIntegration:
    """AgentEngine 与 prompt_loader 集成测试"""

    def test_engine_loads_system_prompt_from_config(self):
        from core.agent.engine import AgentEngine

        engine = AgentEngine(agent_mode="rag")
        prompt = engine._get_system_prompt()
        # 应该从 config_files 加载，包含 Hermes
        assert "Hermes" in prompt
        assert "RAG" in prompt or "rag" in prompt.lower()

    def test_engine_custom_prompt_overrides_config(self):
        from core.agent.engine import AgentEngine

        custom = "Custom system prompt for testing"
        engine = AgentEngine(system_prompt=custom)
        assert engine._get_system_prompt() == custom

    def test_engine_build_history_injects_prompt(self):
        from core.agent.engine import AgentEngine

        engine = AgentEngine(agent_mode="rag")
        history = [{"role": "user", "content": "hi"}]
        built = engine._build_history(history)
        assert built[0]["role"] == "system"
        assert "Hermes" in built[0]["content"]
        assert built[1]["role"] == "user"

    def test_engine_preserves_existing_system_prompt(self):
        from core.agent.engine import AgentEngine

        engine = AgentEngine(agent_mode="rag")
        existing = [
            {"role": "system", "content": "Existing prompt"},
            {"role": "user", "content": "hi"},
        ]
        built = engine._build_history(existing)
        assert built[0]["content"] == "Existing prompt"

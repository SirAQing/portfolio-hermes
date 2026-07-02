"""agents.yaml 加载器 — Agent 预设

从 config_files/agents.yaml 加载 Agent 预设配置。
"""
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


CONFIG_DIR = Path(__file__).parent.parent.parent / "config_files"
AGENTS_FILE = CONFIG_DIR / "agents.yaml"


@dataclass
class AgentPreset:
    """Agent 预设"""
    id: str
    is_builtin: bool = True
    name: str = ""
    description: str = ""
    # config 字段
    agent_mode: str = "smart-reasoning"
    system_prompt_id: str = "rag_agent"
    temperature: float = 0.7
    max_completion_tokens: int = 2048
    max_iterations: int = 20
    web_search_enabled: bool = False
    web_search_max_results: int = 5
    multi_turn_enabled: bool = True
    history_turns: int = 5
    embedding_top_k: int = 10
    keyword_threshold: float = 0.3
    vector_threshold: float = 0.5
    rerank_top_k: int = 10
    rerank_threshold: float = 0.3
    allowed_tools: list = field(default_factory=list)
    enable_rewrite: bool = True
    fallback_strategy: str = "model"


def _parse_preset(raw: dict) -> AgentPreset:
    """从 YAML dict 解析 AgentPreset。"""
    preset = AgentPreset(
        id=raw.get("id", ""),
        is_builtin=raw.get("is_builtin", True),
    )

    # i18n — 优先 zh-CN，否则 default
    i18n = raw.get("i18n", {})
    zh = i18n.get("zh-CN", {})
    default = i18n.get("default", {})
    preset.name = zh.get("name", default.get("name", preset.id))
    preset.description = zh.get("description", default.get("description", ""))

    # config
    cfg = raw.get("config", {})
    preset.agent_mode = cfg.get("agent_mode", "smart-reasoning")
    preset.system_prompt_id = cfg.get("system_prompt_id", "rag_agent")
    preset.temperature = cfg.get("temperature", 0.7)
    preset.max_completion_tokens = cfg.get("max_completion_tokens", 2048)
    preset.max_iterations = cfg.get("max_iterations", 20)
    preset.web_search_enabled = cfg.get("web_search_enabled", False)
    preset.web_search_max_results = cfg.get("web_search_max_results", 5)
    preset.multi_turn_enabled = cfg.get("multi_turn_enabled", True)
    preset.history_turns = cfg.get("history_turns", 5)
    preset.embedding_top_k = cfg.get("embedding_top_k", 10)
    preset.keyword_threshold = cfg.get("keyword_threshold", 0.3)
    preset.vector_threshold = cfg.get("vector_threshold", 0.5)
    preset.rerank_top_k = cfg.get("rerank_top_k", 10)
    preset.rerank_threshold = cfg.get("rerank_threshold", 0.3)
    preset.allowed_tools = cfg.get("allowed_tools", [])
    preset.enable_rewrite = cfg.get("enable_rewrite", True)
    preset.fallback_strategy = cfg.get("fallback_strategy", "model")

    return preset


@lru_cache(maxsize=1)
def load_agents() -> list[AgentPreset]:
    """加载所有 Agent 预设。"""
    if not AGENTS_FILE.exists():
        return []

    with open(AGENTS_FILE, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}

    agents_raw = raw.get("builtin_agents", [])
    return [_parse_preset(a) for a in agents_raw]


def get_agent_by_id(agent_id: str) -> AgentPreset | None:
    """根据 ID 获取 Agent 预设。"""
    for agent in load_agents():
        if agent.id == agent_id:
            return agent
    return None


def get_default_agent() -> AgentPreset | None:
    """获取默认 Agent（第一个）。"""
    agents = load_agents()
    return agents[0] if agents else None


def list_agent_ids() -> list[str]:
    """列出所有 Agent ID。"""
    return [a.id for a in load_agents()]


def clear_agents_cache() -> None:
    """清空缓存。"""
    load_agents.cache_clear()

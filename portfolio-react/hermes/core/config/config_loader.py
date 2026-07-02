"""config.yaml 加载器 — RAG 参数 + 会话配置

从 config_files/config.yaml 加载主配置，提供类型安全的访问方法。
"""
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


CONFIG_DIR = Path(__file__).parent.parent.parent / "config_files"
CONFIG_FILE = CONFIG_DIR / "config.yaml"


@dataclass
class ServerConfig:
    port: int = 8000
    host: str = "0.0.0.0"


@dataclass
class ConversationConfig:
    max_rounds: int = 5
    keyword_threshold: float = 0.3
    embedding_top_k: int = 30
    vector_threshold: float = 0.2
    rerank_threshold: float = 0.3
    rerank_top_k: int = 30
    fallback_strategy: str = "model"
    fallback_response: str = "Sorry, I am unable to answer this question."
    fallback_prompt_id: str = "model_fallback"
    enable_rewrite: bool = True
    rewrite_prompt_id: str = "default_rewrite"
    generate_summary_prompt_id: str = "default_summary"
    generate_session_title_prompt_id: str = "default_session_title"
    extract_keywords_prompt_id: str = "default_keywords_extraction"
    generate_questions_prompt_id: str = "default_generate_questions"


@dataclass
class SummaryConfig:
    max_input_chars: int = 16384
    temperature: float = 0.3
    max_completion_tokens: int = 2048
    prompt_id: str = "default_kb"
    context_template_id: str = "default_context"


@dataclass
class KnowledgeBaseConfig:
    chunk_size: int = 512
    chunk_overlap: int = 50
    split_markers: list = field(default_factory=lambda: ["\n\n", "\n", "。"])
    document_process_timeout: str = "2h"


@dataclass
class RagConfig:
    vector_top_k: int = 10
    keyword_top_k: int = 10
    fusion_weights: dict = field(default_factory=lambda: {"vector": 0.6, "keyword": 0.4})
    rrf_k: int = 60
    context_max_chars: int = 4000


@dataclass
class AgentConfig:
    max_iterations: int = 20
    token_compress_threshold: float = 0.8
    memory_consolidate_threshold: float = 0.5
    max_context_tokens: int = 32000
    default_system_prompt_id: str = "rag_agent"


@dataclass
class GuestQuotaConfig:
    daily_limit: int = 20
    reset_hours: int = 24


@dataclass
class LlmConfig:
    model: str = "deepseek-chat"
    temperature: float = 0.7
    max_tokens: int = 4096
    timeout: int = 60


@dataclass
class AppConfig:
    server: ServerConfig = field(default_factory=ServerConfig)
    conversation: ConversationConfig = field(default_factory=ConversationConfig)
    summary: SummaryConfig = field(default_factory=SummaryConfig)
    knowledge_base: KnowledgeBaseConfig = field(default_factory=KnowledgeBaseConfig)
    rag: RagConfig = field(default_factory=RagConfig)
    agent: AgentConfig = field(default_factory=AgentConfig)
    guest_quota: GuestQuotaConfig = field(default_factory=GuestQuotaConfig)
    llm: LlmConfig = field(default_factory=LlmConfig)


@lru_cache(maxsize=1)
def load_config() -> AppConfig:
    """加载 config.yaml，返回 AppConfig 实例。"""
    if not CONFIG_FILE.exists():
        return AppConfig()

    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}

    config = AppConfig()

    # server
    if "server" in raw:
        s = raw["server"]
        config.server = ServerConfig(
            port=s.get("port", 8000),
            host=s.get("host", "0.0.0.0"),
        )

    # conversation
    if "conversation" in raw:
        c = raw["conversation"]
        config.conversation = ConversationConfig(
            max_rounds=c.get("max_rounds", 5),
            keyword_threshold=c.get("keyword_threshold", 0.3),
            embedding_top_k=c.get("embedding_top_k", 30),
            vector_threshold=c.get("vector_threshold", 0.2),
            rerank_threshold=c.get("rerank_threshold", 0.3),
            rerank_top_k=c.get("rerank_top_k", 30),
            fallback_strategy=c.get("fallback_strategy", "model"),
            fallback_response=c.get("fallback_response", ""),
            fallback_prompt_id=c.get("fallback_prompt_id", "model_fallback"),
            enable_rewrite=c.get("enable_rewrite", True),
            rewrite_prompt_id=c.get("rewrite_prompt_id", "default_rewrite"),
            generate_summary_prompt_id=c.get("generate_summary_prompt_id", "default_summary"),
            generate_session_title_prompt_id=c.get("generate_session_title_prompt_id", "default_session_title"),
            extract_keywords_prompt_id=c.get("extract_keywords_prompt_id", "default_keywords_extraction"),
            generate_questions_prompt_id=c.get("generate_questions_prompt_id", "default_generate_questions"),
        )
        # summary 子配置
        if "summary" in c:
            s = c["summary"]
            config.summary = SummaryConfig(
                max_input_chars=s.get("max_input_chars", 16384),
                temperature=s.get("temperature", 0.3),
                max_completion_tokens=s.get("max_completion_tokens", 2048),
                prompt_id=s.get("prompt_id", "default_kb"),
                context_template_id=s.get("context_template_id", "default_context"),
            )

    # knowledge_base
    if "knowledge_base" in raw:
        kb = raw["knowledge_base"]
        config.knowledge_base = KnowledgeBaseConfig(
            chunk_size=kb.get("chunk_size", 512),
            chunk_overlap=kb.get("chunk_overlap", 50),
            split_markers=kb.get("split_markers", ["\n\n", "\n", "。"]),
            document_process_timeout=kb.get("document_process_timeout", "2h"),
        )

    # rag
    if "rag" in raw:
        r = raw["rag"]
        config.rag = RagConfig(
            vector_top_k=r.get("vector_top_k", 10),
            keyword_top_k=r.get("keyword_top_k", 10),
            fusion_weights=r.get("fusion_weights", {"vector": 0.6, "keyword": 0.4}),
            rrf_k=r.get("rrf_k", 60),
            context_max_chars=r.get("context_max_chars", 4000),
        )

    # agent
    if "agent" in raw:
        a = raw["agent"]
        config.agent = AgentConfig(
            max_iterations=a.get("max_iterations", 20),
            token_compress_threshold=a.get("token_compress_threshold", 0.8),
            memory_consolidate_threshold=a.get("memory_consolidate_threshold", 0.5),
            max_context_tokens=a.get("max_context_tokens", 32000),
            default_system_prompt_id=a.get("default_system_prompt_id", "rag_agent"),
        )

    # guest_quota
    if "guest_quota" in raw:
        gq = raw["guest_quota"]
        config.guest_quota = GuestQuotaConfig(
            daily_limit=gq.get("daily_limit", 20),
            reset_hours=gq.get("reset_hours", 24),
        )

    # llm
    if "llm" in raw:
        l = raw["llm"]
        config.llm = LlmConfig(
            model=l.get("model", "deepseek-chat"),
            temperature=l.get("temperature", 0.7),
            max_tokens=l.get("max_tokens", 4096),
            timeout=l.get("timeout", 60),
        )

    return config


def clear_config_cache() -> None:
    """清空配置缓存。"""
    load_config.cache_clear()

"""系统配置数据访问层 - 管理模型配置、系统提示词等可动态修改的配置"""
import json
from typing import Any, Optional
from models import get_db


# 配置键常量
SETTING_KEYS = {
    # ── 全局配置（fallback 基础值）──
    "SYSTEM_PROMPT": "system_prompt",
    "LLM_API_KEY": "llm_api_key",
    "LLM_BASE_URL": "llm_base_url",
    "LLM_MODEL": "llm_model",
    "EMBEDDING_API_KEY": "embedding_api_key",
    "EMBEDDING_BASE_URL": "embedding_base_url",
    "EMBEDDING_MODEL": "embedding_model",
    "EMBEDDING_DIMENSION": "embedding_dimension",
    "RAG_TOP_K": "rag_top_k",
    "RAG_FINAL_K": "rag_final_k",
    "RRF_VECTOR_WEIGHT": "rrf_vector_weight",
    "RRF_KEYWORD_WEIGHT": "rrf_keyword_weight",
    # ── 访客助手专属配置 ──
    "VISITOR_SYSTEM_PROMPT": "visitor_system_prompt",
    "VISITOR_LLM_API_KEY": "visitor_llm_api_key",
    "VISITOR_LLM_BASE_URL": "visitor_llm_base_url",
    "VISITOR_LLM_MODEL": "visitor_llm_model",
    "VISITOR_ENABLE_TOOLS": "visitor_enable_tools",
    "VISITOR_MAX_TOKENS": "visitor_max_tokens",
    "VISITOR_TEMPERATURE": "visitor_temperature",
    # ── Demo助手专属配置 ──
    "DEMO_SYSTEM_PROMPT": "demo_system_prompt",
    "DEMO_LLM_API_KEY": "demo_llm_api_key",
    "DEMO_LLM_BASE_URL": "demo_llm_base_url",
    "DEMO_LLM_MODEL": "demo_llm_model",
    "DEMO_ENABLE_TOOLS": "demo_enable_tools",
    "DEMO_MAX_TOKENS": "demo_max_tokens",
    "DEMO_TEMPERATURE": "demo_temperature",
}

# 助手模式常量
ASSISTANT_MODES = ("visitor", "demo")


def get_setting(key: str, default: Any = None) -> Any:
    """获取单个配置值，如果不存在返回默认值"""
    with get_db() as conn:
        row = conn.execute(
            "SELECT value FROM system_settings WHERE key = ?",
            (key,)
        ).fetchone()
        if row is None:
            return default
        try:
            return json.loads(row["value"])
        except (json.JSONDecodeError, TypeError):
            return row["value"]


def set_setting(key: str, value: Any) -> None:
    """设置单个配置值，自动JSON序列化复杂类型"""
    if not isinstance(value, str):
        value_str = json.dumps(value, ensure_ascii=False)
    else:
        value_str = value
    
    with get_db() as conn:
        conn.execute(
            """INSERT INTO system_settings (key, value, updated_at) 
               VALUES (?, ?, datetime('now'))
               ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')""",
            (key, value_str, value_str)
        )


def get_all_settings() -> dict:
    """获取所有配置"""
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM system_settings").fetchall()
        result = {}
        for row in rows:
            try:
                result[row["key"]] = json.loads(row["value"])
            except (json.JSONDecodeError, TypeError):
                result[row["key"]] = row["value"]
        return result


def delete_setting(key: str) -> None:
    """删除配置（恢复默认值）"""
    with get_db() as conn:
        conn.execute("DELETE FROM system_settings WHERE key = ?", (key,))


def init_default_settings() -> None:
    """初始化默认配置（仅当配置不存在时设置）"""
    from config import (
        SYSTEM_PROMPT,
        DEEPSEEK_API_KEY,
        DEEPSEEK_BASE_URL,
        DEEPSEEK_MODEL,
        EMBEDDING_API_KEY,
        EMBEDDING_BASE_URL,
        EMBEDDING_MODEL,
        EMBEDDING_DIMENSION,
        RAG_TOP_K,
        RAG_FINAL_K,
        RRF_VECTOR_WEIGHT,
        RRF_KEYWORD_WEIGHT,
    )
    
    defaults = {
        SETTING_KEYS["SYSTEM_PROMPT"]: SYSTEM_PROMPT,
        SETTING_KEYS["LLM_API_KEY"]: DEEPSEEK_API_KEY,
        SETTING_KEYS["LLM_BASE_URL"]: DEEPSEEK_BASE_URL,
        SETTING_KEYS["LLM_MODEL"]: DEEPSEEK_MODEL,
        SETTING_KEYS["EMBEDDING_API_KEY"]: EMBEDDING_API_KEY,
        SETTING_KEYS["EMBEDDING_BASE_URL"]: EMBEDDING_BASE_URL,
        SETTING_KEYS["EMBEDDING_MODEL"]: EMBEDDING_MODEL,
        SETTING_KEYS["EMBEDDING_DIMENSION"]: EMBEDDING_DIMENSION,
        SETTING_KEYS["RAG_TOP_K"]: RAG_TOP_K,
        SETTING_KEYS["RAG_FINAL_K"]: RAG_FINAL_K,
        SETTING_KEYS["RRF_VECTOR_WEIGHT"]: RRF_VECTOR_WEIGHT,
        SETTING_KEYS["RRF_KEYWORD_WEIGHT"]: RRF_KEYWORD_WEIGHT,
    }
    
    for key, value in defaults.items():
        if get_setting(key) is None:
            set_setting(key, value)


# ── 助手模式配置获取（带全局 fallback）──

# 各模式的前缀映射
_MODE_PREFIX = {
    "visitor": "VISITOR_",
    "demo": "DEMO_",
}


def _get_or_fallback(key: str, fallback: Any) -> Any:
    """读取配置，空字符串也视为未设置，使用 fallback。"""
    value = get_setting(key, None)
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return fallback
    return value


def get_llm_config_for_mode(mode: str = "visitor") -> dict:
    """获取指定助手模式的 LLM 配置。

    优先使用助手专属配置，未设置时 fallback 到全局配置，最终 fallback 到环境变量。
    """
    prefix = _MODE_PREFIX.get(mode, "VISITOR_")
    from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL

    return {
        "api_key": _get_or_fallback(SETTING_KEYS[f"{prefix}LLM_API_KEY"], None)
            or _get_or_fallback(SETTING_KEYS["LLM_API_KEY"], DEEPSEEK_API_KEY),
        "base_url": _get_or_fallback(SETTING_KEYS[f"{prefix}LLM_BASE_URL"], None)
            or _get_or_fallback(SETTING_KEYS["LLM_BASE_URL"], DEEPSEEK_BASE_URL),
        "model": _get_or_fallback(SETTING_KEYS[f"{prefix}LLM_MODEL"], None)
            or _get_or_fallback(SETTING_KEYS["LLM_MODEL"], DEEPSEEK_MODEL),
    }


def get_system_prompt_for_mode(mode: str = "visitor") -> str:
    """获取指定助手模式的系统提示词。

    优先使用助手专属配置，未设置时 fallback 到全局配置。
    """
    prefix = _MODE_PREFIX.get(mode, "VISITOR_")
    from config import SYSTEM_PROMPT as DEFAULT_SYSTEM_PROMPT
    return _get_or_fallback(SETTING_KEYS[f"{prefix}SYSTEM_PROMPT"], None) \
        or _get_or_fallback(SETTING_KEYS["SYSTEM_PROMPT"], DEFAULT_SYSTEM_PROMPT)


def validate_llm_config(config: dict) -> None:
    """校验 LLM 配置是否可用。api_key 为空时抛出清晰异常。"""
    if not config.get("api_key"):
        raise ValueError(
            "LLM API key 未配置。请在后台 AI 设置中配置 API Key，"
            "或设置环境变量 DEEPSEEK_API_KEY 后重启服务。"
        )
    if not config.get("base_url"):
        raise ValueError("LLM Base URL 未配置。")
    if not config.get("model"):
        raise ValueError("LLM Model 未配置。")


def get_assistant_settings(mode: str = "visitor") -> dict:
    """获取指定助手模式的全部配置（含功能开关等）。"""
    prefix = _MODE_PREFIX.get(mode, "VISITOR_")
    defaults = {
        "visitor": {
            "enable_tools": False,
            "max_tokens": 1024,
            "temperature": 0.7,
        },
        "demo": {
            "enable_tools": True,
            "max_tokens": 4096,
            "temperature": 0.7,
        },
    }
    d = defaults.get(mode, defaults["visitor"])
    return {
        "system_prompt": get_system_prompt_for_mode(mode),
        "llm_config": get_llm_config_for_mode(mode),
        "enable_tools": get_setting(SETTING_KEYS[f"{prefix}ENABLE_TOOLS"], d["enable_tools"]),
        "max_tokens": get_setting(SETTING_KEYS[f"{prefix}MAX_TOKENS"], d["max_tokens"]),
        "temperature": get_setting(SETTING_KEYS[f"{prefix}TEMPERATURE"], d["temperature"]),
    }
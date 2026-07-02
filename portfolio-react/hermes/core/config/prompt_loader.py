"""Prompt 模板加载器 + Python 模板渲染

从 config_files/prompts/*.yaml 加载提示词模板，支持占位符替换。

占位符语法: {{name}}  （兼容 Jinja2 风格但用简化实现）
"""
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


# ── 路径常量 ──
# prompt_loader.py 位于 hermes/core/config/，往上三层到 hermes/
CONFIG_DIR = Path(__file__).parent.parent.parent / "config_files"
PROMPTS_DIR = CONFIG_DIR / "prompts"


class PromptNotFoundError(Exception):
    pass


class PromptRenderError(Exception):
    pass


# ── 模板渲染 ──

_PLACEHOLDER_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")


def render_template(template: str, variables: dict[str, Any] | None = None) -> str:
    """渲染模板，替换 {{name}} 占位符。

    未提供的占位符保留原样（不报错），便于多次渲染。
    """
    if not variables:
        return template

    def replacer(match: re.Match) -> str:
        key = match.group(1)
        if key in variables:
            return str(variables[key])
        return match.group(0)  # 保留原样

    return _PLACEHOLDER_RE.sub(replacer, template)


def render_template_strict(template: str, variables: dict[str, Any]) -> str:
    """严格渲染 — 缺少变量时报错。"""
    missing: list[str] = []

    def replacer(match: re.Match) -> str:
        key = match.group(1)
        if key in variables:
            return str(variables[key])
        missing.append(key)
        return match.group(0)

    result = _PLACEHOLDER_RE.sub(replacer, template)
    if missing:
        raise PromptRenderError(f"Missing variables: {missing}")
    return result


# ── YAML 加载 ──

@lru_cache(maxsize=32)
def _load_yaml_file(path: str) -> dict:
    """加载 YAML 文件（带缓存）。"""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_prompt_file(filename: str) -> dict:
    """加载 prompts/ 目录下的 YAML 文件。

    filename: 不含路径，如 "agent_system.yaml"
    返回完整的 YAML dict。
    """
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise PromptNotFoundError(f"Prompt file not found: {path}")
    return _load_yaml_file(str(path))


def get_template(filename: str, template_id: str) -> dict:
    """获取指定模板。

    filename: 如 "agent_system.yaml"
    template_id: 如 "rag_agent"

    返回模板 dict（含 content 等字段）。
    """
    data = load_prompt_file(filename)
    templates = data.get("templates", [])
    for t in templates:
        if t.get("id") == template_id:
            return t
    raise PromptNotFoundError(
        f"Template '{template_id}' not found in {filename}"
    )


def get_default_template(filename: str) -> dict:
    """获取文件中的默认模板（default: true 的那个）。"""
    data = load_prompt_file(filename)
    templates = data.get("templates", [])
    # 优先找 default: true
    for t in templates:
        if t.get("default"):
            return t
    # 否则返回第一个
    if templates:
        return templates[0]
    raise PromptNotFoundError(f"No templates found in {filename}")


def get_template_content(
    filename: str,
    template_id: str | None = None,
    variables: dict[str, Any] | None = None,
) -> str:
    """获取模板内容并渲染。

    template_id 为 None 时使用默认模板。
    variables 为 None 时不渲染，返回原始模板。
    """
    if template_id:
        template = get_template(filename, template_id)
    else:
        template = get_default_template(filename)

    content = template.get("content", "")
    if variables:
        content = render_template(content, variables)
    return content


# ── 便捷方法 ──

def get_agent_system_prompt(
    mode: str = "rag",
    variables: dict[str, Any] | None = None,
) -> str:
    """获取 Agent 系统提示。

    mode: "pure" 或 "rag"
    """
    data = load_prompt_file("agent_system.yaml")
    templates = data.get("templates", [])
    target_id = "rag_agent" if mode == "rag" else "pure_agent"
    for t in templates:
        if t.get("id") == target_id:
            content = t.get("content", "")
            if variables:
                return render_template(content, variables)
            return content
    # fallback 到默认
    return get_template_content("agent_system.yaml", variables=variables)


def list_available_prompts() -> dict[str, list[str]]:
    """列出所有可用的 prompt 文件和模板 ID。"""
    result: dict[str, list[str]] = {}
    if not PROMPTS_DIR.exists():
        return result
    for yml_file in sorted(PROMPTS_DIR.glob("*.yaml")):
        try:
            data = load_prompt_file(yml_file.name)
            ids = [t.get("id", "") for t in data.get("templates", [])]
            result[yml_file.name] = ids
        except Exception:
            result[yml_file.name] = []
    return result


def clear_cache() -> None:
    """清空 YAML 加载缓存（用于测试或热重载）。"""
    _load_yaml_file.cache_clear()

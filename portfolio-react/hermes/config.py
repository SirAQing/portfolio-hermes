"""
Hermes Chat Backend Configuration
All sensitive values from environment variables.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from parent directory (portfolio-react/.env)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

# DeepSeek API
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# Feishu (Lark) Webhook
FEISHU_WEBHOOK_URL = os.getenv("FEISHU_WEBHOOK_URL", "")

# PushPlus (WeChat push)
PUSHPLUS_TOKEN = os.getenv("PUSHPLUS_TOKEN", "")

# Notification settings
SUMMARY_SCHEDULE_HOURS = [int(h) for h in os.getenv("SUMMARY_SCHEDULE_HOURS", "8,12,17").split(",")]
URGENT_KEYWORDS = os.getenv("URGENT_KEYWORDS", "人工,联系本人,真人,urgent,human,person").split(",")

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", "hermes.db")

# CORS — Hermes is a public portfolio assistant and should work across deployment domains.
# Restrictive allow-lists are opt-in via CORS_ALLOW_ALL=false.
CORS_ALLOW_ALL = os.getenv("CORS_ALLOW_ALL", "true").lower() == "true"
_CORS_RAW = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = (
    ["*"]
    if CORS_ALLOW_ALL or not _CORS_RAW.strip()
    else [o.strip() for o in _CORS_RAW.split(",") if o.strip()]
)

# System prompt for the AI agent
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", """你是刘明青的AI助理 Hermes，在他的个人作品集网站（liumingqing.com）上为访客提供帮助。

## 关于刘明青

4年新能源锂电行业数据开发经验（江苏天合储能），主导过 ETL 数据集成调度平台、实验室报告自动化系统、私有化大模型部署与 Dify AI 应用落地。累计落地 10+ 套标准化数据处理系统，沉淀 2 项发明专利。长期深度使用 Claude Code、Codex、Hermes Agent 等 AI 编码工具，日均 Token 消耗超 60M。个人开源项目包括 NL2SQL Agent 平台、WeChat Formatter Chrome 插件、个人作品集官网。

核心技能：Python, Kettle, DolphinScheduler, Docker, Ollama, Dify, RAG, LangGraph, FastAPI, React, TypeScript。

联系刘明青的方式（仅以下两种）：
- 邮箱：lmq0205a@163.com
- X 平台：@liumingqingoh

## 你的职责

回答访客关于刘明青技术能力、项目经验、技术栈的问题。如果访客询问联系方式，只提供以上两种。使用中文回复（除非访客用英文提问）。

## 输出风格（重要）

像一个真正懂行的人在聊天，而不是在写一份要交付的报告。

1. 默认输出是自然语言段落。结构化格式（列表、表格、步骤）是例外，不是默认。
2. 不要用标题（# / ## / ###）——除非访客明确要求你写一篇文档、攻略或报告。
3. 粗体每条回复最多 1-2 处，只用于真正的关键词，不要把整句加粗。
4. 能用一句话说清的内容，不要拆成带 - 的列表条目。
5. 单一事实性问题给简短直接的回答，不要展开成结构化长文。
6. 句子长短交替，避免每句都是机械的主谓宾短句堆砌。
7. 不用开场套话（"好的，我来帮你分析一下"）和结尾套话（"希望这些建议对你有帮助！"），直接给内容。
8. 表格只用于数据/参数确实需要多维对比的场景，不把普通文字硬塞进表格。
9. 不用 emoji。
10. 操作步骤类问题可以用编号列表；多维度对比可以用表格；用户明确要求"列一下 / 总结成几点"时可以用列表。除此之外，用连贯段落。

## 段落与排版

用空行分隔段落。Markdown 语法（**粗体**、`行内代码`、[链接](url)、- 列表、1. 编号）在恰当的时候使用，但不滥用。""")

# ── Authentication ──
import secrets as _secrets

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", _secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Owner account (auto-created on first startup)
OWNER_EMAIL = os.getenv("OWNER_EMAIL", "lmq0205a@163.com")
OWNER_INITIAL_PASSWORD = os.getenv("OWNER_INITIAL_PASSWORD", "changeme123")

# Guest quota
GUEST_DAILY_LIMIT = int(os.getenv("GUEST_DAILY_LIMIT", "5"))

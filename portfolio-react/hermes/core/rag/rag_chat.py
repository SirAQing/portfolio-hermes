"""RAG 增强对话集成

职责:
    1. 根据用户消息决定是否需要 RAG 检索
    2. 调用混合检索器获取相关上下文
    3. 将上下文注入到 system prompt 中

设计要点:
    - 默认 KB: 启动时自动查找第一个公开 KB 作为默认 RAG 知识库
    - 触发策略: 简单问答不检索（避免开销），技术性问题才检索
    - 容错: RAG 检索失败不影响对话，降级为无 RAG 模式
"""
from models import get_db
from core.rag.retriever import hybrid_search, build_context
from core.rag.fusion import SearchResult

# 是否启用 RAG（可通过环境变量关闭）
import os
_RAG_ENABLED = os.getenv("RAG_ENABLED", "true").lower() == "true"

# 默认 KB 缓存
_default_kb_id: str | None = None


def get_default_kb_id() -> str | None:
    """获取默认公开 KB 的 ID。"""
    global _default_kb_id
    if _default_kb_id is not None:
        return _default_kb_id
    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT id FROM knowledge_bases WHERE is_public = 1 ORDER BY created_at ASC LIMIT 1"
            ).fetchone()
            if row:
                _default_kb_id = row["id"]
                return _default_kb_id
    except Exception:
        pass
    return None


def should_use_rag(message: str) -> bool:
    """判断是否需要 RAG 检索。

    简单问候/闲聊不检索，技术性问题才检索。
    """
    if not _RAG_ENABLED:
        return False
    msg = message.strip().lower()
    # 短消息（<4 字符）通常不需要
    if len(msg) < 4:
        return False
    # 问候语
    greetings = ["你好", "hello", "hi", "hey", "嗨", "早上好", "下午好", "晚上好", "在吗"]
    if msg in greetings or any(msg.startswith(g) for g in greetings):
        return False
    # 致谢
    thanks = ["谢谢", "感谢", "thanks", "thank you", "多谢"]
    if msg in thanks:
        return False
    return True


async def retrieve_context(query: str, kb_id: str | None = None) -> tuple[str, list[SearchResult]]:
    """检索 RAG 上下文。返回 (context_string, results)。

    失败时返回 ("", [])，不抛异常。
    """
    if kb_id is None:
        kb_id = get_default_kb_id()
    if not kb_id:
        return "", []

    try:
        results = await hybrid_search(query=query, kb_id=kb_id)
        if not results:
            return "", []
        context = build_context(results)
        return context, results
    except Exception as e:
        print(f"[rag_chat] retrieve failed: {e}")
        return "", []


def build_rag_system_prompt(base_prompt: str, context: str) -> str:
    """将检索到的上下文注入到 system prompt 中。"""
    if not context:
        return base_prompt
    return f"""{base_prompt}

## 知识库参考资料

以下是从知识库检索到的相关内容，请优先基于这些资料回答（但保持自然语气，不要直接复述"根据知识库"）：

{context}

如果资料与问题不直接相关，可以忽略，按照你的常识回答。"""

"""RAG 增强对话集成

职责:
    1. 根据用户消息决定是否需要 RAG 检索
    2. 支持多知识库并行检索 + RRF 融合
    3. 将上下文注入到 system prompt 中

设计要点:
    - 链接知识库: owner 在 Admin 页面标记 is_linked=1 的知识库
    - 默认 KB: 如果没有任何链接的 KB，回退到第一个公开 KB（兼容旧数据）
    - 触发策略: 简单问答不检索（避免开销），技术性问题才检索
    - 容错: RAG 检索失败不影响对话，降级为无 RAG 模式
    - 多KB融合: 并行检索所有 linked KB，结果通过 RRF 融合
"""
from models import get_db
from core.rag.retriever import hybrid_search, build_context
from core.rag.fusion import SearchResult
from core.rag.kb_repo import get_linked_kb_ids

import os
_RAG_ENABLED = os.getenv("RAG_ENABLED", "true").lower() == "true"

_default_kb_id: str | None = None


def get_active_kb_ids(mode: str = "both") -> list[str]:
    """获取当前活跃（已链接）的知识库 ID 列表。

    mode: "visitor" | "demo" | "both"
    优先级:
    1. 指定模式下已链接的 KB
    2. 如果没有链接的 KB，回退到第一个公开 KB（兼容旧数据）
    """
    linked = get_linked_kb_ids(mode)
    if linked:
        return linked
    return _get_fallback_kb_ids()


def _get_fallback_kb_ids() -> list[str]:
    """回退：获取第一个公开 KB 的 ID（兼容未设置 link 的旧数据）。"""
    global _default_kb_id
    if _default_kb_id is not None:
        return [_default_kb_id] if _default_kb_id else []
    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT id FROM knowledge_bases WHERE is_public = 1 ORDER BY created_at ASC LIMIT 1"
            ).fetchone()
            if row:
                _default_kb_id = row["id"]
                return [_default_kb_id]
    except Exception:
        pass
    _default_kb_id = ""
    return []


def get_default_kb_id() -> str | None:
    """获取默认 KB ID（保持向后兼容，返回第一个活跃 KB）。"""
    ids = get_active_kb_ids()
    return ids[0] if ids else None


def reset_default_kb_cache():
    """重置 KB 缓存（在 KB link 状态变更后调用）。"""
    global _default_kb_id
    _default_kb_id = None


def should_use_rag(message: str) -> bool:
    """判断是否需要 RAG 检索。"""
    if not _RAG_ENABLED:
        return False
    msg = message.strip().lower()
    if len(msg) < 4:
        return False
    greetings = ["你好", "hello", "hi", "hey", "嗨", "早上好", "下午好", "晚上好", "在吗"]
    if msg in greetings or any(msg.startswith(g) for g in greetings):
        return False
    thanks = ["谢谢", "感谢", "thanks", "thank you", "多谢"]
    if msg in thanks:
        return False
    return True


async def retrieve_context(query: str, kb_ids: list[str] | None = None, mode: str = "both") -> tuple[str, list[SearchResult]]:
    """检索 RAG 上下文，支持多 KB 并行检索 + RRF 融合。

    mode: "visitor" | "demo" | "both" — 当 kb_ids 未指定时按 mode 获取活跃 KB
    返回 (context_string, results)。失败时返回 ("", [])。
    """
    if kb_ids is None:
        kb_ids = get_active_kb_ids(mode)
    if not kb_ids:
        return "", []

    try:
        from core.rag.embedder import get_default_embedder
        embedder = get_default_embedder()

        all_results: list[SearchResult] = []
        for kb_id in kb_ids:
            try:
                results = await hybrid_search(query=query, kb_id=kb_id, embedder=embedder)
                all_results.extend(results)
            except Exception as e:
                print(f"[rag_chat] search failed for kb {kb_id}: {e}")

        if not all_results:
            return "", []

        if len(kb_ids) > 1:
            seen: dict[str, SearchResult] = {}
            for r in all_results:
                if r.chunk_id not in seen or r.score > seen[r.chunk_id].score:
                    seen[r.chunk_id] = r
            all_results = sorted(seen.values(), key=lambda x: x.score, reverse=True)

        from config import RAG_FINAL_K
        all_results = all_results[:RAG_FINAL_K]

        context = build_context(all_results)
        return context, all_results
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

如果资料与问题不直接相关，可以忽略，按照你的常识回答。如果知识库中没有相关信息且联网搜索可用，可以使用 web_search 搜索互联网获取最新信息。"""

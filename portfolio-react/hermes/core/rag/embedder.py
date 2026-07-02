"""Embedder Provider 抽象 + OpenAI 兼容实现"""
import os
import httpx
from abc import ABC, abstractmethod
from typing import Sequence

from config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    EMBEDDING_API_KEY,
    EMBEDDING_BASE_URL,
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSION,
    EMBEDDING_MAX_TOKENS,
    EMBEDDING_BATCH_SIZE,
)


class Embedder(ABC):
    """Embedder 抽象接口（参考 WeKnora embedder.go）"""

    @abstractmethod
    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        """批量嵌入，返回向量列表。"""

    @abstractmethod
    def dimension(self) -> int:
        """向量维度。"""

    @abstractmethod
    def model_name(self) -> str:
        """模型名（用于记录到 documents.embedding_model）。"""

    @abstractmethod
    def max_tokens(self) -> int:
        """单次嵌入最大 token 数。"""


class OpenAICompatibleEmbedder(Embedder):
    """OpenAI 兼容 API 实现（支持 SiliconFlow / DeepSeek / OpenAI 等）"""

    def __init__(
        self,
        api_key: str = None,
        base_url: str = None,
        model: str = None,
        dimension: int = None,
        max_tokens: int = None,
        batch_size: int = None,
    ):
        self.api_key = api_key or EMBEDDING_API_KEY
        self.base_url = (base_url or EMBEDDING_BASE_URL).rstrip("/")
        self._model = model or EMBEDDING_MODEL
        self._dimension = dimension or EMBEDDING_DIMENSION
        self._max_tokens = max_tokens or EMBEDDING_MAX_TOKENS
        self._batch_size = batch_size or EMBEDDING_BATCH_SIZE

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        results: list[list[float]] = []
        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, len(texts), self._batch_size):
                batch = list(texts[i : i + self._batch_size])
                resp = await client.post(
                    f"{self.base_url}/embeddings",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": self._model, "input": batch},
                )
                resp.raise_for_status()
                data = resp.json()
                # OpenAI 兼容格式：data[i].embedding
                batch_vecs = [item["embedding"] for item in data["data"]]
                results.extend(batch_vecs)
        return results

    def dimension(self) -> int:
        return self._dimension

    def model_name(self) -> str:
        return self._model

    def max_tokens(self) -> int:
        return self._max_tokens


class MockEmbedder(Embedder):
    """测试/降级用 Mock — 基于文本 hash 生成确定性向量，维度与数据库一致(768)"""

    def __init__(self, dim: int = 768):
        self._dim = dim

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        import hashlib

        results = []
        for t in texts:
            h = hashlib.sha256(t.encode("utf-8")).digest()
            vec = [(h[i % len(h)] / 255.0 - 0.5) * 2 for i in range(self._dim)]
            results.append(vec)
        return results

    def dimension(self) -> int:
        return self._dim

    def model_name(self) -> str:
        return "mock"

    def max_tokens(self) -> int:
        return 512


_default_embedder: Embedder | None = None


def _is_deepseek_key_used_for_other_provider() -> bool:
    """检测配置错误：EMBEDDING_API_KEY 默认回退到 DEEPSEEK_API_KEY，但 BASE_URL 不是 DeepSeek。
    这种情况下 DeepSeek 的 key 无法在其他服务商（如 SiliconFlow）认证。
    """
    env_has_embedding_key = os.getenv("EMBEDDING_API_KEY") is not None
    if env_has_embedding_key:
        return False
    key_is_deepseek_fallback = (EMBEDDING_API_KEY == DEEPSEEK_API_KEY)
    base_url_is_deepseek = "deepseek.com" in EMBEDDING_BASE_URL
    return key_is_deepseek_fallback and not base_url_is_deepseek


def get_default_embedder() -> Embedder:
    """单例获取默认 embedder，自动检测配置错误并降级。

    降级策略：
    1. 如果显式设置了 EMBEDDING_API_KEY → 使用 OpenAICompatibleEmbedder
    2. 如果 EMBEDDING_API_KEY 为空 → 降级 MockEmbedder
    3. 如果 EMBEDDING_API_KEY 是 DEEPSEEK_API_KEY 的回退值，但 BASE_URL 不是 DeepSeek
       （典型错配：DeepSeek key + SiliconFlow URL）→ 降级 MockEmbedder 并警告
    """
    global _default_embedder
    if _default_embedder is None:
        if not EMBEDDING_API_KEY:
            print("[embedder] WARNING: EMBEDDING_API_KEY is empty, using MockEmbedder (keyword search only)")
            _default_embedder = MockEmbedder(dim=EMBEDDING_DIMENSION)
        elif _is_deepseek_key_used_for_other_provider():
            print(
                "[embedder] WARNING: EMBEDDING_API_KEY defaults to DEEPSEEK_API_KEY "
                f"but EMBEDDING_BASE_URL={EMBEDDING_BASE_URL} is not DeepSeek. "
                "DeepSeek API key cannot authenticate with other providers. "
                "Falling back to MockEmbedder (keyword search only). "
                "Set EMBEDDING_API_KEY explicitly to use a real embedding service."
            )
            _default_embedder = MockEmbedder(dim=EMBEDDING_DIMENSION)
        else:
            _default_embedder = OpenAICompatibleEmbedder()
    return _default_embedder

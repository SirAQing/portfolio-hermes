"""Embedder 测试 — 重点测 MockEmbedder"""
import pytest
from core.rag.embedder import MockEmbedder


@pytest.mark.asyncio
async def test_mock_embedder_returns_vectors():
    emb = MockEmbedder(dim=8)
    vecs = await emb.embed(["hello", "world"])
    assert len(vecs) == 2
    assert len(vecs[0]) == 8
    assert all(isinstance(v, float) for v in vecs[0])


@pytest.mark.asyncio
async def test_mock_embedder_deterministic():
    """相同输入相同输出"""
    emb = MockEmbedder(dim=8)
    v1 = (await emb.embed(["test"]))[0]
    v2 = (await emb.embed(["test"]))[0]
    assert v1 == v2


@pytest.mark.asyncio
async def test_mock_embedder_different_inputs_different():
    emb = MockEmbedder(dim=8)
    v1 = (await emb.embed(["hello"]))[0]
    v2 = (await emb.embed(["world"]))[0]
    assert v1 != v2


@pytest.mark.asyncio
async def test_mock_embedder_empty_input():
    emb = MockEmbedder()
    assert await emb.embed([]) == []


def test_mock_embedder_metadata():
    emb = MockEmbedder(dim=16)
    assert emb.dimension() == 16
    assert emb.model_name() == "mock"
    assert emb.max_tokens() > 0

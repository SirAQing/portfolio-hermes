"""RRF 融合测试"""
from core.rag.fusion import rrf_fuse, SearchResult


def test_rrf_empty_inputs():
    assert rrf_fuse([], []) == []


def test_rrf_single_vector_result():
    results = [SearchResult(chunk_id="1", content="a", source="vector")]
    fused = rrf_fuse(results, [])
    assert len(fused) == 1
    assert fused[0].chunk_id == "1"


def test_rrf_single_keyword_result():
    results = [SearchResult(chunk_id="2", content="b", source="keyword")]
    fused = rrf_fuse([], results)
    assert len(fused) == 1
    assert fused[0].chunk_id == "2"


def test_rrf_overlapping_results_ranked_higher():
    """两个列表中都出现的结果应排在前面"""
    only_vec = SearchResult(chunk_id="only_vec", content="a", source="vector")
    both = SearchResult(chunk_id="both", content="b", source="vector")
    only_kw = SearchResult(chunk_id="only_kw", content="c", source="keyword")
    both_kw = SearchResult(chunk_id="both", content="b", source="keyword")

    fused = rrf_fuse([only_vec, both], [both_kw, only_kw])
    # "both" 应该排第一（两个列表都命中）
    assert fused[0].chunk_id == "both"


def test_rrf_top_rank_gets_higher_score():
    """排名越靠前分数越高"""
    r1 = SearchResult(chunk_id="1", content="a", source="vector")
    r2 = SearchResult(chunk_id="2", content="b", source="vector")
    fused = rrf_fuse([r1, r2], [])
    assert fused[0].score > fused[1].score
    assert fused[0].chunk_id == "1"


def test_rrf_custom_weights():
    """自定义权重影响排序"""
    r_vec = SearchResult(chunk_id="v", content="a", source="vector")
    r_kw = SearchResult(chunk_id="k", content="b", source="keyword")
    # 向量权重远高于关键词
    fused = rrf_fuse([r_vec], [r_kw], vector_weight=10.0, keyword_weight=0.1)
    assert fused[0].chunk_id == "v"


def test_rrf_preserves_content():
    results = [SearchResult(chunk_id="1", content="hello", source="vector")]
    fused = rrf_fuse(results, [])
    assert fused[0].content == "hello"

"""Phase 5 文档处理流水线测试"""
import pytest
from fastapi.testclient import TestClient

from main import app
from core.rag.parser import (
    parse_file,
    ParseError,
    ParseResult,
    get_supported_extensions,
    register_parser,
    _PARSERS,
)
from core.rag.pipeline import (
    run_pipeline,
    ingest_document,
    ingest_markdown,
    ingest_batch,
    get_pipeline_status,
    STATUS_PENDING,
    STATUS_PARSING,
    STATUS_CHUNKING,
    STATUS_EMBEDDING,
    STATUS_READY,
    STATUS_ERROR,
    STATUS_EMPTY,
    PIPELINE_STAGES,
)
from core.rag.kb_repo import (
    create_kb,
    create_document,
    get_document,
    update_document_status,
    update_document_stats,
    get_documents_by_status,
)
from core.rag.embedder import MockEmbedder
from config import OWNER_EMAIL, EMBEDDING_DIMENSION


# ── Fixtures ──

@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def owner_token(fresh_db):
    """创建 owner 用户并签发 token。"""
    from core.auth.init_owner import ensure_owner_account
    from core.auth.user_repo import get_user_by_email
    from core.auth.jwt_handler import create_access_token

    ensure_owner_account()
    user = get_user_by_email(OWNER_EMAIL)
    token = create_access_token(user["id"], user["role"])
    return token


@pytest.fixture
def auth_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}"}


@pytest.fixture
def mock_embedder(monkeypatch):
    """用 MockEmbedder 替换默认 embedder，避免真实 API 调用。"""
    mock = MockEmbedder(dim=EMBEDDING_DIMENSION)

    def _get_mock():
        return mock

    # pipeline 中通过 get_default_embedder() 获取
    monkeypatch.setattr("core.rag.pipeline.get_default_embedder", _get_mock)
    monkeypatch.setattr("core.rag.embedder.get_default_embedder", _get_mock)
    monkeypatch.setattr("api.kb.get_default_embedder", _get_mock)
    return mock


@pytest.fixture(autouse=True)
def clean_parser_registry():
    """每个测试后清理自定义注册的 parser（如 csv）。"""
    original_keys = set(_PARSERS.keys())
    yield
    # 清理新增的 parser
    new_keys = set(_PARSERS.keys()) - original_keys
    for k in new_keys:
        _PARSERS.pop(k, None)


# ── Parser 测试 ──

class TestMarkdownParser:
    def test_parse_markdown_basic(self):
        content = b"# Hello World\n\nThis is a test."
        result = parse_file("test.md", content)
        assert result.source_type == "markdown"
        assert result.title == "Hello World"
        assert "This is a test" in result.content

    def test_parse_markdown_extension(self):
        content = b"# Title\nContent"
        result = parse_file("doc.markdown", content)
        assert result.source_type == "markdown"
        assert result.title == "Title"

    def test_parse_markdown_no_h1_uses_filename(self):
        content = b"Just some text without heading"
        result = parse_file("notes.md", content)
        assert result.title == "notes"

    def test_parse_markdown_preserves_content(self):
        content = b"# Title\n\n```python\ncode = 1\n```\n\n- item 1\n- item 2"
        result = parse_file("test.md", content)
        assert "```python" in result.content
        assert "code = 1" in result.content
        assert "- item 1" in result.content


class TestTextParser:
    def test_parse_txt_utf8(self):
        content = "Hello 世界".encode("utf-8")
        result = parse_file("test.txt", content)
        assert result.source_type == "text"
        assert "Hello" in result.content
        assert "世界" in result.content

    def test_parse_txt_filename_stem_as_title(self):
        content = b"plain text"
        result = parse_file("my_notes.txt", content)
        assert result.title == "my_notes"

    def test_parse_txt_gbk_encoding(self):
        content = "你好世界".encode("gbk")
        result = parse_file("test.txt", content)
        assert "你好" in result.content


class TestHTMLParser:
    def test_parse_html_basic(self):
        html = b"<html><head><title>My Page</title></head><body><h1>Title</h1><p>Content</p></body></html>"
        result = parse_file("test.html", html)
        assert result.source_type == "html"
        assert result.title == "My Page"
        assert "Title" in result.content
        assert "Content" in result.content

    def test_parse_html_removes_script(self):
        html = b"<html><body><script>alert(1)</script><p>Safe</p></body></html>"
        result = parse_file("test.html", html)
        assert "alert" not in result.content
        assert "Safe" in result.content

    def test_parse_html_removes_style(self):
        html = b"<html><body><style>body{color:red}</style><p>Text</p></body></html>"
        result = parse_file("test.html", html)
        assert "color" not in result.content
        assert "Text" in result.content

    def test_parse_html_converts_headings(self):
        html = b"<html><body><h1>Big</h1><h2>Medium</h2><h3>Small</h3></body></html>"
        result = parse_file("test.html", html)
        assert "# Big" in result.content
        assert "## Medium" in result.content
        assert "### Small" in result.content

    def test_parse_html_converts_links(self):
        html = b'<html><body><a href="http://example.com">Link</a></body></html>'
        result = parse_file("test.html", html)
        assert "[Link](http://example.com)" in result.content

    def test_parse_html_converts_code(self):
        html = b"<html><body><pre>code block</pre><code>inline</code></body></html>"
        result = parse_file("test.html", html)
        assert "```" in result.content
        assert "code block" in result.content
        assert "`inline`" in result.content

    def test_parse_html_entities(self):
        html = b"<html><body><p>Tom &amp; Jerry &lt;3</p></body></html>"
        result = parse_file("test.html", html)
        assert "Tom & Jerry" in result.content
        assert "<3" in result.content

    def test_parse_htm_extension(self):
        html = b"<html><body><p>Content</p></body></html>"
        result = parse_file("test.htm", html)
        assert result.source_type == "html"


class TestJSONParser:
    def test_parse_json_with_title_content(self):
        data = b'{"title": "My Doc", "content": "Hello world"}'
        result = parse_file("test.json", data)
        assert result.source_type == "json"
        assert result.title == "My Doc"
        assert "Hello world" in result.content
        assert "# My Doc" in result.content

    def test_parse_json_with_text_field(self):
        data = b'{"title": "Doc", "text": "Body text"}'
        result = parse_file("test.json", data)
        assert "Body text" in result.content

    def test_parse_json_array(self):
        data = b'[{"name": "Alice"}, {"name": "Bob"}]'
        result = parse_file("test.json", data)
        assert "Alice" in result.content
        assert "Bob" in result.content
        assert "Item 1" in result.content

    def test_parse_json_invalid(self):
        data = b"{invalid json}"
        with pytest.raises(ParseError):
            parse_file("test.json", data)

    def test_parse_json_arbitrary_object(self):
        data = b'{"foo": "bar", "count": 42}'
        result = parse_file("test.json", data)
        assert "foo" in result.content
        assert "bar" in result.content


class TestParserRegistry:
    def test_get_supported_extensions(self):
        exts = get_supported_extensions()
        assert "md" in exts
        assert "markdown" in exts
        assert "txt" in exts
        assert "html" in exts
        assert "htm" in exts
        assert "json" in exts

    def test_parse_unsupported_type(self):
        with pytest.raises(ParseError) as exc_info:
            parse_file("test.xyz", b"content")
        assert "Unsupported" in str(exc_info.value)

    def test_parse_case_insensitive_extension(self):
        content = b"# Title\nText"
        result = parse_file("TEST.MD", content)
        assert result.source_type == "markdown"

    def test_register_custom_parser(self):
        @register_parser("csv")
        def parse_csv(content: bytes, filename: str) -> ParseResult:
            return ParseResult(content="csv content", title="csv", source_type="csv")

        result = parse_file("test.csv", b"a,b,c")
        assert result.source_type == "csv"
        assert "csv content" in result.content


# ── Pipeline 测试 ──

class TestPipelineStages:
    """测试流水线阶段常量"""

    def test_stage_order(self):
        assert PIPELINE_STAGES == ["parsing", "chunking", "embedding", "ready"]

    def test_status_constants(self):
        assert STATUS_PENDING == "pending"
        assert STATUS_PARSING == "parsing"
        assert STATUS_CHUNKING == "chunking"
        assert STATUS_EMBEDDING == "embedding"
        assert STATUS_READY == "ready"
        assert STATUS_ERROR == "error"
        assert STATUS_EMPTY == "empty"


class TestPipelineExecution:
    """测试流水线执行（使用 MockEmbedder）"""

    def setup_method(self):
        self.kb_id = create_kb("test-kb", "test", is_public=True)

    @pytest.mark.asyncio
    async def test_pipeline_markdown_success(self, mock_embedder):
        """测试完整流水线：Markdown → ready"""
        content = b"# Test Doc\n\nThis is test content for the pipeline."
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="markdown",
            title="Test",
            raw_content=content.decode(),
        )

        result = await ingest_document(doc_id, self.kb_id, content, "test.md")

        assert result.success is True
        assert result.stage == STATUS_READY
        assert result.chunk_count >= 1
        assert result.total_tokens > 0

        # 验证数据库状态
        doc = get_document(doc_id)
        assert doc["status"] == STATUS_READY
        assert doc["chunk_count"] == result.chunk_count
        assert doc["total_tokens"] == result.total_tokens

    @pytest.mark.asyncio
    async def test_pipeline_unsupported_type_fails(self, mock_embedder):
        """测试不支持的文件类型 → error"""
        content = b"fake unsupported content"
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="xyz",
            title="Bad",
        )

        result = await ingest_document(doc_id, self.kb_id, content, "test.xyz")

        assert result.success is False
        assert result.stage == STATUS_ERROR
        assert "Unsupported" in result.error

        doc = get_document(doc_id)
        assert doc["status"] == STATUS_ERROR

    @pytest.mark.asyncio
    async def test_pipeline_html_input(self, mock_embedder):
        """测试 HTML 输入走流水线"""
        html = b"<html><body><h1>HTML Doc</h1><p>HTML content here</p></body></html>"
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="html",
            title="HTML Test",
        )

        result = await ingest_document(doc_id, self.kb_id, html, "test.html")

        assert result.success is True
        assert result.stage == STATUS_READY

    @pytest.mark.asyncio
    async def test_ingest_markdown_convenience(self, mock_embedder):
        """测试 ingest_markdown 便捷函数"""
        text = "# Title\n\nSome markdown text."
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="markdown",
            title="Conv Test",
        )

        result = await ingest_markdown(doc_id, self.kb_id, text, "test.md")

        assert result.success is True
        assert result.stage == STATUS_READY

    @pytest.mark.asyncio
    async def test_pipeline_json_input(self, mock_embedder):
        """测试 JSON 输入走流水线"""
        data = b'{"title": "JSON Doc", "content": "JSON content for testing"}'
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="json",
            title="JSON Test",
        )

        result = await ingest_document(doc_id, self.kb_id, data, "test.json")

        assert result.success is True
        assert result.stage == STATUS_READY

    @pytest.mark.asyncio
    async def test_pipeline_status_transitions(self, mock_embedder):
        """测试流水线状态转换（pending → parsing → chunking → embedding → ready）"""
        content = b"# Status Tracking\n\nContent for status test."
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="markdown",
            title="Status",
        )

        # 初始为 pending
        assert get_document(doc_id)["status"] == STATUS_PENDING

        # 执行后为 ready
        result = await ingest_document(doc_id, self.kb_id, content, "test.md")
        assert result.success is True

        final_doc = get_document(doc_id)
        assert final_doc["status"] == STATUS_READY
        assert final_doc["chunk_count"] > 0
        assert final_doc["total_tokens"] > 0
        assert final_doc["processed_at"] is not None


class TestPipelineBatch:
    """测试批量处理"""

    def setup_method(self):
        self.kb_id = create_kb("batch-kb", "batch test", is_public=True)

    @pytest.mark.asyncio
    async def test_batch_ingest_success(self, mock_embedder):
        """测试批量摄入"""
        items = []
        for i in range(3):
            doc_id = create_document(
                kb_id=self.kb_id,
                source_type="markdown",
                title=f"Doc {i}",
            )
            items.append({
                "doc_id": doc_id,
                "kb_id": self.kb_id,
                "content": f"# Document {i}\n\nContent number {i}.".encode(),
                "filename": f"doc{i}.md",
            })

        results = await ingest_batch(items, max_concurrency=2)

        assert len(results) == 3
        for r in results:
            assert r.success is True
            assert r.stage == STATUS_READY

    @pytest.mark.asyncio
    async def test_batch_with_one_failure(self, mock_embedder):
        """测试批量中有一个失败"""
        items = []
        # 2 个成功的
        for i in range(2):
            doc_id = create_document(
                kb_id=self.kb_id,
                source_type="markdown",
                title=f"Good {i}",
            )
            items.append({
                "doc_id": doc_id,
                "kb_id": self.kb_id,
                "content": f"# Good {i}\nContent".encode(),
                "filename": f"good{i}.md",
            })
        # 1 个失败的（不支持类型）
        bad_doc = create_document(
            kb_id=self.kb_id,
            source_type="pdf",
            title="Bad",
        )
        items.append({
            "doc_id": bad_doc,
            "kb_id": self.kb_id,
            "content": b"fake pdf",
            "filename": "bad.pdf",
        })

        results = await ingest_batch(items, max_concurrency=3)

        success_count = sum(1 for r in results if r.success)
        failure_count = sum(1 for r in results if not r.success)
        assert success_count == 2
        assert failure_count == 1


class TestPipelineStatus:
    """测试状态查询"""

    def setup_method(self):
        self.kb_id = create_kb("status-kb", "status test", is_public=True)

    def test_get_status_nonexistent(self):
        status = get_pipeline_status("nonexistent-id")
        assert status["exists"] is False

    def test_get_status_pending(self):
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="markdown",
            title="Pending",
        )
        status = get_pipeline_status(doc_id)
        assert status["exists"] is True
        assert status["status"] == STATUS_PENDING
        assert status["chunk_count"] == 0

    def test_get_status_after_manual_update(self):
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="markdown",
            title="Updated",
        )
        update_document_status(doc_id, STATUS_READY)
        update_document_stats(doc_id, 5, 1200)

        status = get_pipeline_status(doc_id)
        assert status["status"] == STATUS_READY
        assert status["chunk_count"] == 5
        assert status["total_tokens"] == 1200
        assert status["processed_at"] is not None

    def test_get_status_with_error(self):
        doc_id = create_document(
            kb_id=self.kb_id,
            source_type="markdown",
            title="Errored",
        )
        update_document_status(doc_id, STATUS_ERROR, error_message="Test error")

        status = get_pipeline_status(doc_id)
        assert status["status"] == STATUS_ERROR
        assert status["error_message"] == "Test error"


class TestDocumentsByStatus:
    """测试按状态查询文档"""

    def setup_method(self):
        self.kb_id = create_kb("by-status-kb", "test", is_public=True)

    def test_filter_by_status(self):
        doc1 = create_document(kb_id=self.kb_id, source_type="md", title="Doc1")
        doc2 = create_document(kb_id=self.kb_id, source_type="md", title="Doc2")
        doc3 = create_document(kb_id=self.kb_id, source_type="md", title="Doc3")

        update_document_status(doc1, STATUS_READY)
        update_document_status(doc2, STATUS_READY)
        update_document_status(doc3, STATUS_ERROR)

        ready_docs = get_documents_by_status(STATUS_READY, self.kb_id)
        error_docs = get_documents_by_status(STATUS_ERROR, self.kb_id)
        pending_docs = get_documents_by_status(STATUS_PENDING, self.kb_id)

        assert len(ready_docs) == 2
        assert len(error_docs) == 1
        assert len(pending_docs) == 0

    def test_filter_without_kb_id(self):
        """不指定 kb_id 时查所有"""
        create_document(kb_id=self.kb_id, source_type="md", title="A")
        ready_docs = get_documents_by_status(STATUS_PENDING)
        assert len(ready_docs) >= 1


# ── API 集成测试 ──

class TestKBApiEnhancements:
    """测试增强的 KB API（使用 mock_embedder 避免真实 API）"""

    def test_supported_types_endpoint(self, client, auth_headers):
        """测试支持的文件类型查询"""
        resp = client.get("/api/kb/supported-types", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "extensions" in data
        assert "md" in data["extensions"]
        assert "txt" in data["extensions"]
        assert "html" in data["extensions"]
        assert "json" in data["extensions"]

    def test_upload_markdown_document(self, client, auth_headers, mock_embedder):
        """测试上传 Markdown 文档"""
        # 先创建 KB
        resp = client.post(
            "/api/kb",
            json={"name": "Upload Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        # 上传文件
        content = b"# Test Document\n\nThis is test content."
        resp = client.post(
            f"/api/kb/{kb_id}/documents",
            files={"file": ("test.md", content, "text/markdown")},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "doc_id" in data
        assert data["title"] == "Test Document"
        assert data["source_type"] == "markdown"

    def test_upload_html_document(self, client, auth_headers, mock_embedder):
        """测试上传 HTML 文档"""
        resp = client.post(
            "/api/kb",
            json={"name": "HTML Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        html = b"<html><head><title>HTML Doc</title></head><body><h1>Title</h1><p>Content</p></body></html>"
        resp = client.post(
            f"/api/kb/{kb_id}/documents",
            files={"file": ("test.html", html, "text/html")},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["source_type"] == "html"

    def test_upload_unsupported_type(self, client, auth_headers):
        """测试上传不支持的文件类型"""
        resp = client.post(
            "/api/kb",
            json={"name": "Bad Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        resp = client.post(
            f"/api/kb/{kb_id}/documents",
            files={"file": ("test.xyz", b"fake content", "application/octet-stream")},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "Unsupported" in resp.json()["detail"]

    def test_upload_txt_document(self, client, auth_headers, mock_embedder):
        """测试上传 TXT 文档"""
        resp = client.post(
            "/api/kb",
            json={"name": "TXT Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        content = b"This is a plain text document.\nIt has multiple lines."
        resp = client.post(
            f"/api/kb/{kb_id}/documents",
            files={"file": ("test.txt", content, "text/plain")},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["source_type"] == "text"

    def test_get_document_status(self, client, auth_headers, mock_embedder):
        """测试查询文档状态"""
        resp = client.post(
            "/api/kb",
            json={"name": "Status Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        # 上传
        content = b"# Status Test\n\nContent"
        resp = client.post(
            f"/api/kb/{kb_id}/documents",
            files={"file": ("test.md", content, "text/markdown")},
            headers=auth_headers,
        )
        doc_id = resp.json()["doc_id"]

        # 查询状态
        resp = client.get(
            f"/api/kb/documents/{doc_id}/status",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["exists"] is True
        assert data["status"] in ("pending", "parsing", "chunking", "embedding", "ready")

    def test_get_status_nonexistent(self, client, auth_headers):
        resp = client.get(
            "/api/kb/documents/nonexistent/status",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_list_documents_by_status(self, client, auth_headers, mock_embedder):
        """测试按状态列出文档"""
        resp = client.post(
            "/api/kb",
            json={"name": "List Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        # 上传一个文档
        content = b"# Test\nContent"
        client.post(
            f"/api/kb/{kb_id}/documents",
            files={"file": ("test.md", content, "text/markdown")},
            headers=auth_headers,
        )

        # 查询 ready 状态
        resp = client.get(
            f"/api/kb/{kb_id}/documents/status/ready",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_batch_upload(self, client, auth_headers, mock_embedder):
        """测试批量上传"""
        resp = client.post(
            "/api/kb",
            json={"name": "Batch Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        # 批量上传 3 个文件
        files = [
            ("doc1.md", b"# Doc 1\nContent 1", "text/markdown"),
            ("doc2.md", b"# Doc 2\nContent 2", "text/markdown"),
            ("doc3.txt", b"Plain text content", "text/plain"),
        ]
        files_param = [("files", (name, content, mime)) for name, content, mime in files]

        resp = client.post(
            f"/api/kb/{kb_id}/documents/batch",
            files=files_param,
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert data["queued"] == 3
        assert data["failed"] == 0
        assert len(data["results"]) == 3

    def test_batch_upload_with_failure(self, client, auth_headers, mock_embedder):
        """测试批量上传含失败文件"""
        resp = client.post(
            "/api/kb",
            json={"name": "Batch Fail Test", "is_public": False},
            headers=auth_headers,
        )
        kb_id = resp.json()["id"]

        files = [
            ("good.md", b"# Good\nContent", "text/markdown"),
            ("bad.pdf", b"fake pdf", "application/pdf"),
        ]
        files_param = [("files", (name, content, mime)) for name, content, mime in files]

        resp = client.post(
            f"/api/kb/{kb_id}/documents/batch",
            files=files_param,
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["queued"] == 1  # 只有 md 成功
        assert data["failed"] == 1  # pdf 失败

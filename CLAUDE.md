# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A bilingual (EN/ZH) portfolio website — React 19, Vite 8, TypeScript 6, Tailwind CSS 3, Framer Motion. Live at liumingqing.com. Includes a ReAct Agent chat assistant (SSE streaming to DeepSeek), a RAG knowledge base with admin CMS, and a FastAPI backend (Hermes) with Feishu/WeChat notifications.

## Commands

All run from `portfolio-react/`:

```bash
npm run dev       # Vite dev server → 127.0.0.1:8080 (proxies /api → localhost:8000)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Preview production build

# Hermes backend (separate terminal, from portfolio-react/hermes/)
pip install -r requirements.txt
python main.py    # → localhost:8000, GET / → health check

# Tests (from portfolio-react/hermes/)
pytest                          # Run all tests
pytest tests/test_agent_act.py  # Single test file
pytest -k "test_rrf"            # Run tests matching keyword

# Docker Compose — local dev
docker compose -f docker-compose.yml up -d    # hermes-api :8000 + nginx :80

# Docker Compose — production (from repo root)
cp .env.example .env
docker compose up -d --build                  # hermes :8000 + Caddy :80
```

## Architecture

### Routing

Hash-based via `src/hooks/useHashRouter.ts`. Four pages, no React Router:

| Hash | Page |
|---|---|
| `#/` or empty | Portfolio (home) |
| `#/chat` | Standalone chat demo page (full-page ReAct Agent) |
| `#/knowledge` | Public notes reader — displays first published note, or specific article |
| `#/knowledge/<slug>` | Specific article reader (from backend published notes) |
| `#/admin` | Admin dashboard (owner-only) |

`App.tsx` checks `route.page` and renders `<ChatPage>`, `<KnowledgeBase>`, `<AdminPage>`, or the portfolio layout.

### Theming

CSS custom properties in `src/index.css` — `:root` (light) and `:root.dark` (dark). Tailwind references tokens via `var(--bg-base)` etc. Dark mode toggled by adding/removing `dark` class on `<html>`, persisted in `localStorage('theme')`.

### i18n

React Context in `src/i18n.tsx`. Single `translations` object keyed by `'en' | 'zh'`. `t()` falls back to English. Language persisted in `localStorage('lang')`.

### Auth System (JWT + RBAC)

**Backend** (`hermes/core/auth/`): PyJWT access/refresh tokens, bcrypt password hashing, 4 roles:
- `owner` — full admin (KB CRUD, invite codes, pipeline management)
- `interviewer` — elevated guest quota
- `user` — basic registered user
- `guest` — anonymous, per-IP daily quota (default 5, configurable via `GUEST_DAILY_LIMIT`)

Owner account auto-bootstrapped on first startup from `OWNER_EMAIL`/`OWNER_INITIAL_PASSWORD` env vars. Invite codes allow owner to upgrade users to `interviewer`.

**Frontend** (`src/auth/AuthContext.tsx`): React Context managing login state, token storage in localStorage, auto-refresh, and auth modal. `authHeaders()` returns `{Authorization: Bearer <token>}` for API calls.

### AI Chat Assistant (Hermes)

Two frontend surfaces:
- **`FloatingAssistant.tsx`** — Floating widget (bottom-right), SSE streaming to `/api/chat/agent` for ReAct mode. Opens via floating button or `'open-chat'` custom event from HeroSection CTA. Quick action buttons send pre-set queries. `ThinkPanel` (purple, collapsible) shows agent reasoning; `ToolPanel` (blue, collapsible) shows tool calls/results. Uses `visitor` assistant mode.
- **`ChatPage.tsx`** (`#/chat`) — Full-page standalone chat demo with sidebar conversation list, new/delete conversation, and full ReAct Agent streaming. Uses `demo` assistant mode (web search + tools enabled by default).

**Backend** (`hermes/`): FastAPI server with DeepSeek API integration. Three chat endpoints:
- `POST /api/chat` — non-streaming, with RAG context injection
- `POST /api/chat/stream` — SSE token-by-token streaming
- `POST /api/chat/agent` — **ReAct Agent SSE stream** (see below)

All endpoints accept `mode` parameter: `"visitor"` (FloatingAssistant, conservative) or `"demo"` (ChatPage, full-featured).

Stream protocol: `data: {"type":"conv_id"|"chunk"|"done", ...}` JSON lines.
Agent SSE event types: `think` | `tool_call` | `tool_result` | `chunk` | `done` | `error` | `iter`.

Key backend files:
- `main.py` — FastAPI entry point, all endpoints, lifespan (DB init + summary loop + LLM config validation)
- `config.py` — Env-driven config (API keys, CORS, JWT, RAG params, guest quota, SYSTEM_PROMPT)
- `llm.py` — DeepSeek API calls (streaming + non-streaming), multi-mode support
- `models.py` — SQLite schema (conversations, messages, users, KB tables, system_settings)
- `notify.py` — Feishu webhook + PushPlus (WeChat) real-time push + scheduled summaries

### Utility Endpoints

- `GET /` — Health check (`{"status": "ok"}`)
- `GET /api/health` — Health check (`{"status": "ok"}`)
- `GET /api/warmup` — Cold-start mitigation: touches DB, returns latency. Called by frontend on page load.
- `POST /api/notify/test` — Fire test notification to Feishu + PushPlus
- `GET /api/agent/tools` — List available agent tools with name/description/parameters schema

**CORS**: Defaults to allow-all (`CORS_ALLOW_ALL=true`). To restrict, set `CORS_ALLOW_ALL=false` and `CORS_ORIGINS=comma,separated,origins`.

**Contact info constraint**: The AI must only return `lmq0205a@163.com` and X `@liumingqingoh`. Enforced in `config.py` SYSTEM_PROMPT. If changing contact methods, update both the i18n `contact.*` keys AND the system prompt.

### Multi-Mode Assistant & Dynamic Settings

The backend supports **two assistant modes** with independent configurations:

| Mode | Used by | Web Search | Tools | Max Tokens |
|---|---|---|---|---|
| `visitor` | FloatingAssistant | off by default | off by default | 1024 |
| `demo` | ChatPage (`#/chat`) | on by default | on by default | 4096 |

**`hermes/core/settings_repo.py`** — Database-backed dynamic settings (`system_settings` table):
- Settings are stored as JSON in SQLite, modifiable at runtime without restart
- **Fallback chain**: mode-specific DB setting → global DB setting → env var → hardcoded default
- Mode-specific keys: `VISITOR_LLM_MODEL`, `DEMO_SYSTEM_PROMPT`, `DEMO_ENABLE_WEB_SEARCH`, etc.
- Global keys: `LLM_API_KEY`, `LLM_BASE_URL`, `RAG_TOP_K`, etc.
- Admin can change model, prompt, temperature, and feature flags per mode via API

`config.py` env vars are the **base defaults**; `settings_repo.py` DB values **override** them at runtime.

### ReAct Agent Engine

`hermes/core/agent/engine.py` — ReAct loop (max 20 iterations):

```
for iteration in range(MAX_ITERATIONS):
    1. Think: LLM + function calling → content + tool_calls
    2. If no tool_calls → break to Finalize
    3. Yield think event (reasoning before action)
    4. Act: parallel tool execution
    5. Yield tool_call + tool_result events (per tool)
    6. Observe: stop condition check (all_tools_failed → STUCK)
    7. Token compression check (history > 20 msgs → keep system + last 10)
Finalize: stream final answer as chunk events → done
```

SSE event types: `think` | `tool_call` | `tool_result` | `chunk` | `done` | `iter` (iteration metadata).

**2 built-in tools** (`hermes/core/agent/tools/`):
- `knowledge_search` — RAG retrieval over uploaded documents
- `todo_write` — multi-step plan tracking

Tools registered via `ToolRegistry`; `create_default_registry()` creates the default set.

### RAG Pipeline

`hermes/core/rag/` — async document ingestion pipeline:

```
upload → pending → parsing → chunking → embedding → ready
                                              ↘ error (any stage)
```

- **parser.py** — Lightweight parser for `.md`/`.txt`/`.html`/`.json` → plain text
- **chunker.py** — Sliding-window chunker (size/overlap configurable via `CHUNK_SIZE`/`CHUNK_OVERLAP`)
- **embedder.py** — Batch embedding API client (default: SiliconFlow `bge-large-zh-v1.5`, 1024-dim)
- **retriever.py** — Vector search (sqlite-vec) + keyword search
- **fusion.py** — RRF (Reciprocal Rank Fusion) to merge vector + keyword results
- **pipeline.py** — Async state machine orchestrating the full pipeline
- **chunk_repo.py** / **kb_repo.py** — SQLite CRUD for chunks and knowledge bases
- **rag_chat.py** — `should_use_rag()` + `retrieve_context()` for chat context injection

**sqlite-vec**: Vector search uses the `sqlite-vec` extension (bundled as a loadable extension). Embeddings stored in `vec_chunks` table with `VECTOR` column type.

**Pipeline degraded fallback**: If embedding API fails, chunks are still stored (without vectors) — keyword search continues to work. The document status shows `ready` with a warning logged, not `error`.

### Config System (YAML-driven)

`hermes/config_files/` — no prompts hardcoded in Python:

- `config.yaml` — Runtime parameters (chunk sizes, RAG weights, agent limits, guest quota)
- `agents.yaml` — 3 builtin agent presets (Quick Answer / Smart Reasoning / General Chat)
- `prompts/agent_system.yaml` — ReAct agent system prompt templates (pure + rag modes)
- Other prompt IDs referenced in config (fallback, rewrite, summary, etc.) resolve to built-in defaults if no YAML file is present for them

`hermes/core/config/` loaders: `config_loader.py`, `prompt_loader.py`, `agents_loader.py` provide typed access. Templates use `{{variable}}` syntax rendered at runtime.

**Env vars still take precedence** for secrets and deployment-specific values (API keys, CORS, JWT secret). The YAML config is for tunable parameters and prompts.

### Docker & Caddy (Production)

Two compose files and a Caddy reverse proxy:

- **`docker-compose.yml`** (repo root) — production stack: `hermes` (FastAPI, port 8000, Caddy reverse proxy, persistent volumes)
- **`portfolio-react/docker-compose.prod.yml`** — used by CI/CD deploy workflow (GitHub Actions deploys this one)
- **`portfolio-react/docker-compose.yml`** — local development compose (same as above, kept separate)
- `Caddyfile` — Caddy 2 config: `api.liumingqing.com` reverse_proxy → `hermes:8000` with security headers

**CI/CD**: `.github/workflows/deploy.yml` — builds and deploys on push to `main` with changes to `portfolio-react/hermes/**` or `docker-compose.prod.yml`.

### Docker & nginx (Development/Alternative)

`portfolio-react/docker-compose.yml` — two-service compose for local Docker-based development (frontend nginx + hermes-api). Uses the same nginx config described below.

### Notes Management System

Two-layer content system: **backend notes** (CRUD + publish) and **static manifest** (legacy, now empty).

**Backend** (`hermes/core/notes/`):
- `note_repo.py` — SQLite CRUD for notes (title, slug, content, description, category, tags, status, summary, ai_notes)
- `note_service.py` — Business logic: publish, AI annotation (calls LLM), KB sync
- `fetcher.py` — Fetch article content from external URL (unused by frontend since removed)

**Public API** (`hermes/api/notes.py`):
- `GET /api/notes` — List published notes (supports `q`, `tag`, `category` filters). Calls `note_repo.list_published_notes()` — only returns `status = 'published'`.
- `GET /api/notes/{slug}` — Get single published note, increments view count. Returns 404 for non-published slugs.

**Admin API** (in `hermes/api/admin.py`):
- Full CRUD: `GET/POST /api/admin/notes`, `PUT/DELETE /api/admin/notes/{id}`
- `POST /api/admin/notes/{id}/publish` — Set status to published
- `POST /api/admin/notes/{id}/ai-annotate` — AI generates summary, notes, tags
- `POST /api/admin/notes/{id}/sync-to-kb` — Push note content to RAG knowledge base
- `POST /api/admin/notes/fetch-url` — Fetch and parse article from external URL

### Public Notes Reader (`#/knowledge`)

`src/components/knowledge/KnowledgeBase.tsx` — reads from backend, no longer depends on manifest:
- Fetches `GET /api/notes?limit=1000` on mount → builds category tree from published notes
- Single article: `GET /api/notes/{slug}` → renders via `MarkdownRenderer`
- Also loads manifest articles as fallback (manifest is now empty; kept for backward compat)
- Left sidebar: `TopicTree` (category → article navigation, expand/collapse)
- Right sidebar: `TocTree` (in-page heading navigation, scroll-spy via `IntersectionObserver`)
- Bottom-right: `ProgressRing` (scroll progress indicator)
- Falls back to loading state while fetching; shows "not found" only if both backend + manifest miss
- The `useHashRouter` no longer forces a default article slug — `#/knowledge` without a slug lets `KnowledgeBase` pick the first published note

### Admin Panel (`#/admin`, owner-only)

`src/components/admin/AdminPage.tsx` — **five tabs** (left sidebar navigation):
1. **📊 Dashboard** (`DashboardTab.tsx`) — Visitor trends, user growth, AI Q&A analytics, invite code status
2. **👥 Users** (`UserManagementTab.tsx`) — User CRUD, role/status management, password reset
3. **📝 Notes** (`NotesManagementTab.tsx`) — Full Markdown editor with 3-panel layout:
   - Left: Note list (search, status/tag/category filters, pagination)
   - Center: Title + status + category/tags/description fields + Markdown editor + live preview toggle + **Import .md** button
   - Right: AI panel (summary, AI notes, suggested tags) + action buttons (AI Annotate, Publish, Sync to KB)
4. **📚 Knowledge Base** (`KBManagement.tsx`) — KB CRUD, document upload (drag & drop or URL, batch up to 20), pipeline status, retrieval test
5. **⚙️ AI Settings** — Per-mode model/prompt/temperature config (visitor/demo), stored in `system_settings` table, editable at runtime. Implemented inline within `AdminPage.tsx` (no separate file).

### Project Cards & Modal

`ProjectsSection.tsx` renders 6 cards in a 2-column grid. Each card has a `detailKey` (e.g. `'etl'`, `'llm'`) for i18n lookup. Clicking a card opens `ProjectModal.tsx` which displays:

- Background (`proj.<key>.background`)
- Key contributions (`proj.<key>.work` — split by `；` into bullet list)
- Quantified impact (`proj.<key>.results` — split by `；` into bullet list)
- Tags + external link + optional KB article links (`kbSlugs` array)

**Adding a project**:
1. Add `proj.<key>.title`, `.desc`, `.background`, `.work`, `.results` to both EN/ZH in `i18n.tsx`
2. Add entry to PROJECTS array in `ProjectsSection.tsx` with matching `detailKey`

### Hero Typewriter

`TypewriterText` component — types out `hero.title.1` once, cursor stops blinking. Resets and re-types when `text` prop changes (language switch). Below it, `hero.title.2.2` and `hero.title.2.3` display as static text.

### Scroll Spy

`SidebarNav` and `KnowledgeBase` both use `IntersectionObserver` with `rootMargin` offsets to track visible section/heading. Active item gets highlighted.

## Component Hierarchy

```
App
└── I18nProvider
    └── AuthProvider
        └── AppContent
            ├── [all pages]
            │   └── GlobalPageHeader (fixed top-right: theme, lang, page nav tabs, admin entry for owner)
            ├── [home]
            │   ├── SidebarNav (scroll-spy, left side, hidden when hero visible)
            │   ├── HeroSection (TypewriterText + stats + story + CTAs)
            │   ├── ExperienceSection (skill tags grid + timeline cards)
            │   ├── ProjectsSection (6 cards → ProjectModal on click)
            │   ├── EducationSection / CertificationsSection / SkillsSection
            │   ├── ContactSection (email + X buttons) / Footer
            │   └── FloatingAssistant (SSE chat widget, ThinkPanel + ToolPanel, visitor mode)
            ├── [chat] (#/chat)
            │   └── ChatPage (sidebar conversation list + full-page ReAct Agent, demo mode)
            ├── [knowledge]
            │   └── KnowledgeBase
            │       └── TopicTree (left) + MarkdownRenderer (center) + TocTree (right) + ProgressRing
            └── [admin] (owner-only, JWT-gated)
                └── AdminPage
                    ├── DashboardTab (visitor trends, user growth, AI analytics)
                    ├── UserManagementTab (user CRUD, role/status, password reset)
                    ├── NotesManagementTab (Markdown editor + AI annotations + KB sync + .md import)
                    ├── KBManagement (KB CRUD + document upload + pipeline + retrieval test)
                    └── AISettings (inline, per-mode model/prompt/temperature config)
            └── AuthModal (login/register dialog, triggered by AuthContext)
```

`GlobalPageHeader` is rendered on **every page** (home, chat, article list, article reader, admin, 404) at the same fixed position. It uses `PageHeaderTabs` for page navigation and conditionally shows an "Admin" link when the logged-in user has the `owner` role.

## Environment Variables

All in `.env` (copy from `.env.example`). Key variables:

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | LLM API key (required) |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | LLM endpoint (default: api.deepseek.com / deepseek-chat) |
| `EMBEDDING_API_KEY` / `EMBEDDING_BASE_URL` / `EMBEDDING_MODEL` | Embedding API (default: SiliconFlow bge-large-zh) |
| `JWT_SECRET_KEY` | JWT signing secret (generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`) |
| `OWNER_EMAIL` / `OWNER_INITIAL_PASSWORD` | Auto-bootstrapped owner account |
| `GUEST_DAILY_LIMIT` | Per-IP daily guest quota (default: 5) |
| `CORS_ALLOW_ALL` | `true` = allow-all; `false` = enforce `CORS_ORIGINS` allow-list |
| `FEISHU_WEBHOOK_URL` / `PUSHPLUS_TOKEN` | Notification channels (optional) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | RAG chunker params (default: 512/50) |
| `RAG_TOP_K` / `RAG_FINAL_K` / `RRF_K` | Retrieval params (default: 30/5/60) |
| `DATABASE_PATH` | SQLite path (Docker overrides to `/app/data/hermes.db`) |

## CI/CD

`.github/workflows/deploy.yml` — SSH deploy to VPS on push to `main` when backend files change (triggers on `portfolio-react/hermes/**` and `portfolio-react/docker-compose.prod.yml`). Frontend deploys separately via Cloudflare Pages (auto-build on push).

`.github/workflows/keep-alive.yml` — Cron ping every 10 minutes to prevent free-tier cold starts.

- **Publishing notes**: Use the Admin Notes tab (`#/admin` → Notes). Write in Markdown, set status to "Published", and it appears on `#/knowledge`. Supports AI annotation and RAG KB sync.
- **Importing .md files**: In Notes editor, click "导入 .md" button in the title toolbar → file picker accepts `.md`/`.markdown`. Auto-extracts first `# heading` as title and first paragraph as description.
- **Adding translations**: keys to both `translations.en` and `translations.zh` in `i18n.tsx`
- **Adding projects**: i18n keys for title/desc/background/work/results → PROJECTS array in `ProjectsSection.tsx`
- **Adding agent tools**: create tool class in `hermes/core/agent/tools/`, register in `registry.py` `create_default_registry()`
- **Editing prompts**: edit YAML files in `hermes/config_files/prompts/` — no Python code changes needed
- **Tuning RAG/agent params**: edit `hermes/config_files/config.yaml` or override via env vars
- **Theme tokens**: `:root` / `:root.dark` in `src/index.css`
- **Changing AI personality/contact**: `SYSTEM_PROMPT` in `hermes/config.py` or `agent_system.yaml`
- **Changing model/prompt at runtime**: Admin API writes to `system_settings` table via `settings_repo.py`; no restart needed. Mode-specific keys (`VISITOR_*` / `DEMO_*`) override global defaults
- **Dev server**: Vite runs on `127.0.0.1:8080` (configured in `vite.config.ts`), not the default 5173. Vite proxies `/api/*` → `localhost:8000`.
- **Tests use MockEmbedder**: `conftest.py` provides `MockEmbedder` to avoid hitting real embedding APIs. Each test run uses a temporary SQLite database with an `autouse` fixture that wipes tables between tests.

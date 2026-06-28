# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A bilingual (EN/ZH) portfolio website — React 19, Vite 8, TypeScript 6, Tailwind CSS 3, Framer Motion. Live at liumingqing.com. Includes a floating AI chat assistant (SSE streaming to DeepSeek), a knowledge base CMS with markdown articles, and a FastAPI backend (Hermes) with Feishu/WeChat notifications.

## Commands

All run from `portfolio-react/`:

```bash
npm run dev       # Vite dev server → localhost:5173 (proxies /api → localhost:8000)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Preview production build

# Hermes backend (separate terminal, from portfolio-react/hermes/)
pip install -r requirements.txt
python main.py    # → localhost:8000, GET / → health check

# Docker Compose (production)
docker compose up -d --build   # frontend :80 + hermes-api :8000
```

## Architecture

### Routing

Hash-based via `src/hooks/useHashRouter.ts`. Two pages, no React Router:

| Hash | Page |
|---|---|
| `#/` or empty | Portfolio (home) |
| `#/knowledge` | Article list |
| `#/knowledge/<slug>` | Article reader |

`App.tsx` checks `route.page` and renders `<KnowledgeBase>` or the portfolio layout.

### Theming

CSS custom properties in `src/index.css` — `:root` (light) and `:root.dark` (dark). Tailwind references tokens via `var(--bg-base)` etc. Dark mode toggled by adding/removing `dark` class on `<html>`, persisted in `localStorage('theme')`.

### i18n

React Context in `src/i18n.tsx`. Single `translations` object keyed by `'en' | 'zh'`. `t()` falls back to English. Language persisted in `localStorage('lang')`.

### AI Chat Assistant (Hermes)

**Frontend**: `FloatingAssistant.tsx` — SSE streaming to `${VITE_API_BASE}/api/chat/stream`. Opens via floating button or `'open-chat'` custom event from HeroSection CTA. Quick action buttons send pre-set queries.

**Backend** (`hermes/`): FastAPI server with DeepSeek API integration. Key files:
- `main.py` — SSE streaming, conversation CRUD, scheduled summary loop, `GET /` health check
- `config.py` — `SYSTEM_PROMPT` (AI persona + contact info), `CORS_ALLOW_ALL` (default true), env vars
- `llm.py` — DeepSeek API calls (streaming + non-streaming)
- `models.py` — SQLite schema (conversations, messages)
- `notify.py` — Feishu webhook + PushPlus (WeChat) real-time push + scheduled summaries

Stream protocol: `data: {"type":"conv_id"|"chunk"|"done", ...}` JSON lines.

**CORS**: Defaults to allow-all (`CORS_ALLOW_ALL=true`). To restrict, set `CORS_ALLOW_ALL=false` and `CORS_ORIGINS=comma,separated,origins`.

**Contact info constraint**: The AI must only return `lmq0205a@163.com` and X `@liumingqingoh`. Enforced in `config.py` SYSTEM_PROMPT. If changing contact methods, update both the i18n `contact.*` keys AND the system prompt.

### Knowledge Base

Articles as `.md` files in `src/content/articles/{en,zh}/`, metadata in `src/content/manifest.json`.

- **Loading**: `import.meta.glob('../../content/articles/**/*.md', { eager: true })` — eager-imported at build time. **After adding new `.md` files, restart the dev server** for glob to pick them up.
- **Language-aware**: `getArticleContent(slug, lang)` prefers `{lang}/{slug}.md`, falls back to any match. Each language needs its own `.md` file under `en/` or `zh/`.
- **Markdown**: `react-markdown` + `remark-gfm` + `rehype-highlight` + `rehype-slug`. `MarkdownRenderer` preprocesses VitePress `::: tip` blocks → blockquotes, strips `<ComponentDemo />` tags.
- **Heading tree**: Extracted from DOM after render (`articleRef.querySelectorAll('h2, h3')`), fed into `TreeNav` for sticky sidebar navigation.
- **Copyright footer**: Only shown when `meta.source` is non-empty (original content hides it).
- **Article list**: Featured card (latest) + remaining grouped by category.

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
    └── AppContent
        ├── [home]
        │   ├── HeaderActions (fixed top-right: theme, lang, KB link)
        │   ├── SidebarNav (scroll-spy, left side, hidden when hero visible)
        │   ├── HeroSection (TypewriterText + stats + story + CTAs)
        │   ├── ExperienceSection (skill tags grid + timeline cards)
        │   ├── ProjectsSection (6 cards → ProjectModal on click)
        │   ├── EducationSection / CertificationsSection / SkillsSection
        │   ├── ContactSection (email + X buttons) / Footer
        │   └── FloatingAssistant (SSE chat widget)
        └── [knowledge]
            └── KnowledgeBase
                ├── ArticleList (when no slug: featured card + category groups)
                └── Article reader (when slug: TreeNav + MarkdownRenderer + ProgressRing)
```

`HeaderActions` is rendered on **every page** (home, article list, article reader, 404) at the same fixed position.

## Key Patterns

- **Adding articles**: `.md` → `content/articles/{en,zh}/`, entry → `manifest.json`, restart dev server
- **Adding translations**: keys to both `translations.en` and `translations.zh` in `i18n.tsx`
- **Adding projects**: i18n keys for title/desc/background/work/results → PROJECTS array in `ProjectsSection.tsx`
- **Theme tokens**: `:root` / `:root.dark` in `src/index.css`
- **Changing AI personality/contact**: `SYSTEM_PROMPT` in `hermes/config.py`
- **Import glob caveat**: new `.md` files require dev server restart to be discovered

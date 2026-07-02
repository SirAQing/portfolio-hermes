import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, FileText, Hash, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ProgressRing } from './ProgressRing';
import { useI18n } from '../../i18n';
import { PageHeaderTabs } from '../PageHeaderTabs';
import manifest from '../../content/manifest.json';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// 固定加载中文版文章（站点当前为中文模式）
const mdModules = import.meta.glob('../../content/articles/zh/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function getLegacyArticleContent(slug: string): string | null {
  for (const [path, content] of Object.entries(mdModules)) {
    if (path.endsWith(`/${slug}.md`)) return content;
  }
  return null;
}

interface KnowledgeBaseProps {
  articleSlug?: string;
  onNavigate: (hash: string) => void;
}

interface TopicNode {
  id: string;
  title: string;
  type: 'category' | 'article';
  slug?: string;
  children?: TopicNode[];
}

interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

interface ContentItem {
  slug: string;
  title: string;
  category: string;
  description?: string;
  tags: string[];
  date?: string;
  source?: string;
  sourceRepo?: string;
  // backend only
  view_count?: number;
  // 'backend' | 'manifest'
  origin: 'backend' | 'manifest';
}

interface ManifestArticle {
  slug: string;
  title: string;
  category: string;
  description?: string;
  tags: string[];
  date?: string;
  source?: string;
  sourceRepo?: string;
}

const manifestArticles = ((manifest as { articles?: ManifestArticle[] }).articles ?? []);

function buildTopicTree(articles: ContentItem[]): TopicNode[] {
  const byCategory: Record<string, TopicNode[]> = {};
  for (const article of articles) {
    const category = article.category || '未分类';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push({
      id: `article-${article.slug}`,
      title: article.title,
      type: 'article',
      slug: article.slug,
    });
  }
  return Object.entries(byCategory).map(([category, children]) => ({
    id: `category-${category}`,
    title: category,
    type: 'category',
    children,
  }));
}

const TocTree = ({
  items,
  activeId,
  onNavigate,
}: {
  items: TocItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}) => {
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <div key={item.id}>
            <button
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
                isActive
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
              }`}
              style={{ paddingLeft: `${(item.level - 2) * 12 + 12}px` }}
            >
              <span className="line-clamp-2">{item.title}</span>
            </button>
            {item.children && item.children.length > 0 && (
              <div className="mt-0.5">
                <TocTree items={item.children} activeId={activeId} onNavigate={onNavigate} />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const TopicTree = ({
  tree,
  currentSlug,
  expanded,
  onToggle,
  onNavigate,
}: {
  tree: TopicNode[];
  currentSlug: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (hash: string) => void;
}) => {
  return (
    <nav className="space-y-1">
      {tree.map((node) => {
        const isExpanded = expanded.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        return (
          <div key={node.id}>
            <button
              onClick={() => hasChildren && onToggle(node.id)}
              className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors text-left"
            >
              {hasChildren ? (
                <ChevronRight
                  size={14}
                  className={`shrink-0 text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                />
              ) : (
                <span className="w-[14px] shrink-0" />
              )}
              <span className="truncate">{node.title}</span>
            </button>
            {hasChildren && isExpanded && (
              <div className="pl-3 mt-0.5 space-y-0.5">
                {node.children!.map((child) => {
                  const isActive = currentSlug === child.slug;
                  return (
                    <button
                      key={child.id}
                      onClick={() => child.slug && onNavigate(`#/knowledge/${child.slug}`)}
                      className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg text-[12px] text-left transition-colors ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                      }`}
                    >
                      <FileText
                        size={13}
                        className={`shrink-0 mt-0.5 ${isActive ? 'text-blue-500' : 'text-text-muted'}`}
                      />
                      <span className="leading-relaxed line-clamp-2">{child.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export const KnowledgeBase = ({ articleSlug, onNavigate }: KnowledgeBaseProps) => {
  const { t } = useI18n();
  const articleRef = useRef<HTMLDivElement>(null);

  const [backendNotes, setBackendNotes] = useState<ContentItem[]>([]);
  const [backendLoading, setBackendLoading] = useState(true);
  const [publicNote, setPublicNote] = useState<any | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);

  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [headingIds, setHeadingIds] = useState<string[]>([]);

  // 合并后端笔记与本地 manifest：后端优先，manifest 作为兜底/历史内容
  const articles = useMemo<ContentItem[]>(() => {
    const backendMap = new Map(backendNotes.map((n) => [n.slug, n]));
    const merged: ContentItem[] = [...backendNotes];
    for (const a of manifestArticles) {
      if (!backendMap.has(a.slug)) {
        merged.push({
          slug: a.slug,
          title: a.title,
          category: a.category,
          description: a.description,
          tags: a.tags,
          date: a.date,
          source: a.source,
          sourceRepo: a.sourceRepo,
          origin: 'manifest',
        });
      }
    }
    return merged;
  }, [backendNotes]);

  const topicTree = useMemo(() => buildTopicTree(articles), [articles]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    topicTree.forEach((n) => initial.add(n.id));
    return initial;
  });

  // 获取公开笔记列表
  useEffect(() => {
    let cancelled = false;
    setBackendLoading(true);
    fetch(`${API_BASE}/api/notes?limit=1000`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        const items: ContentItem[] = (data.items || []).map((n: any) => ({
          slug: n.slug,
          title: n.title,
          category: n.category || '未分类',
          description: n.description,
          tags: Array.isArray(n.tags) ? n.tags : [],
          date: n.published_at?.slice(0, 10) || n.updated_at?.slice(0, 10),
          view_count: n.view_count || 0,
          origin: 'backend',
        }));
        setBackendNotes(items);
      })
      .catch(() => setBackendNotes([]))
      .finally(() => setBackendLoading(false));
    return () => { cancelled = true; };
  }, []);

  // 当前 slug 解析：优先显式传入，否则取合并后第一篇
  const currentSlug = articleSlug || articles[0]?.slug || '';
  const meta = articles.find((a) => a.slug === currentSlug);

  // displayMeta：优先用列表中的 meta，列表缺失时回退到 publicNote（单篇 fetch 结果）
  const displayMeta: ContentItem | undefined = meta || (publicNote ? {
    slug: currentSlug,
    title: publicNote.title || currentSlug,
    category: publicNote.category || '未分类',
    description: publicNote.description || '',
    tags: Array.isArray(publicNote.tags) ? publicNote.tags : [],
    date: publicNote.published_at?.slice(0, 10) || publicNote.updated_at?.slice(0, 10),
    view_count: publicNote.view_count || 0,
    origin: 'backend',
  } : undefined);

  // 自动展开当前文章分类
  useEffect(() => {
    if (displayMeta?.category) {
      setExpandedCategories((prev) => new Set([...prev, `category-${displayMeta.category}`]));
    }
  }, [displayMeta?.category]);

  // 加载单篇内容
  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    setNoteLoading(true);
    setPublicNote(null);

    fetch(`${API_BASE}/api/notes/${encodeURIComponent(currentSlug)}`)
      .then(async (r) => {
        if (cancelled) return null;
        if (r.ok) {
          const note = await r.json();
          return {
            ...note,
            origin: 'backend',
          };
        }
        // 后端没有则尝试本地 manifest
        const legacy = manifestArticles.find((a) => a.slug === currentSlug);
        const content = legacy ? getLegacyArticleContent(currentSlug) : null;
        if (legacy && content) {
          return {
            title: legacy.title,
            content,
            category: legacy.category,
            description: legacy.description,
            tags: legacy.tags,
            published_at: legacy.date,
            source: legacy.source,
            sourceRepo: legacy.sourceRepo,
            origin: 'manifest',
          };
        }
        return null;
      })
      .then((note) => {
        if (!cancelled) setPublicNote(note);
      })
      .finally(() => {
        if (!cancelled) setNoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentSlug]);

  // 从渲染后的 markdown 提取目录
  useEffect(() => {
    const el = articleRef.current;
    if (!el || !publicNote?.content) return;

    const headings = el.querySelectorAll('h2, h3');
    const newToc: TocItem[] = [];
    const ids: string[] = [];
    let currentH2: TocItem | null = null;

    headings.forEach((h) => {
      const id = h.id;
      const title = h.textContent || '';
      if (!id) return;
      ids.push(id);

      if (h.tagName === 'H2') {
        currentH2 = { id, title, level: 2, children: [] };
        newToc.push(currentH2);
      } else if (h.tagName === 'H3' && currentH2) {
        currentH2.children!.push({ id, title, level: 3 });
      }
    });

    setTocItems(newToc);
    setHeadingIds(ids);
    setActiveHeadingId('');
  }, [publicNote?.content]);

  // Scroll spy for active heading
  useEffect(() => {
    if (headingIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveHeadingId(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headingIds]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleHeadingNavigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (backendLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={24} className="animate-spin text-text-muted mr-2" />
          <span className="text-text-muted text-sm">{t('dashboard.loading')}</span>
        </div>
      </div>
    );
  }

  if (!displayMeta) {
    // 列表和单篇都未找到时，若仍在加载则显示 loading
    if (backendLoading || noteLoading) {
      return (
        <div className="min-h-screen bg-bg-base">
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 size={24} className="animate-spin text-text-muted mr-2" />
            <span className="text-text-muted text-sm">{t('dashboard.loading')}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-text-muted">{t('kb.articleNotFound')}</p>
            <button
              onClick={() => onNavigate('#/')}
              className="mt-4 text-blue-500 hover:underline text-sm"
            >
              {t('kb.home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased selection:bg-blue-500/20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-bg-base/85 backdrop-blur-xl border-b border-border-subtle">
        <div className="h-14 flex items-center justify-between px-5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onNavigate('#/')}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{t('kb.home')}</span>
            </button>
            <span className="text-border-subtle">/</span>
            <div className="flex items-center gap-1.5 text-sm text-text-secondary min-w-0">
              <BookOpen size={13} className="text-blue-500 shrink-0" />
              <span className="font-medium truncate">{t('kb.title')}</span>
            </div>
            <span className="text-border-subtle hidden sm:inline">/</span>
            <span className="text-sm text-text-primary font-medium truncate max-w-[200px] sm:max-w-[360px] hidden sm:inline">
              {displayMeta.title}
            </span>
          </div>
          {/* 右侧：标签导航（嵌入框线内） */}
          <PageHeaderTabs current="knowledge" onNavigate={(h) => onNavigate(`#${h}`)} variant="inline" />
        </div>
      </header>

      {/* Main layout: topic tree + content + toc */}
      <div className="flex max-w-[1600px] mx-auto">
        {/* Left sidebar: topic tree */}
        <aside className="hidden lg:block w-[260px] xl:w-[280px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] border-r border-border-subtle overflow-y-auto">
          <div className="px-4 py-6">
            <div className="px-3 mb-4">
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em]">
                {t('kb.toc')}
              </h3>
            </div>
            <TopicTree
              tree={topicTree}
              currentSlug={currentSlug}
              expanded={expandedCategories}
              onToggle={toggleCategory}
              onNavigate={onNavigate}
            />
          </div>
        </aside>

        {/* Center: article content */}
        <main ref={articleRef} className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 xl:px-16 py-10 lg:py-14">
          <article className="max-w-[780px] mx-auto lg:mx-0">
            {/* Article header */}
            <header className="mb-12 pb-8 border-b border-border-subtle">
              <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-text-muted font-mono">
                <span className="px-2 py-1 rounded border border-border-subtle bg-bg-section-alt text-text-secondary">
                  {displayMeta.category}
                </span>
                {displayMeta.date && <span>{displayMeta.date}</span>}
                {typeof displayMeta.view_count === 'number' && displayMeta.view_count > 0 && (
                  <span>{displayMeta.view_count} 次阅读</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight mb-5">
                {displayMeta.title}
              </h1>
              {displayMeta.description && (
                <p className="text-base text-text-secondary leading-relaxed mb-5">
                  {displayMeta.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {displayMeta.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium text-text-secondary bg-bg-section-alt border border-border-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            {/* Markdown body */}
            <div className="prose-custom">
              {noteLoading ? (
                <div className="flex items-center justify-center py-16 text-text-muted">
                  <Loader2 size={22} className="animate-spin mr-2" />
                  <span className="text-sm">{t('dashboard.loading')}</span>
                </div>
              ) : (
                publicNote?.content && <MarkdownRenderer content={publicNote.content} />
              )}
            </div>

            {/* Source / copyright */}
            {publicNote?.source && (
              <div className="mt-16 pt-6 border-t border-border-subtle">
                <p className="text-sm text-text-secondary leading-relaxed">
                  <span className="font-medium text-text-primary">{t('kb.copyright.prefix')}</span>
                  {t('kb.copyright.from')}{' '}
                  <a
                    href={publicNote.source}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 underline-offset-4 transition-colors"
                  >
                    {publicNote.source}
                  </a>
                </p>
                {publicNote.sourceRepo && (
                  <p className="text-sm text-text-secondary mt-2">
                    {t('kb.copyright.belong')}{' '}
                    <a
                      href={publicNote.sourceRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 underline-offset-4 transition-colors"
                    >
                      {publicNote.sourceRepo}
                    </a>{' '}
                    {t('kb.copyright.license')}
                  </p>
                )}
              </div>
            )}
          </article>
        </main>

        {/* Right sidebar: chapter TOC */}
        <aside className="hidden xl:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] border-l border-border-subtle overflow-y-auto">
          <div className="px-4 py-6">
            <div className="px-3 mb-4 flex items-center gap-1.5">
              <Hash size={12} className="text-text-muted" />
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em]">
                章节目录
              </h3>
            </div>
            {tocItems.length > 0 ? (
              <TocTree
                items={tocItems}
                activeId={activeHeadingId}
                onNavigate={handleHeadingNavigate}
              />
            ) : (
              <p className="px-3 text-[12px] text-text-muted">暂无章节</p>
            )}
          </div>
        </aside>
      </div>

      <ProgressRing />
    </div>
  );
};

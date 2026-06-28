import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TreeNav, type TreeItem } from './TreeNav';
import { ProgressRing } from './ProgressRing';
import { HeaderActions } from '../HeaderActions';
import { useI18n } from '../../i18n';
import manifest from '../../content/manifest.json';

// Vite: eagerly import all markdown files as raw strings (including en/ and zh/ subdirs)
const mdModules = import.meta.glob('../../content/articles/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function getArticleContent(slug: string, lang: 'en' | 'zh'): string | null {
  // Prefer language-specific version, fall back to any match
  for (const [path, content] of Object.entries(mdModules)) {
    if (path.includes(`/${lang}/${slug}.md`)) return content;
  }
  for (const [path, content] of Object.entries(mdModules)) {
    if (path.includes(`/${slug}.md`)) return content;
  }
  return null;
}

interface KnowledgeBaseProps {
  articleSlug?: string;
  onNavigate: (hash: string) => void;
}

/** Return localized fields for an article based on current language */
function getLocalizedMeta(article: typeof manifest.articles[number], lang: 'en' | 'zh') {
  if (lang === 'en') {
    return {
      title: (article as any).titleEn || article.title,
      description: (article as any).descriptionEn || article.description,
      category: (article as any).categoryEn || article.category,
      tags: (article as any).tagsEn || article.tags,
      slug: article.slug,
      date: article.date,
      source: article.source,
      sourceRepo: article.sourceRepo,
    };
  }
  return {
    title: article.title,
    description: article.description,
    category: article.category,
    tags: article.tags,
    slug: article.slug,
    date: article.date,
    source: article.source,
    sourceRepo: article.sourceRepo,
  };
}

export const KnowledgeBase = ({ articleSlug, onNavigate }: KnowledgeBaseProps) => {
  const [activeId, setActiveId] = useState('');
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [allIds, setAllIds] = useState<string[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useI18n();

  const content = articleSlug ? getArticleContent(articleSlug, lang) : null;
  const rawMeta = articleSlug ? manifest.articles.find(a => a.slug === articleSlug) : undefined;
  const meta = rawMeta ? getLocalizedMeta(rawMeta, lang) : undefined;

  // Extract headings from DOM after markdown renders (IDs come from rehype-slug)
  useEffect(() => {
    const el = articleRef.current;
    if (!el || !content) return;

    const headings = el.querySelectorAll('h2, h3');
    const newTree: TreeItem[] = [];
    const ids: string[] = [];
    let currentH2: TreeItem | null = null;

    headings.forEach(h => {
      const id = h.id;
      const title = h.textContent || '';
      if (!id) return;

      ids.push(id);

      if (h.tagName === 'H2') {
        currentH2 = { id, title, level: 2, children: [] };
        newTree.push(currentH2);
      } else if (h.tagName === 'H3' && currentH2) {
        currentH2.children!.push({ id, title, level: 3 });
      }
    });

    setTree(newTree);
    setAllIds(ids);
  }, [content]);

  // Scroll spy for active heading
  useEffect(() => {
    if (allIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.scrollTo(0, 0);

    return () => observer.disconnect();
  }, [allIds]);

  const handleNavigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // If no article slug, show article list
  if (!articleSlug) {
    return <ArticleList onNavigate={onNavigate} />;
  }

  if (!content || !meta) {
    return (
      <div className="min-h-screen bg-bg-base">
        <HeaderActions />
        <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-muted">{t('kb.articleNotFound')}</p>
          <button
            onClick={() => onNavigate('#/knowledge')}
            className="mt-4 text-blue-500 hover:underline text-sm"
          >
            {t('kb.backToList')}
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
      {/* Top bar — full-width, minimal */}
      <header className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle">
        <div className="h-12 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('#/')}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={15} />
              <span>{t('kb.home')}</span>
            </button>
            <span className="text-border-subtle">/</span>
            <button
              onClick={() => onNavigate('#/knowledge')}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
            >
              <BookOpen size={13} className="text-blue-500" />
              <span className="font-medium">{t('kb.title')}</span>
            </button>
            <span className="text-border-subtle">/</span>
            <span className="text-sm text-accent font-medium truncate max-w-[200px] sm:max-w-none">{meta.title}</span>
          </div>
          <HeaderActions />
        </div>
      </header>

      {/* 2-column layout: left nav + content */}
      <div className="flex">
        {/* Left: Tree nav — sticky sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[48px] h-[calc(100vh-48px)] border-r border-border-subtle overflow-y-auto custom-scrollbar">
          <div className="px-3 py-6">
            <div className="px-3 mb-5">
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em]">
                {t('kb.toc')}
              </h3>
            </div>
            <TreeNav tree={tree} activeId={activeId} onNavigate={handleNavigate} />
          </div>
        </aside>

        {/* Right: Article content — fills remaining space */}
        <main ref={articleRef} className="flex-1 min-w-0 px-8 sm:px-12 lg:px-16 xl:px-24 py-12 lg:py-16 max-w-[960px]">
          {/* Article header */}
          <div className="mb-14">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-accent mb-5 tracking-tight leading-tight">{meta.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
              <span className="font-medium text-text-secondary">{meta.category}</span>
              <span className="hidden sm:inline text-border-subtle">·</span>
              <span>{meta.date}</span>
              <span className="hidden sm:inline text-border-subtle">·</span>
              <div className="flex flex-wrap gap-2">
                {meta.tags.map((tag: string) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-md bg-bg-section-alt text-text-secondary text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <MarkdownRenderer content={content} />

          {/* Article footer — copyright notice (only for adapted articles) */}
          {meta.source && (
            <div className="mt-20 pt-8 border-t border-border-subtle">
              <div className="rounded-xl p-6 text-sm text-text-secondary leading-relaxed border border-border-subtle">
                <p className="mb-2">
                  <span className="font-medium text-accent">{t('kb.copyright.prefix')}</span>{t('kb.copyright.from')}{' '}
                  <a href={meta.source} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 underline-offset-4 font-medium transition-colors">
                    {meta.source}
                  </a>
                </p>
                {meta.sourceRepo && (
                  <p>
                    {t('kb.copyright.belong')}{' '}
                    <a href={meta.sourceRepo} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 underline-offset-4 font-medium transition-colors">
                      {meta.sourceRepo}
                    </a>
                    {' '}{t('kb.copyright.license')}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ProgressRing />
    </div>
  );
};

// Article list page — Plan A: featured focus + compact list
const ArticleList = ({ onNavigate }: { onNavigate: (hash: string) => void }) => {
  const { t, lang } = useI18n();
  const articles = manifest.articles;

  // Localize article metadata
  const localizedArticles = articles.map(a => getLocalizedMeta(a, lang));

  const categorySet = new Set(localizedArticles.map(a => a.category));
  const tagSet = new Set(localizedArticles.flatMap(a => a.tags));

  // Latest article as featured, rest as list
  const sorted = [...localizedArticles].sort((a, b) => b.date.localeCompare(a.date));
  const featured = sorted[0];
  const rest = sorted.slice(1);

  // Group rest by category
  const restByCategory = rest.reduce<Record<string, typeof rest>>((acc, a) => {
    (acc[a.category] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
      <header className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle">
        <div className="h-12 flex items-center justify-between px-6">
          <div className="flex items-center">
          <button
            onClick={() => onNavigate('#/')}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={15} />
            <span>{t('kb.home')}</span>
          </button>
          <span className="text-border-subtle mx-3">/</span>
          <span className="text-sm text-accent font-medium">{t('kb.title')}</span>
          </div>
          <HeaderActions />
        </div>
      </header>

      {/* Hero with stats */}
      <div className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-purple-500/[0.04] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-accent mb-4 tracking-tight">{t('kb.title')}</h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mb-8">
            {t('kb.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle text-sm font-medium text-text-secondary">
              <span className="text-accent font-bold">{articles.length}</span> {t('kb.articles')}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle text-sm font-medium text-text-secondary">
              <span className="text-accent font-bold">{categorySet.size}</span> {t('kb.categories')}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle text-sm font-medium text-text-secondary">
              <span className="text-accent font-bold">{tagSet.size}</span> {t('kb.tags')}
            </span>
          </div>
        </div>
      </div>

      {/* Featured article */}
      {featured && (
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              {t('kb.latest')}
            </span>
          </div>
          <button
            onClick={() => onNavigate(`#/knowledge/${featured.slug}`)}
            className="w-full text-left rounded-2xl p-8 sm:p-10 border border-border-subtle hover:border-blue-500/30 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 rounded-md bg-bg-section-alt text-text-muted text-xs font-medium">
                {featured.category}
              </span>
              <span className="text-xs text-text-muted">{featured.date}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-accent group-hover:text-blue-500 transition-colors mb-4 leading-tight tracking-tight">
              {featured.title}
            </h2>
            <p className="text-[15px] sm:text-base text-text-secondary leading-relaxed mb-6 max-w-2xl">
              {featured.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {featured.tags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-bg-section-alt text-text-secondary text-xs font-medium">
                  #{tag}
                </span>
              ))}
              <span className="ml-auto text-sm text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {t('kb.startReading')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Remaining articles grouped by category */}
      {rest.length > 0 && (
        <div className="border-t border-border-subtle">
          {Object.entries(restByCategory).map(([category, catArticles], idx) => (
            <div key={category} className={idx % 2 === 1 ? 'bg-bg-section-alt' : ''}>
              <div className="max-w-4xl mx-auto px-6 lg:px-12 py-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-text-muted">{category}</h2>
                  <span className="text-xs text-text-muted px-2 py-0.5 rounded-full border border-border-subtle">
                    {catArticles.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {catArticles.map(article => (
                    <button
                      key={article.slug}
                      onClick={() => onNavigate(`#/knowledge/${article.slug}`)}
                      className="w-full text-left rounded-xl px-5 py-4 -mx-2 transition-all duration-200 group hover:bg-bg-card-hover flex items-center justify-between gap-6"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-accent group-hover:text-blue-500 transition-colors mb-1">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted">{article.date}</span>
                          {article.tags.map((tag: string) => (
                            <span key={tag} className="text-xs text-text-muted">#{tag}</span>
                          ))}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

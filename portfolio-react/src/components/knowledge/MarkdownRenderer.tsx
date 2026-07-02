import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import type { Components } from 'react-markdown';

/**
 * Preprocess VitePress-specific syntax:
 * 1. ::: tip blocks → blockquotes with a marker
 * 2. <ComponentDemo /> → skip (text descriptions already cover the content)
 */
function preprocessVitePress(raw: string): string {
  let result = raw;

  // Convert ::: tip blocks to blockquotes
  // ::: tip Title\n...\n:::  →  > **[Title]**\n> ...\n
  result = result.replace(/::: tip\s*(.*?)\n([\s\S]*?):::/g, (_match, title, body) => {
    const prefix = title ? `> **${title}**\n` : '';
    const quoted = body.trim().split('\n').map((line: string) => `> ${line}`).join('\n');
    return prefix + quoted;
  });

  // Remove VitePress custom demo components (they are Vue-specific)
  result = result.replace(/<[A-Z][a-zA-Z]+\s*\/>/g, '');

  return result;
}

// Custom component overrides for react-markdown
const components: Components = {
  // Style tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-8 rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-bg-section-alt border-b border-border text-text-secondary">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-5 py-3.5 font-semibold text-accent whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-5 py-3.5 border-t border-border-subtle text-text-secondary">{children}</td>
  ),

  // Style blockquotes (used for ::: tip callouts) — transparent, no background
  blockquote: ({ children }) => (
    <blockquote className="my-8 px-5 py-4 rounded-r-lg border-l-4 border-blue-400 dark:border-blue-500 text-text-secondary">
      {children}
    </blockquote>
  ),

  // Style headings with anchor ids
  h2: ({ id, children }) => (
    <h2 id={id} className="text-2xl sm:text-3xl font-bold text-accent mt-16 mb-8 pb-3 border-b border-border-subtle scroll-mt-28">
      {children}
    </h2>
  ),
  h3: ({ id, children }) => (
    <h3 id={id} className="text-xl sm:text-2xl font-semibold text-accent mt-12 mb-6 scroll-mt-28">
      {children}
    </h3>
  ),
  h4: ({ id, children }) => (
    <h4 id={id} className="text-lg sm:text-xl font-medium text-accent mt-8 mb-4 scroll-mt-28">
      {children}
    </h4>
  ),

  // Style code blocks
  code: ({ className, children, node, ...props }) => {
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="my-8 p-5 rounded-xl bg-[#0d1117] dark:bg-black border border-border overflow-x-auto text-[13px] sm:text-sm leading-relaxed shadow-sm">
      <div className="text-gray-300">{children}</div>
    </pre>
  ),

  // Style lists
  ul: ({ children }) => <ul className="my-6 space-y-2 list-disc pl-8 text-text-secondary marker:text-text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-6 space-y-2 list-decimal pl-8 text-text-secondary marker:text-text-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,

  // Style links
  a: ({ href, children }) => (
    <a href={href} className="text-blue-500 hover:text-blue-600 font-medium underline decoration-blue-500/30 underline-offset-4 hover:decoration-blue-600 transition-all" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),

  // Horizontal rule
  hr: () => <hr className="my-14 border-border-subtle" />,

  // Paragraph
  p: ({ children }) => <p className="my-5 leading-relaxed text-[15px] sm:text-base text-text-secondary">{children}</p>,

  // Strong/bold
  strong: ({ children }) => <strong className="font-semibold text-accent">{children}</strong>,
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const processed = preprocessVitePress(content);

  return (
    <article className="prose-custom max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </article>
  );
};

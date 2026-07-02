import { useEffect } from 'react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  activeId: string;
}

export const TableOfContents = ({ items, activeId }: TableOfContentsProps) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      () => {
        // No-op or we can remove the state update logic
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="py-2 sticky top-24">
      <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 px-2">
        本页目录
      </h4>
      <ul className="space-y-1.5 border-l-2 border-border-subtle ml-2 relative">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block py-1 pr-2 text-[13px] transition-all truncate rounded-r-md ${
                item.level === 3 ? 'pl-6' : 'pl-4'
              } ${
                activeId === item.id
                  ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/5 -ml-[2px] border-l-2 border-blue-500'
                  : 'text-text-secondary hover:text-accent hover:bg-bg-card-hover -ml-[2px] border-l-2 border-transparent font-medium'
              }`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export interface TreeItem {
  id: string;
  title: string;
  level: number;
  children?: TreeItem[];
}

interface TreeNavProps {
  tree: TreeItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

const TreeNode = ({ item, activeId, onNavigate, depth = 0 }: {
  item: TreeItem;
  activeId: string;
  onNavigate: (id: string) => void;
  depth?: number;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activeId === item.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer text-[13px] transition-all group ${
          isActive
            ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-semibold shadow-sm'
            : 'text-text-secondary hover:text-accent hover:bg-bg-card-hover font-medium'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          onNavigate(item.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          <ChevronRight
            size={14}
            className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-blue-500' : 'text-text-muted group-hover:text-text-secondary'} ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <span className="truncate">{item.title}</span>
      </div>
      {hasChildren && expanded && (
        <div className="mt-0.5">
          {item.children!.map(child => (
            <TreeNode
              key={child.id}
              item={child}
              activeId={activeId}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeNav = ({ tree, activeId, onNavigate }: TreeNavProps) => {
  return (
    <nav className="py-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-120px)]">
      {tree.map(item => (
        <TreeNode
          key={item.id}
          item={item}
          activeId={activeId}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
};

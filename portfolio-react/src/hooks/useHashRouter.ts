import { useState, useEffect } from 'react';

export interface HashRoute {
  page: string;       // 'home' | 'knowledge' | 'admin'
  articleSlug?: string; // e.g. 'dify-五大应用类型开发实操方法集'
}

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function parseHash(): HashRoute {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean).map(safeDecodeURIComponent);

  if (parts[0] === 'chat') {
    return { page: 'chat' };
  }
  if (parts[0] === 'knowledge' && parts[1]) {
    return { page: 'knowledge', articleSlug: parts[1] };
  }
  if (parts[0] === 'knowledge') {
    // 不指定默认文章，由 KnowledgeBase 从后端取第一篇已发布笔记
    return { page: 'knowledge' };
  }
  if (parts[0] === 'admin') {
    return { page: 'admin' };
  }
  return { page: 'home' };
}

export function useHashRouter(): [HashRoute, (hash: string) => void] {
  const [route, setRoute] = useState<HashRoute>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (hash: string) => {
    window.location.hash = hash;
  };

  return [route, navigate];
}

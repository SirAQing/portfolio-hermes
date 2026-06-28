import { useState, useEffect } from 'react';

export interface HashRoute {
  page: string;       // 'home' | 'knowledge'
  articleSlug?: string; // e.g. 'vibe-coding-fullstack'
}

function parseHash(): HashRoute {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'knowledge' && parts[1]) {
    return { page: 'knowledge', articleSlug: parts[1] };
  }
  if (parts[0] === 'knowledge') {
    return { page: 'knowledge' };
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

import { useState, useEffect } from 'react';
import { Moon, Sun, Globe, BookOpen } from 'lucide-react';
import { useI18n } from '../i18n';

export const HeaderActions = () => {
  const [isDark, setIsDark] = useState(false);
  const { lang, toggleLang, t } = useI18n();

  useEffect(() => {
    // Theme logic
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
      {/* Knowledge Base */}
      <a
        href="#/knowledge"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-pill shadow-sm border border-border-subtle text-text-primary hover:text-accent transition-colors text-xs font-medium"
        aria-label="Knowledge base"
      >
        <BookOpen size={14} />
        <span>{t('header.knowledge')}</span>
      </a>

      {/* Language Switcher */}
      <button
        onClick={toggleLang}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-pill shadow-sm border border-border-subtle text-text-primary hover:text-accent transition-colors text-xs font-medium"
        aria-label="Toggle language"
      >
        <Globe size={14} />
        <span>{lang === 'en' ? 'EN' : '中'}</span>
      </button>

      {/* Theme Switcher */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-bg-pill shadow-sm border border-border-subtle text-text-primary hover:text-accent transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
};

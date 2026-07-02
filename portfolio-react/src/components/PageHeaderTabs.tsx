/**
 * PageHeaderTabs — 顶部右侧统一标签按钮组
 *
 * 用于：GlobalPageHeader（推荐），以及 ChatPage / AdminPage 等需要内联 tab 的页面
 *
 * 规则：
 * 1. 当前路由对应的按钮为 active 态（蓝-靛渐变背景，layoutId 共享动画）
 * 2. 「管理后台」tab 仅在 owner 登录态展示
 * 3. 标签文案统一：AI 问答 / 笔记 / 管理后台
 * 4. 切换时背景滑块平滑过渡（spring 物理）
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';

export type PageKey = 'home' | 'chat' | 'knowledge' | 'admin';

interface PageHeaderTabsProps {
  /** 当前页面的 key，决定哪个 tab 处于 active 态 */
  current: PageKey;
  /** 点击 tab 时的导航回调（接收目标 hash，例如 '/chat'） */
  onNavigate: (hash: string) => void;
  /** 是否在 fixed 容器内（影响 margin 与定位） */
  variant?: 'floating' | 'inline';
}

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
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
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-pill transition-colors"
      aria-label="Toggle theme"
      title={isDark ? '切换为浅色' : '切换为深色'}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </motion.button>
  );
};

const Tab = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'text-white'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {/* 共享布局的背景滑块 */}
      {active && (
        <motion.div
          layoutId="page-tab-active-bg"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon size={13} className="relative z-10" />
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
};

export const PageHeaderTabs = ({ current, onNavigate }: PageHeaderTabsProps) => {
  const { lang } = useI18n();
  const { user } = useAuth();

  const isOwner = !!user && !user.is_guest && user.role === 'owner';

  // 文案映射
  const labels = {
    aiChat: lang === 'zh' ? 'AI 问答' : 'AI Chat',
    notes: lang === 'zh' ? '笔记' : 'Notes',
    admin: lang === 'zh' ? '管理后台' : 'Admin Panel',
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* AI 问答 */}
      <Tab
        active={current === 'chat'}
        onClick={() => onNavigate('/chat')}
        icon={Sparkles}
        label={labels.aiChat}
      />

      {/* 笔记 */}
      <Tab
        active={current === 'knowledge'}
        onClick={() => onNavigate('/knowledge')}
        icon={BookOpen}
        label={labels.notes}
      />

      {/* 管理后台（仅 owner 可见） */}
      {isOwner && (
        <Tab
          active={current === 'admin'}
          onClick={() => onNavigate('/admin')}
          icon={SettingsIcon}
          label={labels.admin}
        />
      )}

      {/* 分隔线 */}
      <div className="w-px h-4 bg-border-subtle mx-0.5" />

      {/* 明暗主题切换 */}
      <ThemeToggle />
    </div>
  );
};

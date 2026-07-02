/**
 * GlobalPageHeader — 全局浮动页头
 *
 * 统一所有页面的右上角位置：
 * - 固定在 top: 24px / right: 24px
 * - 包含标签按钮组（AI 问答 / 笔记 / 管理后台）+ 主题切换
 * - 液态玻璃容器（backdrop-blur + 边框 + 阴影）
 * - 仅在 owner 登录态下展示「管理后台」tab
 */
import { motion } from 'framer-motion';
import { LogIn, LogOut, User } from 'lucide-react';
import { PageHeaderTabs, type PageKey } from './PageHeaderTabs';
import { useAuth } from '../auth/AuthContext';

interface GlobalPageHeaderProps {
  currentPage: PageKey;
  onNavigate: (hash: string) => void;
}

export const GlobalPageHeader = ({ currentPage, onNavigate }: GlobalPageHeaderProps) => {
  const { user, openAuthModal, logout } = useAuth();
  const isGuest = !user || user.is_guest;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed top-6 right-6 z-50 flex items-center gap-2 p-1.5 rounded-full
                 bg-bg-card/80 backdrop-blur-xl border border-border-subtle
                 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <PageHeaderTabs current={currentPage} onNavigate={onNavigate} variant="floating" />

      {/* 分隔线 */}
      <div className="w-px h-4 bg-border-subtle mx-0.5" />

      {/* 登录 / 退出 */}
      {isGuest ? (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={openAuthModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)]"
        >
          <LogIn size={12} />
          <span>登录</span>
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={logout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-pill transition-colors"
          title={user?.email || '退出登录'}
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold">
            {user?.email?.charAt(0).toUpperCase() || <User size={10} />}
          </div>
          <LogOut size={12} />
        </motion.button>
      )}
    </motion.div>
  );
};

/**
 * 登录/注册模态框 — 访客配额用尽时弹出
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type Mode = 'login' | 'register';

export const AuthModal = () => {
  const { showAuthModal, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      closeAuthModal();
      setEmail(''); setPassword(''); setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeAuthModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <h2 className="text-lg font-semibold text-text-primary">
                {mode === 'login' ? '登录账号' : '注册新账号'}
              </h2>
              <button
                onClick={closeAuthModal}
                className="p-1.5 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">邮箱</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-bg-base border border-border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">用户名</label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your name"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-bg-base border border-border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-text-primary placeholder:text-text-muted"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">密码</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-bg-base border border-border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {mode === 'login' ? '登录' : '注册'}
              </button>

              <div className="text-center text-xs text-text-secondary">
                {mode === 'login' ? '还没有账号？' : '已有账号？'}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-1 text-blue-500 hover:text-blue-600 font-medium"
                >
                  {mode === 'login' ? '去注册' : '去登录'}
                </button>
              </div>

              <div className="text-center text-[11px] text-text-muted pt-2 border-t border-border-subtle">
                访客每日可对话 5 次，登录后无限制
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

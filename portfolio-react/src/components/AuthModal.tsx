/**
 * 登录/注册/兑换邀请码模态框
 *
 * 设计要点：
 * - 三态窗口保持统一尺寸，避免切换时高度跳动
 * - 使用 AnimatePresence + motion 做内容淡入淡出
 * - 保持 taste-skill 液态玻璃与 spring 动画风格
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Loader2, Ticket } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';

type Mode = 'login' | 'register' | 'redeem';

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };
const fadeSlide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: springTransition,
};

export const AuthModal = () => {
  const { showAuthModal, closeAuthModal, login, register, redeemInvite } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, username, password);
      } else {
        await redeemInvite(inviteCode);
      }
      closeAuthModal();
      setEmail('');
      setPassword('');
      setUsername('');
      setInviteCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (target: Mode) => {
    if (target === mode) return;
    setMode(target);
    setError(null);
    // 切换时清空可能不相关的字段，保留邮箱便于登录/注册切换
    if (target === 'redeem') {
      setEmail('');
      setPassword('');
      setUsername('');
    }
  };

  const { t, lang } = useI18n();

  const modeTabs: { key: Mode; label: string }[] = [
    { key: 'login', label: '登录' },
    { key: 'register', label: '注册' },
    { key: 'redeem', label: t('auth.redeem.title') },
  ];

  const title =
    mode === 'login' ? '登录账号' : mode === 'register' ? '注册新账号' : t('auth.redeem.title');

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
            transition={springTransition}
            className="w-full max-w-md bg-bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              <button
                onClick={closeAuthModal}
                className="p-1.5 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="px-5 pt-4">
              <div className="flex p-1 bg-bg-base border border-border-subtle rounded-xl">
                {modeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => switchMode(tab.key)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      mode === tab.key
                        ? 'bg-bg-card text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form — 固定最小高度，避免切换时窗口跳动 */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="relative min-h-[260px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mode}
                    {...fadeSlide}
                    className="space-y-4"
                  >
                    {mode !== 'redeem' && (
                      <>
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

                        <AnimatePresence>
                          {mode === 'register' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={springTransition}
                              className="space-y-1.5 overflow-hidden"
                            >
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
                            </motion.div>
                          )}
                        </AnimatePresence>

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
                      </>
                    )}

                    {mode === 'redeem' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">{t('auth.redeem.code')}</label>
                        <div className="relative">
                          <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                          <input
                            type="text"
                            required
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder={t('auth.redeem.codePlaceholder')}
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-bg-base border border-border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-text-primary placeholder:text-text-muted font-mono tracking-wider"
                          />
                        </div>
                        <p className="text-[11px] text-text-muted">{t('auth.redeem.hint')}</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-4 space-y-3">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {mode === 'login' ? '登录' : mode === 'register' ? '注册' : t('auth.redeem.submit')}
                </button>

                <div className="text-center text-[11px] text-text-muted pt-2 border-t border-border-subtle">
                  {lang === 'zh'
                    ? '访客每日可对话 20 次，登录后无限制'
                    : 'Guests have 20 messages/day; unlimited after login'}
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 用户管理 Tab
 *
 * 功能：
 * - 左侧用户列表 + 搜索/角色筛选/状态筛选
 * - 用户卡片：头像首字母、email、username、角色 badge、状态 badge、注册时间
 * - 右侧抽屉用于创建/编辑用户
 * - 操作：编辑、删除（带确认弹窗）、重置密码
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  KeyRound,
  X,
  Shield,
  User,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useI18n } from '../../i18n';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

interface AdminUser {
  id: string;
  email: string;
  username?: string;
  role: string;
  status: 'active' | 'disabled';
  nickname?: string;
  phone?: string;
  admin_notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  last_login_at?: string;
}

interface UserFormData {
  email: string;
  username: string;
  role: string;
  status: 'active' | 'disabled';
  password?: string;
}

const ROLES = ['owner', 'interviewer', 'user'];
const STATUSES = ['active', 'disabled'];

const getInitials = (name?: string, email?: string) => {
  const source = (name || email || '?').trim();
  return source.charAt(0).toUpperCase();
};

const formatDate = (iso?: string, lang: 'en' | 'zh' = 'zh') => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const roleBadgeClass = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'interviewer':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
};

const statusBadgeClass = (status: string) => {
  return status === 'active'
    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
};

const FieldRow = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) => (
  <div>
    <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors"
    />
  </div>
);

const SelectRow = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) => (
  <div>
    <label className="block text-[11px] font-medium text-text-secondary mb-1.5">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export const UserManagementTab = ({ authHeaders }: { authHeaders: () => Record<string, string> }) => {
  const { t, lang } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormData>({
    email: '',
    username: '',
    role: 'user',
    status: 'active',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [confirmMode, setConfirmMode] = useState<'delete' | 'reset'>('delete');
  const [resetPassword, setResetPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      const resp = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (resp.ok) {
        const data = await resp.json();
        setUsers(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, debouncedSearch, roleFilter, statusFilter, offset]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setOffset(0);
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: '', username: '', role: 'user', status: 'active', password: '' });
    setFormError('');
    setDrawerOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'user',
      status: user.status || 'active',
      password: '',
    });
    setFormError('');
    setDrawerOpen(true);
  };

  const validateForm = () => {
    if (!form.email.trim() || !form.email.includes('@')) return t('admin.users.emailInvalid');
    if (!form.username.trim()) return t('admin.users.usernameRequired');
    if (!editingUser && (!form.password || form.password.length < 6)) return t('admin.users.passwordRequired');
    return '';
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    setFormError('');
    let saveErr = '';
    try {
      if (editingUser) {
        const payload: Partial<UserFormData> = {
          email: form.email,
          username: form.username,
          role: form.role,
          status: form.status,
        };
        const resp = await fetch(`${API_BASE}/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          saveErr = detail.detail || t('admin.users.saveFailed');
          setFormError(saveErr);
        }
      } else {
        const resp = await fetch(`${API_BASE}/api/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            email: form.email,
            username: form.username,
            password: form.password,
            role: form.role,
          }),
        });
        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          saveErr = detail.detail || t('admin.users.createFailed');
          setFormError(saveErr);
        }
      }
      if (!saveErr) {
        setDrawerOpen(false);
        await fetchUsers();
      }
    } catch (e) {
      setFormError(t('admin.users.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const openConfirm = (user: AdminUser, mode: 'delete' | 'reset') => {
    setConfirmUser(user);
    setConfirmMode(mode);
    setResetPassword('');
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmUser) return;
    setActionLoading(true);
    try {
      if (confirmMode === 'delete') {
        const resp = await fetch(`${API_BASE}/api/admin/users/${confirmUser.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          alert(detail.detail || t('admin.users.deleteFailed'));
        }
      } else {
        if (!resetPassword || resetPassword.length < 6) {
          alert(t('admin.users.passwordRequired'));
          setActionLoading(false);
          return;
        }
        const resp = await fetch(`${API_BASE}/api/admin/users/${confirmUser.id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ new_password: resetPassword }),
        });
        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          alert(detail.detail || t('admin.users.resetFailed'));
        }
      }
      setConfirmOpen(false);
      await fetchUsers();
    } catch (e) {
      console.error('Action failed', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex gap-4 min-h-0">
      {/* 左侧用户列表 */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex-1 min-w-0 flex flex-col rounded-2xl border border-border-subtle bg-bg-card/80 backdrop-blur-xl overflow-hidden"
      >
        {/* 工具栏 */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.users.search')}
                className="w-full sm:w-44 pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setOffset(0); }}
              className="px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
            >
              <option value="">{t('admin.users.allRoles')}</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{t(`admin.users.role.${r}`)}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
              className="px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
            >
              <option value="">{t('admin.users.allStatuses')}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`admin.users.status.${s}`)}</option>
              ))}
            </select>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              <Plus size={13} />
              {t('admin.users.create')}
            </motion.button>
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-text-muted">
              <Loader2 size={20} className="animate-spin mr-2" /> {t('dashboard.loading')}
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center mx-auto mb-3">
                <User size={20} className="text-text-muted" />
              </div>
              <p className="text-xs text-text-muted">{t('admin.users.empty')}</p>
              {(search || roleFilter || statusFilter) && (
                <button
                  onClick={resetFilters}
                  className="mt-2 text-[11px] text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {t('admin.users.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springTransition}
                  className="group p-3 rounded-xl bg-bg-base border border-border-subtle hover:border-border transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {getInitials(user.username, user.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {user.username || user.email}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleBadgeClass(user.role)}`}>
                          {t(`admin.users.role.${user.role}`)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusBadgeClass(user.status)}`}>
                          {t(`admin.users.status.${user.status}`)}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted truncate mt-1">{user.email}</div>
                      <div className="text-[10px] text-text-muted mt-1.5">
                        {t('admin.users.registeredAt')}: {formatDate(user.created_at, lang)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg hover:bg-bg-card text-text-secondary hover:text-blue-500 transition-colors"
                        title={t('admin.users.edit')}
                      >
                        <Edit2 size={13} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openConfirm(user, 'reset')}
                        className="p-1.5 rounded-lg hover:bg-bg-card text-text-secondary hover:text-amber-500 transition-colors"
                        title={t('admin.users.resetPassword')}
                      >
                        <KeyRound size={13} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openConfirm(user, 'delete')}
                        className="p-1.5 rounded-lg hover:bg-bg-card text-text-secondary hover:text-rose-500 transition-colors"
                        title={t('admin.users.delete')}
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {total > limit && (
          <div className="p-3 border-t border-border-subtle flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-text-muted">
              {offset + 1}-{Math.min(offset + limit, total)} / {total}
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="px-3 py-1.5 text-[11px] rounded-lg border border-border hover:bg-bg-card disabled:opacity-40 transition-colors"
              >
                {t('admin.users.prev')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1.5 text-[11px] rounded-lg border border-border hover:bg-bg-card disabled:opacity-40 transition-colors"
              >
                {t('admin.users.next')}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* 右侧抽屉 */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:relative md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={springTransition}
              className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 md:relative md:inset-auto md:z-auto border-l border-border-subtle bg-bg-card/80 backdrop-blur-xl flex flex-col shadow-2xl md:shadow-none"
            >
              <div className="h-14 border-b border-border-subtle flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-blue-500" />
                  <span className="text-sm font-semibold text-text-primary">
                    {editingUser ? t('admin.users.editTitle') : t('admin.users.createTitle')}
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-bg-base text-text-muted transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2">
                    <AlertCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-rose-600 dark:text-rose-400">{formError}</span>
                  </div>
                )}
                <FieldRow
                  label={t('admin.users.email')}
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  placeholder="user@example.com"
                  required
                />
                <FieldRow
                  label={t('admin.users.username')}
                  value={form.username}
                  onChange={(v) => setForm((f) => ({ ...f, username: v }))}
                  placeholder={t('admin.users.usernamePlaceholder')}
                  required
                />
                <SelectRow
                  label={t('admin.users.role')}
                  value={form.role}
                  onChange={(v) => setForm((f) => ({ ...f, role: v }))}
                  options={ROLES}
                />
                <SelectRow
                  label={t('admin.users.status')}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v as 'active' | 'disabled' }))}
                  options={STATUSES}
                />
                {!editingUser && (
                  <FieldRow
                    label={t('admin.users.password')}
                    type="password"
                    value={form.password || ''}
                    onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                    placeholder={t('admin.users.passwordPlaceholder')}
                    required
                  />
                )}
              </div>

              <div className="p-4 border-t border-border-subtle flex items-center justify-end gap-2 flex-shrink-0 bg-bg-base/80 backdrop-blur-xl">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-bg-card text-text-secondary font-medium transition-colors"
                >
                  {t('admin.users.cancel')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {saving ? t('admin.users.saving') : t('admin.users.save')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 确认弹窗 */}
      <AnimatePresence>
        {confirmOpen && confirmUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={springTransition}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-5 rounded-2xl border border-border-subtle bg-bg-card/90 backdrop-blur-xl shadow-2xl z-50"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${confirmMode === 'delete' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {confirmMode === 'delete' ? <Trash2 size={15} /> : <KeyRound size={15} />}
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {confirmMode === 'delete' ? t('admin.users.deleteConfirmTitle') : t('admin.users.resetConfirmTitle')}
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                {confirmMode === 'delete'
                  ? t('admin.users.deleteConfirmDesc', { user: confirmUser.username || confirmUser.email })
                  : t('admin.users.resetConfirmDesc', { user: confirmUser.username || confirmUser.email })}
              </p>
              {confirmMode === 'reset' && (
                <div className="mb-4">
                  <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
                    {t('admin.users.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder={t('admin.users.passwordPlaceholder')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-bg-card text-text-secondary font-medium transition-colors"
                >
                  {t('admin.users.cancel')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs rounded-lg text-white font-medium transition-colors inline-flex items-center gap-1.5 ${
                    confirmMode === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'
                  } disabled:opacity-50`}
                >
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  {confirmMode === 'delete' ? t('admin.users.delete') : t('admin.users.resetPassword')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

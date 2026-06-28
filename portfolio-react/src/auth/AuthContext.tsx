/**
 * 认证上下文 — 管理登录状态、token、配额、登录弹窗
 */
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_KEY = 'hermes_access_token';
const REFRESH_KEY = 'hermes_refresh_token';

export interface AuthUser {
  id?: string;
  email?: string;
  username?: string;
  role: string;
  is_guest: boolean;
  quota_remaining?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** 获取认证 headers，无 token 返回空对象 */
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  /** 探测登录状态 + 配额 */
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    try {
      const resp = await fetch(`${API_BASE}/api/auth/warmup`, { headers });
      if (!resp.ok) throw new Error('warmup failed');
      const data = await resp.json();
      setUser(data);
    } catch {
      setUser({ is_guest: true, role: 'guest', quota_remaining: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const persistTokens = (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  };

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await resp.json();
    persistTokens(data.access_token, data.refresh_token);
    await refreshUser();
  };

  const register = async (email: string, username: string, password: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await resp.json();
    persistTokens(data.access_token, data.refresh_token);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    refreshUser();
  };

  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        showAuthModal,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshUser,
        authHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  MessageSquare,
  Bot,
  UserPlus,
  Clock,
  Calendar,
  Ticket,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useI18n } from '../../i18n';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface DashboardData {
  dateRange: { start: string; end: string };
  kpis: {
    visitorsToday: number;
    conversationsToday: number;
    messagesToday: number;
    aiRepliesToday: number;
    registeredUsers: number;
    activeGuestsToday: number;
  };
  visitorTrend: { date: string; conversations: number; visitors: number; messages: number }[];
  userGrowth: { date: string; owner: number; interviewer: number; user_count: number }[];
  aiUsage: { date: string; visitor_mode: number; demo_mode: number }[];
  hourlyPeak: { hour: number; count: number }[];
  roleDistribution: { role: string; count: number }[];
  recentActivity: {
    id: string;
    visitorName: string;
    startedAt: number;
    messageCount: number;
    mode: string;
    lastMessage: string;
  }[];
  inviteStatus: {
    id: string;
    code: string;
    company: string | null;
    position: string | null;
    maxUses: number;
    usedCount: number;
    expiresAt: string;
    status: string;
  }[];
}

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

const ACCENT = {
  visitor: '#3b82f6',
  demo: '#6366f1',
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  slate: '#64748b',
};

const ROLE_COLORS: Record<string, string> = {
  owner: '#f59e0b',
  interviewer: '#6366f1',
  user: '#3b82f6',
  guest: '#94a3b8',
};

export const DashboardTab = ({ authHeaders }: { authHeaders: () => Record<string, string> }) => {
  const { t, lang } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('start_date', startDate);
      params.set('end_date', endDate);
      const base = API_BASE || window.location.origin;
      const url = `${base}/api/admin/analytics/dashboard?${params.toString()}`;
      const resp = await fetch(url, { headers: authHeaders() });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const kpiCards = useMemo(
    () => [
      {
        key: 'visitors',
        label: t('dashboard.kpi.visitors'),
        value: data?.kpis.visitorsToday ?? 0,
        icon: Users,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        key: 'conversations',
        label: t('dashboard.kpi.conversations'),
        value: data?.kpis.conversationsToday ?? 0,
        icon: MessageSquare,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
      },
      {
        key: 'aiReplies',
        label: t('dashboard.kpi.aiReplies'),
        value: data?.kpis.aiRepliesToday ?? 0,
        icon: Bot,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      {
        key: 'registered',
        label: t('dashboard.kpi.registeredUsers'),
        value: data?.kpis.registeredUsers ?? 0,
        icon: UserPlus,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      },
    ],
    [data, t]
  );

  const roleData = useMemo(
    () =>
      (data?.roleDistribution ?? []).map((item) => ({
        name: t(`dashboard.role.${item.role}`) || item.role,
        value: item.count,
        color: ROLE_COLORS[item.role] || ACCENT.slate,
      })),
    [data, t]
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-5">
      {/* Date range picker */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 p-4 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-base border border-border-subtle">
            <Calendar size={12} className="text-text-muted" />
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-text-primary outline-none"
            />
          </div>
          <span className="text-text-muted text-xs">-</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-base border border-border-subtle">
            <Calendar size={12} className="text-text-muted" />
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-text-primary outline-none"
            />
          </div>
        </div>
      </motion.div>

      {loading && !data && (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Activity size={24} />
          </motion.div>
          <span className="ml-2 text-sm">{t('dashboard.loading')}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpiCards.map((card, idx) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: idx * 0.05 }}
                className="p-4 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon size={16} className={card.color} />
                  </div>
                  <TrendingUp size={14} className="text-text-muted" />
                </div>
                <div className="text-2xl font-semibold font-mono text-text-primary tracking-tight">
                  {card.value.toLocaleString()}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{card.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Visitor trend + Role distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="lg:col-span-2 p-5 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-blue-500" />
                <h3 className="text-sm font-medium text-text-primary">{t('dashboard.chart.visitorTrend')}</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.visitorTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT.blue} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={ACCENT.blue} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT.emerald} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={ACCENT.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      stroke="rgba(148,163,184,0.3)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      stroke="rgba(148,163,184,0.3)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.2)',
                        background: 'rgba(255,255,255,0.95)',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke={ACCENT.blue}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorConversations)"
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke={ACCENT.emerald}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMessages)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.15 }}
              className="p-5 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-indigo-500" />
                <h3 className="text-sm font-medium text-text-primary">{t('dashboard.chart.roleDistribution')}</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.2)',
                        background: 'rgba(255,255,255,0.95)',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {roleData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Row 3: AI usage + hourly peak */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="lg:col-span-2 p-5 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Bot size={16} className="text-emerald-500" />
                <h3 className="text-sm font-medium text-text-primary">{t('dashboard.chart.aiUsage')}</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.aiUsage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT.visitor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={ACCENT.visitor} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDemo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT.demo} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={ACCENT.demo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      stroke="rgba(148,163,184,0.3)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      stroke="rgba(148,163,184,0.3)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.2)',
                        background: 'rgba(255,255,255,0.95)',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitor_mode"
                      name={t('dashboard.mode.visitor')}
                      stroke={ACCENT.visitor}
                      strokeWidth={2}
                      fill="url(#colorVisitor)"
                    />
                    <Area
                      type="monotone"
                      dataKey="demo_mode"
                      name={t('dashboard.mode.demo')}
                      stroke={ACCENT.demo}
                      strokeWidth={2}
                      fill="url(#colorDemo)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.25 }}
              className="p-5 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-amber-500" />
                <h3 className="text-sm font-medium text-text-primary">{t('dashboard.chart.hourlyPeak')}</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyPeak} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(h) => `${h}:00`}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                      stroke="rgba(148,163,184,0.3)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      stroke="rgba(148,163,184,0.3)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.2)',
                        background: 'rgba(255,255,255,0.95)',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill={ACCENT.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Row 4: Recent activity + Invite status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
              className="p-5 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-blue-500" />
                <h3 className="text-sm font-medium text-text-primary">{t('dashboard.list.recentActivity')}</h3>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-muted">{t('dashboard.empty.activity')}</div>
                ) : (
                  data.recentActivity.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springTransition, delay: 0.05 * idx }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-bg-base border border-border-subtle"
                    >
                      <div
                        className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          item.mode === 'demo' ? 'bg-indigo-500' : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-text-primary truncate">{item.visitorName}</span>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">{formatTime(item.startedAt)}</span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {item.lastMessage || t('dashboard.activity.noMessage')}
                        </p>
                        <div className="text-[10px] text-text-muted mt-1">
                          {item.messageCount} {t('dashboard.activity.messages')}
                          <span className="mx-1">·</span>
                          {item.mode === 'demo' ? t('dashboard.mode.demo') : t('dashboard.mode.visitor')}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.35 }}
              className="p-5 rounded-2xl border border-border-subtle bg-bg-card backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Ticket size={16} className="text-indigo-500" />
                <h3 className="text-sm font-medium text-text-primary">{t('dashboard.list.inviteStatus')}</h3>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {data.inviteStatus.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-muted">{t('dashboard.empty.invites')}</div>
                ) : (
                  data.inviteStatus.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springTransition, delay: 0.05 * idx }}
                      className="flex items-center justify-between p-3 rounded-xl bg-bg-base border border-border-subtle"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-text-primary">{item.code}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              item.status === 'active'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : item.status === 'expired'
                                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {t(`dashboard.invite.${item.status}`)}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5 truncate">
                          {item.company && <span className="mr-2">{item.company}</span>}
                          {item.position && <span className="mr-2">{item.position}</span>}
                          <span>
                            {item.usedCount}/
                            {item.maxUses >= 9999 ? t('dashboard.invite.unlimited') : item.maxUses} {t('dashboard.invite.used')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

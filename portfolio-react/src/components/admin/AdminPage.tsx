/**
 * 知识库管理页 — 文档上传、流水线状态监控、检索测试、AI 助理设置
 *
 * 路由：#/admin
 * 权限：需要 owner 角色
 *
 * 升级内容（taste-skill 设计规范）：
 * - 复用 KBManagement 组件（与 ChatPage 侧滑面板一致）
 * - 全局页头由 GlobalPageHeader 统一提供
 * - 液态玻璃 + 弹簧物理 + Bento 风格
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Settings as SettingsIcon,
  Database,
  Bot,
  Cpu,
  FileText,
  Check,
  Save,
  RotateCcw,
  Loader2,
  Wand2,
  Globe,
  Boxes,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Wrench,
  Ticket,
  Copy,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { DashboardTab } from './DashboardTab';
import { UserManagementTab } from './UserManagementTab';
import { NotesManagementTab } from './NotesManagementTab';
import { useAuth } from '../../auth/AuthContext';
import { KBManagement } from '../knowledge/KBManagement';
import { PageHeaderTabs } from '../PageHeaderTabs';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

// ── AI 助理设置 Tab ──

interface SystemSettings {
  system_prompt?: string;
  llm_api_key?: string;
  llm_base_url?: string;
  llm_model?: string;
  embedding_api_key?: string;
  embedding_base_url?: string;
  embedding_model?: string;
  embedding_dimension?: number;
  rag_top_k?: number;
  rag_final_k?: number;
  rrf_vector_weight?: number;
  rrf_keyword_weight?: number;
  visitor_system_prompt?: string;
  visitor_llm_api_key?: string;
  visitor_llm_base_url?: string;
  visitor_llm_model?: string;
  visitor_enable_tools?: boolean;
  visitor_max_tokens?: number;
  visitor_temperature?: number;
  demo_system_prompt?: string;
  demo_llm_api_key?: string;
  demo_llm_base_url?: string;
  demo_llm_model?: string;
  demo_enable_tools?: boolean;
  demo_max_tokens?: number;
  demo_temperature?: number;
}

const AISettingsTab = ({ authHeaders }: { authHeaders: () => Record<string, string> }) => {
  const { lang } = useI18n();
  const [aiSubTab, setAiSubTab] = useState<'model' | 'prompt'>('model');
  const [activeAssistant, setActiveAssistant] = useState<'visitor' | 'demo'>('demo');
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/settings`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const payload: Partial<SystemSettings> = {};
      const sensitiveKeys: (keyof SystemSettings)[] = [
        'llm_api_key', 'embedding_api_key',
        'visitor_llm_api_key', 'demo_llm_api_key',
      ];
      for (const [k, v] of Object.entries(settings)) {
        const key = k as keyof SystemSettings;
        if (sensitiveKeys.includes(key) && typeof v === 'string' && v.includes('****')) {
          continue;
        }
        (payload as any)[key] = v;
      }

      const resp = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        setSaveMessage(lang === 'zh' ? '配置已保存，新对话将立即生效' : 'Saved. New chats will use these settings.');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const err = await resp.json().catch(() => ({ detail: lang === 'zh' ? '保存失败' : 'Save failed' }));
        setSaveMessage(`${lang === 'zh' ? '保存失败' : 'Save failed'}: ${err.detail || resp.statusText}`);
      }
    } catch (e) {
      setSaveMessage(`${lang === 'zh' ? '保存出错' : 'Save error'}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSetting = async (key: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/settings/reset/${key}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      await fetchSettings();
    } catch (e) {
      console.error('Failed to reset setting', e);
    }
  };

  const prefix = activeAssistant === 'visitor' ? 'visitor' : 'demo';
  const llmKey = `${prefix}_llm_api_key` as keyof SystemSettings;
  const llmUrl = `${prefix}_llm_base_url` as keyof SystemSettings;
  const llmModel = `${prefix}_llm_model` as keyof SystemSettings;
  const sysPromptKey = `${prefix}_system_prompt` as keyof SystemSettings;
  const enableToolsKey = `${prefix}_enable_tools` as keyof SystemSettings;
  const maxTokensKey = `${prefix}_max_tokens` as keyof SystemSettings;
  const tempKey = `${prefix}_temperature` as keyof SystemSettings;
  const assistantLabel = activeAssistant === 'visitor' ? '访客助手' : 'AI 问答';
  const assistantDesc = activeAssistant === 'visitor'
    ? '主页浮动窗口（轻量问答）'
    : '全屏深度问答（Agent 模式）';
  const accentColor = activeAssistant === 'visitor' ? 'emerald' : 'blue';

  return (
    <div className="space-y-5">
      {/* 助手选择器 - Bento 风格 */}
      <div className="grid grid-cols-2 gap-3">
        <AssistantCard
          active={activeAssistant === 'visitor'}
          onClick={() => setActiveAssistant('visitor')}
          label="访客助手"
          description="主页浮动窗口"
          icon={Bot}
          color="emerald"
        />
        <AssistantCard
          active={activeAssistant === 'demo'}
          onClick={() => setActiveAssistant('demo')}
          label="AI 问答"
          description="全屏深度问答"
          icon={Sparkles}
          color="blue"
        />
      </div>

      {/* 子标签 */}
      <div className="flex gap-1 p-1 bg-bg-card border border-border-subtle rounded-xl">
        <SubTabButton
          active={aiSubTab === 'model'}
          onClick={() => setAiSubTab('model')}
          icon={Cpu}
          label="模型配置"
        />
        <SubTabButton
          active={aiSubTab === 'prompt'}
          onClick={() => setAiSubTab('prompt')}
          icon={Wand2}
          label="系统提示词"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={20} className="animate-spin mr-2" /> 加载中...
        </div>
      ) : aiSubTab === 'model' ? (
        <div className="space-y-4">
          {/* 助手专属功能开关 - Bento 卡片 */}
          <BentoCard
            title={`${assistantLabel} · 功能开关`}
            subtitle={assistantDesc}
            accent={accentColor}
            icon={Zap}
          >
            <div className="space-y-3">
              <ToggleRow
                label="允许工具调用 (Agent 模式)"
                description="启用后 AI 可调用知识库检索等工具"
                checked={!!settings[enableToolsKey]}
                onChange={() => setSettings(s => ({ ...s, [enableToolsKey]: !s[enableToolsKey] }))}
              />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <NumberField
                  label="最大输出 Token"
                  value={Number(settings[maxTokensKey] ?? (activeAssistant === 'visitor' ? 1024 : 4096))}
                  onChange={(v) => setSettings(s => ({ ...s, [maxTokensKey]: v }))}
                />
                <NumberField
                  label="温度 (Temperature)"
                  step="0.1"
                  min={0}
                  max={2}
                  value={Number(settings[tempKey] ?? 0.7)}
                  onChange={(v) => setSettings(s => ({ ...s, [tempKey]: v }))}
                />
              </div>
            </div>
          </BentoCard>

          {/* 助手专属 LLM 配置 */}
          <BentoCard
            title={`${assistantLabel} · 独立模型配置`}
            subtitle="留空则使用下方全局配置（fallback 机制）"
            accent={accentColor}
            icon={Sparkles}
          >
            <div className="space-y-3">
              <FieldRow
                label="API Base URL"
                placeholder="留空使用全局配置"
                value={(settings[llmUrl] as string) || ''}
                onChange={(v) => setSettings(s => ({ ...s, [llmUrl]: v }))}
              />
              <FieldRow
                label="API Key"
                type="password"
                placeholder="留空使用全局配置"
                value={(settings[llmKey] as string) || ''}
                onChange={(v) => setSettings(s => ({ ...s, [llmKey]: v }))}
                hint={(settings[llmKey] as string) || '未配置（fallback 到全局）'}
              />
              <FieldRow
                label="模型名称"
                placeholder="留空使用全局配置"
                value={(settings[llmModel] as string) || ''}
                onChange={(v) => setSettings(s => ({ ...s, [llmModel]: v }))}
              />
            </div>
          </BentoCard>

          {/* 全局配置 */}
          <BentoCard
            title="全局模型配置"
            subtitle="两个助手的 Fallback 基础值"
            accent="purple"
            icon={Boxes}
          >
            <div className="space-y-3">
              <FieldRow
                label="API Base URL"
                placeholder="https://api.deepseek.com"
                value={settings.llm_base_url || ''}
                onChange={(v) => setSettings(s => ({ ...s, llm_base_url: v }))}
              />
              <FieldRow
                label="API Key"
                type="password"
                placeholder="sk-..."
                value={settings.llm_api_key || ''}
                onChange={(v) => setSettings(s => ({ ...s, llm_api_key: v }))}
                hint={settings.llm_api_key || '未配置（使用环境变量）'}
              />
              <FieldRow
                label="模型名称"
                placeholder="deepseek-chat"
                value={settings.llm_model || ''}
                onChange={(v) => setSettings(s => ({ ...s, llm_model: v }))}
              />
            </div>
          </BentoCard>

          {/* 嵌入模型 */}
          <BentoCard
            title="嵌入模型 (Embedding)"
            subtitle="全局共用 · 用于文档向量化"
            accent="cyan"
            icon={FileText}
          >
            <div className="space-y-3">
              <FieldRow
                label="API Base URL"
                placeholder="https://api.siliconflow.cn/v1"
                value={settings.embedding_base_url || ''}
                onChange={(v) => setSettings(s => ({ ...s, embedding_base_url: v }))}
              />
              <FieldRow
                label="API Key"
                type="password"
                placeholder="留空则使用 LLM 的 API Key"
                value={settings.embedding_api_key || ''}
                onChange={(v) => setSettings(s => ({ ...s, embedding_api_key: v }))}
                hint={settings.embedding_api_key || '未配置（使用环境变量）'}
              />
              <FieldRow
                label="模型名称"
                placeholder="BAAI/bge-large-zh-v1.5"
                value={settings.embedding_model || ''}
                onChange={(v) => setSettings(s => ({ ...s, embedding_model: v }))}
              />
              <NumberField
                label="向量维度"
                value={settings.embedding_dimension || 768}
                onChange={(v) => setSettings(s => ({ ...s, embedding_dimension: v }))}
              />
            </div>
          </BentoCard>

          {/* RAG 检索参数 */}
          <BentoCard
            title="RAG 检索参数"
            subtitle="全局共用 · 向量 + 关键词融合权重"
            accent="orange"
            icon={Globe}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="初始检索 Top K"
                value={settings.rag_top_k || 30}
                onChange={(v) => setSettings(s => ({ ...s, rag_top_k: v }))}
              />
              <NumberField
                label="最终返回 Top K"
                value={settings.rag_final_k || 5}
                onChange={(v) => setSettings(s => ({ ...s, rag_final_k: v }))}
              />
              <NumberField
                label="向量权重"
                step="0.1"
                value={settings.rrf_vector_weight || 1.0}
                onChange={(v) => setSettings(s => ({ ...s, rrf_vector_weight: v }))}
              />
              <NumberField
                label="关键词权重"
                step="0.1"
                value={settings.rrf_keyword_weight || 1.0}
                onChange={(v) => setSettings(s => ({ ...s, rrf_keyword_weight: v }))}
              />
            </div>
          </BentoCard>

          <SaveBar saving={saving} message={saveMessage} onSave={handleSaveSettings} onRefresh={fetchSettings} />
        </div>
      ) : (
        <div className="space-y-4">
          <BentoCard
            title={`${assistantLabel} · 专属系统提示词`}
            subtitle={activeAssistant === 'visitor'
              ? '访客助手提示词：专注简历个人信息、项目经验的轻量问答，建议保持简洁明确。'
              : 'AI 问答提示词：支持知识库深度问答、工具调用、Agent 模式，可配置丰富技能。'}
            accent={accentColor}
            icon={Wand2}
            action={{ label: '恢复默认', onClick: () => handleResetSetting(`${prefix}_system_prompt`) }}
          >
            <textarea
              value={(settings[sysPromptKey] as string) || ''}
              onChange={(e) => setSettings(s => ({ ...s, [sysPromptKey]: e.target.value }))}
              rows={16}
              className="w-full px-3.5 py-2.5 text-xs leading-relaxed rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors font-mono text-text-primary resize-y"
              placeholder="留空则使用全局系统提示词..."
            />
          </BentoCard>

          <BentoCard
            title="全局系统提示词 (Fallback)"
            subtitle="当助手专属提示词为空时使用此全局提示词。"
            accent="purple"
            icon={Wand2}
            action={{ label: '恢复默认', onClick: () => handleResetSetting('system_prompt') }}
          >
            <textarea
              value={settings.system_prompt || ''}
              onChange={(e) => setSettings(s => ({ ...s, system_prompt: e.target.value }))}
              rows={16}
              className="w-full px-3.5 py-2.5 text-xs leading-relaxed rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors font-mono text-text-primary resize-y"
              placeholder="输入全局系统提示词..."
            />
          </BentoCard>

          <SaveBar saving={saving} message={saveMessage} onSave={handleSaveSettings} onRefresh={fetchSettings} />

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-xs text-text-secondary leading-relaxed">
              提示：在系统提示词中明确写明联系方式（邮箱、电话、社交媒体等）可以让 AI 直接回答，无需每次都搜索知识库。修改后新对话立即生效。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 面试官邀请码管理 Tab ──

interface Invite {
  id: string;
  code: string;
  company: string | null;
  position: string | null;
  interview_date: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string;
  created_at: string;
}

const InviteManagementTab = ({ authHeaders }: { authHeaders: () => Record<string, string> }) => {
  const { t, lang } = useI18n();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company: '',
    position: '',
    interview_date: '',
    max_uses: 1,
    expire_days: 3,
  });

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/invites`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setInvites(data);
      }
    } catch (e) {
      console.error('Failed to fetch invites', e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          company: form.company || null,
          position: form.position || null,
          interview_date: form.interview_date || null,
          max_uses: form.max_uses,
          expire_days: form.expire_days,
        }),
      });
      if (resp.ok) {
        setForm({ company: '', position: '', interview_date: '', max_uses: 1, expire_days: 3 });
        await fetchInvites();
      }
    } catch (e) {
      console.error('Failed to create invite', e);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateOpenInvite = async () => {
    setCreating(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          company: null,
          position: null,
          interview_date: null,
          max_uses: 9999,
          expire_days: 90,
        }),
      });
      if (resp.ok) {
        await fetchInvites();
      }
    } catch (e) {
      console.error('Failed to create open invite', e);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (invite: Invite) => {
    try {
      await navigator.clipboard.writeText(invite.code);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // fallback
    }
  };

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatus = (invite: Invite) => {
    const expired = new Date(invite.expires_at) < new Date();
    const usedUp = invite.used_count >= invite.max_uses;
    if (usedUp) return { label: t('admin.invite.usedUp'), className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
    if (expired) return { label: t('admin.invite.expired'), className: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' };
    return { label: t('admin.invite.active'), className: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  return (
    <div className="space-y-5">
      <BentoCard
        title={t('admin.invite.openTitle')}
        subtitle={t('admin.invite.openSubtitle')}
        accent="emerald"
        icon={Sparkles}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-text-muted max-w-md">
            {t('admin.invite.openDescription')}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateOpenInvite}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors whitespace-nowrap"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {t('admin.invite.openButton')}
          </motion.button>
        </div>
      </BentoCard>

      <BentoCard
        title={t('admin.invite.create')}
        subtitle={t('admin.invite.subtitle')}
        accent="blue"
        icon={Ticket}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldRow
            label={t('admin.invite.company')}
            placeholder={t('admin.invite.companyPlaceholder')}
            value={form.company}
            onChange={(v) => setForm((f) => ({ ...f, company: v }))}
          />
          <FieldRow
            label={t('admin.invite.position')}
            placeholder={t('admin.invite.positionPlaceholder')}
            value={form.position}
            onChange={(v) => setForm((f) => ({ ...f, position: v }))}
          />
          <FieldRow
            label={t('admin.invite.date')}
            type="date"
            value={form.interview_date}
            onChange={(v) => setForm((f) => ({ ...f, interview_date: v }))}
          />
          <NumberField
            label={t('admin.invite.maxUses')}
            value={form.max_uses}
            min={1}
            max={100}
            onChange={(v) => setForm((f) => ({ ...f, max_uses: v }))}
          />
          <NumberField
            label={t('admin.invite.expireDays')}
            value={form.expire_days}
            min={1}
            max={90}
            onChange={(v) => setForm((f) => ({ ...f, expire_days: v }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Ticket size={12} />}
            {t('admin.invite.create')}
          </motion.button>
        </div>
      </BentoCard>

      <BentoCard
        title={t('admin.invite.listTitle')}
        subtitle={`${invites.length} ${lang === 'zh' ? '条记录' : 'records'}`}
        accent="purple"
        icon={Database}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 size={20} className="animate-spin mr-2" /> 加载中...
          </div>
        ) : invites.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-muted">{t('admin.invite.empty')}</div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => {
              const status = getStatus(invite);
              return (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springTransition}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-base border border-border-subtle"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-text-primary tracking-wider">
                        {invite.code}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {invite.company && <span className="mr-2">{invite.company}</span>}
                      {invite.position && <span className="mr-2">{invite.position}</span>}
                      {invite.interview_date && <span className="mr-2">{invite.interview_date}</span>}
                      <span>
                        {t('admin.invite.used')}: {invite.used_count}/
                        {invite.max_uses >= 9999 ? t('admin.invite.unlimited') : invite.max_uses}
                      </span>
                      <span className="mx-1">·</span>
                      <span>{t('admin.invite.expires')}: {formatExpiry(invite.expires_at)}</span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(invite)}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-border hover:bg-bg-card text-text-secondary transition-colors"
                  >
                    {copiedId === invite.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    {copiedId === invite.id ? t('admin.invite.copied') : t('admin.invite.copy')}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </BentoCard>
    </div>
  );
};

// ── Bento UI 子组件 ──

const AssistantCard = ({
  active,
  onClick,
  label,
  description,
  icon: Icon,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
  icon: any;
  color: 'emerald' | 'blue';
}) => {
  const activeClass = color === 'emerald'
    ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-2 border-emerald-500/40 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.2)]'
    : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-2 border-blue-500/40 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.2)]';
  const dotColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  const iconBg = color === 'emerald' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-blue-500/15 text-blue-600';

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-2xl text-left transition-all ${
        active
          ? activeClass
          : 'bg-bg-card border border-border hover:border-text-muted/30'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? iconBg : 'bg-bg-base text-text-muted'}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm tracking-tight">{label}</span>
            {active && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />}
          </div>
          <p className="text-[10px] text-text-muted">{description}</p>
        </div>
      </div>
    </motion.button>
  );
};

const SubTabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
      active
        ? 'bg-bg-base text-text-primary shadow-sm'
        : 'text-text-muted hover:text-text-primary'
    }`}
  >
    <Icon size={13} />
    {label}
  </button>
);

const BentoCard = ({
  title,
  subtitle,
  accent,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  accent: 'blue' | 'emerald' | 'purple' | 'cyan' | 'orange';
  icon: any;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) => {
  const accentColors: Record<string, string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    orange: 'bg-orange-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="p-5 rounded-2xl border border-border-subtle bg-bg-card hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2 h-2 rounded-full ${accentColors[accent]} flex-shrink-0`} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-1.5">
              <Icon size={14} className="text-text-muted" />
              {title}
            </h3>
            {subtitle && <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[11px] text-text-muted hover:text-rose-500 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <RotateCcw size={10} />
            {action.label}
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
};

const ToggleRow = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: () => void }) => (
  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-base border border-border-subtle">
    <div className="min-w-0">
      <div className="text-xs font-medium text-text-primary">{label}</div>
      {description && <div className="text-[10px] text-text-muted mt-0.5">{description}</div>}
    </div>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onChange}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      style={{ height: '1.4rem' }}
    >
      <motion.span
        layout
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  </div>
);

const FieldRow = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) => (
  <div>
    <label className="block text-[11px] font-medium text-text-secondary mb-1.5">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors"
    />
    {hint && <p className="text-[10px] text-text-muted mt-1 font-mono">{hint}</p>}
  </div>
);

const NumberField = ({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: number;
  max?: number;
}) => (
  <div>
    <label className="block text-[11px] font-medium text-text-secondary mb-1.5">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      min={min}
      max={max}
      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors font-mono"
    />
  </div>
);

const SaveBar = ({ saving, message, onSave, onRefresh }: { saving: boolean; message: string; onSave: () => void; onRefresh: () => void }) => (
  <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-bg-base/80 backdrop-blur-xl border-t border-border-subtle flex items-center gap-3">
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
    >
      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      {saving ? '保存中...' : '保存配置'}
    </motion.button>
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onRefresh}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border hover:bg-bg-card text-text-secondary font-medium transition-colors"
    >
      <RotateCcw size={11} />
      刷新
    </motion.button>
    {message && (
      <motion.span
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        className={`text-xs flex items-center gap-1 ${
          message.includes('失败') || message.includes('出错') ? 'text-rose-500' : 'text-emerald-500'
        }`}
      >
        {message.includes('失败') || message.includes('出错') ? null : <Check size={11} />}
        {message}
      </motion.span>
    )}
  </div>
);

// ── 左侧目录导航 ──

interface NavItem {
  key: 'dashboard' | 'kb' | 'aisettings' | 'invites' | 'users' | 'notes';
  label: string;
  icon: any;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
    description: '访问趋势与用户数据分析',
  },
  {
    key: 'kb',
    label: '知识库',
    icon: Database,
    description: 'RAG 检索与文档治理',
  },
  {
    key: 'users',
    label: '用户管理',
    icon: Users,
    description: '用户账号、角色与状态管理',
  },
  {
    key: 'notes',
    label: '笔记管理',
    icon: FileText,
    description: 'Markdown 笔记、AI 批注与发布',
  },
  {
    key: 'aisettings',
    label: 'AI 助理设置',
    icon: Sparkles,
    description: '模型配置与系统提示词',
  },
  {
    key: 'invites',
    label: '面试官邀请码',
    icon: Ticket,
    description: '生成与管理面试官邀请码',
  },
];

const smoothEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

const Sidebar = ({
  activeTab,
  onSelect,
  collapsed,
  onToggle,
  onNavigateHome,
}: {
  activeTab: NavItem['key'];
  onSelect: (key: NavItem['key']) => void;
  collapsed: boolean;
  onToggle: () => void;
  onNavigateHome: () => void;
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col border-r border-border-subtle bg-bg-card/50 backdrop-blur-xl flex-shrink-0 overflow-hidden"
    >
      {/* Sidebar header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border-subtle flex-shrink-0">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="title"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={smoothEase}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_2px_6px_-1px_rgba(59,130,246,0.4)] flex-shrink-0">
                <Wrench size={13} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-tight truncate">管理后台</div>
                <div className="text-[10px] text-text-muted truncate">Owner only</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggle}
          className={`p-1.5 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors flex-shrink-0 ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? '展开菜单' : '折叠菜单'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </motion.button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <div className="px-2.5 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
            功能菜单
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <motion.button
              key={item.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 rounded-xl transition-all relative group ${
                collapsed ? 'justify-center h-10 w-12 mx-auto' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-base border border-transparent'
              }`}
            >
              {isActive && !collapsed && (
                <motion.div
                  layoutId="admin-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={15} className="flex-shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={smoothEase}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="text-xs font-semibold truncate">{item.label}</div>
                    <div className="text-[10px] text-text-muted truncate mt-0.5">{item.description}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        <div className={`my-3 border-t border-border-subtle ${collapsed ? 'mx-2' : ''}`} />

        {!collapsed && (
          <div className="px-2.5 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
            快捷跳转
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNavigateHome}
          title={collapsed ? '返回主页' : undefined}
          className={`w-full flex items-center gap-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-base transition-colors ${
            collapsed ? 'justify-center h-10 w-12 mx-auto' : 'px-3 py-2.5'
          }`}
        >
          <Home size={14} className="flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={smoothEase}
                className="text-xs font-medium"
              >
                返回主页
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </nav>

      {/* Footer status */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-border-subtle flex-shrink-0">
          <div className="px-2.5 py-2 rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/10">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-text-secondary">系统正常</span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">所有服务运行中</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

// ── 主页面 ──

export const AdminPage = ({ onNavigate }: { onNavigate: (hash: string) => void }) => {
  const { t, lang } = useI18n();
  const { user, authHeaders, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem['key']>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const authHeadersFn = useCallback(() => authHeaders() as Record<string, string>, [authHeaders]);

  // 权限检查
  if (!user || user.is_guest) {
    return (
      <div className="min-h-[100dvh] bg-bg-base flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.4)]">
            <SettingsIcon size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">{t('admin.title')}</h1>
          <p className="text-text-secondary mb-6 text-sm">{t('admin.requireLogin')}</p>
          <div className="flex gap-3 justify-center">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openAuthModal}
              className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              {t('admin.requireLogin')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('')}
              className="px-6 py-2 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-bg-card transition-colors"
            >
              {t('admin.back')}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'owner') {
    return (
      <div className="min-h-[100dvh] bg-bg-base flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <SettingsIcon size={28} className="text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">{t('admin.title')}</h1>
          <p className="text-rose-500 mb-6 text-sm">{t('admin.requireOwner')}</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('')}
            className="px-6 py-2 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-bg-card transition-colors"
          >
            {t('admin.back')}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-base text-text-primary font-sans antialiased flex">
      {/* Left sidebar - collapsible navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelect={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onNavigateHome={() => onNavigate('')}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header - 与 ChatPage 一致的标签按钮组 */}
        <div className="h-14 border-b border-border bg-bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-xs text-text-muted">
                {lang === 'zh' ? '管理后台' : 'Admin Panel'}
              </div>
              <div className="h-4 w-px bg-border-subtle" />
              <div className="text-xs text-text-primary font-medium truncate">
                {activeTab === 'dashboard'
                  ? t('dashboard.title')
                  : activeTab === 'kb'
                    ? (lang === 'zh' ? '知识库' : 'Knowledge Base')
                    : activeTab === 'users'
                      ? t('admin.users.title')
                      : activeTab === 'notes'
                        ? t('admin.notes.title')
                        : activeTab === 'aisettings'
                          ? (lang === 'zh' ? 'AI 助理设置' : 'AI Settings')
                          : t('admin.invite.title')}
              </div>
            </div>
          </div>
          {/* 右侧：标签导航（嵌入框线内） */}
          <PageHeaderTabs current="admin" onNavigate={onNavigate} variant="inline" />
        </div>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full">
            {/* Tab 内容 */}
            {activeTab === 'dashboard' ? (
              <div className="px-4 sm:px-6 py-4">
                <DashboardTab authHeaders={authHeadersFn} />
              </div>
            ) : activeTab === 'kb' ? (
              <div className="h-full rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
                <KBManagement authHeaders={authHeadersFn} hideHeaderTitle={true} />
              </div>
            ) : activeTab === 'users' ? (
              <UserManagementTab authHeaders={authHeadersFn} />
            ) : activeTab === 'notes' ? (
              <NotesManagementTab authHeaders={authHeadersFn} />
            ) : activeTab === 'aisettings' ? (
              <div className="px-4 sm:px-6 py-4">
                <AISettingsTab authHeaders={authHeadersFn} />
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-4">
                <InviteManagementTab authHeaders={authHeadersFn} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

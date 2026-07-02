/**
 * 知识库管理组件 — 可复用于 AdminPage 与 ChatPage 侧滑面板
 *
 * 包含：KB 列表、创建、链接到 AI 助手、删除、文档上传、URL 抓取、检索测试、分块预览
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Trash2,
  FileText,
  Link as LinkIcon,
  Plus,
  X,
  Eye,
  Database,
  Globe,
  Check,
  AlertCircle,
  Upload,
  Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// ── 类型定义 ──

export interface KB {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  is_linked?: boolean;
  linked_for_visitor?: boolean;
  linked_for_demo?: boolean;
  document_count?: number;
  created_at?: string;
}

interface Document {
  id: string;
  kb_id: string;
  title: string;
  source_type: string;
  source_path: string;
  status: string;
  chunk_count: number;
  total_tokens: number;
  error_message?: string;
  created_at?: string;
  processed_at?: string;
}

interface SearchResult {
  chunk_id: string;
  content: string;
  score: number;
  source: string;
}

interface Chunk {
  id: string;
  doc_id: string;
  kb_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  created_at?: string;
}

interface DocumentChunksData {
  document: Document;
  profile: {
    char_count: number;
    token_count: number;
    chunk_count: number;
  };
  chunks: Chunk[];
}

// ── 状态徽章 ──

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  parsing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  chunking: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  embedding: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  ready: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {({
      pending: '待处理',
      parsing: '解析中',
      chunking: '分块中',
      embedding: '向量化',
      ready: '就绪',
      error: '错误',
    } as Record<string, string>)[status] || status}
  </span>
);

// ── 工具函数 ──

const formatDate = (timestamp?: number | string) => {
  if (!timestamp) return '';
  const d = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// ── 主组件 ──

export interface KBManagementProps {
  authHeaders: () => Record<string, string>;
  /** 紧凑模式：用于 ChatPage 侧滑面板，隐藏一些高级设置 */
  compact?: boolean;
  /** 默认选中的 KB id */
  initialKbId?: string | null;
  /** 关闭回调（用于侧滑面板） */
  onClose?: () => void;
  /** 在管理后台嵌入时隐藏标题（避免与页面头部重复） */
  hideHeaderTitle?: boolean;
}

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

export const KBManagement = ({ authHeaders, compact = false, initialKbId, onClose, hideHeaderTitle = false }: KBManagementProps) => {
  const [kbs, setKbs] = useState<KB[]>([]);
  const [currentKbId, setCurrentKbId] = useState<string | null>(initialKbId || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'search'>('overview');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchKbs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/kb`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setKbs(data);
        if (data.length > 0 && !currentKbId) {
          setCurrentKbId(data[0].id);
        } else if (currentKbId && !data.find((kb: KB) => kb.id === currentKbId)) {
          setCurrentKbId(data[0]?.id || null);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authHeaders, currentKbId]);

  useEffect(() => {
    fetchKbs();
  }, [fetchKbs]);

  const handleCreateKb = async (name: string, description: string, isPublic: boolean) => {
    const resp = await fetch(`${API_BASE}/api/kb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, description: description || null, is_public: isPublic }),
    });
    if (resp.ok) {
      await fetchKbs();
    }
  };

  const handleToggleLink = async (kbId: string, mode: string = 'both') => {
    const resp = await fetch(`${API_BASE}/api/kb/${kbId}/link?mode=${mode}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (resp.ok) {
      await fetchKbs();
    }
  };

  const handleDeleteKb = async (kbId: string) => {
    if (!confirm('确认删除此知识库及其所有文档？此操作不可恢复！')) return;
    const resp = await fetch(`${API_BASE}/api/kb/${kbId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (resp.ok) {
      if (currentKbId === kbId) {
        setCurrentKbId(null);
      }
      await fetchKbs();
    }
  };

  const currentKb = kbs.find(kb => kb.id === currentKbId);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)]">
            <Database size={15} className="text-white" />
          </div>
          {!hideHeaderTitle && (
            <div className="min-w-0">
              <div className="font-semibold text-sm tracking-tight truncate">知识库管理</div>
              <div className="text-[11px] text-text-muted">RAG 检索与文档治理</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={fetchKbs}
            className="p-2 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors"
            title="刷新"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </motion.button>
          {onClose && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors"
              title="关闭"
            >
              <X size={15} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={`mx-auto px-5 py-5 space-y-5 ${compact ? 'max-w-full' : 'max-w-5xl'}`}>
          {/* KB 概览卡片 */}
          <KBCards
            kbs={kbs}
            currentKbId={currentKbId}
            onSelect={setCurrentKbId}
            onCreate={handleCreateKb}
            onToggleLink={handleToggleLink}
            onDelete={handleDeleteKb}
            showCreate={showCreate}
            setShowCreate={setShowCreate}
            compact={compact}
          />

          {/* Tab 切换 - 只在有选中 KB 时显示 */}
          {currentKb && (
            <>
              <div className="flex gap-1 p-1 bg-bg-card border border-border-subtle rounded-xl">
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={Database}
                  label="概览"
                />
                <TabButton
                  active={activeTab === 'documents'}
                  onClick={() => setActiveTab('documents')}
                  icon={FileText}
                  label="文档"
                />
                <TabButton
                  active={activeTab === 'search'}
                  onClick={() => setActiveTab('search')}
                  icon={Search}
                  label="检索测试"
                />
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={springTransition}
                  >
                    <KBOverviewTab kb={currentKb} onToggleLink={handleToggleLink} />
                  </motion.div>
                )}
                {activeTab === 'documents' && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={springTransition}
                  >
                    <DocumentsTab kbId={currentKbId!} authHeaders={authHeaders} />
                  </motion.div>
                )}
                {activeTab === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={springTransition}
                  >
                    <SearchTab kbId={currentKbId!} authHeaders={authHeaders} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {!currentKb && kbs.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-border rounded-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Database size={24} className="text-blue-500" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">还没有知识库</h3>
              <p className="text-xs text-text-muted mb-4">创建你的第一个知识库以启用 RAG 检索</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                <Plus size={13} /> 新建知识库
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── 子组件：Tab 按钮 ──

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
      active
        ? 'bg-bg-base text-text-primary shadow-sm'
        : 'text-text-muted hover:text-text-primary'
    }`}
  >
    <Icon size={13} />
    {label}
  </button>
);

// ── 子组件：KB 卡片列表 ──

const KBCards = ({
  kbs,
  currentKbId,
  onSelect,
  onCreate,
  onToggleLink,
  onDelete,
  showCreate,
  setShowCreate,
  compact,
}: {
  kbs: KB[];
  currentKbId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, description: string, isPublic: boolean) => Promise<void>;
  onToggleLink: (kbId: string, mode?: string) => Promise<void>;
  onDelete: (kbId: string) => Promise<void>;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  compact?: boolean;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), description.trim(), isPublic);
      setName('');
      setDescription('');
      setIsPublic(false);
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">知识库</h3>
          <p className="text-[11px] text-text-muted">选择知识库以管理文档、链接到 AI 助理</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          {showCreate ? <X size={12} /> : <Plus size={12} />}
          {showCreate ? '取消' : '新建'}
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2.5">
              <input
                type="text"
                placeholder="知识库名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg-card border border-border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="描述（可选）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg-card border border-border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                公开（访客助手可见）
              </label>
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="w-full py-2 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
              >
                {creating ? '创建中...' : '确认创建'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {kbs.length > 0 && (
        <div className={`grid gap-2.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {kbs.map(kb => (
            <KBCard
              key={kb.id}
              kb={kb}
              active={kb.id === currentKbId}
              onSelect={() => onSelect(kb.id)}
              onToggleLink={onToggleLink}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── 子组件：单个 KB 卡片 ──

const KBCard = ({ kb, active, onSelect, onToggleLink, onDelete }: {
  kb: KB;
  active: boolean;
  onSelect: () => void;
  onToggleLink: (kbId: string, mode?: string) => Promise<void>;
  onDelete: (kbId: string) => Promise<void>;
}) => {
  const linkedCount = (kb.linked_for_visitor ? 1 : 0) + (kb.linked_for_demo ? 1 : 0);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`group p-3.5 rounded-xl border cursor-pointer transition-all ${
        active
          ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.15)]'
          : 'border-border bg-bg-card hover:border-blue-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Database size={13} className="text-blue-500 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-text-primary truncate">{kb.name}</h4>
          </div>
          {kb.description && (
            <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{kb.description}</p>
          )}
        </div>
        {active && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {kb.is_public ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Globe size={9} /> 公开
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
            私有
          </span>
        )}
        {kb.linked_for_visitor && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-green-500/10 text-green-600">
            <Check size={9} /> 访客
          </span>
        )}
        {kb.linked_for_demo && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-600">
            <Check size={9} /> Demo
          </span>
        )}
        {linkedCount === 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-500">
            未链接
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>{kb.document_count ?? 0} 篇文档</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLink(kb.id, 'both'); }}
            className="p-1 hover:bg-blue-500/10 rounded text-text-muted hover:text-blue-500 transition-colors"
            title="链接到 AI 助理"
          >
            <LinkIcon size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(kb.id); }}
            className="p-1 hover:bg-rose-500/10 rounded text-text-muted hover:text-rose-500 transition-colors"
            title="删除"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── 子组件：概览 Tab ──

const KBOverviewTab = ({ kb, onToggleLink }: { kb: KB; onToggleLink: (kbId: string, mode?: string) => Promise<void> }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 rounded-xl border border-border bg-bg-card">
        <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">AI 助理链接</div>
        <div className="space-y-2">
          <LinkRow
            label="访客助手"
            active={!!kb.linked_for_visitor}
            color="emerald"
            onToggle={() => onToggleLink(kb.id, 'visitor')}
          />
          <LinkRow
            label="AI 问答"
            active={!!kb.linked_for_demo}
            color="blue"
            onToggle={() => onToggleLink(kb.id, 'demo')}
          />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-bg-card">
        <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">元数据</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-text-muted">可见性</span>
            <span className="text-text-primary font-medium">{kb.is_public ? '公开' : '私有'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">文档数</span>
            <span className="text-text-primary font-mono">{kb.document_count ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">创建时间</span>
            <span className="text-text-primary font-mono text-[11px]">{formatDate(kb.created_at) || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">ID</span>
            <span className="text-text-muted font-mono text-[10px] truncate ml-2 max-w-[140px]">{kb.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LinkRow = ({ label, active, color, onToggle }: { label: string; active: boolean; color: 'emerald' | 'blue'; onToggle: () => void }) => {
  const colorClass = active
    ? color === 'emerald'
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
      : 'bg-blue-500/10 border-blue-500/30 text-blue-600'
    : 'bg-bg-base border-border text-text-muted';
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${colorClass}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${active ? (color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-300'}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
          active
            ? 'hover:bg-rose-500/10 hover:text-rose-600'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {active ? '取消' : '链接'}
      </button>
    </div>
  );
};

// ── 子组件：文档 Tab ──

const DocumentsTab = ({ kbId, authHeaders }: { kbId: string; authHeaders: () => Record<string, string> }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [fetching, setFetching] = useState(false);
  const [chunksModal, setChunksModal] = useState<{
    open: boolean;
    docId: string | null;
    data: DocumentChunksData | null;
    loading: boolean;
  }>({ open: false, docId: null, data: null, loading: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!kbId) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/kb/${kbId}/documents`, {
        headers: authHeaders(),
      });
      if (resp.ok) {
        const data = await resp.json();
        setDocuments(data);
      }
    } finally {
      setLoading(false);
    }
  }, [kbId, authHeaders]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    const hasPending = documents.some(d =>
      ['pending', 'parsing', 'chunking', 'embedding'].includes(d.status)
    );
    if (hasPending) {
      pollRef.current = setInterval(fetchDocs, 2000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [documents, fetchDocs]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!kbId || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      const fileArr = Array.from(files);
      let response;
      if (fileArr.length === 1) {
        formData.append('file', fileArr[0]);
        response = await fetch(`${API_BASE}/api/kb/${kbId}/documents`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        });
      } else {
        fileArr.forEach(f => formData.append('files', f));
        response = await fetch(`${API_BASE}/api/kb/${kbId}/documents/batch`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        });
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        alert(`上传失败: ${errorData.detail || response.statusText}`);
        return;
      }
      await fetchDocs();
    } catch (error) {
      alert(`上传出错: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlFetch = async () => {
    if (!kbId || !urlInput.trim()) return;
    setFetching(true);
    try {
      const response = await fetch(`${API_BASE}/api/kb/${kbId}/documents/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ url: urlInput.trim(), title: urlTitle.trim() || undefined }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'URL fetch failed' }));
        alert(`URL抓取失败: ${errorData.detail || response.statusText}`);
        return;
      }
      setUrlInput('');
      setUrlTitle('');
      await fetchDocs();
    } catch (error) {
      alert(`URL抓取出错: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('确认删除此文档及其所有分块？')) return;
    await fetch(`${API_BASE}/api/kb/documents/${docId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await fetchDocs();
  };

  const handleViewChunks = async (docId: string) => {
    setChunksModal({ open: true, docId, data: null, loading: true });
    try {
      const resp = await fetch(`${API_BASE}/api/kb/documents/${docId}/chunks`, {
        headers: authHeaders(),
      });
      if (resp.ok) {
        const data = await resp.json();
        setChunksModal({ open: true, docId, data, loading: false });
      } else {
        setChunksModal({ open: false, docId: null, data: null, loading: false });
      }
    } catch {
      setChunksModal({ open: false, docId: null, data: null, loading: false });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      {/* 上传区 */}
      <div className="p-3.5 rounded-xl border border-border bg-bg-card space-y-3">
        <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          <Upload size={12} /> 上传文档
        </h3>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-border-subtle hover:border-blue-500/50 hover:bg-blue-500/[0.02]'
          }`}
        >
          {uploading ? (
            <Loader2 size={20} className="mx-auto text-blue-500 mb-1.5 animate-spin" />
          ) : (
            <Upload size={20} className="mx-auto text-text-muted mb-1.5" />
          )}
          <p className="text-xs text-text-secondary">拖拽文件或点击上传</p>
          <p className="text-[10px] text-text-muted mt-0.5">支持 .md .txt .html .json .pdf .docx</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.txt,.html,.json,.pdf,.docx"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* URL 抓取 */}
        <div className="pt-2.5 border-t border-border-subtle space-y-2">
          <p className="text-[10px] text-text-muted">或从 URL 抓取</p>
          <input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-bg-base border border-border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="标题（可选）"
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-bg-base border border-border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleUrlFetch}
            disabled={fetching || !urlInput.trim()}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            <LinkIcon size={12} /> {fetching ? '抓取中...' : '抓取'}
          </button>
        </div>
      </div>

      {/* 文档列表 */}
      <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border-subtle">
          <h3 className="text-xs font-semibold text-text-primary">文档列表 ({documents.length})</h3>
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="p-8 text-center text-xs text-text-muted">暂无文档</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 hover:bg-bg-base/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={12} className="text-text-muted flex-shrink-0" />
                      <span className="text-xs font-medium text-text-primary truncate">{doc.title}</span>
                      <StatusBadge status={doc.status} />
                    </div>
                    <p className="text-[10px] text-text-muted truncate">{doc.source_path}</p>
                    {doc.error_message && (
                      <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={9} /> {doc.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-text-muted font-mono mr-1">{doc.chunk_count || 0}</span>
                    {doc.status === 'ready' && (
                      <button
                        onClick={() => handleViewChunks(doc.id)}
                        className="p-1 rounded text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="查看分块"
                      >
                        <Eye size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分块预览模态框 */}
      <AnimatePresence>
        {chunksModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setChunksModal({ open: false, docId: null, data: null, loading: false })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={springTransition}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[80vh] rounded-2xl border border-border bg-bg-base shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {chunksModal.data?.document.title || 'Document Chunks'}
                  </h3>
                  {chunksModal.data && (
                    <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                      {chunksModal.data.profile.chunk_count} chunks · {chunksModal.data.profile.token_count} tokens
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setChunksModal({ open: false, docId: null, data: null, loading: false })}
                  className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {chunksModal.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                  </div>
                ) : chunksModal.data ? (
                  chunksModal.data.chunks.map((chunk, idx) => (
                    <div key={chunk.id} className="p-3 rounded-lg border border-border-subtle bg-bg-card">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-text-muted">#{idx + 1} (chunk_{chunk.chunk_index})</span>
                        <span className="text-[10px] text-text-muted font-mono">{chunk.token_count} tokens</span>
                      </div>
                      <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{chunk.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-text-muted py-12">加载失败</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── 子组件：检索测试 Tab ──

const SearchTab = ({ kbId, authHeaders }: { kbId: string; authHeaders: () => Record<string, string> }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!kbId || !query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const resp = await fetch(`${API_BASE}/api/kb/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ query: query.trim(), kb_id: kbId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setResults(data.results || []);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3.5 rounded-xl border border-border bg-bg-card">
        <h3 className="text-xs font-semibold text-text-primary mb-2.5 flex items-center gap-1.5">
          <Search size={12} /> 检索测试
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="输入查询关键词..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 text-sm bg-bg-base border border-border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            搜索
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {hasSearched && results.length === 0 && (
          <p className="p-8 text-center text-xs text-text-muted border border-dashed border-border rounded-xl">无结果</p>
        )}
        {results.map((r, idx) => (
          <motion.div
            key={r.chunk_id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, ...springTransition }}
            className="p-3 rounded-lg border border-border bg-bg-card"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-text-muted">#{idx + 1}</span>
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span>score: <span className="font-mono text-blue-500 font-semibold">{r.score.toFixed(4)}</span></span>
                <span className="font-mono truncate max-w-[120px]">{r.source}</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{r.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

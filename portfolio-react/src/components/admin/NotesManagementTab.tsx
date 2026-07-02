/**
 * 笔记管理 Tab（taste-skill 设计规范）
 *
 * 功能：
 * - 左侧笔记列表（可左折叠）+ 搜索/状态/分类筛选
 * - 中间 Markdown 编辑器 + 实时预览
 * - 右侧 AI 辅助面板（可右折叠）：摘要/AI 批注/标签
 * - 支持新建、保存、删除、AI 批注、发布、同步到知识库
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Plus,
  Loader2,
  Save,
  Trash2,
  Sparkles,
  Send,
  Database,
  Tag,
  Check,
  Eye,
  Edit3,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FolderOpen,
  AlignLeft,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { MarkdownRenderer } from '../knowledge/MarkdownRenderer';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };
const smoothEase = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

interface Note {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  summary?: string;
  ai_notes?: string;
  metadata?: Record<string, unknown>;
  is_kb_synced?: boolean;
  kb_id?: string;
  kb_doc_id?: string;
  published_at?: string;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

interface TagCount {
  name: string;
  usage_count: number;
  color: string;
}

const STATUSES = ['draft', 'published', 'archived'];

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'archived':
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  }
};

const formatDate = (iso?: string, lang: 'en' | 'zh' = 'zh') => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseTagsInput = (input: string): string[] =>
  input
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

export const NotesManagementTab = ({ authHeaders }: { authHeaders: () => Record<string, string> }) => {
  const { t, lang } = useI18n();
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tags, setTags] = useState<TagCount[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [dirty, setDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      const resp = await fetch(`${API_BASE}/api/admin/notes?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (resp.ok) {
        const data = await resp.json();
        setNotes(data.items || []);
        setTotal(data.total || 0);

        const cats = new Set<string>();
        (data.items || []).forEach((n: Note) => {
          if (n.category?.trim()) cats.add(n.category.trim());
        });
        setCategories(Array.from(cats).sort((a, b) => a.localeCompare(b, 'zh-CN')));
      }
    } catch (e) {
      console.error('Failed to fetch notes', e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, debouncedSearch, statusFilter, tagFilter, categoryFilter, offset]);

  const fetchTags = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/admin/tags`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setTags(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch tags', e);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);

  const loadNoteIntoEditor = (note: Note | null, newNote: boolean) => {
    setSelectedNote(note);
    setIsNew(newNote);
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setDescription(note?.description || '');
    setCategory(note?.category || '');
    setTagsInput((note?.tags || []).join(', '));
    setStatus(note?.status || 'draft');
    setDirty(false);
    setSaveMessage('');
    setSaveError(false);
  };

  const createNewNote = () => {
    loadNoteIntoEditor(null, true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const selectNote = (note: Note) => {
    if (dirty && !window.confirm(t('admin.notes.unsavedConfirm'))) return;
    loadNoteIntoEditor(note, false);
  };

  const handleFieldChange = (field: 'title' | 'content' | 'tags' | 'status' | 'description' | 'category', value: string) => {
    setDirty(true);
    if (field === 'title') setTitle(value);
    if (field === 'content') setContent(value);
    if (field === 'description') setDescription(value);
    if (field === 'category') setCategory(value);
    if (field === 'tags') setTagsInput(value);
    if (field === 'status') setStatus(value as Note['status']);
  };

  const showMessage = (msg: string, isError = false) => {
    setSaveMessage(msg);
    setSaveError(isError);
    setTimeout(() => {
      setSaveMessage('');
      setSaveError(false);
    }, isError ? 5000 : 3000);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showMessage(t('admin.notes.titleRequired'), true);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        description,
        category,
        tags: parseTagsInput(tagsInput),
        status,
      };
      if (isNew) {
        const resp = await fetch(`${API_BASE}/api/admin/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          showMessage(detail.detail || t('admin.notes.createFailed'), true);
        } else {
          const note = await resp.json();
          loadNoteIntoEditor(note, false);
          showMessage(t('admin.notes.saved'));
          await fetchNotes();
          await fetchTags();
        }
      } else if (selectedNote) {
        const resp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          showMessage(detail.detail || t('admin.notes.saveFailed'), true);
        } else {
          const note = await resp.json();
          loadNoteIntoEditor(note, false);
          showMessage(t('admin.notes.saved'));
          await fetchNotes();
          await fetchTags();
        }
      }
    } catch (e) {
      showMessage(t('admin.notes.saveError'), true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm(t('admin.notes.deleteConfirm'))) return;
    setDeleteLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        showMessage(detail.detail || t('admin.notes.deleteFailed'), true);
      } else {
        loadNoteIntoEditor(null, false);
        await fetchNotes();
        await fetchTags();
      }
    } catch (e) {
      showMessage(t('admin.notes.deleteError'), true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedNote) {
      await handleSave();
      return;
    }
    setPublishLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        showMessage(detail.detail || t('admin.notes.publishFailed'), true);
      } else {
        const note = await resp.json();
        loadNoteIntoEditor(note, false);
        showMessage(t('admin.notes.published'));
        await fetchNotes();
      }
    } catch (e) {
      showMessage(t('admin.notes.publishError'), true);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleImportMd = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 如果还没有新建或选中笔记，自动进入新建模式
    if (!isNew && !selectedNote) {
      loadNoteIntoEditor(null, true);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      // 提取第一个 # 标题作为笔记标题
      const titleMatch = text.match(/^#\s+(.+)$/m);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.md$/i, '');

      // 提取标题后第一段非空文字作为描述
      let extractedDesc = '';
      if (titleMatch) {
        const afterTitle = text.slice((titleMatch.index || 0) + titleMatch[0].length);
        const paraMatch = afterTitle.match(/\n\n(.+?)(?:\n\n|\n#|\n```|$)/s);
        if (paraMatch) {
          extractedDesc = paraMatch[1].replace(/\n/g, ' ').trim().slice(0, 200);
        }
      }

      setTitle(extractedTitle);
      setContent(text);
      if (extractedDesc && !description) {
        setDescription(extractedDesc);
      }
      setDirty(true);
    };
    reader.readAsText(file);

    // 重置 input 以便重复导入同一文件
    e.target.value = '';
  };

  const handleAiAnnotate = async () => {
    if (!selectedNote) {
      await handleSave();
      return;
    }
    setAiLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}/ai-annotate`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        showMessage(detail.detail || t('admin.notes.aiFailed'), true);
      } else {
        const noteResp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}`, {
          headers: authHeaders(),
        });
        if (noteResp.ok) {
          const note = await noteResp.json();
          loadNoteIntoEditor(note, false);
          showMessage(t('admin.notes.aiDone'));
          await fetchNotes();
          await fetchTags();
        }
      }
    } catch (e) {
      showMessage(t('admin.notes.aiError'), true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSyncToKB = async () => {
    if (!selectedNote) {
      await handleSave();
      return;
    }
    setSyncLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}/sync-to-kb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({}),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        showMessage(detail.detail || t('admin.notes.syncFailed'), true);
      } else {
        const noteResp = await fetch(`${API_BASE}/api/admin/notes/${selectedNote.id}`, {
          headers: authHeaders(),
        });
        if (noteResp.ok) {
          const note = await noteResp.json();
          loadNoteIntoEditor(note, false);
          showMessage(t('admin.notes.synced'));
          await fetchNotes();
        }
      }
    } catch (e) {
      showMessage(t('admin.notes.syncError'), true);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex min-h-0">
      {/* 左侧笔记列表 — 可折叠（layout 驱动 transform 动画） */}
      <motion.div
        layout
        transition={springTransition}
        className={`relative flex-shrink-0 flex flex-col rounded-2xl border border-border-subtle bg-bg-card/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_-12px_rgba(0,0,0,0.06)] ${leftOpen ? 'w-72 mr-3' : 'w-11 mr-3'}`}
      >
        <motion.div
          initial={false}
          animate={{ opacity: leftOpen ? 1 : 0 }}
          transition={smoothEase}
          className={`absolute inset-0 flex flex-col ${leftOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div className="p-3 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <FileText size={13} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-primary tracking-tight truncate">{t('admin.notes.title')}</h3>
                <p className="text-[10px] text-text-muted">{total} {lang === 'zh' ? '篇笔记' : 'notes'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={createNewNote}
                className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title={t('admin.notes.create')}
              >
                <Plus size={14} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setLeftOpen(false)}
                className="p-1.5 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
                title={lang === 'zh' ? '收起左栏' : 'Collapse sidebar'}
              >
                <PanelLeftClose size={14} />
              </motion.button>
            </div>
          </div>

          <div className="p-3 space-y-2 border-b border-border-subtle flex-shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.notes.search')}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
              >
                <option value="">{t('admin.notes.allStatuses')}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`admin.notes.status.${s}`)}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setOffset(0); }}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
              >
                <option value="">{t('admin.notes.allCategories')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setOffset(0); }}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
            >
              <option value="">{t('admin.notes.allTags')}</option>
              {tags.map((tag) => (
                <option key={tag.name} value={tag.name}>{tag.name} ({tag.usage_count})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-text-muted">
                <Loader2 size={18} className="animate-spin mr-2" /> {t('dashboard.loading')}
              </div>
            ) : notes.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={24} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">{t('admin.notes.empty')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => {
                  const isActive = selectedNote?.id === note.id;
                  return (
                    <motion.button
                      key={note.id}
                      onClick={() => selectNote(note)}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={springTransition}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30'
                          : 'bg-bg-base border-border-subtle hover:border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-text-primary line-clamp-1">{note.title || t('admin.notes.untitled')}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusBadgeClass(note.status)}`}>
                          {t(`admin.notes.status.${note.status}`)}
                        </span>
                      </div>
                      {note.category && (
                        <div className="text-[10px] text-text-muted mb-1 flex items-center gap-1">
                          <FolderOpen size={9} />
                          <span className="truncate">{note.category}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-text-muted line-clamp-2 mb-1.5">
                        {note.description || note.content?.slice(0, 80).replace(/#/g, '') || t('admin.notes.noContent')}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(note.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-bg-card text-text-muted border border-border-subtle">
                            {tag}
                          </span>
                        ))}
                        {(note.tags || []).length > 3 && (
                          <span className="text-[9px] text-text-muted">+{(note.tags || []).length - 3}</span>
                        )}
                      </div>
                      <div className="text-[9px] text-text-muted mt-1.5 flex items-center gap-1">
                        <Clock size={9} />
                        {formatDate(note.updated_at, lang)}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {total > limit && (
            <div className="p-2 border-t border-border-subtle flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="px-2 py-1 text-[10px] rounded-lg border border-border hover:bg-bg-card disabled:opacity-40 transition-colors"
              >
                {t('admin.notes.prev')}
              </button>
              <span className="text-[10px] text-text-muted">{offset + 1}-{Math.min(offset + limit, total)}</span>
              <button
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= total}
                className="px-2 py-1 text-[10px] rounded-lg border border-border hover:bg-bg-card disabled:opacity-40 transition-colors"
              >
                {t('admin.notes.next')}
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: leftOpen ? 0 : 1 }}
          transition={smoothEase}
          className={`absolute inset-0 flex flex-col items-center py-3 ${leftOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setLeftOpen(true)}
            className="p-2 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors mb-2"
            title={lang === 'zh' ? '展开左栏' : 'Expand sidebar'}
          >
            <PanelLeftOpen size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={createNewNote}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title={t('admin.notes.create')}
          >
            <Plus size={16} />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* 中间编辑区 + 预览 */}
      <motion.div
        layout
        transition={springTransition}
        className="flex-[2] min-w-0 flex flex-col rounded-2xl border border-border-subtle bg-bg-card/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_-12px_rgba(0,0,0,0.06)]"
      >
        {!selectedNote && !isNew ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springTransition}
              className="w-16 h-16 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center mb-4"
            >
              <Edit3 size={24} />
            </motion.div>
            <p className="text-sm font-medium">{t('admin.notes.selectOrCreate')}</p>
            <p className="text-[11px] mt-1">{t('admin.notes.selectHint')}</p>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border-subtle flex items-center gap-3 flex-shrink-0">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder={t('admin.notes.titlePlaceholder')}
                className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-none focus:outline-none text-text-primary placeholder:text-text-muted"
              />
              <select
                value={status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="px-2.5 py-1.5 text-[11px] rounded-lg border border-border bg-bg-base focus:border-blue-500 focus:outline-none transition-colors appearance-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`admin.notes.status.${s}`)}</option>
                ))}
              </select>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleImportMd}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-border hover:bg-bg-card text-text-secondary transition-colors whitespace-nowrap"
                title={t('admin.notes.importMd')}
              >
                <Upload size={11} />
                <span className="hidden sm:inline">{t('admin.notes.importMd')}</span>
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="px-3 py-2 border-b border-border-subtle grid grid-cols-1 lg:grid-cols-2 gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen size={12} className="text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder={t('admin.notes.categoryPlaceholder')}
                  className="flex-1 min-w-0 text-[11px] bg-transparent border-none focus:outline-none text-text-primary placeholder:text-text-muted"
                />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Tag size={12} className="text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => handleFieldChange('tags', e.target.value)}
                  placeholder={t('admin.notes.tagsPlaceholder')}
                  className="flex-1 min-w-0 text-[11px] bg-transparent border-none focus:outline-none text-text-primary placeholder:text-text-muted"
                />
              </div>
              <div className="flex items-center gap-2 min-w-0 lg:col-span-2">
                <AlignLeft size={12} className="text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder={t('admin.notes.descriptionPlaceholder')}
                  className="flex-1 min-w-0 text-[11px] bg-transparent border-none focus:outline-none text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 flex">
              <div className={`flex-1 min-w-0 flex flex-col ${previewMode ? 'hidden lg:flex' : 'flex'}`}>
                <textarea
                  value={content}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  placeholder={t('admin.notes.contentPlaceholder')}
                  className="flex-1 w-full p-4 text-xs leading-relaxed bg-bg-base border-none focus:outline-none resize-none font-mono text-text-primary custom-scrollbar"
                  spellCheck={false}
                />
              </div>
              <div className={`flex-1 min-w-0 overflow-y-auto custom-scrollbar p-4 bg-bg-base/50 border-l border-border-subtle ${previewMode ? 'flex' : 'hidden lg:block'}`}>
                <div className="text-[10px] text-text-muted mb-2 flex items-center gap-1">
                  <Eye size={10} /> {t('admin.notes.preview')}
                </div>
                <MarkdownRenderer content={content} />
              </div>
            </div>

            <div className="p-3 border-t border-border-subtle flex items-center justify-between flex-shrink-0 bg-bg-base/80 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPreviewMode((p) => !p)}
                  className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 text-[11px] rounded-lg border border-border hover:bg-bg-card text-text-secondary transition-colors"
                >
                  {previewMode ? <Edit3 size={11} /> : <Eye size={11} />}
                  {previewMode ? t('admin.notes.edit') : t('admin.notes.preview')}
                </motion.button>
                {saveMessage && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-[11px] ${saveError ? 'text-rose-500' : 'text-emerald-500'}`}
                  >
                    {saveMessage}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedNote && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] rounded-lg border border-rose-200 hover:bg-rose-500/5 text-rose-500 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    {t('admin.notes.delete')}
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {saving ? t('admin.notes.saving') : t('admin.notes.save')}
                </motion.button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* 右侧 AI 辅助面板 — 可折叠（layout 驱动 transform 动画） */}
      <motion.div
        layout
        transition={springTransition}
        className={`relative flex-shrink-0 flex flex-col rounded-2xl border border-border-subtle bg-bg-card/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_-12px_rgba(0,0,0,0.06)] ${rightOpen ? 'w-72 ml-3' : 'w-11 ml-3'}`}
      >
        <motion.div
          initial={false}
          animate={{ opacity: rightOpen ? 1 : 0 }}
          transition={smoothEase}
          className={`absolute inset-0 flex flex-col ${rightOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div className="h-12 border-b border-border-subtle flex items-center justify-between px-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500" />
              <span className="text-sm font-semibold text-text-primary">{t('admin.notes.aiPanel')}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setRightOpen(false)}
              className="p-1.5 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
              title={lang === 'zh' ? '收起右栏' : 'Collapse AI panel'}
            >
              <PanelRightClose size={14} />
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {!selectedNote && !isNew ? (
              <div className="py-8 text-center text-text-muted text-xs">
                {t('admin.notes.aiHint')}
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="p-3 rounded-xl bg-bg-base border border-border-subtle">
                  <div className="text-[11px] font-semibold text-text-secondary mb-2 flex items-center gap-1">
                    <FileText size={11} />
                    {t('admin.notes.summary')}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {selectedNote?.summary || t('admin.notes.noSummary')}
                  </p>
                </div>

                {/* AI Notes */}
                <div className="p-3 rounded-xl bg-bg-base border border-border-subtle">
                  <div className="text-[11px] font-semibold text-text-secondary mb-2 flex items-center gap-1">
                    <Sparkles size={11} />
                    {t('admin.notes.aiNotes')}
                  </div>
                  {selectedNote?.ai_notes ? (
                    <ul className="space-y-1.5">
                      {selectedNote.ai_notes
                        .split('\n')
                        .filter((line) => line.trim())
                        .map((line, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-relaxed">
                            <CheckCircle2 size={11} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{line.trim().replace(/^[\-\*]\s*/, '')}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-text-muted">{t('admin.notes.noAiNotes')}</p>
                  )}
                </div>

                {/* Suggested Tags */}
                <div className="p-3 rounded-xl bg-bg-base border border-border-subtle">
                  <div className="text-[11px] font-semibold text-text-secondary mb-2 flex items-center gap-1">
                    <Tag size={11} />
                    {t('admin.notes.suggestedTags')}
                  </div>
                  {(selectedNote?.tags || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedNote?.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-muted">{t('admin.notes.noTags')}</p>
                  )}
                </div>

                {/* KB Status */}
                {selectedNote?.is_kb_synced && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
                    <Check size={12} className="text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{t('admin.notes.syncedToKB')}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 border-t border-border-subtle space-y-2 flex-shrink-0 bg-bg-base/80 backdrop-blur-xl">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAiAnnotate}
              disabled={aiLoading || (!selectedNote && !isNew)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {aiLoading ? t('admin.notes.aiAnnotating') : t('admin.notes.aiAnnotate')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handlePublish}
              disabled={publishLoading || (!selectedNote && !isNew)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {publishLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {publishLoading ? t('admin.notes.publishing') : t('admin.notes.publish')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSyncToKB}
              disabled={syncLoading || (!selectedNote && !isNew)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border hover:bg-bg-card disabled:opacity-50 text-text-secondary font-medium transition-colors"
            >
              {syncLoading ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              {syncLoading ? t('admin.notes.syncing') : t('admin.notes.syncToKB')}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: rightOpen ? 0 : 1 }}
          transition={smoothEase}
          className={`absolute inset-0 flex flex-col items-center py-3 ${rightOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setRightOpen(true)}
            className="p-2 rounded-lg hover:bg-bg-base text-text-muted hover:text-text-primary transition-colors"
            title={lang === 'zh' ? '展开 AI 辅助' : 'Expand AI panel'}
          >
            <PanelRightOpen size={16} />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

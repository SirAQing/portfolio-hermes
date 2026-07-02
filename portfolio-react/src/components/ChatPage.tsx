/**
 * AI 问答页面 — 全屏深度对话
 *
 * 升级内容（taste-skill 设计规范）：
 * - 左侧强化会话管理：搜索、按日期分组、重命名、消息计数
 * - 知识库管理侧滑面板（独立组件）
 * - 全局页头由 GlobalPageHeader 统一提供
 * - 液态玻璃 + 弹簧物理 + Bento 风格
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  Globe,
  User,
  Bot,
  Sparkles,
  ArrowLeft,
  Search,
  PanelRightOpen,
  PanelRightClose,
  Pencil,
  Check,
  X as XIcon,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { ThinkingProcess, chatMdComponents, type AgentSubEvent } from './FloatingAssistant';
import { KBManagement, type KB } from './knowledge/KBManagement';
import { PageHeaderTabs } from './PageHeaderTabs';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface Message {
  role: 'user' | 'ai';
  content: string;
  streaming?: boolean;
  subEvents?: AgentSubEvent[];
  sources?: any[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  convId?: string;
  createdAt: number;
  updatedAt: number;
}

const GUEST_ID_KEY = 'hermes_chat_guest_id';

function getStorageKey(user: ReturnType<typeof useAuth>['user']): string {
  if (!user || user.is_guest) {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = generateId();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return `hermes_chat_conversations_guest_${guestId}`;
  }
  return `hermes_chat_conversations_user_${user.email || user.id || 'unknown'}`;
}

function loadConversations(user: ReturnType<typeof useAuth>['user']): Conversation[] {
  try {
    const data = localStorage.getItem(getStorageKey(user));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[], user: ReturnType<typeof useAuth>['user']) {
  localStorage.setItem(getStorageKey(user), JSON.stringify(convs));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };
const smoothEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

// ── 日期分组工具 ──

type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'earlier';

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date();
  const d = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 86400000;
  const diff = startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (diff <= 0) return 'today';
  if (diff <= oneDay) return 'yesterday';
  if (diff <= oneDay * 7) return 'thisWeek';
  if (diff <= oneDay * 14) return 'lastWeek';
  return 'earlier';
}

const DATE_GROUP_LABELS: Record<DateGroup, { zh: string; en: string }> = {
  today: { zh: '今天', en: 'Today' },
  yesterday: { zh: '昨天', en: 'Yesterday' },
  thisWeek: { zh: '本周', en: 'This Week' },
  lastWeek: { zh: '上周', en: 'Last Week' },
  earlier: { zh: '更早', en: 'Earlier' },
};

const DATE_GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'earlier'];

// ── 主组件 ──

export const ChatPage = ({ onNavigate }: { onNavigate: (hash: string) => void }) => {
  const { t, lang } = useI18n();
  const { user, authHeaders: getAuthHeaders, openAuthModal, refreshUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 新增：会话管理功能
  const [convSearchQuery, setConvSearchQuery] = useState('');
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 新增：知识库管理面板
  const [kbPanelOpen, setKbPanelOpen] = useState(false);
  const [linkedKbs, setLinkedKbs] = useState<KB[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingTimerRef = useRef<number | null>(null);

  const authHeaders = useCallback(() => {
    return getAuthHeaders() as Record<string, string>;
  }, [getAuthHeaders]);

  const isOwner = user?.role === 'owner';

  // 按当前登录用户隔离会话历史
  useEffect(() => {
    const convs = loadConversations(user);
    setConversations(convs);
    if (convs.length > 0) {
      setActiveConvId(convs[0].id);
    } else {
      const newConv: Conversation = {
        id: generateId(),
        title: lang === 'zh' ? '新对话' : 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations([newConv]);
      setActiveConvId(newConv.id);
      saveConversations([newConv], user);
    }
    // 切换用户时关闭 KB 面板，防止权限泄漏
    setKbPanelOpen(false);
  }, [user, lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId, conversations]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputValue]);

  // 加载 owner 已链接到 AI 助手的知识库（公开接口，访客也可查看）
  const fetchKbs = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/kb/linked`);
      if (resp.ok) {
        const data = await resp.json();
        setLinkedKbs(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchKbs();
  }, [fetchKbs]);

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  const updateConversation = useCallback((convId: string, updater: (conv: Conversation) => Conversation) => {
    setConversations(prev => {
      const updated = prev.map(c => c.id === convId ? updater(c) : c);
      saveConversations(updated, user);
      return updated;
    });
  }, [user]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: generateId(),
      title: lang === 'zh' ? '新对话' : 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveConversations(updated, user);
      return updated;
    });
    setActiveConvId(newConv.id);
    setInputValue('');
  };

  const deleteConversation = (convId: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== convId);
      saveConversations(updated, user);
      if (activeConvId === convId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
        } else {
          const newConv: Conversation = {
            id: generateId(),
            title: lang === 'zh' ? '新对话' : 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          saveConversations([newConv], user);
          setActiveConvId(newConv.id);
          return [newConv];
        }
      }
      return updated;
    });
  };

  const startRename = (conv: Conversation) => {
    setRenamingConvId(conv.id);
    setRenameValue(conv.title);
  };

  const commitRename = () => {
    if (renamingConvId && renameValue.trim()) {
      updateConversation(renamingConvId, c => ({ ...c, title: renameValue.trim().slice(0, 60) }));
    }
    setRenamingConvId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingConvId(null);
    setRenameValue('');
  };

  // 过滤 + 分组会话
  const filteredAndGroupedConvs = useMemo(() => {
    const q = convSearchQuery.trim().toLowerCase();
    const filtered = q
      ? conversations.filter(c => c.title.toLowerCase().includes(q))
      : conversations;
    const groups: Record<DateGroup, Conversation[]> = {
      today: [], yesterday: [], thisWeek: [], lastWeek: [], earlier: [],
    };
    filtered.forEach(c => {
      groups[getDateGroup(c.updatedAt)].push(c);
    });
    return groups;
  }, [conversations, convSearchQuery]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSending || !activeConvId) return;

    setInputValue('');
    setIsSending(true);
    setLoadingStage(0);
    clearLoadingTimer();

    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingStage(1);
      loadingTimerRef.current = window.setTimeout(() => {
        setLoadingStage(2);
      }, 3000);
    }, 1500);

    const conv = conversations.find(c => c.id === activeConvId);
    const newMessages: Message[] = [...(conv?.messages || []), { role: 'user', content: text }];

    const isFirstMessage = !conv || conv.messages.length === 0;
    const title = isFirstMessage ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : conv.title;

    updateConversation(activeConvId, c => ({
      ...c,
      title,
      messages: [...newMessages, { role: 'ai', content: '', streaming: true, subEvents: [] }],
      updatedAt: Date.now(),
    }));

    const aiMsgIndex = newMessages.length;

    try {
      const resp = await fetch(`${API_BASE}/api/chat/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          conversation_id: conv?.convId,
          message: text,
          web_search_enabled: webSearchEnabled,
          mode: 'demo',
        }),
      });

      if (resp.status === 403) {
        clearLoadingTimer();
        updateConversation(activeConvId, c => ({
          ...c,
          messages: c.messages.map((m, i) => i === aiMsgIndex ? {
            role: 'ai',
            content: lang === 'zh' ? '您的访客配额已用完，请登录后继续对话。' : 'Guest quota exceeded. Please login to continue.',
            streaming: false,
          } : m),
        }));
        openAuthModal();
        return;
      }

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullReply = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'conv_id') {
              updateConversation(activeConvId, c => ({ ...c, convId: data.conversation_id }));
            } else if (data.type === 'think') {
              clearLoadingTimer();
              setLoadingStage(0);
              updateConversation(activeConvId, c => {
                const msg = c.messages[aiMsgIndex];
                const subEvents = [...(msg.subEvents || [])];
                const last = subEvents[subEvents.length - 1];
                const iter = data.iteration || 0;
                if (last && last.kind === 'think' && last.iteration === iter) {
                  subEvents[subEvents.length - 1] = {
                    ...last,
                    content: last.content + data.content,
                  };
                } else {
                  subEvents.push({
                    kind: 'think' as const,
                    content: data.content,
                    iteration: iter,
                  });
                }
                return {
                  ...c,
                  messages: c.messages.map((m, i) => i === aiMsgIndex ? { ...m, subEvents } : m),
                };
              });
            } else if (data.type === 'tool_call') {
              updateConversation(activeConvId, c => {
                const msg = c.messages[aiMsgIndex];
                const newSubEvents = [...(msg.subEvents || []), {
                  kind: 'tool_call' as const,
                  tool: data.tool,
                  input: data.input,
                  iteration: data.iteration || 0,
                }];
                return {
                  ...c,
                  messages: c.messages.map((m, i) => i === aiMsgIndex ? { ...m, subEvents: newSubEvents } : m),
                };
              });
            } else if (data.type === 'tool_result') {
              updateConversation(activeConvId, c => {
                const msg = c.messages[aiMsgIndex];
                if (!msg.subEvents) return c;
                let targetIdx = -1;
                for (let i = msg.subEvents.length - 1; i >= 0; i--) {
                  const ev = msg.subEvents[i];
                  if (ev.kind === 'tool_call' && ev.tool === data.tool && ev.output === undefined) {
                    targetIdx = i;
                    break;
                  }
                }
                if (targetIdx === -1) return c;
                const newSubEvents = msg.subEvents.map((ev, i) =>
                  i === targetIdx ? { ...ev, output: data.output, error: data.error || undefined } : ev
                );
                return {
                  ...c,
                  messages: c.messages.map((m, i) => i === aiMsgIndex ? { ...m, subEvents: newSubEvents } : m),
                };
              });
            } else if (data.type === 'chunk') {
              clearLoadingTimer();
              setLoadingStage(0);
              fullReply += data.content;
              updateConversation(activeConvId, c => ({
                ...c,
                messages: c.messages.map((m, i) => i === aiMsgIndex ? { ...m, content: fullReply, streaming: true } : m),
              }));
            } else if (data.type === 'done') {
              updateConversation(activeConvId, c => ({
                ...c,
                messages: c.messages.map((m, i) => i === aiMsgIndex ? { ...m, streaming: false } : m),
              }));
              refreshUser();
            } else if (data.type === 'error') {
              clearLoadingTimer();
              updateConversation(activeConvId, c => ({
                ...c,
                messages: c.messages.map((m, i) => i === aiMsgIndex ? {
                  role: 'ai',
                  content: `${data.error || 'Agent error'}`,
                  streaming: false,
                } : m),
              }));
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      updateConversation(activeConvId, c => ({
        ...c,
        messages: c.messages.map((m, i) => i === aiMsgIndex && m.streaming ? { ...m, streaming: false } : m),
      }));
    } catch {
      const errorMsg = lang === 'zh' ? '网络错误，请重试' : 'Network error, please try again';
      updateConversation(activeConvId, c => ({
        ...c,
        messages: c.messages.map((m, i) => i === aiMsgIndex ? { role: 'ai', content: errorMsg, streaming: false } : m),
      }));
    } finally {
      clearLoadingTimer();
      setLoadingStage(0);
      setIsSending(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInputValue(text);
    setTimeout(() => handleSend(), 0);
  };

  const quickActions = lang === 'zh'
    ? [
        { text: '介绍一下你的技术栈', icon: Sparkles },
        { text: '你有哪些代表性项目？', icon: MessageSquare },
        { text: '解释一下RAG是什么', icon: Bot },
        { text: '如何联系你？', icon: User },
      ]
    : [
        { text: 'Tell me about your tech stack', icon: Sparkles },
        { text: 'What are your notable projects?', icon: MessageSquare },
        { text: 'Explain what RAG is', icon: Bot },
        { text: 'How can I contact you?', icon: User },
      ];

  return (
    <div className="min-h-[100dvh] flex bg-bg-base text-text-primary font-sans antialiased overflow-hidden">
      {/* ───── 左侧：会话管理 ───── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={smoothEase}
            className="h-[100dvh] bg-bg-card border-r border-border flex flex-col overflow-hidden flex-shrink-0 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            {/* Sidebar Header */}
            <div className="px-4 pt-4 pb-3 border-b border-border-subtle flex-shrink-0">
              <button
                onClick={() => onNavigate('/')}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-3 group"
              >
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                {lang === 'zh' ? '返回主页' : 'Back to Home'}
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={createNewConversation}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-text-primary text-bg-base rounded-xl font-medium text-xs transition-all hover:opacity-90 shadow-sm"
              >
                <Plus size={14} />
                {lang === 'zh' ? '新建对话' : 'New Chat'}
              </motion.button>
            </div>

            {/* 搜索 */}
            <div className="px-3 py-2.5 border-b border-border-subtle flex-shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={convSearchQuery}
                  onChange={(e) => setConvSearchQuery(e.target.value)}
                  placeholder={lang === 'zh' ? '搜索对话...' : 'Search chats...'}
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-bg-base border border-border-subtle rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* 会话列表（按日期分组） */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {DATE_GROUP_ORDER.map(group => {
                const convs = filteredAndGroupedConvs[group];
                if (convs.length === 0) return null;
                return (
                  <div key={group} className="mb-3">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
                      {DATE_GROUP_LABELS[group][lang === 'zh' ? 'zh' : 'en']} · {convs.length}
                    </div>
                    <div className="space-y-0.5">
                      {convs.map((conv, idx) => (
                        <ConversationItem
                          key={conv.id}
                          conv={conv}
                          active={conv.id === activeConvId}
                          renaming={renamingConvId === conv.id}
                          renameValue={renameValue}
                          setRenameValue={setRenameValue}
                          onSelect={() => setActiveConvId(conv.id)}
                          onDelete={() => deleteConversation(conv.id)}
                          onStartRename={() => startRename(conv)}
                          onCommitRename={commitRename}
                          onCancelRename={cancelRename}
                          index={idx}
                          lang={lang}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {conversations.length === 0 && (
                <p className="p-6 text-center text-xs text-text-muted">
                  {lang === 'zh' ? '还没有对话\n点击上方按钮开始' : 'No conversations yet'}
                </p>
              )}
              {convSearchQuery && filteredAndGroupedConvs.today.length + filteredAndGroupedConvs.yesterday.length + filteredAndGroupedConvs.thisWeek.length + filteredAndGroupedConvs.lastWeek.length + filteredAndGroupedConvs.earlier.length === 0 && (
                <p className="p-6 text-center text-xs text-text-muted">
                  {lang === 'zh' ? '无匹配对话' : 'No matches'}
                </p>
              )}
            </div>

            {/* 知识库连接状态（固定底部） */}
            <div className="border-t border-border-subtle p-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${linkedKbs.length > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span className="text-[11px] text-text-secondary truncate">
                    {linkedKbs.length > 0
                      ? (lang === 'zh' ? `已链接 ${linkedKbs.length} 个知识库` : `${linkedKbs.length} KB linked`)
                      : (lang === 'zh' ? '未链接知识库' : 'No KB linked')}
                  </span>
                </div>
                {isOwner && (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setKbPanelOpen(true)}
                    className="text-[10px] text-blue-500 hover:text-blue-600 font-medium transition-colors flex-shrink-0"
                  >
                    {lang === 'zh' ? '管理' : 'Manage'}
                  </motion.button>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── 中间：主对话区 ───── */}
      <div className="flex-1 flex flex-col h-[100dvh] min-w-0">
        {/* Header - 包含标签按钮组（参考笔记页） */}
        <div className="h-14 border-b border-border bg-bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-bg-card-hover rounded-lg transition-colors text-text-secondary"
              title={sidebarOpen ? '收起侧栏' : '展开侧栏'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </motion.button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)]">
                <Sparkles size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm tracking-tight truncate">
                  {lang === 'zh' ? 'AI 智能助手' : 'AI Assistant'}
                </div>
                <div className="text-[10px] text-text-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {lang === 'zh' ? 'RAG + Agent 在线' : 'RAG + Agent Online'}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：标签导航（嵌入框线内） + KB 切换按钮 */}
          <div className="flex items-center gap-2">
            <PageHeaderTabs current="chat" onNavigate={onNavigate} variant="inline" />
            {isOwner && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setKbPanelOpen(!kbPanelOpen)}
                className={`p-2 rounded-full transition-all ${
                  kbPanelOpen
                    ? 'bg-blue-500 text-white shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)]'
                    : 'bg-bg-pill shadow-sm border border-border-subtle text-text-primary hover:text-accent'
                }`}
                title={lang === 'zh' ? '知识库管理' : 'Knowledge Base'}
              >
                {kbPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              </motion.button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
                className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center mb-8 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.4)] relative"
              >
                <Bot size={36} className="text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-bg-base animate-pulse" />
              </motion.div>
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, ...springTransition }}
                className="text-2xl font-semibold text-text-primary mb-3 tracking-tight"
              >
                {lang === 'zh' ? '你好，我是 AI 助手' : 'Hello, I am AI Assistant'}
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, ...springTransition }}
                className="text-text-secondary text-center max-w-lg mb-10 text-sm leading-relaxed"
              >
                {lang === 'zh'
                  ? '基于 RAG 检索增强生成和 Agent 智能体技术，我可以回答关于我的经历、项目、技术栈的问题，也可以联网搜索最新信息。'
                  : 'Powered by RAG and Agent technology. Ask me about experience, projects, tech stack, or search the web.'}
              </motion.p>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, ...springTransition }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full"
              >
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98, y: -1 }}
                      onClick={() => handleQuickAction(action.text)}
                      className="p-5 text-left rounded-[1.5rem] border border-border bg-bg-card hover:border-blue-300/60 dark:hover:border-blue-700/50 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-3">
                        <Icon size={18} className="text-blue-500" />
                      </div>
                      <div className="text-sm font-medium text-text-primary group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {action.text}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          ) : (
            <div className="w-full py-6 px-4 sm:px-5">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springTransition}
                  className={`flex gap-3 mb-6 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-[0_2px_8px_-1px_rgba(59,130,246,0.3)] mt-0.5">
                      <Bot size={15} className="text-white" />
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'max-w-[85%]' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-[1.25rem] rounded-tr-md shadow-[0_4px_12px_-4px_rgba(59,130,246,0.4)]">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {msg.subEvents && msg.subEvents.length > 0 && (
                          <ThinkingProcess
                            subEvents={msg.subEvents}
                            streaming={msg.streaming || false}
                            t={t}
                            lang={lang}
                          />
                        )}
                        {msg.content && (
                          <div className="text-[15px] leading-relaxed text-text-primary mt-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMdComponents}>
                              {msg.content}
                            </ReactMarkdown>
                            {msg.streaming && (
                              <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle rounded-full"></span>
                            )}
                          </div>
                        )}
                        {!msg.content && msg.streaming && loadingStage === 0 && (
                          <div className="flex gap-1.5 mt-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                        {!msg.content && msg.streaming && loadingStage > 0 && (
                          <div className="text-text-muted text-sm mt-3 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            {lang === 'zh'
                              ? loadingStage === 1 ? '正在思考...' : '正在检索相关信息...'
                              : loadingStage === 1 ? 'Thinking...' : 'Retrieving information...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <User size={15} className="text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-bg-card/80 backdrop-blur-xl p-4 flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_-1px_3px_rgba(0,0,0,0.03)]">
          <div className="w-full px-0 sm:px-1">
            <div className="flex items-end gap-2 bg-bg-card rounded-[1.25rem] border border-border p-2 focus-within:border-blue-400/60 dark:focus-within:border-blue-600/50 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                  webSearchEnabled
                    ? 'bg-blue-500 text-white shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)]'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-base'
                }`}
                title={webSearchEnabled
                  ? (lang === 'zh' ? '联网优先模式（已开启）- 将优先使用网络搜索' : 'Web-first mode (enabled) - Web search first')
                  : (lang === 'zh' ? '智能联网模式（默认）- 知识库无结果时自动联网' : 'Smart mode (default) - Auto web search when KB has no results')}
              >
                <Globe size={18} />
              </motion.button>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={webSearchEnabled
                  ? (lang === 'zh' ? '联网优先模式：输入问题搜索网络...' : 'Web-first mode: Search the web...')
                  : (lang === 'zh' ? '输入你的问题... (Enter发送，Shift+Enter换行)' : 'Type your message... (Enter to send, Shift+Enter for newline)')}
                rows={1}
                className="flex-1 bg-transparent px-1 py-2.5 resize-none outline-none text-sm max-h-40 leading-relaxed placeholder:text-text-muted"
                disabled={isSending}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-text-muted text-white rounded-xl transition-all shadow-[0_2px_8px_-1px_rgba(59,130,246,0.4)] disabled:shadow-none flex-shrink-0"
              >
                <Send size={18} />
              </motion.button>
            </div>
            <p className="text-center text-[10px] text-text-muted mt-2.5">
              {lang === 'zh' ? 'AI 可能会出错，请核实重要信息' : 'AI may make mistakes. Please verify important information.'}
            </p>
          </div>
        </div>
      </div>

      {/* ───── 右侧：知识库管理面板（侧滑，仅 owner） ───── */}
      <AnimatePresence>
        {isOwner && kbPanelOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={springTransition}
            className="h-[100dvh] w-[460px] max-w-[90vw] bg-bg-card border-l border-border flex-shrink-0 flex flex-col overflow-hidden shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.08)] z-20"
          >
            <KBManagement
              authHeaders={authHeaders}
              compact
              onClose={() => setKbPanelOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── 子组件：会话项 ──

const ConversationItem = ({
  conv,
  active,
  renaming,
  renameValue,
  setRenameValue,
  onSelect,
  onDelete,
  onStartRename,
  onCommitRename,
  onCancelRename,
  index,
  lang,
}: {
  conv: Conversation;
  active: boolean;
  renaming: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onSelect: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  index: number;
  lang: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const messageCount = conv.messages.length;
  const lastMessage = conv.messages[conv.messages.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), ...smoothEase }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
        active
          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
          : 'hover:bg-bg-card-hover text-text-secondary border border-transparent'
      }`}
      onClick={renaming ? undefined : onSelect}
    >
      <MessageSquare size={12} className="flex-shrink-0" />
      {renaming ? (
        <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename();
              if (e.key === 'Escape') onCancelRename();
            }}
            autoFocus
            className="flex-1 px-1.5 py-0.5 text-xs bg-bg-card border border-blue-500/40 rounded focus:outline-none min-w-0"
          />
          <button
            onClick={onCommitRename}
            className="p-0.5 text-emerald-500 hover:bg-emerald-500/10 rounded"
          >
            <Check size={11} />
          </button>
          <button
            onClick={onCancelRename}
            className="p-0.5 text-rose-500 hover:bg-rose-500/10 rounded"
          >
            <XIcon size={11} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{conv.title}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <span>{messageCount} {lang === 'zh' ? '条' : 'msgs'}</span>
              {lastMessage && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[80px]">
                    {lastMessage.role === 'user' ? lang === 'zh' ? '你' : 'You' : lang === 'zh' ? 'AI' : 'AI'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-0.5 transition-opacity ${hovered || active ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onStartRename(); }}
              className="p-1 hover:bg-blue-500/10 rounded text-text-muted hover:text-blue-500 transition-colors"
              title={lang === 'zh' ? '重命名' : 'Rename'}
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(lang === 'zh' ? '确认删除此对话？' : 'Delete this conversation?')) onDelete(); }}
              className="p-1 hover:bg-rose-500/10 rounded text-text-muted hover:text-rose-500 transition-colors"
              title={lang === 'zh' ? '删除' : 'Delete'}
            >
              <Trash2 size={10} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Briefcase, GitFork, HelpCircle, Mail, ChevronDown, Brain, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import avatarImg from '../assets/avatar.jpg';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Chat-appropriate markdown components — lightweight, no document-style formatting
export const chatMdComponents: Components = {
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-blue-600 dark:text-blue-400">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 space-y-0.5 list-disc pl-5 marker:text-text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-0.5 list-decimal pl-5 marker:text-text-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    return isInline
      ? <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[0.9em] font-mono" {...props}>{children}</code>
      : <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="my-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 overflow-x-auto text-[13px] leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-4 border-l-2 border-blue-500/40 text-text-secondary/80 italic bg-blue-50/50 dark:bg-blue-950/20 py-1 pr-2 rounded-r">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-border-subtle">
      <table className="w-full text-xs text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-bg-section-alt border-b border-border-subtle">{children}</thead>,
  th: ({ children }) => <th className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-2.5 py-1.5 border-t border-border-subtle/50">{children}</td>,
  hr: () => <hr className="my-3 border-border-subtle" />,
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[15px] font-semibold mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-medium mt-2 mb-0.5">{children}</h4>,
  h5: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-0.5">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-medium mt-2 mb-0.5">{children}</h6>,
};

// ── Agent 事件类型 ──

export interface ThinkEvent {
  kind: 'think';
  content: string;
  iteration: number;
}

export interface ToolCallEvent {
  kind: 'tool_call';
  tool: string;
  input: Record<string, unknown> | string;
  iteration: number;
  output?: string;
  error?: string;
}

export type AgentSubEvent = ThinkEvent | ToolCallEvent;

interface Message {
  role: 'ai' | 'user';
  content: string;
  streaming?: boolean;
  /** Agent 子事件（思考/工具调用），按顺序排列 */
  subEvents?: AgentSubEvent[];
}

// ── 统一的思考推理过程面板 ──

interface IterationGroup {
  iteration: number;
  think?: ThinkEvent;
  tools: ToolCallEvent[];
}

const groupEventsByIteration = (events: AgentSubEvent[]): IterationGroup[] => {
  const groups: Map<number, IterationGroup> = new Map();
  for (const ev of events) {
    if (!groups.has(ev.iteration)) {
      groups.set(ev.iteration, { iteration: ev.iteration, tools: [] });
    }
    const group = groups.get(ev.iteration)!;
    if (ev.kind === 'think') {
      group.think = ev;
    } else {
      group.tools.push(ev);
    }
  }
  return Array.from(groups.values()).sort((a, b) => a.iteration - b.iteration);
};

const getToolStatus = (tool: ToolCallEvent): 'running' | 'success' | 'error' => {
  if (tool.error) return 'error';
  if (tool.output !== undefined) return 'success';
  return 'running';
};

const ToolCallItem = ({ tool, isLast, t }: { tool: ToolCallEvent; isLast: boolean; t: (k: string) => string }) => {
  const [expanded, setExpanded] = useState(false);
  const status = getToolStatus(tool);
  const inputStr = typeof tool.input === 'string' ? tool.input : JSON.stringify(tool.input, null, 2);
  const truncatedInput = inputStr.length > 80 ? inputStr.slice(0, 80) + '...' : inputStr;

  const statusIcon = {
    running: <Loader2 size={12} className="text-blue-500 animate-spin" />,
    success: <CheckCircle2 size={12} className="text-blue-500" />,
    error: <XCircle size={12} className="text-red-500" />,
  }[status];

  const borderColor = {
    running: 'border-blue-500/30 bg-blue-500/5',
    success: 'border-blue-500/20 bg-blue-500/5',
    error: 'border-red-500/20 bg-red-500/5',
  }[status];

  return (
    <div className={`relative pl-5 ${!isLast ? 'pb-2' : ''}`}>
      {!isLast && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-blue-500/20" />}
      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111111] flex items-center justify-center"
        style={{ background: status === 'running' ? '#3b82f6' : status === 'success' ? '#3b82f6' : '#ef4444' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border ${borderColor} hover:brightness-95 transition-all`}
      >
        {statusIcon}
        <Wrench size={11} className={status === 'error' ? 'text-red-500' : status === 'success' ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'} />
        <span className={`font-medium ${status === 'error' ? 'text-red-600 dark:text-red-400' : status === 'success' ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}>
          {tool.tool}
        </span>
        <span className="text-text-muted font-mono text-[10px] truncate flex-1 text-left">{truncatedInput}</span>
        <ChevronDown size={11} className={`text-text-muted transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-2 p-2 rounded-md bg-black/5 dark:bg-white/5 text-[11px] space-y-1.5">
              <div>
                <div className="text-text-muted font-medium mb-0.5">{t('chat.tool_call')}</div>
                <pre className="whitespace-pre-wrap break-words text-text-secondary font-mono leading-relaxed">{inputStr}</pre>
              </div>
              {tool.output && (
                <div>
                  <div className="text-text-muted font-medium mb-0.5">{t('chat.tool_result')}</div>
                  <pre className={`whitespace-pre-wrap break-words font-mono leading-relaxed max-h-32 overflow-y-auto ${tool.error ? 'text-red-500' : 'text-text-secondary'}`}>
                    {tool.output.length > 600 ? tool.output.slice(0, 600) + '\n...' : tool.output}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ThinkingProcess = ({ subEvents, streaming, t, lang }: { subEvents: AgentSubEvent[]; streaming: boolean; t: (k: string) => string; lang: string }) => {
  const [expanded, setExpanded] = useState(false);
  const userToggledRef = useRef(false);
  const groups = groupEventsByIteration(subEvents);
  const hasActiveEvents = groups.length > 0;

  const latestGroup = groups[groups.length - 1];
  const isThinking = streaming && latestGroup && !latestGroup.think?.content;
  const hasRunningTool = streaming && latestGroup?.tools.some(t => t.output === undefined && !t.error);
  const isActivelyThinking = streaming && (isThinking || hasRunningTool || hasActiveEvents);

  useEffect(() => {
    if (isActivelyThinking) {
      if (!userToggledRef.current) {
        setExpanded(true);
      }
    } else {
      userToggledRef.current = false;
      setExpanded(false);
    }
  }, [isActivelyThinking]);

  const handleToggle = () => {
    userToggledRef.current = true;
    setExpanded(!expanded);
  };

  const getGroupStatus = (group: IterationGroup, idx: number): 'thinking' | 'running' | 'done' | 'error' => {
    const hasError = group.tools.some(t => t.error);
    if (hasError) return 'error';
    if (idx === groups.length - 1 && streaming) {
      if (group.tools.some(t => t.output === undefined)) return 'running';
      if (!group.think) return 'thinking';
    }
    return 'done';
  };

  const groupStatusIcon = (status: string) => {
    switch (status) {
      case 'thinking': return <Loader2 size={11} className="text-blue-500 animate-spin" />;
      case 'running': return <Loader2 size={11} className="text-blue-500 animate-spin" />;
      case 'error': return <XCircle size={11} className="text-red-500" />;
      default: return <CheckCircle2 size={11} className="text-blue-500" />;
    }
  };

  const iterationLabel = (num: number) => lang === 'zh' ? `第 ${num} 轮` : `Iteration ${num}`;

  return (
    <div className="mt-2 rounded-xl border border-blue-500/25 bg-gradient-to-br from-blue-500/8 to-indigo-500/5 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-500/10 transition-colors"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/15">
          <Brain size={12} className="text-blue-600 dark:text-blue-400" />
        </div>
        <span className="font-semibold text-blue-700 dark:text-blue-300">{t('chat.thinking')}</span>
        {(isThinking || hasRunningTool) && (
          <span className="flex items-center gap-1 text-blue-500">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px]">{isThinking ? (lang === 'zh' ? '思考中...' : 'Thinking...') : (lang === 'zh' ? '执行中...' : 'Running...')}</span>
          </span>
        )}
        <ChevronDown size={12} className={`ml-auto text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && hasActiveEvents && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-blue-500/10 space-y-3">
              {groups.map((group, groupIdx) => {
                const status = getGroupStatus(group, groupIdx);
                return (
                  <div key={group.iteration} className="relative pl-5">
                    {groupIdx < groups.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-[-12px] w-px bg-gradient-to-b from-blue-400/30 to-indigo-400/30" />
                    )}
                    <div className="absolute left-0 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111111] flex items-center justify-center"
                      style={{
                        background: status === 'error' ? '#ef4444' : '#3b82f6'
                      }}>
                      {status === 'thinking' || status === 'running' ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {groupStatusIcon(status)}
                      <span className="text-[11px] font-medium text-text-secondary">
                        {iterationLabel(group.iteration + 1)}
                      </span>
                      {status === 'error' && <span className="text-[10px] text-red-500">{lang === 'zh' ? '出错' : 'Error'}</span>}
                    </div>
                    {group.think && (
                      <div className="text-xs text-text-secondary/90 whitespace-pre-wrap leading-relaxed mb-2 pl-0.5">
                        {group.think.content}
                      </div>
                    )}
                    {group.tools.length > 0 && (
                      <div className="space-y-1.5">
                        {group.tools.map((tool, toolIdx) => (
                          <ToolCallItem
                            key={`${group.iteration}-${toolIdx}`}
                            tool={tool}
                            isLast={toolIdx === group.tools.length - 1 && groupIdx === groups.length - 1}
                            t={t}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const { t, lang } = useI18n();
  const { user, authHeaders, openAuthModal, refreshUser } = useAuth();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'ai', content: t('chat.welcome') }]);
    }
  }, [isOpen, messages.length, t, lang]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleQuickAction = (text: string) => {
    setInputValue(text);
    setTimeout(() => {
      handleSendDirect(text);
    }, 0);
  };

  const handleSendDirect = async (text: string) => {
    if (!text || isSending) return;

    setInputValue('');
    setIsSending(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    const aiMsgIndex = newMessages.length;
    setMessages(prev => [...prev, { role: 'ai', content: '', streaming: true, subEvents: [] }]);

    try {
      // 切换到 Agent 端点，支持 think/tool_call/tool_result 事件
      const resp = await fetch(`${API_BASE}/api/chat/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          conversation_id: convId,
          message: text,
          mode: 'visitor',
        }),
      });

      if (resp.status === 403) {
        setMessages(prev => {
          return prev.map((m, i) => i === aiMsgIndex ? {
            role: 'ai',
            content: '您的访客配额已用完，请登录后继续对话。',
            streaming: false,
          } : m);
        });
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
              setConvId(data.conversation_id);
            } else if (data.type === 'think') {
              // 思考过程事件（流式逐字输出）
              setMessages(prev => {
                const msg = prev[aiMsgIndex];
                const subEvents = [...(msg.subEvents || [])];
                const last = subEvents[subEvents.length - 1];
                const iter = data.iteration || 0;
                // 同 iteration 的 think 事件：追加 content
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
                return prev.map((m, i) => i === aiMsgIndex ? { ...m, subEvents } : m);
              });
            } else if (data.type === 'tool_call') {
              // 工具调用事件
              setMessages(prev => {
                const msg = prev[aiMsgIndex];
                const newSubEvents = [...(msg.subEvents || []), {
                  kind: 'tool_call' as const,
                  tool: data.tool,
                  input: data.input,
                  iteration: data.iteration || 0,
                }];
                return prev.map((m, i) => i === aiMsgIndex ? { ...m, subEvents: newSubEvents } : m);
              });
            } else if (data.type === 'tool_result') {
              // 工具返回事件 — 更新最后一个匹配的 tool_call 的 output
              setMessages(prev => {
                const msg = prev[aiMsgIndex];
                if (!msg.subEvents) return prev;
                let targetIdx = -1;
                for (let i = msg.subEvents.length - 1; i >= 0; i--) {
                  const ev = msg.subEvents[i];
                  if (ev.kind === 'tool_call' && ev.tool === data.tool && ev.output === undefined) {
                    targetIdx = i;
                    break;
                  }
                }
                if (targetIdx === -1) return prev;
                const newSubEvents = msg.subEvents.map((ev, i) =>
                  i === targetIdx ? { ...ev, output: data.output, error: data.error || undefined } : ev
                );
                return prev.map((m, i) => i === aiMsgIndex ? { ...m, subEvents: newSubEvents } : m);
              });
            } else if (data.type === 'chunk') {
              fullReply += data.content;
              setMessages(prev => {
                return prev.map((m, i) => i === aiMsgIndex ? { ...m, content: fullReply, streaming: true } : m);
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                return prev.map((m, i) => i === aiMsgIndex ? { ...m, streaming: false } : m);
              });
              refreshUser();
            } else if (data.type === 'error') {
              setMessages(prev => {
                return prev.map((m, i) => i === aiMsgIndex ? {
                  role: 'ai',
                  content: `⚠️ ${data.error || 'Agent error'}`,
                  streaming: false,
                } : m);
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      setMessages(prev => {
        return prev.map((m, i) => i === aiMsgIndex && m.streaming ? { ...m, streaming: false } : m);
      });
    } catch {
      const errorMsg = t('chat.error.network');
      setMessages(prev => {
        return prev.map((m, i) => i === aiMsgIndex ? { role: 'ai', content: errorMsg, streaming: false } : m);
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => handleSendDirect(inputValue.trim());

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] h-[540px] max-h-[calc(100vh-120px)] bg-bg-card rounded-2xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={avatarImg} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-border" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-bg-card"></div>
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">{t('chat.name')}</div>
                  <div className="text-xs text-text-secondary">
                    {user?.is_guest
                      ? `访客 · 剩余 ${user.quota_remaining ?? 0} 次`
                      : user?.email || (t('chat.subtitle') || 'Ask me about my experience')}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none shadow-[0_4px_12px_-4px_rgba(59,130,246,0.4)]' : 'bg-bg-pill border border-border text-text-primary rounded-tl-none'}`}>
                    {msg.streaming && !msg.content && (!msg.subEvents || msg.subEvents.length === 0) ? (
                      <span className="flex items-center gap-1 text-text-muted">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    ) : (
                      <>
                        {/* Agent 子事件：统一的思考过程面板（思考+工具调用整合） */}
                        {msg.subEvents && msg.subEvents.length > 0 && (
                          <ThinkingProcess subEvents={msg.subEvents} streaming={!!msg.streaming} t={t} lang={lang} />
                        )}

                        {/* 最终答案内容 */}
                        {msg.content && (
                          <div className="chat-markdown text-sm leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMdComponents}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {msg.streaming && msg.content && (
                          <span className="inline-block w-1 h-3.5 bg-blue-400 animate-pulse ml-0.5 align-middle"></span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => handleQuickAction(t('chat.action.exp'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <Briefcase size={12} /> {t('chat.action.exp')}
                  </button>
                  <button onClick={() => handleQuickAction(t('chat.action.projects'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-blue-500/25 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <GitFork size={12} /> {t('chat.action.projects')}
                  </button>
                  <button onClick={() => handleQuickAction(t('chat.action.why'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <HelpCircle size={12} /> {t('chat.action.why')}
                  </button>
                  <button onClick={() => handleQuickAction(t('chat.action.contact'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-blue-500/15 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <Mail size={12} /> {t('chat.action.contact')}
                  </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border-subtle bg-bg-card">
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-base border border-border rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('chat.placeholder')}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || !inputValue.trim()}
                  className={`p-1.5 rounded-lg transition-colors ${inputValue.trim() && !isSending ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-transparent text-text-muted hover:text-text-primary'}`}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg border-2 border-white dark:border-border bg-bg-card flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_-2px_rgba(59,130,246,0.4)]">
            <X size={24} />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img src={avatarImg} alt="AI Assistant" className="w-full h-full rounded-full object-cover" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full border-[2.5px] border-white dark:border-bg-card"></div>
          </div>
        )}
      </button>
    </>
  );
};

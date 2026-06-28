import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Briefcase, GitFork, HelpCircle, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import avatarImg from '../assets/avatar.jpg';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Chat-appropriate markdown components — lightweight, no document-style formatting
const chatMdComponents: Components = {
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-accent">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul className="my-2 space-y-0.5 list-disc pl-5 marker:text-text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-0.5 list-decimal pl-5 marker:text-text-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-500 underline decoration-blue-500/30 underline-offset-2 hover:text-blue-600 transition-colors">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    return isInline
      ? <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[0.9em] font-mono" {...props}>{children}</code>
      : <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-border-subtle overflow-x-auto text-[13px] leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-3 border-blue-400/40 text-text-secondary/80 italic">{children}</blockquote>
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

interface Message {
  role: 'ai' | 'user';
  content: string;
  streaming?: boolean;
}

export const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const { t, lang } = useI18n();
  const { user, authHeaders, openAuthModal, refreshUser } = useAuth();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progressive loading hints for cold starts
  const LOADING_HINTS = [
    '',                          // 0-2s: dots only
    t('chat.connecting'),        // 2-5s: "Connecting..."
    t('chat.warming'),           // 5s+: "AI is warming up..."
  ];

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  // Clear timer on unmount
  useEffect(() => {
    return () => clearLoadingTimer();
  }, []);

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
    // Use setTimeout to ensure state is updated before sending
    setTimeout(() => {
      // Create a synthetic event object or call logic directly
      // Since handleSend uses inputValue from state, we need to pass text directly
      handleSendDirect(text);
    }, 0);
  };

  const handleSendDirect = async (text: string) => {
    if (!text || isSending) return;

    setInputValue('');
    setIsSending(true);
    setLoadingStage(0);
    clearLoadingTimer();

    // Progressive loading hints: stage 0→1 after 2s, 1→2 after another 3s
    loadingTimerRef.current = setTimeout(() => {
      setLoadingStage(1);
      loadingTimerRef.current = setTimeout(() => {
        setLoadingStage(2);
      }, 3000);
    }, 2000);

    // Add visitor message
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    // Add placeholder for streaming AI reply
    const aiMsgIndex = newMessages.length;
    setMessages(prev => [...prev, { role: 'ai', content: '', streaming: true }]);

    try {
      const resp = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          conversation_id: convId,
          message: text,
        }),
      });

      if (resp.status === 403) {
        // 配额耗尽：弹出登录框
        clearLoadingTimer();
        setMessages(prev => {
          const updated = [...prev];
          updated[aiMsgIndex] = {
            role: 'ai',
            content: '您的访客配额已用完，请登录后继续对话。',
            streaming: false,
          };
          return updated;
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
            } else if (data.type === 'chunk') {
              clearLoadingTimer();
              setLoadingStage(0);
              fullReply += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[aiMsgIndex] = { role: 'ai', content: fullReply, streaming: true };
                return updated;
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                const updated = [...prev];
                updated[aiMsgIndex] = { role: 'ai', content: fullReply, streaming: false };
                return updated;
              });
              // 刷新配额状态
              refreshUser();
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      // Finalize: ensure streaming flag is off
      setMessages(prev => {
        const updated = [...prev];
        if (updated[aiMsgIndex]?.streaming) {
          updated[aiMsgIndex] = { ...updated[aiMsgIndex], streaming: false };
        }
        return updated;
      });
    } catch {
      const errorMsg = t('chat.error.network');
      setMessages(prev => {
        const updated = [...prev];
        updated[aiMsgIndex] = { role: 'ai', content: errorMsg, streaming: false };
        return updated;
      });
    } finally {
      clearLoadingTimer();
      setLoadingStage(0);
      setIsSending(false);
    }
  };

  const handleSend = () => handleSendDirect(inputValue.trim());

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[360px] h-[500px] max-h-[calc(100vh-120px)] bg-bg-card rounded-2xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={avatarImg} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-border" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-bg-card"></div>
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
              {user?.is_guest && (
                <button
                  onClick={openAuthModal}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  登录
                </button>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-bg-pill border border-border text-text-primary rounded-tl-none'}`}>
                    {msg.streaming && !msg.content ? (
                      <span className="flex flex-col items-start gap-1.5">
                        <span className="flex items-center gap-1 text-text-muted">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        {loadingStage > 0 && (
                          <span className="text-[11px] text-text-muted/60 animate-pulse">
                            {LOADING_HINTS[loadingStage]}
                          </span>
                        )}
                      </span>
                    ) : (
                      <>
                        <div className="chat-markdown text-sm leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMdComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.streaming && (
                          <span className="inline-block w-1 h-3.5 bg-blue-400 animate-pulse ml-0.5 align-middle"></span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Actions (only show if it's the beginning) */}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => handleQuickAction(t('chat.action.exp'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-teal-500/30 bg-teal-500/5 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors">
                    <Briefcase size={12} /> {t('chat.action.exp')}
                  </button>
                  <button onClick={() => handleQuickAction(t('chat.action.projects'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <GitFork size={12} /> {t('chat.action.projects')}
                  </button>
                  <button onClick={() => handleQuickAction(t('chat.action.why'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors">
                    <HelpCircle size={12} /> {t('chat.action.why')}
                  </button>
                  <button onClick={() => handleQuickAction(t('chat.action.contact'))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors">
                    <Mail size={12} /> {t('chat.action.contact')}
                  </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border-subtle bg-bg-card">
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-base border border-border rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
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
                  className={`p-1.5 rounded-lg transition-colors ${inputValue.trim() && !isSending ? 'bg-blue-500 text-white' : 'bg-transparent text-text-muted hover:text-text-primary'}`}
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
          <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white">
            <X size={24} />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img src={avatarImg} alt="AI Assistant" className="w-full h-full rounded-full object-cover" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-white dark:border-bg-card"></div>
          </div>
        )}
      </button>
    </>
  );
};

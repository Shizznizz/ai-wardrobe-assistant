import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Loader2, AlertCircle, Sparkles, Crown, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface OliviaChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobeCount?: number | null;
  quizSummary?: string | null;
}

type ChatStatus = 'ok' | 'auth_required' | 'rate_limited' | 'error';

const STORAGE_KEY_PREFIX = 'olivia_chat:';
const GUEST_LIMIT_KEY = 'olivia_guest_limit';
const GUEST_DAILY_LIMIT = 2;

const getStorageKey = (userId?: string | null): string => {
  return `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
};

// Guest rate limiting via localStorage
const getGuestUsage = (): { count: number; date: string } => {
  try {
    const stored = localStorage.getItem(GUEST_LIMIT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[OliviaChat] Failed to read guest usage:', e);
  }
  return { count: 0, date: new Date().toDateString() };
};

const incrementGuestUsage = (): number => {
  const today = new Date().toDateString();
  const usage = getGuestUsage();
  
  // Reset if new day
  if (usage.date !== today) {
    usage.count = 0;
    usage.date = today;
  }
  
  usage.count += 1;
  
  try {
    localStorage.setItem(GUEST_LIMIT_KEY, JSON.stringify(usage));
  } catch (e) {
    console.error('[OliviaChat] Failed to save guest usage:', e);
  }
  
  return usage.count;
};

const checkGuestCanSend = (): boolean => {
  const today = new Date().toDateString();
  const usage = getGuestUsage();
  
  // Reset count if new day
  if (usage.date !== today) {
    return true;
  }
  
  return usage.count < GUEST_DAILY_LIMIT;
};

const OliviaChatPanel: React.FC<OliviaChatPanelProps> = ({
  isOpen,
  onClose,
  wardrobeCount = null,
  quizSummary = null,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>('ok');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const storageKey = getStorageKey(user?.id);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error('[OliviaChat] Failed to load messages from localStorage:', e);
    }
  }, [user?.id]);

  // Persist messages to localStorage
  useEffect(() => {
    const storageKey = getStorageKey(user?.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error('[OliviaChat] Failed to save messages to localStorage:', e);
    }
  }, [messages, user?.id]);

  // Check guest limit on open
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      if (!checkGuestCanSend()) {
        setStatus('auth_required');
      } else {
        setStatus('ok');
      }
    }
  }, [isOpen, isAuthenticated]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Memoize route name to avoid unstable function dependencies
  const routeName = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/style-planner') return 'style-planner';
    return path.replace('/', '') || 'unknown';
  }, [location.pathname]);

  // Dev-only: reset guest limit
  const resetGuestLimit = () => {
    localStorage.removeItem(GUEST_LIMIT_KEY);
    setStatus('ok');
  };

  const sendMessage = useCallback(async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    setError(null);
    setIsLoading(true);
    setInputValue('');

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: Date.now(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Unable to connect to services');
      }

      // Guest flow: use simple AI response without backend user context
      if (!isAuthenticated || !user?.id) {
        // Increment guest usage
        const newCount = incrementGuestUsage();
        
        // Build messages array for API (last 6 for context)
        const apiMessages = updatedMessages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Call edge function without userId (guest mode)
        const { data, error: fnError } = await supabase.functions.invoke('chat-with-olivia', {
          body: {
            messages: apiMessages,
            userId: null, // Guest mode
            context: {
              route: routeName,
              wardrobeCount: null,
              quizSummary: null,
              isGuest: true,
            },
          },
        });

        // Handle response - guest users won't get rate limit from backend since userId is required
        if (fnError) {
          // The backend requires userId, so for guests we'll use a simple fallback
          const guestResponse: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: "Hi! I'm Olivia, your AI stylist. To give you personalized outfit recommendations based on your wardrobe, I'll need you to create an account. But feel free to ask me general fashion questions! 💫",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, guestResponse]);
        } else if (data?.reply) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }

        // Check if guest hit their limit after this message
        if (newCount >= GUEST_DAILY_LIMIT) {
          setStatus('auth_required');
        }
        
        return;
      }

      // Authenticated flow
      const apiMessages = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const context = {
        route: routeName,
        wardrobeCount,
        quizSummary,
      };

      const { data, error: fnError } = await supabase.functions.invoke('chat-with-olivia', {
        body: {
          messages: apiMessages,
          userId: user.id,
          context,
        },
      });

      if (fnError) {
        console.error('[OliviaChat] Function error:', fnError);
        throw new Error(fnError.message || 'Failed to get response');
      }

      // Handle rate limit from backend
      if (data?.limitReached || data?.error === 'Message limit reached') {
        setStatus('rate_limited');
        setError('Daily chat limit reached. Upgrade to Premium for unlimited chats.');
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data?.reply || "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus('ok');

      // Check if limit will be reached after this message
      if (data?.limitReached) {
        setStatus('rate_limited');
      }
    } catch (err) {
      console.error('[OliviaChat] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, user?.id, isAuthenticated, wardrobeCount, quizSummary, routeName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    // Reset status only if not auth_required due to guest limit
    if (isAuthenticated || checkGuestCanSend()) {
      setStatus('ok');
    }
    const storageKey = getStorageKey(user?.id);
    localStorage.removeItem(storageKey);
  };

  const retryLastMessage = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMessage) {
        setMessages((prev) => prev.filter((m) => m.id !== lastUserMessage.id));
        setInputValue(lastUserMessage.content);
        setError(null);
        if (status === 'error') {
          setStatus('ok');
        }
      }
    }
  };

  // Determine if input should be disabled
  const isInputDisabled = 
    isLoading || 
    status === 'rate_limited' || 
    (status === 'auth_required' && !checkGuestCanSend());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-slate-900/95 backdrop-blur-xl border-l border-purple-500/30",
              "flex flex-col shadow-2xl",
              "md:right-0 md:top-0 md:bottom-0 md:w-[420px]",
              "max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-[15%] max-md:rounded-t-3xl max-md:border-t"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-coral-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Olivia</h2>
                  <p className="text-xs text-purple-300/80">Your AI stylist</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {import.meta.env.DEV && (
                  <button
                    onClick={resetGuestLimit}
                    className="text-xs text-purple-400/60 hover:text-purple-300 px-2 py-1"
                    title="Dev only: Reset guest limit"
                  >
                    Reset guest
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-8 text-purple-300/60">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    Hi! I'm Olivia, your personal AI stylist. Ask me about outfit ideas, style tips, or anything fashion-related!
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                        : 'bg-slate-800/80 text-purple-100 border border-purple-500/20'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-purple-500/20 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-purple-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Olivia is typing...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State (generic errors only) */}
              {error && status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-200 text-sm">{error}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={retryLastMessage}
                        className="mt-2 text-red-300 hover:text-white hover:bg-red-500/20"
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth Required CTA (for guests who hit limit) */}
              {status === 'auth_required' && (
                <div className="bg-gradient-to-r from-purple-500/10 to-coral-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-center">
                    <LogIn className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-purple-200 text-sm mb-3">
                      Sign up to keep chatting with Olivia and get personalized outfit recommendations!
                    </p>
                    <Button
                      onClick={() => navigate('/auth')}
                      className="bg-gradient-to-r from-purple-500 to-coral-400 hover:from-purple-600 hover:to-coral-500"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign Up / Log In
                    </Button>
                  </div>
                </div>
              )}

              {/* Rate Limit CTA (for authenticated users who hit backend limit) */}
              {status === 'rate_limited' && isAuthenticated && (
                <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    <p className="text-amber-200 text-sm mb-3">
                      Daily chat limit reached. Upgrade to Premium for unlimited chats.
                    </p>
                    <Button
                      onClick={() => navigate('/premium')}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-purple-500/20">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isInputDisabled ? "Chat limit reached" : "Ask Olivia anything..."}
                    disabled={isInputDisabled}
                    rows={1}
                    className={cn(
                      "w-full resize-none rounded-xl px-4 py-3 pr-12",
                      "bg-slate-800/50 border border-purple-500/30",
                      "text-white placeholder-purple-400/50",
                      "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "max-h-32"
                    )}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isInputDisabled}
                  className="bg-gradient-to-r from-purple-500 to-coral-400 hover:from-purple-600 hover:to-coral-500 h-12 w-12 rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-purple-400/50 mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OliviaChatPanel;

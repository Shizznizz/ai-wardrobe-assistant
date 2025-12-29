import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const STORAGE_KEY_PREFIX = 'olivia_chat:';

const getStorageKey = (userId?: string | null): string => {
  return `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
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
  const [limitReached, setLimitReached] = useState(false);
  
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

  const getCurrentRoute = (): string => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/style-planner') return 'style-planner';
    return path.replace('/', '') || 'unknown';
  };

  const sendMessage = useCallback(async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    // Check if logged in - edge function requires userId
    if (!isAuthenticated || !user?.id) {
      setError('Please sign in to chat with Olivia.');
      setLimitReached(true);
      return;
    }

    setError(null);
    setLimitReached(false);
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

      // Build messages array for API (last 10 for context)
      const apiMessages = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Build context
      const context = {
        route: getCurrentRoute(),
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

      // Handle rate limit
      if (data?.limitReached || data?.error === 'Message limit reached') {
        setLimitReached(true);
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

      // Check if limit reached after this message
      if (data?.limitReached) {
        setLimitReached(true);
      }
    } catch (err) {
      console.error('[OliviaChat] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, user?.id, isAuthenticated, wardrobeCount, quizSummary, getCurrentRoute]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setLimitReached(false);
    const storageKey = getStorageKey(user?.id);
    localStorage.removeItem(storageKey);
  };

  const retryLastMessage = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMessage) {
        // Remove the last user message and resend
        setMessages((prev) => prev.filter((m) => m.id !== lastUserMessage.id));
        setInputValue(lastUserMessage.content);
        setError(null);
      }
    }
  };

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
              // Desktop: right side panel
              "md:right-0 md:top-0 md:bottom-0 md:w-[420px]",
              // Mobile: bottom sheet
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

              {/* Error State */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-200 text-sm">{error}</p>
                      {!limitReached && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={retryLastMessage}
                          className="mt-2 text-red-300 hover:text-white hover:bg-red-500/20"
                        >
                          Try again
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rate Limit CTA */}
              {limitReached && (
                <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-xl p-4">
                  {isAuthenticated ? (
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
                  ) : (
                    <div className="text-center">
                      <LogIn className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <p className="text-purple-200 text-sm mb-3">
                        Sign up to chat more with Olivia.
                      </p>
                      <Button
                        onClick={() => navigate('/auth')}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign Up / Log In
                      </Button>
                    </div>
                  )}
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
                    placeholder="Ask Olivia anything..."
                    disabled={isLoading || (limitReached && !isAuthenticated)}
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
                  disabled={!inputValue.trim() || isLoading || (limitReached && !isAuthenticated)}
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

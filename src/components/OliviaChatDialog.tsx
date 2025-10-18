
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import OutfitFeedbackRating from './chat/OutfitFeedbackRating';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  id?: string;
  needsFeedback?: boolean;
}

interface OliviaChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

const OliviaChatDialog = ({ isOpen, onClose, initialMessage = "Hi! I'm Olivia Bloom, your personal style assistant. How can I help with your fashion needs today? The first 5 messages are free, after which you'll need a premium account to continue chatting." }: OliviaChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage, id: 'initial', needsFeedback: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [feedbackGivenFor, setFeedbackGivenFor] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset error state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHasError(false);
      // Focus input field when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Get user message count on initial load
  useEffect(() => {
    const fetchMessageCount = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('message_count')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching message count:', error);
          return;
        }
        
        if (data && data.message_count) {
          setMessageCount(data.message_count);
          // If they've already reached the limit, show the limit reached message
          if (data.message_count > 5) {
            setLimitReached(true);
          }
        }
      } catch (error) {
        console.error('Error getting message count:', error);
      }
    };
    
    if (isOpen && user) {
      fetchMessageCount();
    }
  }, [isOpen, user]);

  // Focus the input field
  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleRetry = () => {
    if (messages.length > 1) {
      // Get the last user message
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage) {
        setHasError(false);
        setInput(lastUserMessage.content);
        focusInput();
      }
    }
  };

  const handleUpgradeClick = () => {
    // Here you would redirect to your premium subscription page
    // For now, we'll just close the chat and navigate to settings
    onClose();
    navigate('/settings');
    toast({
      title: "Premium Required",
      description: "You'll need to upgrade to premium to continue chatting with Olivia.",
      variant: "default"
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Check if user is logged in
    if (!user) {
      onClose();
      toast({
        title: "Login Required",
        description: "Please log in to chat with Olivia",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    // Add user message to chat
    const userMessage: Message = { 
      role: 'user' as const, 
      content: input.trim(),
      id: `user-${Date.now()}`
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Convert messages to format expected by OpenAI API
      const formattedMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      console.log('Sending messages to Olivia:', formattedMessages.slice(-2));
      
      // Call Supabase Edge Function with user ID
      const { data, error } = await supabase.functions.invoke('chat-with-olivia', {
        body: { 
          messages: formattedMessages,
          userId: user.id
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (!data || data.error) {
        console.error('Function returned error:', data?.error);
        throw new Error(data?.error || 'Unknown error occurred');
      }
      
      // Update message count from response
      if (data.messageCount) {
        setMessageCount(data.messageCount);
      }
      
      // Check if limit has been reached
      if (data.limitReached) {
        setLimitReached(true);
      }
      
      // Add assistant response to chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: data.reply }
      ]);
      
      // Focus the input field after response is received
      focusInput();
    } catch (error) {
      console.error('Error sending message:', error);
      setHasError(true);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Olivia is unavailable right now. Please try again later.",
        action: <Button variant="outline" size="sm" onClick={handleRetry}>Retry</Button>
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed z-50 top-24 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col border border-purple-100 dark:border-purple-900"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src="/lovable-uploads/86bf74b8-b311-4e3c-bfd6-53819add3df8.png" alt="Olivia Bloom" />
                <AvatarFallback className="bg-purple-200 text-purple-700">OB</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-white flex items-center">
                  Olivia Bloom
                  <Sparkles className="h-4 w-4 ml-1 text-yellow-200" />
                </h3>
                <p className="text-xs text-white/80">Style Advisor</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 bg-gray-50 dark:bg-slate-950">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex">
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                      <AvatarImage src="/lovable-uploads/86bf74b8-b311-4e3c-bfd6-53819add3df8.png" alt="Olivia Bloom" />
                      <AvatarFallback className="bg-purple-200 text-purple-700">OB</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
                
                {/* Feedback Rating for assistant messages */}
                {message.role === 'assistant' && 
                 message.needsFeedback && 
                 message.id && 
                 !feedbackGivenFor.has(message.id) && 
                 index === messages.length - 1 && 
                 !isLoading && (
                  <div className="ml-10 w-[calc(80%-2.5rem)]">
                    <OutfitFeedbackRating
                      messageId={message.id}
                      onFeedbackSubmitted={() => {
                        setFeedbackGivenFor(prev => new Set(prev).add(message.id!));
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                  <AvatarImage src="/lovable-uploads/86bf74b8-b311-4e3c-bfd6-53819add3df8.png" alt="Olivia Bloom" />
                  <AvatarFallback className="bg-purple-200 text-purple-700">OB</AvatarFallback>
                </Avatar>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 rounded-tl-none">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                </div>
              </div>
            )}
            {hasError && (
              <div className="flex justify-center my-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">Connection issue. Please try again.</span>
                  <Button size="sm" variant="outline" onClick={handleRetry} className="ml-2">
                    Retry
                  </Button>
                </div>
              </div>
            )}
            {limitReached && (
              <div className="flex justify-center my-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-amber-100 dark:bg-amber-700 p-2 rounded-full">
                      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">Premium Feature</h3>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                    You've reached your limit of free messages. Please upgrade to premium to continue chatting with Olivia Bloom.
                  </p>
                  <Button 
                    onClick={handleUpgradeClick}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Premium
                  </Button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex items-center space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={limitReached ? "Upgrade to continue chatting..." : "Ask Olivia for style advice..."}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none h-10 max-h-24 dark:bg-slate-800 dark:text-white"
                rows={1}
                disabled={isLoading || limitReached || !user}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || limitReached || !user}
                size="icon"
                className="rounded-full h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {messageCount > 0 && (
              <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                {messageCount <= 5 ? (
                  <span>{5 - messageCount} free {messageCount === 4 ? 'message' : 'messages'} remaining</span>
                ) : (
                  <span>Premium access required</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OliviaChatDialog;

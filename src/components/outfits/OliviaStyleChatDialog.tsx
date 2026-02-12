
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useOutfitState } from '@/hooks/useOutfitState';
import { useLocationStorage } from '@/hooks/useLocationStorage';
import { generateWeatherForDate } from '@/services/WeatherService';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface OliviaStyleChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

const OliviaStyleChatDialog = ({ isOpen, onClose, selectedDate }: OliviaStyleChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hi! I'm Olivia, your personal AI stylist. I can see your wardrobe and style preferences, so I can give you truly personalized outfit suggestions! What would you like to wear today? 💫",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { outfits, clothingItems } = useOutfitState();
  const { savedLocation } = useLocationStorage();
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasError(false);
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
        // Read chat-specific counter (chat_count / last_chat_at), independent
        // of generation_count used by instant-outfit generation.
        const { data, error } = await supabase
          .from('user_chat_limits')
          .select('chat_count, last_chat_at, is_premium')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching message count:', error);
          return;
        }

        if (data) {
          const today = new Date().toDateString();
          const lastChatDate = data.last_chat_at
            ? new Date(data.last_chat_at).toDateString()
            : null;

          // Reset count if it's a new day
          const currentCount = lastChatDate === today ? (data.chat_count ?? 0) : 0;
          setMessageCount(currentCount);

          // Check if they've already reached the limit (for non-premium users)
          if (!data.is_premium && currentCount >= 5) {
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

  const getContextualInfo = () => {
    const currentDate = selectedDate || new Date();
    const weather = generateWeatherForDate(currentDate, savedLocation?.city, savedLocation?.country);
    
    return {
      date: currentDate.toDateString(),
      weather: weather,
      location: savedLocation ? `${savedLocation.city}, ${savedLocation.country}` : 'Unknown location',
      wardrobeSize: clothingItems.length,
      outfitCount: outfits.length,
      favoriteOutfits: outfits.filter(o => o.favorite).length
    };
  };

  const handleUpgradeClick = () => {
    onClose();
    navigate('/premium');
    toast({
      title: "Premium Required",
      description: "You'll need to upgrade to premium to continue chatting with Olivia.",
      variant: "default"
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;
    
    const userMessage: Message = { 
      role: 'user', 
      content: input.trim(), 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setHasError(false);
    
    try {
      const context = getContextualInfo();
      
      // Create a simple contextual message about current conditions
      const contextualMessage = `Current context: It's ${context.weather.condition} and ${context.weather.temperature}°C in ${context.location} on ${context.date}. ${input.trim()}`;

      const conversationMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.role === 'user' && msg === userMessage ? contextualMessage : msg.content
        }));

      const { data, error } = await supabase.functions.invoke('chat-with-olivia', {
        body: { 
          messages: conversationMessages,
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
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        timestamp: new Date()
      }]);
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setHasError(true);
      toast({
        variant: "destructive",
        title: "Olivia is temporarily unavailable",
        description: "Please try again in a moment.",
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

  const handleRetry = () => {
    if (messages.length > 1) {
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage) {
        setHasError(false);
        setInput(lastUserMessage.content);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] p-0 bg-slate-900 border-purple-500/20 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src="/lovable-uploads/b87d5aa1-136e-42c6-b11e-b4651dce8f93.png" alt="Olivia" />
              <AvatarFallback className="bg-purple-200 text-purple-700">O</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white flex items-center">
                Olivia
                <Sparkles className="h-4 w-4 ml-1 text-yellow-200" />
              </h3>
              <p className="text-xs text-white/80">Your AI Stylist</p>
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
        <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 bg-slate-950">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                  <AvatarImage src="/lovable-uploads/b87d5aa1-136e-42c6-b11e-b4651dce8f93.png" alt="Olivia" />
                  <AvatarFallback className="bg-purple-200 text-purple-700">O</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-tr-none'
                    : 'bg-slate-800 text-white border border-slate-700 rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                <AvatarImage src="/lovable-uploads/b87d5aa1-136e-42c6-b11e-b4651dce8f93.png" alt="Olivia" />
                <AvatarFallback className="bg-purple-200 text-purple-700">O</AvatarFallback>
              </Avatar>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 rounded-tl-none">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  <span className="text-sm text-purple-300">Olivia is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          {hasError && (
            <div className="flex justify-center my-4">
              <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg flex items-center gap-2 text-red-300">
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
              <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-amber-700 p-2 rounded-full">
                    <Lock className="h-5 w-5 text-amber-300" />
                  </div>
                  <h3 className="font-medium text-amber-300">Daily Limit Reached</h3>
                </div>
                <p className="text-sm text-amber-400 mb-3">
                  You've reached your daily free message limit. Upgrade to premium to keep chatting with Olivia Bloom.
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
        <div className="p-3 border-t border-slate-700 bg-slate-900 flex-shrink-0">
          <div className="flex items-end space-x-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={limitReached ? "Upgrade to continue chatting..." : "Ask Olivia for style advice..."}
              className="flex-1 px-4 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none h-10 max-h-24 bg-slate-800 text-white"
              rows={1}
              disabled={isLoading || limitReached || !user}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || limitReached || !user}
              size="icon"
              className="rounded-full h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {messageCount > 0 && messageCount <= 5 && !limitReached && (
            <div className="mt-2 text-xs text-center text-slate-400">
              {messageCount}/5 free messages used today
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OliviaStyleChatDialog;

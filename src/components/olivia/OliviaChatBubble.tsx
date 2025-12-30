import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Real Olivia avatar image path
const OLIVIA_AVATAR = '/lovable-uploads/5be0da00-2b86-420e-b2b4-3cc8e5e4dc1a.png';

interface OliviaChatBubbleProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Get today's date key for localStorage
const getTodayKey = () => {
  const today = new Date();
  return `olivia_bubble_tooltip_dismissed:${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const OliviaChatBubble: React.FC<OliviaChatBubbleProps> = ({ isOpen, onToggle }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Check if tooltip should be shown (once per day)
  useEffect(() => {
    const todayKey = getTodayKey();
    const dismissed = localStorage.getItem(todayKey);
    
    if (!dismissed && !isOpen) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Hide tooltip when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
    }
  }, [isOpen]);

  const dismissTooltip = useCallback(() => {
    const todayKey = getTodayKey();
    localStorage.setItem(todayKey, 'true');
    setShowTooltip(false);
  }, []);

  // Handle keyboard events for tooltip accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTooltip) {
        dismissTooltip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTooltip, dismissTooltip]);

  return (
    <>
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 sm:bottom-24 right-4 z-[999] max-w-[200px]"
          >
            <div className="relative bg-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-xl px-4 py-3 shadow-xl">
              <button
                onClick={dismissTooltip}
                className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 border border-purple-500/30 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
                aria-label="Dismiss tooltip"
              >
                <X className="w-3 h-3 text-white/70" />
              </button>
              <p className="text-sm text-white/90 leading-snug">
                Need an outfit idea? Ask Olivia.
              </p>
              {/* Tooltip arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-900/95 border-r border-b border-purple-500/30 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble Button */}
      <motion.button
        onClick={onToggle}
        aria-label={isOpen ? "Close Olivia chat" : "Open Olivia chat"}
        className="fixed bottom-20 sm:bottom-6 right-4 z-[1000] group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r from-[#F97316] via-[#EC6FF1] to-[#9b87f5] opacity-60 blur-md transition-opacity duration-300 ${
            isOpen ? 'opacity-80' : 'group-hover:opacity-80'
          }`}
          animate={isOpen ? { 
            scale: [1, 1.15, 1],
            opacity: [0.6, 0.9, 0.6]
          } : {}}
          transition={{ 
            duration: 2, 
            repeat: isOpen ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
        
        {/* Gradient ring border */}
        <div className="relative w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full p-[2px] bg-gradient-to-r from-[#F97316] via-[#EC6FF1] to-[#9b87f5]">
          {/* Glassmorphism background */}
          <div className="w-full h-full rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="avatar"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-full"
                >
                  <img 
                    src={OLIVIA_AVATAR} 
                    alt="Olivia" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.button>
    </>
  );
};

export default OliviaChatBubble;

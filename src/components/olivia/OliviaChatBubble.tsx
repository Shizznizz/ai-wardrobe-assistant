import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface OliviaChatBubbleProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Blonde Olivia Avatar SVG component - minimal, premium flat/vector style
const OliviaAvatar = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Hair background - blonde */}
    <ellipse cx="24" cy="20" rx="16" ry="14" fill="url(#blonde-gradient)" />
    
    {/* Face */}
    <ellipse cx="24" cy="26" rx="11" ry="12" fill="#FDDCBD" />
    
    {/* Hair front strands - blonde */}
    <path 
      d="M12 18C12 18 14 8 24 8C34 8 36 18 36 18C36 18 34 14 24 14C14 14 12 18 12 18Z" 
      fill="url(#blonde-gradient-dark)"
    />
    
    {/* Side hair waves */}
    <path 
      d="M10 20C10 20 8 28 10 34C10 34 12 30 12 24C12 18 10 20 10 20Z" 
      fill="url(#blonde-gradient)"
    />
    <path 
      d="M38 20C38 20 40 28 38 34C38 34 36 30 36 24C36 18 38 20 38 20Z" 
      fill="url(#blonde-gradient)"
    />
    
    {/* Eyes */}
    <ellipse cx="20" cy="25" rx="2" ry="2.5" fill="#4A3728" />
    <ellipse cx="28" cy="25" rx="2" ry="2.5" fill="#4A3728" />
    
    {/* Eye highlights */}
    <circle cx="19.5" cy="24" r="0.8" fill="white" />
    <circle cx="27.5" cy="24" r="0.8" fill="white" />
    
    {/* Eyebrows */}
    <path d="M17 21.5C17.5 21 19 20.5 21.5 21" stroke="#B8956B" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M31 21.5C30.5 21 29 20.5 26.5 21" stroke="#B8956B" strokeWidth="0.8" strokeLinecap="round" />
    
    {/* Blush */}
    <ellipse cx="16" cy="28" rx="2.5" ry="1.5" fill="#FFB5B5" fillOpacity="0.4" />
    <ellipse cx="32" cy="28" rx="2.5" ry="1.5" fill="#FFB5B5" fillOpacity="0.4" />
    
    {/* Nose */}
    <path d="M24 27V30" stroke="#E5C4A8" strokeWidth="0.8" strokeLinecap="round" />
    
    {/* Smile */}
    <path 
      d="M21 33C21 33 22.5 35 24 35C25.5 35 27 33 27 33" 
      stroke="#D4736A" 
      strokeWidth="1.2" 
      strokeLinecap="round"
    />
    
    {/* Lips highlight */}
    <path 
      d="M22 33.5C22 33.5 23 34.5 24 34.5C25 34.5 26 33.5 26 33.5" 
      stroke="#E8847A" 
      strokeWidth="0.6" 
      strokeLinecap="round"
    />
    
    {/* Gradient definitions */}
    <defs>
      <linearGradient id="blonde-gradient" x1="8" y1="8" x2="40" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F7E3B3" />
        <stop offset="0.5" stopColor="#E8C97A" />
        <stop offset="1" stopColor="#D4AF61" />
      </linearGradient>
      <linearGradient id="blonde-gradient-dark" x1="12" y1="8" x2="36" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E8C97A" />
        <stop offset="1" stopColor="#C9A456" />
      </linearGradient>
    </defs>
  </svg>
);

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
                  className="w-8 h-8 sm:w-10 sm:h-10"
                >
                  <OliviaAvatar className="w-full h-full" />
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

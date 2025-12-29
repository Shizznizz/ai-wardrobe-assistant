
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MobileHeroSectionProps {
  title: string;
  subtitle: string;
  description: React.ReactNode;
  imageSrc: string;
  imageAlt?: string;
  onStartJourney: () => void;
  onTakeStyleQuiz: () => void;
  extraContent?: React.ReactNode;
  buttons?: Array<{
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
    className?: string;
  }>;
  mainActionLabel?: string;
  onMainAction?: () => void;
}

const MobileHeroSection = ({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt = "Olivia AI Fashion Assistant",
  onStartJourney,
  onTakeStyleQuiz,
  extraContent,
  buttons,
  mainActionLabel,
  onMainAction,
}: MobileHeroSectionProps) => {
  const [imageError, setImageError] = useState(false);
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  // Use provided buttons or defaults
  const heroButtons = buttons || [
    {
      label: "Start Your Style Journey →",
      onClick: onStartJourney,
      variant: 'primary',
    },
    {
      label: "Take a Style Quiz",
      onClick: onTakeStyleQuiz,
      variant: 'secondary',
    }
  ];

  return (
    <div className="flex flex-col items-center text-center md:hidden max-w-[640px] mx-auto">
      {/* 1. Headline - Mobile optimized */}
      <motion.h1 
        variants={itemVariants}
        className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-coral-400 to-purple-400 leading-tight mb-2"
      >
        {title}
      </motion.h1>
      
      {/* 2. Olivia Image with fallback */}
      <motion.div 
        className="w-full flex justify-center mb-6"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              delay: 0.3,
              duration: 0.8,
              ease: "easeOut"
            }
          }
        }}
      >
        {imageError ? (
          <div 
            className="max-h-[300px] w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
            role="img"
            aria-label={imageAlt}
          >
            <ImageOff className="w-12 h-12 text-white/30" aria-hidden="true" />
          </div>
        ) : (
          <img 
            src={imageSrc} 
            alt={imageAlt}
            fetchPriority="high"
            className="max-h-[300px] w-full object-contain drop-shadow-lg"
            onError={() => setImageError(true)}
          />
        )}
      </motion.div>
      
      {/* 3. Subheadline - MADE SMALLER */}
      <motion.p 
        variants={itemVariants} 
        className="text-xs font-medium text-neutral-400 mb-1"
      >
        {subtitle}
      </motion.p>
      
      {/* 4. Description - MADE BIGGER */}
      {description && (
        <motion.div 
          variants={itemVariants} 
          className="text-base text-white/70 leading-relaxed mb-6 max-w-[90%] mx-auto"
        >
          {description}
        </motion.div>
      )}
      
      {/* 5. CTA Buttons */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col gap-3 w-full" 
      >
        {heroButtons.map((button, index) => (
          <Button
            key={index}
            onClick={button.onClick}
            aria-label={button.label}
            className={cn(
              "hover:opacity-90 transition-opacity text-white font-semibold py-3 px-6 rounded-xl shadow-md min-h-[44px] w-full text-base",
              button.variant === 'secondary' 
                ? "bg-gradient-to-r from-[#6C5DD3] to-[#8E8BFE]" 
                : "bg-gradient-to-r from-[#EC6FF1] to-[#FF8AF0]",
              button.className
            )}
            size="lg"
          >
            {button.icon && <span className="mr-2">{button.icon}</span>}
            {button.label}
          </Button>
        ))}
        
        {/* Additional action button if provided */}
        {mainActionLabel && onMainAction && (
          <Button
            onClick={onMainAction}
            aria-label={mainActionLabel}
            className="bg-gradient-to-r from-[#EC6FF1] to-[#FF8AF0] hover:opacity-90 transition-opacity text-white font-semibold py-3 px-6 rounded-xl shadow-md min-h-[44px] w-full text-base mt-4"
            size="lg"
          >
            {mainActionLabel}
          </Button>
        )}
      </motion.div>
      
      {/* Extra Content (if provided) */}
      {extraContent && (
        <motion.div variants={itemVariants} className="mt-4">
          {extraContent}
        </motion.div>
      )}
    </div>
  );
};

export default MobileHeroSection;


import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DesktopHeroSectionProps {
  title: string;
  subtitle: string;
  description: React.ReactNode;
  imageSrc: string;
  imageAlt?: string;
  layoutPosition?: 'left' | 'right';
  onStartJourney: () => void;
  onTakeStyleQuiz: () => void;
  extraContent?: React.ReactNode;
  hasSparkleEffect?: boolean;
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

const DesktopHeroSection = ({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt = "Olivia AI Fashion Assistant",
  layoutPosition = 'right',
  onStartJourney,
  onTakeStyleQuiz,
  extraContent,
  hasSparkleEffect = false,
  buttons,
  mainActionLabel,
  onMainAction,
}: DesktopHeroSectionProps) => {
  
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.3,
        duration: 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      filter: "drop-shadow(0 0 15px rgba(236, 111, 241, 0.5))",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const sparkleVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.8,
        duration: 0.5,
        ease: "easeOut"
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
    <div className={`hidden md:flex md:flex-row ${layoutPosition === 'left' ? 'md:flex-row-reverse' : ''} items-center justify-between gap-10`}>
      {/* Text content */}
      <div className="w-1/2 text-left space-y-6">
        <motion.div variants={itemVariants} className="relative">
          {hasSparkleEffect && (
            <motion.div 
              className="absolute -top-6 left-0"
              variants={sparkleVariants}
              initial="initial"
              animate="animate"
            >
              <Sparkles className="w-5 h-5 text-coral-400" />
            </motion.div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-coral-400 to-purple-400 leading-tight">
            {title}
          </h1>
        </motion.div>
        
        <motion.p variants={itemVariants} className="text-xl sm:text-2xl text-white/80 font-montserrat">
          {subtitle}
        </motion.p>
        
        {description && (
          <motion.div variants={itemVariants} className="text-white/70 text-base sm:text-lg max-w-xl leading-relaxed mb-6">
            {description}
          </motion.div>
        )}
        
        <motion.div 
          variants={itemVariants}
          className="flex flex-row gap-4 justify-start pt-4" 
        >
          {heroButtons.map((button, index) => (
            <Button
              key={index}
              onClick={button.onClick}
              className={cn(
                "hover:opacity-90 transition-opacity text-white font-semibold py-3 px-6 rounded-xl shadow-md min-h-[44px]",
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
        </motion.div>
        
        {/* Additional action button if provided */}
        {mainActionLabel && onMainAction && (
          <motion.div variants={itemVariants} className="pt-6">
            <Button 
              className="bg-gradient-to-r from-[#EC6FF1] to-[#FF8AF0] text-white hover:opacity-90 transition-opacity font-semibold py-6 px-8 rounded-xl shadow-md h-auto text-lg min-h-[44px]"
              onClick={onMainAction}
            >
              {mainActionLabel}
            </Button>
          </motion.div>
        )}
        
        {/* Extra Content (if provided) */}
        {extraContent && (
          <motion.div variants={itemVariants} className="pt-4">
            {extraContent}
          </motion.div>
        )}
      </div>

      {/* Image container */}
      <motion.div 
        className={`w-1/2 flex ${layoutPosition === 'left' ? 'justify-start' : 'justify-end'} h-full`}
        variants={imageVariants}
      >
        <motion.div 
          className="relative h-full"
          whileHover="hover"
          variants={imageVariants}
        >
          {/* Glowing backlight effect for the image */}
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-purple-500/20 via-coral-500/20 to-purple-500/20 blur-2xl"></div>
          
          {/* Subtle animated rings */}
          <div className="absolute inset-0 -z-5 rounded-full border border-coral-400/10 animate-pulse-glow"></div>
          <div className="absolute inset-2 -z-5 rounded-full border border-purple-400/5"></div>
          
          {/* The image */}
          <img 
            src={imageSrc} 
            alt={imageAlt}
            fetchPriority="high"
            className="drop-shadow-lg animate-float object-contain max-h-[350px] lg:max-h-[450px] w-auto"
          />
          
          {/* Subtle light effect */}
          <div className="absolute top-0 right-1/4 w-10 h-10 bg-white/10 rounded-full blur-xl"></div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DesktopHeroSection;

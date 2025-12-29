import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Sun, Contrast, Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PresetName = 'normal' | 'soft' | 'crisp' | 'warm' | 'editorial';

interface Preset {
  name: PresetName;
  label: string;
  icon: React.ReactNode;
  filter: string;
  description: string;
}

const PRESETS: Preset[] = [
  {
    name: 'normal',
    label: 'Normal',
    icon: <RotateCcw className="w-4 h-4" />,
    filter: 'none',
    description: 'Original look',
  },
  {
    name: 'soft',
    label: 'Soft',
    icon: <Sparkles className="w-4 h-4" />,
    filter: 'brightness(1.05) contrast(0.95) saturate(0.9)',
    description: 'Gentle, diffused lighting',
  },
  {
    name: 'crisp',
    label: 'Crisp',
    icon: <Contrast className="w-4 h-4" />,
    filter: 'brightness(1.02) contrast(1.15) saturate(1.05)',
    description: 'Sharp, defined edges',
  },
  {
    name: 'warm',
    label: 'Warm',
    icon: <Sun className="w-4 h-4" />,
    filter: 'brightness(1.05) contrast(1.02) saturate(1.1) sepia(0.15)',
    description: 'Golden hour glow',
  },
  {
    name: 'editorial',
    label: 'Editorial',
    icon: <Camera className="w-4 h-4" />,
    filter: 'brightness(1.08) contrast(1.1) saturate(0.85) grayscale(0.1)',
    description: 'Magazine-ready',
  },
];

interface StudioPresetsProps {
  activePreset: PresetName;
  onPresetChange: (preset: PresetName) => void;
  className?: string;
}

const StudioPresets: React.FC<StudioPresetsProps> = ({
  activePreset,
  onPresetChange,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-medium text-purple-200 flex items-center gap-2">
        <Camera className="w-4 h-4" />
        Studio Presets
      </h4>
      
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <motion.button
            key={preset.name}
            onClick={() => onPresetChange(preset.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              activePreset === preset.name
                ? "bg-gradient-to-r from-purple-500 to-coral-400 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 border border-white/10 text-purple-200 hover:bg-white/10 hover:border-purple-500/30"
            )}
            title={preset.description}
          >
            {preset.icon}
            {preset.label}
          </motion.button>
        ))}
      </div>
      
      {activePreset !== 'normal' && (
        <p className="text-xs text-purple-300/60">
          {PRESETS.find(p => p.name === activePreset)?.description}
        </p>
      )}
    </div>
  );
};

export const getPresetFilter = (preset: PresetName): string => {
  return PRESETS.find(p => p.name === preset)?.filter || 'none';
};

export default StudioPresets;

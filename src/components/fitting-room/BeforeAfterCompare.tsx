import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeAfterCompareProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  filter?: string;
}

const BeforeAfterCompare: React.FC<BeforeAfterCompareProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Original',
  afterLabel = 'Processed',
  className,
  filter = 'none',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'toggle'>('slider');
  const [showAfter, setShowAfter] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* View mode toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={viewMode === 'slider' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('slider')}
          className={cn(
            "text-xs",
            viewMode === 'slider' 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
          )}
        >
          <SlidersHorizontal className="w-3 h-3 mr-1" />
          Slider
        </Button>
        <Button
          variant={viewMode === 'toggle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('toggle')}
          className={cn(
            "text-xs",
            viewMode === 'toggle' 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
          )}
        >
          <Eye className="w-3 h-3 mr-1" />
          Toggle
        </Button>
      </div>

      {viewMode === 'slider' ? (
        /* Slider compare mode */
        <div
          ref={containerRef}
          className="relative w-full aspect-[3/4] max-h-[500px] rounded-xl overflow-hidden cursor-ew-resize select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* Before image (full width, visible on right side) */}
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* After image (clipped to slider position) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={afterImage}
              alt={afterLabel}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
                filter 
              }}
              draggable={false}
            />
          </div>

          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            {/* Slider handle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
            {afterLabel}
          </div>
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
            {beforeLabel}
          </div>
        </div>
      ) : (
        /* Toggle compare mode */
        <div className="relative w-full aspect-[3/4] max-h-[500px] rounded-xl overflow-hidden">
          <motion.img
            key={showAfter ? 'after' : 'before'}
            src={showAfter ? afterImage : beforeImage}
            alt={showAfter ? afterLabel : beforeLabel}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: showAfter ? filter : 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Toggle buttons */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={() => setShowAfter(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !showAfter 
                  ? "bg-white text-purple-900" 
                  : "bg-black/50 text-white hover:bg-black/70"
              )}
            >
              {beforeLabel}
            </button>
            <button
              onClick={() => setShowAfter(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                showAfter 
                  ? "bg-white text-purple-900" 
                  : "bg-black/50 text-white hover:bg-black/70"
              )}
            >
              {afterLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeforeAfterCompare;

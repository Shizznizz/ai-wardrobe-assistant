import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Download, Copy, Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ExportPanelProps {
  imageUrl: string;
  filter?: string;
  className?: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  imageUrl,
  filter = 'none',
  className,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const supportsClipboard = typeof navigator !== 'undefined' && 
    navigator.clipboard && 
    typeof ClipboardItem !== 'undefined';
  
  const supportsShare = typeof navigator !== 'undefined' && 
    navigator.share && 
    navigator.canShare;

  // Apply filter and get blob
  const getProcessedBlob = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.filter = filter;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 1.0);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await getProcessedBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fit-preview-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!supportsClipboard) return;
    
    setIsCopying(true);
    try {
      const blob = await getProcessedBlob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      toast.success('Image copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy image');
    } finally {
      setIsCopying(false);
    }
  };

  const handleShare = async () => {
    if (!supportsShare) return;
    
    try {
      const blob = await getProcessedBlob();
      const file = new File([blob], 'fit-preview.png', { type: 'image/png' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Fit Preview',
          text: 'Check out my outfit from Wardrobe Wizardry!',
          files: [file],
        });
      } else {
        // Fallback: share URL only
        await navigator.share({
          title: 'My Fit Preview',
          text: 'Check out my outfit from Wardrobe Wizardry!',
        });
      }
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Failed to share');
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-medium text-purple-200 flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Export & Share
      </h4>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-500/50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Download PNG
        </Button>
        
        {supportsClipboard && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={isCopying}
            className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-500/50"
          >
            {isCopying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : copied ? (
              <Check className="w-4 h-4 mr-2 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Image'}
          </Button>
        )}
        
        {supportsShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-500/50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;

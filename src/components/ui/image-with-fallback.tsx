import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-white/5 border border-white/10 rounded-lg',
          fallbackClassName || className
        )}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <ImageOff className="w-8 h-8 text-white/30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className={cn(
            'animate-pulse bg-white/10 rounded-lg',
            className
          )}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, isLoading && 'hidden')}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...props}
      />
    </>
  );
}

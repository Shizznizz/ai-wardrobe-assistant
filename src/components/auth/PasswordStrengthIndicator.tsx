import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'ok' | 'strong';

interface StrengthInfo {
  level: StrengthLevel;
  label: string;
  color: string;
  width: string;
}

function getPasswordStrength(password: string): StrengthInfo {
  if (!password) {
    return { level: 'weak', label: '', color: 'bg-white/20', width: 'w-0' };
  }

  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { level: 'weak', label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
  } else if (score <= 4) {
    return { level: 'ok', label: 'OK', color: 'bg-yellow-500', width: 'w-2/3' };
  } else {
    return { level: 'strong', label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  }
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1" role="status" aria-live="polite">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/60">Password strength</span>
        <span 
          className={cn(
            "text-xs font-medium",
            strength.level === 'weak' && 'text-red-400',
            strength.level === 'ok' && 'text-yellow-400',
            strength.level === 'strong' && 'text-green-400'
          )}
          aria-label={`Password strength: ${strength.label}`}
        >
          {strength.label}
        </span>
      </div>
      <div 
        className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={strength.level === 'weak' ? 33 : strength.level === 'ok' ? 66 : 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Password strength meter"
      >
        <div 
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            strength.color,
            strength.width
          )}
        />
      </div>
      {strength.level === 'weak' && (
        <p className="text-xs text-white/50">
          Use 8+ characters with uppercase, numbers, and symbols
        </p>
      )}
    </div>
  );
}

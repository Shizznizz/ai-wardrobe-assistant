import { AlertTriangle } from 'lucide-react';
import { validateSupabaseConfig } from '@/integrations/supabase/client';

/**
 * ConfigErrorBanner - Shows a visible error message when Supabase config is missing
 * Prevents blank screens by providing clear guidance to developers
 */
export default function ConfigErrorBanner() {
  const config = validateSupabaseConfig();

  // Don't render if config is valid
  if (config.isValid) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            Configuration Error
          </h3>
          <p className="text-sm mb-2">
            {config.errorMessage}
          </p>
          <div className="text-xs bg-red-700 rounded px-3 py-2 font-mono">
            <p className="mb-1">Missing variables:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {config.missingVars.map(varName => (
                <li key={varName}>{varName}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs mt-2 opacity-90">
            💡 <strong>Developer tip:</strong> Copy <code className="bg-red-700 px-1 rounded">.env.example</code> to <code className="bg-red-700 px-1 rounded">.env</code> and fill in your Supabase credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

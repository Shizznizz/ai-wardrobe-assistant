
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Sparkles } from 'lucide-react';

interface BackgroundRemovalControlsProps {
  skipBackgroundRemoval: boolean;
  onSkipChange: (skip: boolean) => void;
  debugMode: boolean;
  onDebugChange: (debug: boolean) => void;
  lastUsedModel?: string;
  isProcessing?: boolean;
}

const BackgroundRemovalControls = ({
  skipBackgroundRemoval,
  onSkipChange,
  debugMode,
  onDebugChange,
  lastUsedModel,
  isProcessing = false
}: BackgroundRemovalControlsProps) => {
  return (
    <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-medium text-white">AI Background Removal</span>
        {isProcessing && (
          <div className="flex items-center ml-auto">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
            <span className="text-xs text-purple-300 ml-2">Processing...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="skip-bg-removal" className="text-sm text-white">
          Skip background removal
        </Label>
        <Switch
          id="skip-bg-removal"
          checked={skipBackgroundRemoval}
          onCheckedChange={onSkipChange}
          disabled={isProcessing}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="debug-mode" className="text-sm text-white">
          Debug mode
        </Label>
        <Switch
          id="debug-mode"
          checked={debugMode}
          onCheckedChange={onDebugChange}
          disabled={isProcessing}
        />
      </div>

      {lastUsedModel && (
        <div className="text-xs text-green-400 pt-2 border-t border-slate-700/50 flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          Background removed with: {lastUsedModel}
        </div>
      )}
    </div>
  );
};

export default BackgroundRemovalControls;

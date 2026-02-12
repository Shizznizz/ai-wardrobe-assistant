
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutfitLog } from '@/lib/types';
import { Outfit } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

// Create a new component for OutfitLogItem
const OutfitLogItem = ({ 
  log, 
  outfitName, 
  onView, 
  onDelete, 
  onEdit 
}: { 
  log: OutfitLog; 
  outfitName: string; 
  onView: () => void; 
  onDelete: () => void; 
  onEdit?: () => void; 
}) => {
  return (
    <div 
      className="p-3 bg-slate-900/70 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer"
      onClick={onView}
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-purple-200">{outfitName}</h4>
          <p className="text-xs text-slate-400 mt-1">
            {log.timeOfDay}{' '}
            {log.weatherCondition && `• ${log.weatherCondition}`}{' '}
            {log.temperature && `• ${log.temperature}`}
          </p>
        </div>
        <div className="space-x-1">
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <span className="sr-only">Edit</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 hover:text-red-400" 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

interface OutfitLogsListProps {
  selectedDate: Date | undefined;
  outfitLogsOnDate: OutfitLog[];
  getOutfitById: (id: string) => Outfit | undefined;
  handleViewLog: (log: OutfitLog) => void;
  handleOpenLogDialog: (date?: Date) => void;
  handleDeleteLog?: (id: string) => Promise<boolean>;
  handleEditLog?: (log: OutfitLog) => void;
}

const OutfitLogsList = ({
  selectedDate,
  outfitLogsOnDate,
  getOutfitById,
  handleViewLog,
  handleOpenLogDialog,
  handleDeleteLog,
  handleEditLog
}: OutfitLogsListProps) => {
  const isMobile = useIsMobile();
  
  const onDeleteLog = async (id: string) => {
    if (handleDeleteLog) {
      const success = await handleDeleteLog(id);
      if (success) {
        toast.success('Outfit log deleted');
      }
    }
  };
  
  return (
    <Card className={`col-span-1 ${isMobile ? 'w-full' : 'md:col-span-2'} bg-slate-800/40 border-purple-500/20 shadow-lg backdrop-blur-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-purple-200">
          Outfits on {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {outfitLogsOnDate && outfitLogsOnDate.length > 0 ? (
          <div className="space-y-3">
            {outfitLogsOnDate.map(log => {
              const outfit = getOutfitById(log.outfitId);

              // Tombstone: outfit was soft-deleted but the log still references it.
              if (!outfit) {
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/70 rounded-lg border border-purple-500/20 flex justify-between items-center"
                  >
                    <span className="text-sm text-slate-400">Deleted outfit</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:text-red-400"
                      onClick={() => onDeleteLog(log.id)}
                    >
                      <span className="sr-only">Delete log</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                );
              }

              return (
                <OutfitLogItem
                  key={log.id}
                  log={log}
                  outfitName={outfit.name}
                  onView={() => handleViewLog(log)}
                  onDelete={() => onDeleteLog(log.id)}
                  onEdit={handleEditLog ? () => handleEditLog(log) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 italic mb-4">No outfits logged on this date</p>
            <Button 
              variant="outline" 
              className="border-purple-500/30 hover:bg-purple-500/20"
              onClick={() => handleOpenLogDialog(selectedDate)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Outfit Log
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OutfitLogsList;

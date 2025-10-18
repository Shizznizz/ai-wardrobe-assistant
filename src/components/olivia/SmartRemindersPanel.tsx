import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartReminder {
  id: string;
  reminder_type: string;
  message: string;
  priority: number;
  dismissed: boolean;
}

const SmartRemindersPanel = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<SmartReminder[]>([]);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('smart_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('priority', { ascending: false })
      .limit(5);

    if (data) {
      setReminders(data);
    }
  };

  const handleDismiss = async (reminderId: string) => {
    await supabase
      .from('smart_reminders')
      .update({ dismissed: true })
      .eq('id', reminderId);

    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'unworn_item':
        return <AlertCircle className="h-5 w-5" />;
      case 'seasonal_rotation':
        return <Calendar className="h-5 w-5" />;
      case 'needs_cleaning':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getReminderColor = (priority: number) => {
    if (priority >= 8) return 'border-red-500 bg-red-50/50 dark:bg-red-950/20';
    if (priority >= 6) return 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
    return 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return { label: 'High', variant: 'destructive' as const };
    if (priority >= 6) return { label: 'Medium', variant: 'default' as const };
    return { label: 'Low', variant: 'secondary' as const };
  };

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-2"
      >
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Smart Reminders</h3>
        <Badge variant="secondary" className="ml-auto">
          {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
        </Badge>
      </motion.div>
      
      <AnimatePresence mode="popLayout">
        {reminders.map((reminder, index) => {
          const priorityInfo = getPriorityLabel(reminder.priority);
          return (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
              transition={{ 
                delay: index * 0.05,
                exit: { duration: 0.2 }
              }}
              layout
            >
              <Card className={`border-l-4 ${getReminderColor(reminder.priority)} transition-all hover:shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                        className="text-primary mt-0.5"
                      >
                        {getReminderIcon(reminder.reminder_type)}
                      </motion.div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={priorityInfo.variant} className="text-xs">
                            {priorityInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {reminder.reminder_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{reminder.message}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(reminder.id)}
                      className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SmartRemindersPanel;

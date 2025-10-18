import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
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

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {reminders.map((reminder) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm">{reminder.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(reminder.id)}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SmartRemindersPanel;

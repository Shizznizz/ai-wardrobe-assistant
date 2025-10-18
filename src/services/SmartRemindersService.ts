import { supabase } from '@/integrations/supabase/client';

export interface CreateReminderParams {
  reminder_type: 'unworn_item' | 'needs_cleaning' | 'seasonal_rotation';
  message: string;
  priority?: number;
  item_id?: string;
  outfit_id?: string;
  expires_at?: string;
}

export class SmartRemindersService {
  /**
   * Get active reminders for the current user
   */
  static async getActiveReminders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('smart_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a new reminder
   */
  static async createReminder(params: CreateReminderParams) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('smart_reminders')
      .insert({
        user_id: user.id,
        reminder_type: params.reminder_type,
        message: params.message,
        priority: params.priority || 5,
        item_id: params.item_id,
        outfit_id: params.outfit_id,
        expires_at: params.expires_at,
        dismissed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }

    return data;
  }

  /**
   * Dismiss a reminder
   */
  static async dismissReminder(reminderId: string) {
    const { error } = await supabase
      .from('smart_reminders')
      .update({ dismissed: true })
      .eq('id', reminderId);

    if (error) {
      console.error('Error dismissing reminder:', error);
      throw error;
    }
  }

  /**
   * Dismiss all reminders
   */
  static async dismissAllReminders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('smart_reminders')
      .update({ dismissed: true })
      .eq('user_id', user.id)
      .eq('dismissed', false);

    if (error) {
      console.error('Error dismissing all reminders:', error);
      throw error;
    }
  }

  /**
   * Generate reminders for unworn items
   */
  static async generateUnwornItemReminders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get items not worn in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .or(`last_worn.is.null,last_worn.lt.${thirtyDaysAgo.toISOString()}`)
      .limit(5);

    if (error) {
      console.error('Error fetching unworn items:', error);
      return [];
    }

    // Create reminders for these items
    const reminders = items?.map(item => ({
      user_id: user.id,
      reminder_type: 'unworn_item' as const,
      message: `Haven't worn your ${item.color} ${item.type} in a while. Want to style it today?`,
      priority: 6,
      item_id: item.id,
      dismissed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })) || [];

    if (reminders.length > 0) {
      const { error: insertError } = await supabase
        .from('smart_reminders')
        .insert(reminders);

      if (insertError) {
        console.error('Error creating reminders:', insertError);
        return [];
      }
    }

    return reminders;
  }
}

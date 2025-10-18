import { supabase } from '@/integrations/supabase/client';

export class DailySuggestionsService {
  /**
   * Manually trigger daily suggestions generation for the current user
   * Useful for testing or on-demand generation
   */
  static async generateSuggestionsNow(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-suggestions', {
        body: {}
      });

      if (error) {
        console.error('Error generating suggestions:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error calling suggestion function:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get today's suggestions for the current user
   */
  static async getTodaysSuggestions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .eq('suggestion_date', today)
      .single();

    if (error) {
      console.error('Error fetching suggestions:', error);
      return null;
    }

    return data;
  }

  /**
   * Mark a suggestion as viewed
   */
  static async markAsViewed(suggestionId: string) {
    const { error } = await supabase
      .from('daily_suggestions')
      .update({ was_viewed: true })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error marking suggestion as viewed:', error);
    }
  }

  /**
   * Mark a suggestion as accepted
   */
  static async markAsAccepted(suggestionId: string) {
    const { error } = await supabase
      .from('daily_suggestions')
      .update({ was_accepted: true })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error marking suggestion as accepted:', error);
    }
  }

  /**
   * Get suggestion history for the current user
   */
  static async getSuggestionHistory(limit: number = 7) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('daily_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .order('suggestion_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching suggestion history:', error);
      return [];
    }

    return data || [];
  }
}


import { supabase } from "@/integrations/supabase/client";

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  total_quizzes: number;
  total_outfits: number;
  quiz_breakdown: Record<string, number>;
  recent_signups: Array<{
    first_name: string;
    created_at: string;
  }>;
  popular_tags: Array<{
    tag: string;
    count: number;
  }>;
}

export interface UserStats {
  total_users: number;
  recent_signups: Array<{
    first_name: string;
    created_at: string;
  }>;
}

export interface QuizAnalytics {
  total_quizzes: number;
  quiz_breakdown: Record<string, number>;
}

export interface OutfitSummary {
  total_outfits: number;
  popular_tags: Array<{
    tag: string;
    count: number;
  }>;
}

class AdminService {
  /**
   * Check if the current user has admin role using server-side validation.
   * NEVER use client-side email comparison for authorization.
   */
  async checkAdminStatus(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;
      
      // Query the user_roles table to check admin status (server-side validation)
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return roleData !== null;
    } catch (error) {
      console.error('Exception checking admin status:', error);
      return false;
    }
  }

  async getAnalytics(): Promise<AdminAnalytics | null> {
    try {
      // The RPC function itself validates admin status server-side
      const { data, error } = await supabase.rpc('get_admin_analytics');
      
      if (error) {
        console.error('Error fetching admin analytics:', error);
        return null;
      }
      
      return data as AdminAnalytics;
    } catch (error) {
      console.error('Exception fetching admin analytics:', error);
      return null;
    }
  }

  async getUserStats(): Promise<UserStats | null> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_admin_analytics');
      
      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }
      
      return {
        total_users: analytics.total_users,
        recent_signups: analytics.recent_signups
      };
    } catch (error) {
      console.error('Exception fetching user stats:', error);
      return null;
    }
  }

  async getQuizAnalytics(): Promise<QuizAnalytics | null> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_admin_analytics');
      
      if (error) {
        console.error('Error fetching quiz analytics:', error);
        return null;
      }
      
      return {
        total_quizzes: analytics.total_quizzes,
        quiz_breakdown: analytics.quiz_breakdown
      };
    } catch (error) {
      console.error('Exception fetching quiz analytics:', error);
      return null;
    }
  }

  async getOutfitSummary(): Promise<OutfitSummary | null> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_admin_analytics');
      
      if (error) {
        console.error('Error fetching outfit summary:', error);
        return null;
      }
      
      return {
        total_outfits: analytics.total_outfits,
        popular_tags: analytics.popular_tags
      };
    } catch (error) {
      console.error('Exception fetching outfit summary:', error);
      return null;
    }
  }

  /**
   * Export user data - requires admin role (validated server-side via RPC)
   * Only exports aggregated/anonymized data for privacy
   */
  async exportAllUserData(): Promise<void> {
    try {
      // Verify admin status first via server-side check
      const isAdmin = await this.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get analytics data (already validated server-side)
      const analytics = await this.getAnalytics();
      if (!analytics) {
        throw new Error('Failed to fetch analytics data');
      }

      // Export only aggregated analytics data, not raw user data
      const exportData = {
        exportedAt: new Date().toISOString(),
        summary: {
          totalUsers: analytics.total_users,
          activeUsers: analytics.active_users,
          totalQuizzes: analytics.total_quizzes,
          totalOutfits: analytics.total_outfits
        },
        quizBreakdown: analytics.quiz_breakdown,
        popularTags: analytics.popular_tags,
        recentSignups: analytics.recent_signups.map(s => ({
          firstName: s.first_name,
          signupDate: s.created_at
        }))
      };

      // Create JSON export (not raw CSV of all data)
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin_analytics_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();

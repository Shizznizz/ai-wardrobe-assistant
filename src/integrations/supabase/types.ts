export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity: string | null
          ai_suggested: boolean | null
          created_at: string | null
          date: string
          id: string
          outfit_id: string | null
          temperature: string | null
          time_of_day: string
          updated_at: string | null
          user_id: string
          weather_condition: string | null
        }
        Insert: {
          activity?: string | null
          ai_suggested?: boolean | null
          created_at?: string | null
          date: string
          id?: string
          outfit_id?: string | null
          temperature?: string | null
          time_of_day: string
          updated_at?: string | null
          user_id: string
          weather_condition?: string | null
        }
        Update: {
          activity?: string | null
          ai_suggested?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          outfit_id?: string | null
          temperature?: string | null
          time_of_day?: string
          updated_at?: string | null
          user_id?: string
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          activity_tag: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          outfit_id: string
          user_id: string
        }
        Insert: {
          activity_tag?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          outfit_id: string
          user_id: string
        }
        Update: {
          activity_tag?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          outfit_id?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_entries: {
        Row: {
          challenge_id: string
          created_at: string | null
          id: string
          outfit_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          votes: number | null
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          id?: string
          outfit_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          votes?: number | null
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          id?: string
          outfit_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          votes?: number | null
        }
        Relationships: []
      }
      clothing_items: {
        Row: {
          color: string
          date_added: string | null
          favorite: boolean | null
          id: string
          image_url: string | null
          last_worn: string | null
          material: string | null
          name: string
          occasions: string[] | null
          season: string[] | null
          times_worn: number | null
          type: string
          user_id: string
        }
        Insert: {
          color: string
          date_added?: string | null
          favorite?: boolean | null
          id?: string
          image_url?: string | null
          last_worn?: string | null
          material?: string | null
          name: string
          occasions?: string[] | null
          season?: string[] | null
          times_worn?: number | null
          type: string
          user_id: string
        }
        Update: {
          color?: string
          date_added?: string | null
          favorite?: boolean | null
          id?: string
          image_url?: string | null
          last_worn?: string | null
          material?: string | null
          name?: string
          occasions?: string[] | null
          season?: string[] | null
          times_worn?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_drop_clicks: {
        Row: {
          clicked_at: string
          converted: boolean | null
          country_code: string | null
          device_type: string | null
          id: string
          item_id: string
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          converted?: boolean | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          item_id: string
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          converted?: boolean | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          item_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_suggestions: {
        Row: {
          activity_context: string | null
          created_at: string
          id: string
          outfit_ids: string[]
          reasoning: string | null
          suggestion_date: string
          updated_at: string
          user_id: string
          was_accepted: boolean | null
          was_viewed: boolean | null
          weather_context: Json | null
        }
        Insert: {
          activity_context?: string | null
          created_at?: string
          id?: string
          outfit_ids?: string[]
          reasoning?: string | null
          suggestion_date: string
          updated_at?: string
          user_id: string
          was_accepted?: boolean | null
          was_viewed?: boolean | null
          weather_context?: Json | null
        }
        Update: {
          activity_context?: string | null
          created_at?: string
          id?: string
          outfit_ids?: string[]
          reasoning?: string | null
          suggestion_date?: string
          updated_at?: string
          user_id?: string
          was_accepted?: boolean | null
          was_viewed?: boolean | null
          weather_context?: Json | null
        }
        Relationships: []
      }
      fashion_trends: {
        Row: {
          colors: string[] | null
          created_at: string
          description: string
          id: string
          key_pieces: string[] | null
          popularity_score: number | null
          season: string
          style_tags: string[] | null
          trend_name: string
          updated_at: string
        }
        Insert: {
          colors?: string[] | null
          created_at?: string
          description: string
          id?: string
          key_pieces?: string[] | null
          popularity_score?: number | null
          season: string
          style_tags?: string[] | null
          trend_name: string
          updated_at?: string
        }
        Update: {
          colors?: string[] | null
          created_at?: string
          description?: string
          id?: string
          key_pieces?: string[] | null
          popularity_score?: number | null
          season?: string
          style_tags?: string[] | null
          trend_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      instant_outfits_saved: {
        Row: {
          created_at: string
          id: string
          items: string[]
          occasion: string
          reasoning: string | null
          style_vibe: string
          title: string
          updated_at: string
          user_id: string
          weather: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: string[]
          occasion: string
          reasoning?: string | null
          style_vibe: string
          title: string
          updated_at?: string
          user_id: string
          weather: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: string[]
          occasion?: string
          reasoning?: string | null
          style_vibe?: string
          title?: string
          updated_at?: string
          user_id?: string
          weather?: string
        }
        Relationships: []
      }
      olivia_learning_data: {
        Row: {
          context: Json | null
          created_at: string
          feedback_text: string | null
          id: string
          interaction_type: string
          outfit_data: Json | null
          rating: number | null
          updated_at: string
          user_id: string
          was_successful: boolean | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          interaction_type: string
          outfit_data?: Json | null
          rating?: number | null
          updated_at?: string
          user_id: string
          was_successful?: boolean | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          interaction_type?: string
          outfit_data?: Json | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          was_successful?: boolean | null
        }
        Relationships: []
      }
      outfit_feedback: {
        Row: {
          id: string
          item_id: string | null
          label: string
          notes: string | null
          outfit_id: string
          replacement_item_id: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id?: string | null
          label: string
          notes?: string | null
          outfit_id: string
          replacement_item_id?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string | null
          label?: string
          notes?: string | null
          outfit_id?: string
          replacement_item_id?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outfit_logs: {
        Row: {
          activity: string | null
          ai_suggested: boolean | null
          created_at: string
          custom_activity: string | null
          date: string
          id: string
          notes: string | null
          outfit_id: string
          temperature: string | null
          time_of_day: string
          updated_at: string
          user_id: string
          weather_condition: string | null
        }
        Insert: {
          activity?: string | null
          ai_suggested?: boolean | null
          created_at?: string
          custom_activity?: string | null
          date: string
          id?: string
          notes?: string | null
          outfit_id: string
          temperature?: string | null
          time_of_day: string
          updated_at?: string
          user_id: string
          weather_condition?: string | null
        }
        Update: {
          activity?: string | null
          ai_suggested?: boolean | null
          created_at?: string
          custom_activity?: string | null
          date?: string
          id?: string
          notes?: string | null
          outfit_id?: string
          temperature?: string | null
          time_of_day?: string
          updated_at?: string
          user_id?: string
          weather_condition?: string | null
        }
        Relationships: []
      }
      outfit_usage: {
        Row: {
          action_type: string
          id: string
          outfit_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action_type: string
          id?: string
          outfit_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action_type?: string
          id?: string
          outfit_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      outfits: {
        Row: {
          color_scheme: string | null
          colors: string[] | null
          created_at: string | null
          date_added: string | null
          favorite: boolean | null
          id: string
          items: string[]
          last_worn: string | null
          name: string
          notes: string | null
          occasion: string | null
          occasions: string[] | null
          personality_tags: string[] | null
          season: string[] | null
          tags: string[] | null
          times_worn: number | null
          user_id: string
        }
        Insert: {
          color_scheme?: string | null
          colors?: string[] | null
          created_at?: string | null
          date_added?: string | null
          favorite?: boolean | null
          id?: string
          items: string[]
          last_worn?: string | null
          name: string
          notes?: string | null
          occasion?: string | null
          occasions?: string[] | null
          personality_tags?: string[] | null
          season?: string[] | null
          tags?: string[] | null
          times_worn?: number | null
          user_id: string
        }
        Update: {
          color_scheme?: string | null
          colors?: string[] | null
          created_at?: string | null
          date_added?: string | null
          favorite?: boolean | null
          id?: string
          items?: string[]
          last_worn?: string | null
          name?: string
          notes?: string | null
          occasion?: string | null
          occasions?: string[] | null
          personality_tags?: string[] | null
          season?: string[] | null
          tags?: string[] | null
          times_worn?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          color_scheme: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notification_settings: Json | null
          personality_tags: string[] | null
          pronouns: string | null
          style_preferences: Json | null
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          color_scheme?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          notification_settings?: Json | null
          personality_tags?: string[] | null
          pronouns?: string | null
          style_preferences?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          color_scheme?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notification_settings?: Json | null
          personality_tags?: string[] | null
          pronouns?: string | null
          style_preferences?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          quiz_type: string
          result_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          quiz_type: string
          result_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          quiz_type?: string
          result_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      smart_reminders: {
        Row: {
          created_at: string
          dismissed: boolean | null
          expires_at: string | null
          id: string
          item_id: string | null
          message: string
          outfit_id: string | null
          priority: number | null
          reminder_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          item_id?: string | null
          message: string
          outfit_id?: string | null
          priority?: number | null
          reminder_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          item_id?: string | null
          message?: string
          outfit_id?: string | null
          priority?: number | null
          reminder_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_chat_limits: {
        Row: {
          created_at: string
          id: string
          is_premium: boolean
          last_message_at: string
          message_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_premium?: boolean
          last_message_at?: string
          message_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_premium?: boolean
          last_message_at?: string
          message_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          appearance_settings: Json | null
          body_type: string | null
          climate_preferences: string[] | null
          created_at: string | null
          favorite_colors: string[] | null
          favorite_styles: string[] | null
          id: string
          message_count: number | null
          notify_new_outfits: boolean | null
          notify_weather_changes: boolean | null
          occasions_preferences: string[] | null
          personality_tags: string[] | null
          preferred_city: string | null
          preferred_country: string | null
          pronouns: string | null
          quiz_derived_eras: Json | null
          quiz_derived_lifestyle: Json | null
          quiz_derived_styles: Json | null
          quiz_derived_vibes: Json | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          seasonal_preferences: Json | null
          temperature_unit: string | null
          updated_at: string | null
          use_only_wardrobe: boolean | null
          use_trends_global: boolean | null
          use_trends_local: boolean | null
          user_id: string
          weekly_email_updates: boolean | null
        }
        Insert: {
          appearance_settings?: Json | null
          body_type?: string | null
          climate_preferences?: string[] | null
          created_at?: string | null
          favorite_colors?: string[] | null
          favorite_styles?: string[] | null
          id?: string
          message_count?: number | null
          notify_new_outfits?: boolean | null
          notify_weather_changes?: boolean | null
          occasions_preferences?: string[] | null
          personality_tags?: string[] | null
          preferred_city?: string | null
          preferred_country?: string | null
          pronouns?: string | null
          quiz_derived_eras?: Json | null
          quiz_derived_lifestyle?: Json | null
          quiz_derived_styles?: Json | null
          quiz_derived_vibes?: Json | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          seasonal_preferences?: Json | null
          temperature_unit?: string | null
          updated_at?: string | null
          use_only_wardrobe?: boolean | null
          use_trends_global?: boolean | null
          use_trends_local?: boolean | null
          user_id: string
          weekly_email_updates?: boolean | null
        }
        Update: {
          appearance_settings?: Json | null
          body_type?: string | null
          climate_preferences?: string[] | null
          created_at?: string | null
          favorite_colors?: string[] | null
          favorite_styles?: string[] | null
          id?: string
          message_count?: number | null
          notify_new_outfits?: boolean | null
          notify_weather_changes?: boolean | null
          occasions_preferences?: string[] | null
          personality_tags?: string[] | null
          preferred_city?: string | null
          preferred_country?: string | null
          pronouns?: string | null
          quiz_derived_eras?: Json | null
          quiz_derived_lifestyle?: Json | null
          quiz_derived_styles?: Json | null
          quiz_derived_vibes?: Json | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          seasonal_preferences?: Json | null
          temperature_unit?: string | null
          updated_at?: string | null
          use_only_wardrobe?: boolean | null
          use_trends_global?: boolean | null
          use_trends_local?: boolean | null
          user_id?: string
          weekly_email_updates?: boolean | null
        }
        Relationships: []
      }
      user_quiz_results: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          quiz_id: string
          quiz_name: string
          result_label: string
          result_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          quiz_id: string
          quiz_name: string
          result_label: string
          result_value: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          quiz_id?: string
          quiz_name?: string
          result_label?: string
          result_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vto_testers: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          created_at: string
          favorite: boolean | null
          id: string
          item_data: Json
          last_viewed_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite?: boolean | null
          id?: string
          item_data: Json
          last_viewed_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          favorite?: boolean | null
          id?: string
          item_data?: Json
          last_viewed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_reminders: { Args: never; Returns: undefined }
      get_admin_analytics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_message_count: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

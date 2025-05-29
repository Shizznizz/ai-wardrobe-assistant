export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          is_admin: boolean | null
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
          is_admin?: boolean | null
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
          is_admin?: boolean | null
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
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      increment_message_count: {
        Args: { user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

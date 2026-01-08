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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      league_teams: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          league_name: string
          logo_url: string | null
          sport: string
          stadium: string | null
          team_id: string
          team_name: string
          updated_at: string
          website: string | null
          year_founded: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          league_name: string
          logo_url?: string | null
          sport: string
          stadium?: string | null
          team_id: string
          team_name: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          league_name?: string
          logo_url?: string | null
          sport?: string
          stadium?: string | null
          team_id?: string
          team_name?: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Relationships: []
      }
      leagues: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          league_id: string
          league_name: string
          logo_url: string | null
          sport: string
          updated_at: string
          website: string | null
          year_founded: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          league_id: string
          league_name: string
          logo_url?: string | null
          sport: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          league_id?: string
          league_name?: string
          logo_url?: string | null
          sport?: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team: string
          away_team_badge: string | null
          created_at: string
          faqs: Json | null
          home_score: number | null
          home_team: string
          home_team_badge: string | null
          id: string
          league: string | null
          match_id: string
          match_time: string
          seo_preview: string | null
          sport: string | null
          status: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team: string
          away_team_badge?: string | null
          created_at?: string
          faqs?: Json | null
          home_score?: number | null
          home_team: string
          home_team_badge?: string | null
          id?: string
          league?: string | null
          match_id: string
          match_time: string
          seo_preview?: string | null
          sport?: string | null
          status?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team?: string
          away_team_badge?: string | null
          created_at?: string
          faqs?: Json | null
          home_score?: number | null
          home_team?: string
          home_team_badge?: string | null
          id?: string
          league?: string | null
          match_id?: string
          match_time?: string
          seo_preview?: string | null
          sport?: string | null
          status?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      notified_matches: {
        Row: {
          id: string
          match_id: string
          match_title: string | null
          notification_type: string | null
          notified_at: string
        }
        Insert: {
          id?: string
          match_id: string
          match_title?: string | null
          notification_type?: string | null
          notified_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          match_title?: string | null
          notification_type?: string | null
          notified_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_stats: {
        Row: {
          average_goals: number | null
          clean_sheets: number | null
          created_at: string
          current_position: number | null
          draws: number | null
          form_last_5: string[] | null
          goals_conceded: number | null
          goals_scored: number | null
          id: string
          league: string | null
          losses: number | null
          matches_played: number | null
          sport: string
          team_id: string
          team_name: string
          total_points: number | null
          updated_at: string
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          average_goals?: number | null
          clean_sheets?: number | null
          created_at?: string
          current_position?: number | null
          draws?: number | null
          form_last_5?: string[] | null
          goals_conceded?: number | null
          goals_scored?: number | null
          id?: string
          league?: string | null
          losses?: number | null
          matches_played?: number | null
          sport: string
          team_id: string
          team_name: string
          total_points?: number | null
          updated_at?: string
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          average_goals?: number | null
          clean_sheets?: number | null
          created_at?: string
          current_position?: number | null
          draws?: number | null
          form_last_5?: string[] | null
          goals_conceded?: number | null
          goals_scored?: number | null
          id?: string
          league?: string | null
          losses?: number | null
          matches_played?: number | null
          sport?: string
          team_id?: string
          team_name?: string
          total_points?: number | null
          updated_at?: string
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viewer_sessions: {
        Row: {
          created_at: string
          id: string
          last_heartbeat: string
          match_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_heartbeat?: string
          match_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_heartbeat?: string
          match_id?: string
          session_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_notifications: { Args: never; Returns: undefined }
      cleanup_stale_viewer_sessions: { Args: never; Returns: undefined }
      get_page_views_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          top_pages: Json
          total_views: number
          unique_sessions: number
        }[]
      }
      get_public_iptv_providers: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          output_format: string
          playlist_type: string
        }[]
      }
      get_total_page_views: { Args: never; Returns: number }
      get_viewer_count: { Args: { match_id_param: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      heartbeat_viewer: {
        Args: { match_id_param: string; session_id_param: string }
        Returns: undefined
      }
      increment_blog_views: { Args: { post_slug: string }; Returns: undefined }
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

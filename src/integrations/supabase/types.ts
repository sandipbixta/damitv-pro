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
      blog_posts: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          match_id: string
          message: string
          session_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          match_id: string
          message: string
          session_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          match_id?: string
          message?: string
          session_id?: string
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          subscribed_leagues: string[] | null
          subscribed_teams: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string | null
          verification_token: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_leagues?: string[] | null
          subscribed_teams?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          verification_token?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_leagues?: string[] | null
          subscribed_teams?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          verification_token?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      head_to_head_stats: {
        Row: {
          created_at: string
          draws: number | null
          id: string
          last_5_results: string[] | null
          last_match_date: string | null
          last_match_score: string | null
          sport: string
          team_a_name: string
          team_a_wins: number | null
          team_b_name: string
          team_b_wins: number | null
          total_matches: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          draws?: number | null
          id?: string
          last_5_results?: string[] | null
          last_match_date?: string | null
          last_match_score?: string | null
          sport: string
          team_a_name: string
          team_a_wins?: number | null
          team_b_name: string
          team_b_wins?: number | null
          total_matches?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          draws?: number | null
          id?: string
          last_5_results?: string[] | null
          last_match_date?: string | null
          last_match_score?: string | null
          sport?: string
          team_a_name?: string
          team_a_wins?: number | null
          team_b_name?: string
          team_b_wins?: number | null
          total_matches?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      iptv_providers: {
        Row: {
          base_url: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          output_format: string | null
          password: string
          playlist_type: string | null
          updated_at: string
          username: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          output_format?: string | null
          password: string
          playlist_type?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          output_format?: string | null
          password?: string
          playlist_type?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
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
      match_predictions: {
        Row: {
          confidence_level: string | null
          created_at: string
          display_name: string
          id: string
          is_correct: boolean | null
          match_id: string
          match_start_time: string
          points_earned: number | null
          predicted_score_away: number | null
          predicted_score_home: number | null
          predicted_winner: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_correct?: boolean | null
          match_id: string
          match_start_time: string
          points_earned?: number | null
          predicted_score_away?: number | null
          predicted_score_home?: number | null
          predicted_winner: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_correct?: boolean | null
          match_id?: string
          match_start_time?: string
          points_earned?: number | null
          predicted_score_away?: number | null
          predicted_score_home?: number | null
          predicted_winner?: string
          session_id?: string
          user_id?: string | null
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
      user_favorites: {
        Row: {
          created_at: string
          favorite_id: string
          favorite_name: string
          favorite_type: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          favorite_id: string
          favorite_name: string
          favorite_type: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          favorite_id?: string
          favorite_name?: string
          favorite_type?: string
          id?: string
          session_id?: string
          user_id?: string | null
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
      watch_history: {
        Row: {
          created_at: string
          id: string
          last_watched_at: string
          match_id: string
          match_title: string
          session_id: string
          sport_id: string
          user_id: string | null
          watch_duration: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_watched_at?: string
          match_id: string
          match_title: string
          session_id: string
          sport_id: string
          user_id?: string | null
          watch_duration?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_watched_at?: string
          match_id?: string
          match_title?: string
          session_id?: string
          sport_id?: string
          user_id?: string | null
          watch_duration?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      prediction_leaderboard: {
        Row: {
          accuracy_percentage: number | null
          correct_predictions: number | null
          display_name: string | null
          session_id: string | null
          total_points: number | null
          total_predictions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
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

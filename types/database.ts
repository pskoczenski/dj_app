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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      event_lineup: {
        Row: {
          added_by: string
          created_at: string | null
          event_id: string
          id: string
          is_headliner: boolean | null
          profile_id: string
          set_time: string | null
          sort_order: number | null
        }
        Insert: {
          added_by: string
          created_at?: string | null
          event_id: string
          id?: string
          is_headliner?: boolean | null
          profile_id: string
          set_time?: string | null
          sort_order?: number | null
        }
        Update: {
          added_by?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_headliner?: boolean | null
          profile_id?: string
          set_time?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_lineup_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_lineup_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineup_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineup_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_lineup_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          state_code: string
          state_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          state_code: string
          state_name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state_code?: string
          state_name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city_id: string
          country: string | null
          created_at: string | null
          created_by: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          flyer_image_url: string | null
          genre_ids: string[]
          google_place_id: string | null
          id: string
          latitude: number | null
          likes_count: number
          longitude: number | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          street_address: string | null
          ticket_url: string | null
          title: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          city_id: string
          country?: string | null
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          flyer_image_url?: string | null
          genre_ids?: string[]
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          likes_count?: number
          longitude?: number | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          street_address?: string | null
          ticket_url?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          city_id?: string
          country?: string | null
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          flyer_image_url?: string | null
          genre_ids?: string[]
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          likes_count?: number
          longitude?: number | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          street_address?: string | null
          ticket_url?: string | null
          title?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_likes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          profile_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          profile_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string
          event_id: string | null
          id: string
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          event_id?: string | null
          id?: string
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          event_id?: string | null
          id?: string
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comment_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          commentable_id: string
          commentable_type: Database["public"]["Enums"]["commentable_type"]
          created_at: string | null
          deleted_at: string | null
          id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          body: string
          commentable_id: string
          commentable_type: Database["public"]["Enums"]["commentable_type"]
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          commentable_id?: string
          commentable_type?: Database["public"]["Enums"]["commentable_type"]
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_likes: {
        Row: {
          created_at: string
          id: string
          mix_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mix_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mix_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mix_likes_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mix_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
      mixes: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration: string | null
          embed_url: string
          genre_ids: string[]
          id: string
          likes_count: number
          platform: Database["public"]["Enums"]["mix_platform"]
          profile_id: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          embed_url: string
          genre_ids?: string[]
          id?: string
          likes_count?: number
          platform: Database["public"]["Enums"]["mix_platform"]
          profile_id: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          embed_url?: string
          genre_ids?: string[]
          id?: string
          likes_count?: number
          platform?: Database["public"]["Enums"]["mix_platform"]
          profile_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mixes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_follow_counts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mixes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          city_id: string
          country: string | null
          created_at: string | null
          deleted_at: string | null
          display_name: string
          genre_ids: string[]
          id: string
          profile_image_url: string | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          slug: string
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          city_id: string
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name: string
          genre_ids?: string[]
          id: string
          profile_image_url?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          slug: string
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          city_id?: string
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string
          genre_ids?: string[]
          id?: string
          profile_image_url?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          slug?: string
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      comment_counts: {
        Row: {
          commentable_id: string | null
          commentable_type: Database["public"]["Enums"]["commentable_type"] | null
          count: number | null
        }
        Relationships: []
      }
      profile_follow_counts: {
        Row: {
          followers_count: number | null
          following_count: number | null
          profile_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_self_to_event_group_chat: { Args: { p_event_id: string }; Returns: undefined }
      get_or_create_dm: { Args: { other_user_id: string }; Returns: string }
      sync_event_group_participants_for_event: {
        Args: { p_event_id: string }
        Returns: undefined
      }
    }
    Enums: {
      commentable_type: "event" | "mix"
      conversation_type: "dm" | "event_group"
      event_status: "draft" | "published" | "cancelled"
      mix_platform:
        | "soundcloud"
        | "mixcloud"
        | "youtube"
        | "spotify"
        | "apple_music"
        | "other"
      profile_type: "dj" | "promoter" | "fan"
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
      commentable_type: ["event", "mix"],
      conversation_type: ["dm", "event_group"],
      event_status: ["draft", "published", "cancelled"],
      mix_platform: [
        "soundcloud",
        "mixcloud",
        "youtube",
        "spotify",
        "apple_music",
        "other",
      ],
      profile_type: ["dj", "promoter", "fan"],
    },
  },
} as const

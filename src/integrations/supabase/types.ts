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
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          call_notifications: boolean
          created_at: string
          id: string
          interest_notifications: boolean
          match_notifications: boolean
          message_notifications: boolean
          push_notifications: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          call_notifications?: boolean
          created_at?: string
          id?: string
          interest_notifications?: boolean
          match_notifications?: boolean
          message_notifications?: boolean
          push_notifications?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          call_notifications?: boolean
          created_at?: string
          id?: string
          interest_notifications?: boolean
          match_notifications?: boolean
          message_notifications?: boolean
          push_notifications?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          additional_photos: string[] | null
          annual_income: string | null
          birth_place: string | null
          birth_time: string | null
          city_village: string | null
          community: string | null
          created_at: string
          date_of_birth: string | null
          district: string | null
          education: string | null
          email: string | null
          full_name: string
          gender: string | null
          gotra: string | null
          height: string | null
          id: string
          is_online: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          manglik: string | null
          marital_status: string | null
          mother_tongue: string | null
          nakshatra: string | null
          occupation: string | null
          phone: string | null
          photo_url: string | null
          pref_age_max: number | null
          pref_age_min: number | null
          pref_education: string[] | null
          pref_height_max: string | null
          pref_height_min: string | null
          pref_marital_status: string[] | null
          pref_states: string[] | null
          profile_completion: number | null
          rashi: string | null
          registration_step: number | null
          religion: string | null
          state: string | null
          sub_caste: string | null
          tanda_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          additional_photos?: string[] | null
          annual_income?: string | null
          birth_place?: string | null
          birth_time?: string | null
          city_village?: string | null
          community?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          education?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          gotra?: string | null
          height?: string | null
          id?: string
          is_online?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          manglik?: string | null
          marital_status?: string | null
          mother_tongue?: string | null
          nakshatra?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_education?: string[] | null
          pref_height_max?: string | null
          pref_height_min?: string | null
          pref_marital_status?: string[] | null
          pref_states?: string[] | null
          profile_completion?: number | null
          rashi?: string | null
          registration_step?: number | null
          religion?: string | null
          state?: string | null
          sub_caste?: string | null
          tanda_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          additional_photos?: string[] | null
          annual_income?: string | null
          birth_place?: string | null
          birth_time?: string | null
          city_village?: string | null
          community?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          education?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          gotra?: string | null
          height?: string | null
          id?: string
          is_online?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          manglik?: string | null
          marital_status?: string | null
          mother_tongue?: string | null
          nakshatra?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_education?: string[] | null
          pref_height_max?: string | null
          pref_height_min?: string | null
          pref_marital_status?: string[] | null
          pref_states?: string[] | null
          profile_completion?: number | null
          rashi?: string | null
          registration_step?: number | null
          religion?: string | null
          state?: string | null
          sub_caste?: string | null
          tanda_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          id: string
          is_typing: boolean | null
          partner_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          partner_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          partner_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          id_photo_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          id_photo_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          id_photo_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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

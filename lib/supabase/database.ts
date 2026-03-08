export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          token_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          token_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          token_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          ayat_number: number;
          created_at: string;
          id: string;
          surah_id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ayat_number: number;
          created_at?: string;
          id?: string;
          surah_id: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ayat_number?: number;
          created_at?: string;
          id?: string;
          surah_id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          ayat_read: number;
          created_at: string;
          date: string;
          halaman_read: number;
          id: string;
          minutes_read: number;
          surah_read: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ayat_read?: number;
          created_at?: string;
          date: string;
          halaman_read?: number;
          id?: string;
          minutes_read?: number;
          surah_read?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ayat_read?: number;
          created_at?: string;
          date?: string;
          halaman_read?: number;
          id?: string;
          minutes_read?: number;
          surah_read?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          id: string;
          initials: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          id: string;
          initials: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          initials?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reading_progress: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          is_completed: boolean;
          last_ayat_read: number | null;
          started_at: string;
          surah_id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          last_ayat_read?: number | null;
          started_at?: string;
          surah_id: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          last_ayat_read?: number | null;
          started_at?: string;
          surah_id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          current_streak: number;
          id: string;
          last_read_date: string | null;
          longest_streak: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          current_streak?: number;
          id?: string;
          last_read_date?: string | null;
          longest_streak?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          current_streak?: number;
          id?: string;
          last_read_date?: string | null;
          longest_streak?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_goals: {
        Row: {
          ayat_goal: number;
          created_at: string;
          halaman_goal: number;
          id: string;
          menit_goal: number;
          surah_goal: number;
          target_juz: number;
          updated_at: string;
        };
        Insert: {
          ayat_goal?: number;
          created_at?: string;
          halaman_goal?: number;
          id: string;
          menit_goal?: number;
          surah_goal?: number;
          target_juz?: number;
          updated_at?: string;
        };
        Update: {
          ayat_goal?: number;
          created_at?: string;
          halaman_goal?: number;
          id?: string;
          menit_goal?: number;
          surah_goal?: number;
          target_juz?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          daily_target_pages: number;
          dark_mode: boolean;
          id: string;
          language: string;
          prayer_reminder: boolean;
          reading_notification: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          daily_target_pages?: number;
          dark_mode?: boolean;
          id: string;
          language?: string;
          prayer_reminder?: boolean;
          reading_notification?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          daily_target_pages?: number;
          dark_mode?: boolean;
          id?: string;
          language?: string;
          prayer_reminder?: boolean;
          reading_notification?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

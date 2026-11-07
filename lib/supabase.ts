import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string };
      };
      members: {
        Row: {
          id: string;
          club_id: string | null;
          full_name: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: { id: string; club_id?: string; full_name?: string; is_active?: boolean };
      };
      access_permissions: {
        Row: {
          id: string;
          member_id: string;
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
      };
      door_events: {
        Row: {
          id: string;
          member_id: string | null;
          requested_at: string;
          lock_state: string | null;
          result: string;
          error_message: string | null;
        };
      };
      access_requests: {
        Row: {
          id: string;
          club_id: string | null;
          request_type: string;
          full_name: string;
          email: string;
          desired_date: string | null;
          status: string;
          processed_at: string | null;
          processed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id?: string;
          request_type: string;
          full_name: string;
          email: string;
          desired_date?: string;
          status?: string;
          note?: string;
        };
      };
    };
  };
};

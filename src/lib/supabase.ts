import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          public_key: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          public_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          public_key?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          encrypted_content: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          encrypted_content: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          encrypted_content?: string;
          created_at?: string;
          read_at?: string | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_id?: string;
          created_at?: string;
        };
      };
    };
  };
};

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
          // Optional: the API roles no longer have column-level SELECT on
          // `email` (see supabase/migrations/*_restrict_users_email_select.sql),
          // so client reads of the users table never include it. Email comes
          // from the auth session (session.user.email), not this table.
          email?: string;
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
          topic: string | null;
          extension: string | null;
          file_name: string | null;
          file_type: string | null;
          file_size: number | null;
          file_url: string | null;
          encrypted_file_key: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          encrypted_content: string;
          created_at?: string;
          read_at?: string | null;
          topic?: string | null;
          extension?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          encrypted_file_key?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          encrypted_content?: string;
          created_at?: string;
          read_at?: string | null;
          topic?: string | null;
          extension?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          encrypted_file_key?: string | null;
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
      key_backups: {
        Row: {
          user_id: string;
          encrypted_private_key: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          encrypted_private_key: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          encrypted_private_key?: string;
          updated_at?: string;
        };
      };
    };
  };
};

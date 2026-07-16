import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// UI gate only: decides whether the dashboard button/modal render at all.
// The actual authorization lives server-side in get_admin_stats(), which
// checks the caller's verified JWT email — a spoofed client gains nothing.
export const ADMIN_EMAIL = 'pgj@mailbox.org';

export function isAdminUser(user: User | null): boolean {
  return user?.email === ADMIN_EMAIL;
}

// Shape of the get_admin_stats() RPC result (aggregate counts only —
// see supabase/migrations/20260716090000_add_visitor_stats_admin.sql).
export interface AdminStats {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  total_messages: number;
  messages_7d: number;
  visits_today: number;
  visits_7d: number;
  visits_30d: number;
  visits_total: number;
  visits_daily: { day: string; count: number }[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('get_admin_stats');
  if (error) throw error;
  return data as AdminStats;
}

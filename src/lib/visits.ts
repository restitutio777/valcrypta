import { supabase } from './supabase';

// Logs one visit per browser session. The row carries only a timestamp and
// a signed-in flag — no IP, no user agent, no user id (the table is also
// write-only for clients; see supabase/init.sql, site_visits).
const SESSION_FLAG = 'valcrypta-visit-logged';

export function logVisit(isAuthenticated: boolean): void {
  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, '1');
  } catch {
    // Storage unavailable (e.g. blocked) — skip rather than double-count.
    return;
  }

  // Fire-and-forget: statistics must never affect the app.
  void supabase
    .from('site_visits')
    .insert({ is_authenticated: isAuthenticated })
    .then(({ error }) => {
      if (error) console.debug('Visit logging skipped:', error.message);
    });
}

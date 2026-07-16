-- Admin backend: general visitor statistics.
--
-- site_visits stores one row per app visit — a timestamp and whether the
-- visitor was signed in. Deliberately nothing else: no IP address, no user
-- agent, no user id. The landing page promises "kein Tracking"; aggregate
-- visit counts with no identifying detail keep that claim true.
--
-- Raw rows are write-only for clients (INSERT policy, no SELECT policy).
-- Reading happens exclusively through get_admin_stats(), a SECURITY DEFINER
-- RPC that authorizes against the caller's verified JWT email server-side —
-- the client cannot spoof it, and the frontend admin check is UI-only.

CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_authenticated boolean NOT NULL DEFAULT false
);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- Anyone may log a visit (the app inserts once per browser session). With no
-- SELECT/UPDATE/DELETE policies, client roles can never read rows back.
DROP POLICY IF EXISTS "Anyone can log a visit" ON site_visits;
CREATE POLICY "Anyone can log a visit"
  ON site_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON site_visits(created_at DESC);

-- Defense in depth, matching 20260705140000: client roles keep only the
-- privilege they actually use (INSERT), so an RLS mistake alone can't leak.
REVOKE ALL ON public.site_visits FROM anon, authenticated;
GRANT INSERT ON public.site_visits TO anon, authenticated;

-- Aggregate statistics for the admin dashboard. SECURITY DEFINER so it can
-- count across tables the caller has no direct access to; only ever returns
-- counts, never row contents.
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  today timestamptz := date_trunc('day', now());
BEGIN
  IF coalesce(auth.jwt() ->> 'email', '') <> 'pgj@mailbox.org' THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.users),
    'new_users_7d', (SELECT count(*) FROM public.users WHERE created_at >= now() - interval '7 days'),
    'new_users_30d', (SELECT count(*) FROM public.users WHERE created_at >= now() - interval '30 days'),
    'total_messages', (SELECT count(*) FROM public.messages),
    'messages_7d', (SELECT count(*) FROM public.messages WHERE created_at >= now() - interval '7 days'),
    'visits_today', (SELECT count(*) FROM public.site_visits WHERE created_at >= today),
    'visits_7d', (SELECT count(*) FROM public.site_visits WHERE created_at >= now() - interval '7 days'),
    'visits_30d', (SELECT count(*) FROM public.site_visits WHERE created_at >= now() - interval '30 days'),
    'visits_total', (SELECT count(*) FROM public.site_visits),
    'visits_daily', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object('day', to_char(d.day, 'YYYY-MM-DD'), 'count', coalesce(v.n, 0))
          ORDER BY d.day
        ),
        '[]'::jsonb
      )
      FROM generate_series(today - interval '13 days', today, interval '1 day') AS d(day)
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, count(*) AS n
        FROM public.site_visits
        WHERE created_at >= today - interval '13 days'
        GROUP BY 1
      ) v ON v.day = d.day
    )
  );
END;
$$;

-- Matching 20260705140100: unauthenticated callers can't even invoke the RPC;
-- the email check above does the actual authorization.
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

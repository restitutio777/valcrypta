-- Hardening follow-up for site_visits: narrow the client INSERT privilege to
-- the single column the app actually sends. Clients can then neither choose
-- ids nor backdate/forge created_at — both always come from the defaults.

REVOKE INSERT ON public.site_visits FROM anon, authenticated;
GRANT INSERT (is_authenticated) ON public.site_visits TO anon, authenticated;

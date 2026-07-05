-- B-3 defense-in-depth: drop table privileges the client roles never use,
-- so a future RLS-policy mistake alone can't expose these tables.
--
-- Applied to production 2026-07-05 via MCP (apply_migration). Safe to apply
-- at any time relative to a frontend deploy: nothing revoked here is used by
-- any client version (verified: no code references email_notification_queue;
-- PostgREST cannot issue TRUNCATE/REFERENCES/TRIGGER).

-- email_notification_queue: only service_role has an RLS policy (deny-all for
-- clients) and the frontend never references the table; remove the grants as
-- a second layer.
REVOKE ALL ON public.email_notification_queue FROM anon, authenticated;

-- key_backups: the app needs SELECT/INSERT/UPDATE/DELETE (owner-scoped via
-- RLS). anon never touches it; the remaining maintenance privileges are
-- dropped below for every table.
REVOKE ALL ON public.key_backups FROM anon;

-- TRUNCATE is NOT subject to RLS, and REFERENCES/TRIGGER are DDL-time
-- privileges no PostgREST client can meaningfully hold. Drop them for the
-- client roles across the schema.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

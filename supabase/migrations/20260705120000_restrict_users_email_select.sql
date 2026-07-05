-- Restrict email exposure (security fix A-4).
--
-- Problem: the `users` SELECT policy is `USING (true)` so any authenticated
-- user can read EVERY row. Because RLS is row-level (it cannot hide a single
-- column), that broad read also exposed every user's `email` — a PII leak
-- confirmed live (`select email from users` returns all addresses).
--
-- Fix: remove the column-level SELECT privilege on `users.email` from the two
-- API roles (`anon`, `authenticated`). `username` and `public_key` stay
-- readable (needed for contact search and message encryption). The app never
-- reads `email` from this table — it uses the auth session (session.user.email)
-- — and INSERT/UPDATE of `email` (signup upsert) is unaffected because those
-- are separate column privileges. `service_role` keeps full access.
--
-- DEPLOY ORDER (important): ship the frontend that no longer issues
-- `select('*')` on `users` FIRST (it now selects `id, username, public_key,
-- created_at`), THEN run this migration. Applying it while an old client still
-- requests `*`/`email` could make those reads fail.

REVOKE SELECT (email) ON public.users FROM anon, authenticated;

-- Optional hardening for future columns: also drop the default so a re-GRANT of
-- table-wide SELECT doesn't silently re-expose email.
-- (Re-running the REVOKE above after any `GRANT SELECT ON users` is sufficient.)

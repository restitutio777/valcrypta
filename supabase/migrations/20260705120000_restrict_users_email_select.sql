-- Restrict email exposure (security fix A-4).
--
-- Problem: the `users` SELECT policy is `USING (true)`, so any authenticated
-- user can read EVERY row. Because RLS is row-level (it cannot hide a single
-- column), that broad read also exposed every user's `email` — a PII leak
-- confirmed live (`select email from users` returned all addresses).
--
-- Why a column-level REVOKE alone is NOT enough (verified against this project):
-- `authenticated` holds a TABLE-level SELECT grant on `users`, which implicitly
-- covers every column. In PostgreSQL a table-level SELECT cannot be narrowed by
-- `REVOKE SELECT (email)` — the table grant keeps making all columns readable.
-- The only working fix is to drop the table-level SELECT and re-grant SELECT on
-- exactly the allowed columns:
--
--   allowed for clients: id, username, public_key, created_at
--   hidden from clients: email   (served only by the auth session)
--
-- `anon` has no SELECT on users (RLS is `TO authenticated`), so it needs no
-- change. `service_role` keeps full access for server-side jobs.
--
-- ⚠️ DEPLOY ORDER (verified necessary): once table-level SELECT is gone, a
-- client that issues `select('*')` (or `select('email')`) on users gets a hard
-- `42501 permission denied for table users`. Ship the frontend that selects
-- explicit columns (`id, username, public_key, created_at`) FIRST, then run
-- this migration. Running it against the OLD frontend breaks login/search.

REVOKE SELECT ON public.users FROM authenticated;
GRANT SELECT (id, username, public_key, created_at) ON public.users TO authenticated;

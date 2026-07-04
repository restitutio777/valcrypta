-- Applied to production 2026-07-04 via Supabase MCP.
-- The app performs every database operation with an authenticated session;
-- the anon key is only used to bootstrap auth. Removing anon's table and
-- function privileges hides the schema from unauthenticated GraphQL/REST
-- introspection (advisor lints 0026/0028) without affecting the app.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- Trigger-only functions are fired by the database itself (EXECUTE is not
-- checked at trigger fire time), so no client role needs them. Functions
-- default to EXECUTE for PUBLIC, which must be revoked explicitly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_unread_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invoke_email_notifications() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.should_send_email_notification(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_unread_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_file_access(text, uuid) FROM PUBLIC;

-- Re-grant only what signed-in clients legitimately need: the storage
-- SELECT policy evaluates has_file_access() as the querying role, and
-- reset_unread_count() is the RPC for the future unread-badge feature.
GRANT EXECUTE ON FUNCTION public.has_file_access(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_unread_count(uuid) TO authenticated;

-- Future functions should not be publicly executable by default either.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

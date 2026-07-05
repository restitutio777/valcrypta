-- B-3 follow-up: the SECURITY DEFINER RPCs are only meaningful for signed-in
-- users (both resolve auth.uid() internally); remove the anonymous/public
-- execute grant so unauthenticated callers can't even invoke them.
--
-- Applied to production 2026-07-05 via MCP (apply_migration). authenticated
-- keeps EXECUTE on both (storage policy + client RPC verified afterwards).
REVOKE EXECUTE ON FUNCTION public.has_file_access(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reset_unread_count(uuid) FROM anon, public;

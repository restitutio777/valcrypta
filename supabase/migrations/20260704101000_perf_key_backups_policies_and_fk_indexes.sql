-- Applied to production 2026-07-04 via Supabase MCP.
-- Wrap auth.uid() in a scalar subquery so Postgres evaluates it once per
-- statement instead of once per row (advisor lint 0003), and add covering
-- indexes for two unindexed foreign keys (advisor lint 0001).

DROP POLICY IF EXISTS "Users can view own key backup" ON key_backups;
CREATE POLICY "Users can view own key backup"
  ON key_backups FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own key backup" ON key_backups;
CREATE POLICY "Users can insert own key backup"
  ON key_backups FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own key backup" ON key_backups;
CREATE POLICY "Users can update own key backup"
  ON key_backups FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own key backup" ON key_backups;
CREATE POLICY "Users can delete own key backup"
  ON key_backups FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS typing_status_contact_id_idx ON typing_status(contact_id);
CREATE INDEX IF NOT EXISTS unread_counts_contact_id_idx ON unread_counts(contact_id);

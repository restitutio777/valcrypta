-- Key Backups: optional encrypted private-key backup ("Balanced"/"Comfort"
-- security levels). The blob is AES-GCM encrypted client-side with a key
-- derived from the user's password (PBKDF2, 100k iterations) BEFORE upload —
-- the server can never read it. Kept in a separate table (not on users) so
-- the profile-wide SELECT policy never exposes it to other users.

CREATE TABLE IF NOT EXISTS key_backups (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  encrypted_private_key text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE key_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own key backup" ON key_backups;
CREATE POLICY "Users can view own key backup"
  ON key_backups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own key backup" ON key_backups;
CREATE POLICY "Users can insert own key backup"
  ON key_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own key backup" ON key_backups;
CREATE POLICY "Users can update own key backup"
  ON key_backups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own key backup" ON key_backups;
CREATE POLICY "Users can delete own key backup"
  ON key_backups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

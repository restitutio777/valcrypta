-- Create Users Table for E2E Encrypted Chat
-- This table extends auth.users with public encryption keys and usernames

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  public_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create Messages Table
-- Stores encrypted message content that can only be decrypted by the recipient

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_content text NOT NULL,
  -- Legacy sender-copy column (superseded by the v2 hybrid `sk` wrap inside
  -- encrypted_content); retained because production still has it.
  encrypted_for_sender text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  -- Message routing/kind metadata.
  topic text DEFAULT 'chat',
  extension text DEFAULT 'text',        -- 'text' | 'file' | 'image'
  -- E2E-encrypted file attachment (all plaintext columns are generic; the real
  -- filename/MIME live encrypted inside encrypted_content, see src/lib/files.ts).
  file_name text,                       -- generic placeholder ('encrypted')
  file_type text,                       -- generic ('application/octet-stream')
  file_size bigint,                     -- plaintext byte count (UI hint only)
  file_url text,                        -- object path in the encrypted_files bucket
  encrypted_file_key text               -- JSON { v:2, rk, sk }: AES key RSA-wrapped
);

-- Columns added after the original release (production drifted ahead of this
-- file); ALTERs keep an already-provisioned database in sync when re-run.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_for_sender text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS topic text DEFAULT 'chat';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS extension text DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_file_key text;

-- Full old row in the WAL so Realtime can evaluate the RLS SELECT policy on
-- DELETE events and deliver "delete for everyone" to the recipient live.
ALTER TABLE messages REPLICA IDENTITY FULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received messages" ON messages;
CREATE POLICY "Users can update received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Sender can delete their own message ("delete for everyone"). See
-- supabase/migrations/20260704120000_add_messages_delete_policy.sql.
DROP POLICY IF EXISTS "Senders can delete own messages" ON messages;
CREATE POLICY "Senders can delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = sender_id);

CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- Create Contacts Table
-- Manages user contact lists

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add contacts" ON contacts;
CREATE POLICY "Users can add contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Users can delete own contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_contact_id_idx ON contacts(contact_id);

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

-- Encrypted file storage
-- Private bucket holding E2E-encrypted attachment ciphertext (iv || AES-GCM
-- ciphertext). Objects live under a {senderId}/{uuid} path; the original
-- filename never appears in the path (it is metadata and belongs encrypted).

INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted_files', 'encrypted_files', false)
ON CONFLICT (id) DO NOTHING;

-- Access check for downloads: a caller may read an object only if a messages
-- row references it as file_url and names them as sender or recipient.
-- SECURITY DEFINER so the storage SELECT policy can read the messages table.
-- The identity is taken from auth.uid() inside the function (not a parameter) so
-- it can't be called as an oracle for other users' access — see
-- supabase/migrations/20260705130100_has_file_access_use_auth_uid.sql.
CREATE OR REPLACE FUNCTION public.has_file_access(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.messages
    WHERE file_url = file_path
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );
END;
$$;

DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'encrypted_files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view accessible files" ON storage.objects;
CREATE POLICY "Users can view accessible files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'encrypted_files'
    AND has_file_access(name)
  );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'encrypted_files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Visitor statistics (admin backend)
-- One row per app visit: timestamp + signed-in flag, nothing identifying
-- (no IP, no user agent, no user id). Write-only for clients; the admin reads
-- aggregates via get_admin_stats(), authorized server-side by JWT email.
-- See supabase/migrations/20260716090000_add_visitor_stats_admin.sql.

CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_authenticated boolean NOT NULL DEFAULT false
);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log a visit" ON site_visits;
CREATE POLICY "Anyone can log a visit"
  ON site_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON site_visits(created_at DESC);

-- Clients may only ever supply the signed-in flag; id and created_at always
-- come from the column defaults (no backdating, no chosen ids).
REVOKE ALL ON public.site_visits FROM anon, authenticated;
GRANT INSERT (is_authenticated) ON public.site_visits TO anon, authenticated;

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

REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- NOTE: production also contains additional, separately-prepared feature tables
-- (typing_status, unread_counts, notification_settings, email_notification_queue)
-- and their triggers/functions, which are outside the file-sharing scope of this
-- file and are not reproduced here.

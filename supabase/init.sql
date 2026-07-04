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
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

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

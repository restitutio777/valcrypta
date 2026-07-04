-- Sender can delete their own message ("delete for everyone").
--
-- This is the only DB change required for E2E-encrypted file sharing: the
-- messages table already carries the file columns (file_url, file_name,
-- file_type, file_size, encrypted_file_key, topic, extension) and the private
-- `encrypted_files` storage bucket + policies already exist in production.
--
-- Client-side deletion order MUST be: remove the storage object first, then
-- delete this row. The storage SELECT policy (has_file_access) resolves access
-- by looking up a messages row with a matching file_url, so deleting the row
-- first would strip the guard while the ciphertext still lingers in the bucket.
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.messages;
CREATE POLICY "Senders can delete own messages"
  ON public.messages FOR DELETE TO authenticated
  USING ((select auth.uid()) = sender_id);

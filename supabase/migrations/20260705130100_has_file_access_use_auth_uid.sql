-- A-12: has_file_access(file_path text, user_id uuid) took the user id as a
-- parameter and is callable via /rest/v1/rpc/has_file_access, so any signed-in
-- user could probe `has_file_access('<path>', '<someone_else_uid>')` and learn
-- whether a given path belongs to another user — an information oracle.
--
-- Replace it with a single-argument version that derives the identity from
-- auth.uid() internally, so a caller can only ever probe their own access.

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

-- Repoint the storage SELECT policy at the new single-argument signature.
DROP POLICY IF EXISTS "Users can view accessible files" ON storage.objects;
CREATE POLICY "Users can view accessible files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'encrypted_files'
    AND has_file_access(name)
  );

-- Remove the old oracle-shaped two-argument function.
DROP FUNCTION IF EXISTS public.has_file_access(text, uuid);

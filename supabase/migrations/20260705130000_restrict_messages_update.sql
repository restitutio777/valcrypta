-- A-8: the messages UPDATE policy lets a recipient update their received rows,
-- but with no column restriction they could overwrite encrypted_content (or any
-- other column) of a message they received. The intended capability is only the
-- read receipt (read_at); the app never issues any other UPDATE on messages.
--
-- Narrow the privilege to the read_at column. The RLS policy
-- ("Users can update received messages", USING recipient_id = auth.uid()) still
-- gates WHICH rows; this gates WHICH column. No frontend depends on updating
-- other columns, so this is safe to apply at any time.

REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- Deliver Realtime DELETE events to the authorized recipient.
--
-- With RLS enabled and the default replica identity, a DELETE's old record
-- carries only the primary key, so Realtime cannot evaluate the messages
-- SELECT policy (which checks sender_id / recipient_id) and drops the event
-- for the recipient's subscription. REPLICA IDENTITY FULL writes the full old
-- row to the WAL so the RLS check passes and "delete for everyone" removes the
-- bubble live on the other side. The old row is ciphertext the recipient is
-- already authorized to read, so this exposes nothing new.
ALTER TABLE public.messages REPLICA IDENTITY FULL;

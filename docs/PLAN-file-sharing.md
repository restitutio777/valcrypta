# Implementation Plan: E2E-Encrypted File & Image Sharing

Goal: users can send images and files inside a chat, preview images inline,
download files, and the **sender can delete a shared file again** (removed
for both sides, ciphertext wiped from storage).

This plan was written after auditing the **live production database** —
substantial groundwork already exists there. Read the "Existing groundwork"
section carefully before writing any migration: most of the backend is
already in place and must be reused, not recreated.

---

## 1. Existing groundwork (live DB, verified 2026-07-04)

### 1.1 `messages` table already has file columns

The live table has more columns than `supabase/init.sql` (the repo file has
drifted behind production; see §6):

| column | type | purpose |
|---|---|---|
| `file_name` | text | original filename |
| `file_type` | text | MIME type |
| `file_size` | bigint | bytes |
| `file_url` | text | path of the encrypted object in the storage bucket |
| `encrypted_file_key` | text | AES key for the file, RSA-wrapped (see §3.2) |
| `topic` / `extension` | text | defaults `'chat'` / `'text'`; set `extension='file'` or `'image'` for file messages |

### 1.2 Private storage bucket `encrypted_files` with policies

- Bucket `encrypted_files`, `public=false`.
- `INSERT`: "Users can upload own files" — path must start with own uid
  (`(storage.foldername(name))[1] = auth.uid()::text`).
- `SELECT`: "Users can view accessible files" — via
  `has_file_access(name, auth.uid())`, a SECURITY DEFINER function that
  returns true when a `messages` row exists with `file_url = <path>` and the
  caller as sender or recipient.
- `DELETE`: "Users can delete own files" — own-folder prefix only.

Consequence of these policies:
- **Upload path convention is fixed**: `{senderId}/<something>`. Use
  `{senderId}/{crypto.randomUUID()}` (no original filename in the path —
  it's metadata that belongs encrypted, not in a URL).
- **Insert the `messages` row before the recipient can download** (the
  SELECT policy checks the messages table).
- **Only the sender can remove the object** (own-folder DELETE policy),
  which matches the intended "sender deletes for everyone" semantics.

### 1.3 Other relevant live infrastructure

- Realtime publication `supabase_realtime` includes `public.messages`
  (INSERT events power the current chat; DELETE events arrive with the old
  row's primary key, which is enough to remove a bubble).
- Triggers on `messages`: `trigger_increment_unread_count`,
  `trigger_notify_new_message` — they fire on INSERT of file messages too;
  no changes needed.
- API surface is hardened (anon has no table privileges; functions are not
  PUBLIC-executable). New functions must explicitly
  `GRANT EXECUTE ... TO authenticated` if the client calls them.
- RLS policy style: wrap `auth.uid()` as `(select auth.uid())` in any new
  policy (advisor lint 0003).

## 2. The one missing DB piece: deletion

`messages` currently has **no DELETE policy** — deletion is impossible for
everyone. Migration (apply via MCP `apply_migration`, mirror the file into
`supabase/migrations/` and append to `init.sql`):

```sql
-- Sender can delete their own message ("delete for everyone").
DROP POLICY IF EXISTS "Senders can delete own messages" ON messages;
CREATE POLICY "Senders can delete own messages"
  ON messages FOR DELETE TO authenticated
  USING ((select auth.uid()) = sender_id);
```

No other schema change is required. Do **not** add columns that already
exist (§1.1). Deletion order in the client: storage object first, then the
DB row (see §4.3) — never the other way around, or the `has_file_access`
check that guards the object disappears while the ciphertext lingers.

## 3. Crypto design (extend `src/lib/crypto.ts`)

Follow the existing v2 hybrid pattern (`encryptMessage`): fresh AES-GCM-256
key per file, wrapped for **both** parties so the sender can re-open their
own upload.

### 3.1 New functions

```ts
encryptFile(data: ArrayBuffer, recipientPub: CryptoKey, senderPub: CryptoKey)
  -> { ciphertext: ArrayBuffer /* iv || ct */, keyPayload: string }
decryptFile(ciphertext: ArrayBuffer, keyPayload: string,
            privateKey: CryptoKey, isSender: boolean) -> ArrayBuffer
```

### 3.2 `encrypted_file_key` format

Store a JSON payload in the existing `encrypted_file_key` column, mirroring
text messages:

```json
{ "v": 2, "rk": "<AES key RSA-wrapped for recipient>", "sk": "<wrapped for sender>" }
```

The column predates this plan and was single-recipient by comment; the JSON
`v:2` envelope keeps it future-proof and self-describing. Also encrypt the
display metadata: put `file_name` + `file_type` into the *text* part of the
message (`encrypted_content`) as a JSON body, and write only generic values
to the plaintext columns (`file_name = 'encrypted'`, real MIME only if
needed for nothing — prefer `application/octet-stream`). Plaintext
`file_size` (rounded) is acceptable for UI hints.

## 4. Client flows (`src/lib/files.ts` new + `ChatArea.tsx`)

### 4.1 Send

1. Paperclip button in the composer → file input (`accept` unrestricted,
   images get a fast path). Limit: **25 MB** (check before reading; friendly
   error notification). Optionally downscale images > 2048px via canvas
   before encrypting.
2. Read file → `encryptFile` → upload ciphertext to
   `encrypted_files/{senderId}/{uuid}` with `contentType:
   'application/octet-stream'`, `upsert: false`.
3. Insert `messages` row: `encrypted_content` = encrypted JSON
   `{ kind:'file', name, mime, note? }`, plus `file_url`, `file_size`,
   `encrypted_file_key`, `extension: mime.startsWith('image/') ? 'image' : 'file'`.
4. If the insert fails, remove the just-uploaded object (cleanup), then
   surface the error. Show upload progress state on the optimistic bubble.

### 4.2 Receive / display

- Message bubbles with `file_url`: render a file card (icon, decrypted
  name, size, download button). For `extension === 'image'`: download +
  decrypt lazily when the bubble scrolls into view, show as blob-URL
  `<img>` with a tap-to-open lightbox; revoke object URLs on unmount.
- Download: `storage.from('encrypted_files').download(path)` →
  `decryptFile` → `URL.createObjectURL` → programmatic `<a download>`.
- Cache decrypted blobs per message id in memory only (never persist
  plaintext).

### 4.3 Delete (sender only)

1. Hover/long-press menu on own bubbles → "Delete" → confirm dialog
   (mention it deletes for both sides).
2. `storage.remove([file_url])` (if a file message) → `messages.delete()`
   by id → remove from local store.
3. Other side: extend the existing Realtime subscription with a `DELETE`
   listener on `messages` (no filter on payload columns — DELETE events
   carry only the old primary key; match against loaded message ids and
   drop the bubble). Also delete plain text messages this way — the feature
   falls out for free.

### 4.4 UI polish (match the design system)

- Attach button: `btn-ghost-icon` paperclip left of the input.
- Image bubbles: rounded-2xl, max-h ~320px, blur-up skeleton while
  decrypting.
- File card: glass-card row with file-type icon disc (brand gradient),
  name (truncate), size, download icon.
- Progress: thin brand-gradient bar on the optimistic bubble.
- Delete: trash icon in a small context menu; `animate-pop-in` removal.

## 5. Types & stores

- `src/lib/supabase.ts`: extend `messages` Row/Insert/Update with
  `file_name`, `file_type`, `file_size`, `file_url`, `encrypted_file_key`,
  `topic`, `extension` (all nullable) — matching the live schema.
- `chat-store.ts`: `removeMessage(id)` action; message type gains optional
  decrypted file metadata + blob-URL fields.

## 6. Housekeeping (do first, small)

- `supabase/init.sql` has drifted behind production (missing:
  file columns on `messages`, `encrypted_for_sender`, `topic`, `extension`,
  `typing_status`, `unread_counts`, `notification_settings`,
  `email_notification_queue`, storage bucket + policies, functions/triggers).
  Refresh it from the live schema (`supabase db dump` or via MCP
  `list_tables`/`pg_dump` queries) so the repo is the source of truth again.
- Regenerate nothing blindly: the app's hand-written `Database` type only
  needs the `messages` additions above.

## 7. Verification checklist

- [ ] `npm run typecheck` / `npm run build` / `npm run lint` clean
- [ ] Two test accounts: send image A→B — inline preview on both sides,
      realtime arrival on B without refresh
- [ ] Send a non-image file (PDF) — card renders, download → decrypted
      bytes identical (hash-compare)
- [ ] Sender deletes the file message — bubble disappears on both clients
      live; `storage.objects` row gone; recipient download now 403/404
- [ ] Recipient has no delete affordance on foreign bubbles
- [ ] 26 MB file rejected client-side with a friendly notification
- [ ] Refresh mid-chat: file messages decrypt again from history (sender
      side too — `sk` wrap works)
- [ ] Legacy text-only messages still render and decrypt
- [ ] Security advisors (MCP `get_advisors`) show no new findings after the
      DELETE-policy migration

## 8. Explicit non-goals (this iteration)

- No thumbnails stored server-side (would leak image content).
- No "delete for me only", no edit, no expiring messages.
- No chunked/resumable upload; 25 MB cap keeps single-shot uploads fine.
- No changes to the unread/typing/email-notification tables (separate,
  already-prepared features).

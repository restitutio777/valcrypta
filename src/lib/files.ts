import { supabase, Database } from './supabase';
import { encryptFile, decryptFile, encryptMessage } from './crypto';

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const BUCKET = 'encrypted_files';

type MessageRow = Database['public']['Tables']['messages']['Row'];

// Plaintext metadata written to the message body is encrypted (via
// encryptMessage) before it ever leaves the client. This is its shape.
export interface FileMeta {
  kind: 'file';
  name: string;
  mime: string;
  note?: string;
}

export interface SendFileParams {
  file: File;
  senderId: string;
  recipientId: string;
  recipientPublicKey: CryptoKey;
  senderPublicKey: CryptoKey;
}

export class FileTooLargeError extends Error {
  constructor() {
    super('File exceeds the 25 MB limit');
    this.name = 'FileTooLargeError';
  }
}

// Encrypt a file, upload the ciphertext to the private bucket, and insert the
// messages row. Order matters: the object is uploaded first so the row's
// file_url is valid the moment it becomes visible; if the insert fails the
// just-uploaded object is removed so no orphan ciphertext lingers.
export async function sendFile(params: SendFileParams): Promise<MessageRow> {
  const { file, senderId, recipientId, recipientPublicKey, senderPublicKey } = params;

  if (file.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError();
  }

  const data = await file.arrayBuffer();
  const { ciphertext, keyPayload } = await encryptFile(
    data,
    recipientPublicKey,
    senderPublicKey
  );

  const path = `${senderId}/${crypto.randomUUID()}`;
  const isImage = file.type.startsWith('image/');

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([ciphertext]), {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // The real filename and MIME type are metadata; they belong encrypted, not
  // in plaintext columns or the object path.
  const meta: FileMeta = {
    kind: 'file',
    name: file.name,
    mime: file.type || 'application/octet-stream',
  };
  const encryptedContent = await encryptMessage(
    JSON.stringify(meta),
    recipientPublicKey,
    senderPublicKey
  );

  const { data: row, error: insertError } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      encrypted_content: encryptedContent,
      encrypted_file_key: keyPayload,
      file_url: path,
      file_name: 'encrypted',
      file_type: 'application/octet-stream',
      file_size: file.size,
      extension: isImage ? 'image' : 'file',
      topic: 'chat',
    })
    .select()
    .single();

  if (insertError || !row) {
    // Roll back the orphaned ciphertext before surfacing the error.
    await supabase.storage.from(BUCKET).remove([path]);
    throw insertError ?? new Error('Failed to insert file message');
  }

  return row;
}

// Download an encrypted attachment and return its decrypted bytes.
export async function downloadFileBytes(
  path: string,
  keyPayload: string,
  privateKey: CryptoKey,
  isSender: boolean
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw error ?? new Error('Failed to download file');
  }
  const ciphertext = await data.arrayBuffer();
  return decryptFile(ciphertext, keyPayload, privateKey, isSender);
}

// Delete a message for everyone. For file messages the storage object is
// removed first (while the has_file_access guard still resolves), then the row
// — never the reverse, or the ciphertext would outlive its access check.
// A storage-removal failure is non-fatal: the row deletion is what actually
// makes the message disappear for both sides via the realtime DELETE event.
export async function deleteMessage(message: {
  id: string;
  file_url?: string | null;
}): Promise<void> {
  if (message.file_url) {
    const { error } = await supabase.storage.from(BUCKET).remove([message.file_url]);
    if (error) {
      console.error('Failed to remove storage object (continuing):', error);
    }
  }

  const { error } = await supabase.from('messages').delete().eq('id', message.id);
  if (error) throw error;
}

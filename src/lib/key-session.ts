import { supabase } from './supabase';
import { arrayBufferToBase64, base64ToArrayBuffer, importPrivateKey } from './crypto';
import { idbPut, idbGet, idbDelete } from './db';

// The user picks how much convenience they trade for security:
//  - maximum:  key lives in memory only; every page load asks for the
//              password again; no cloud backup of the encrypted key.
//  - balanced: key survives refreshes for the lifetime of the tab;
//              encrypted key blob is backed up to the server so a new
//              device can sign in with just the password.
//  - comfort:  key persists on this device (IndexedDB) so the app opens
//              without a password prompt; cloud backup enabled.
// The cloud blob is the same AES-GCM(PBKDF2(password)) ciphertext stored
// locally — the server never sees a decryptable key.
//
// Nothing is persisted as plaintext PKCS8 (A-3):
//  - comfort:  the key is stored as a non-extractable CryptoKey *object*
//              in IndexedDB (structured clone keeps extractable=false), so
//              script access can use but never export it.
//  - balanced: sessionStorage cannot hold a CryptoKey, so the PKCS8 string
//              is AES-GCM-encrypted into sessionStorage while the random
//              wrapping key lives as a non-extractable CryptoKey in
//              IndexedDB. Either half alone is useless; the sessionStorage
//              half evaporates with the tab.
export type SecurityLevel = 'maximum' | 'balanced' | 'comfort';

const SESSION_KEY_PREFIX = 'valcrypta_unlocked_';
const WRAP_KEY_PREFIX = 'wrap_';
const WRAP_IV_LENGTH = 12;

const UNLOCKED_STORE = 'unlocked_keys';

// sessionStorage payload for the balanced level. Legacy entries are the raw
// base64 PKCS8 string (no JSON marker); restoreUnlockedKey migrates them.
interface WrappedSessionPayload {
  v: 2;
  iv: string;
  ct: string;
}

function parseWrappedSessionPayload(raw: string): WrappedSessionPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 2) return parsed as WrappedSessionPayload;
  } catch {
    // Not JSON: legacy plaintext PKCS8 entry.
  }
  return null;
}

/**
 * Persist the unlocked private key according to the chosen security level
 * so the user isn't asked for their password on every page load.
 *
 * Takes the PKCS8 string (not a CryptoKey) so the in-memory key can stay
 * non-extractable; callers that don't have the string (the security-level
 * switch) must re-derive it from the password-encrypted blob.
 */
export async function persistUnlockedKey(
  userId: string,
  privateKeyPkcs8: string,
  level: SecurityLevel
): Promise<void> {
  await clearUnlockedKey(userId);
  if (level === 'maximum') return;

  if (level === 'balanced') {
    const wrapKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(WRAP_IV_LENGTH));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      wrapKey,
      new TextEncoder().encode(privateKeyPkcs8)
    );
    // Order matters: the wrapping key must be stored before the ciphertext
    // becomes restorable, or a reload in between would hit a dead entry.
    await idbPut(UNLOCKED_STORE, WRAP_KEY_PREFIX + userId, wrapKey);
    const payload: WrappedSessionPayload = {
      v: 2,
      iv: arrayBufferToBase64(iv.buffer),
      ct: arrayBufferToBase64(ct),
    };
    sessionStorage.setItem(SESSION_KEY_PREFIX + userId, JSON.stringify(payload));
  } else {
    const key = await importPrivateKey(privateKeyPkcs8);
    await idbPut(UNLOCKED_STORE, userId, key);
  }
}

/**
 * Try to restore an unlocked private key persisted by persistUnlockedKey.
 * Returns null when nothing is stored (the caller should show the unlock
 * screen). Legacy plaintext entries from older app versions are imported
 * once and immediately re-persisted in the encrypted/non-extractable
 * format, so existing sessions survive the upgrade.
 */
export async function restoreUnlockedKey(userId: string): Promise<CryptoKey | null> {
  try {
    const fromSession = sessionStorage.getItem(SESSION_KEY_PREFIX + userId);
    if (fromSession) {
      const payload = parseWrappedSessionPayload(fromSession);
      if (payload) {
        const wrapKey = await idbGet(UNLOCKED_STORE, WRAP_KEY_PREFIX + userId);
        if (!(wrapKey instanceof CryptoKey)) return null;
        const pkcs8Bytes = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: base64ToArrayBuffer(payload.iv) },
          wrapKey,
          base64ToArrayBuffer(payload.ct)
        );
        return await importPrivateKey(new TextDecoder().decode(pkcs8Bytes));
      }

      // Legacy plaintext PKCS8 in sessionStorage: migrate in place.
      const key = await importPrivateKey(fromSession);
      await persistUnlockedKey(userId, fromSession, 'balanced');
      return key;
    }

    const fromIdb = await idbGet(UNLOCKED_STORE, userId);
    if (fromIdb instanceof CryptoKey) return fromIdb;
    if (typeof fromIdb === 'string') {
      // Legacy plaintext PKCS8 in IndexedDB: migrate in place.
      const key = await importPrivateKey(fromIdb);
      await persistUnlockedKey(userId, fromIdb, 'comfort');
      return key;
    }
  } catch (error) {
    console.error('Failed to restore unlocked key:', error);
  }
  return null;
}

export async function clearUnlockedKey(userId: string): Promise<void> {
  sessionStorage.removeItem(SESSION_KEY_PREFIX + userId);
  try {
    await idbDelete(UNLOCKED_STORE, userId);
    await idbDelete(UNLOCKED_STORE, WRAP_KEY_PREFIX + userId);
  } catch (error) {
    console.error('Failed to clear persisted key:', error);
  }
}

/**
 * Upload the password-encrypted private key blob so the user can sign in
 * from other devices. Fails softly (returns false) when the key_backups
 * table doesn't exist yet or the network is down — the app works without it.
 */
export async function uploadKeyBackup(
  userId: string,
  encryptedPrivateKey: string
): Promise<boolean> {
  const { error } = await supabase
    .from('key_backups')
    .upsert(
      { user_id: userId, encrypted_private_key: encryptedPrivateKey, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) {
    console.error('Key backup upload failed:', error);
    return false;
  }
  return true;
}

export async function fetchKeyBackup(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('key_backups')
    .select('encrypted_private_key')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('Key backup fetch failed:', error);
    return null;
  }
  return data?.encrypted_private_key ?? null;
}

export async function deleteKeyBackup(userId: string): Promise<boolean> {
  const { error } = await supabase.from('key_backups').delete().eq('user_id', userId);
  if (error) {
    console.error('Key backup delete failed:', error);
    return false;
  }
  return true;
}

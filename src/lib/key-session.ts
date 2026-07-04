import { supabase } from './supabase';
import { exportPrivateKey, importPrivateKey } from './crypto';

// The user picks how much convenience they trade for security:
//  - maximum:  key lives in memory only; every page load asks for the
//              password again; no cloud backup of the encrypted key.
//  - balanced: key survives refreshes for the lifetime of the tab
//              (sessionStorage); encrypted key blob is backed up to the
//              server so a new device can sign in with just the password.
//  - comfort:  key persists on this device (IndexedDB) so the app opens
//              without a password prompt; cloud backup enabled.
// The cloud blob is the same AES-GCM(PBKDF2(password)) ciphertext stored
// locally — the server never sees a decryptable key.
export type SecurityLevel = 'maximum' | 'balanced' | 'comfort';

const SESSION_KEY_PREFIX = 'valcrypta_unlocked_';

const DB_NAME = 'ValCryptaDB';
const DB_VERSION = 2;
const KEYS_STORE = 'keys';
const UNLOCKED_STORE = 'unlocked_keys';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(KEYS_STORE)) {
        db.createObjectStore(KEYS_STORE);
      }
      if (!db.objectStoreNames.contains(UNLOCKED_STORE)) {
        db.createObjectStore(UNLOCKED_STORE);
      }
    };
  });
}

function idbPut(store: string, key: string, value: string): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readwrite').objectStore(store).put(value, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
  );
}

function idbGet(store: string, key: string): Promise<string | null> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readonly').objectStore(store).get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      })
  );
}

function idbDelete(store: string, key: string): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readwrite').objectStore(store).delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
  );
}

/**
 * Persist the unlocked private key according to the chosen security level
 * so the user isn't asked for their password on every page load.
 */
export async function persistUnlockedKey(
  userId: string,
  privateKey: CryptoKey,
  level: SecurityLevel
): Promise<void> {
  await clearUnlockedKey(userId);
  if (level === 'maximum') return;

  const exported = await exportPrivateKey(privateKey);
  if (level === 'balanced') {
    sessionStorage.setItem(SESSION_KEY_PREFIX + userId, exported);
  } else {
    await idbPut(UNLOCKED_STORE, userId, exported);
  }
}

/**
 * Try to restore an unlocked private key persisted by persistUnlockedKey.
 * Returns null when nothing is stored (the caller should show the unlock
 * screen).
 */
export async function restoreUnlockedKey(userId: string): Promise<CryptoKey | null> {
  try {
    const fromSession = sessionStorage.getItem(SESSION_KEY_PREFIX + userId);
    if (fromSession) return await importPrivateKey(fromSession);

    const fromIdb = await idbGet(UNLOCKED_STORE, userId);
    if (fromIdb) return await importPrivateKey(fromIdb);
  } catch (error) {
    console.error('Failed to restore unlocked key:', error);
  }
  return null;
}

export async function clearUnlockedKey(userId: string): Promise<void> {
  sessionStorage.removeItem(SESSION_KEY_PREFIX + userId);
  try {
    await idbDelete(UNLOCKED_STORE, userId);
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

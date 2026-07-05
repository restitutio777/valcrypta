// Single owner of the ValCryptaDB IndexedDB schema. Every module must open
// the database through this helper: IndexedDB rejects opens with an older
// version once a newer one exists, so per-module copies of the version
// number drift apart and start failing.
//
// Stores:
//  - keys:         password-encrypted private-key blob (storage.ts)
//  - unlocked_keys: unlocked-key persistence per security level (key-session.ts)
//  - pinned_keys:  first-seen contact public keys for MITM detection (key-pinning.ts)
const DB_NAME = 'ValCryptaDB';
// v3 adds 'pinned_keys'.
const DB_VERSION = 3;

const STORES = ['keys', 'unlocked_keys', 'pinned_keys'] as const;
export type StoreName = (typeof STORES)[number];

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      }
    };
  });
}

export function idbPut(store: StoreName, key: string, value: unknown): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readwrite').objectStore(store).put(value, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
  );
}

export function idbGet(store: StoreName, key: string): Promise<unknown> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readonly').objectStore(store).get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? null);
      })
  );
}

export function idbDelete(store: StoreName, key: string): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readwrite').objectStore(store).delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
  );
}

export function idbClear(store: StoreName): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction([store], 'readwrite').objectStore(store).clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
  );
}

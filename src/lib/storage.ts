const DB_NAME = 'ValCryptaDB';
// v2 adds the 'unlocked_keys' store used by key-session.ts; both modules
// must open with the same version or IndexedDB rejects the older open.
const DB_VERSION = 2;
const STORE_NAME = 'keys';
const UNLOCKED_STORE = 'unlocked_keys';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(UNLOCKED_STORE)) {
        db.createObjectStore(UNLOCKED_STORE);
      }
    };
  });
}

export async function storeEncryptedPrivateKey(
  userId: string,
  encryptedKey: string
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(encryptedKey, `privateKey_${userId}`);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getEncryptedPrivateKey(userId: string): Promise<string | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`privateKey_${userId}`);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function deleteEncryptedPrivateKey(userId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(`privateKey_${userId}`);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllKeys(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

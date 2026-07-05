import { idbPut, idbGet, idbDelete, idbClear } from './db';

const STORE_NAME = 'keys';

export async function storeEncryptedPrivateKey(
  userId: string,
  encryptedKey: string
): Promise<void> {
  await idbPut(STORE_NAME, `privateKey_${userId}`, encryptedKey);
}

export async function getEncryptedPrivateKey(userId: string): Promise<string | null> {
  const value = await idbGet(STORE_NAME, `privateKey_${userId}`);
  return typeof value === 'string' ? value : null;
}

export async function deleteEncryptedPrivateKey(userId: string): Promise<void> {
  await idbDelete(STORE_NAME, `privateKey_${userId}`);
}

export async function clearAllKeys(): Promise<void> {
  await idbClear(STORE_NAME);
}

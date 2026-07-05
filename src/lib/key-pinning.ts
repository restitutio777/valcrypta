import { base64ToArrayBuffer } from './crypto';
import { idbPut, idbGet, idbDelete } from './db';

// Trust-on-first-use pinning of contact public keys (A-1). The server is the
// only channel for public keys, so a compromised database could swap in an
// attacker key and silently read future messages. Pinning the first-seen key
// per contact on this device turns that swap into a loud "key changed"
// warning instead. Pins are device-local by design.
const PINNED_STORE = 'pinned_keys';

const pinKeyFor = (userId: string, contactId: string) => `${userId}_${contactId}`;

export type PinCheck =
  | { status: 'pinned-now' | 'match' }
  | { status: 'changed'; pinnedKey: string };

/**
 * Compare a contact's current public key against the pinned one. First sight
 * pins it (TOFU); a mismatch is reported WITHOUT overwriting the pin — only
 * acceptContactKey (explicit user action) may re-pin.
 */
export async function checkAndPinContactKey(
  userId: string,
  contactId: string,
  publicKey: string
): Promise<PinCheck> {
  const pinned = await idbGet(PINNED_STORE, pinKeyFor(userId, contactId));
  if (typeof pinned !== 'string') {
    await idbPut(PINNED_STORE, pinKeyFor(userId, contactId), publicKey);
    return { status: 'pinned-now' };
  }
  if (pinned === publicKey) return { status: 'match' };
  return { status: 'changed', pinnedKey: pinned };
}

export async function acceptContactKey(
  userId: string,
  contactId: string,
  publicKey: string
): Promise<void> {
  await idbPut(PINNED_STORE, pinKeyFor(userId, contactId), publicKey);
}

export async function clearPinnedKey(userId: string, contactId: string): Promise<void> {
  await idbDelete(PINNED_STORE, pinKeyFor(userId, contactId));
}

/**
 * Human-comparable fingerprint of a public key: SHA-256 over the raw SPKI
 * bytes, rendered as 16 groups of 4 hex digits. Both sides read theirs out
 * over another channel; equal strings = untampered key.
 */
export async function computeFingerprint(publicKeyBase64: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', base64ToArrayBuffer(publicKeyBase64));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.replace(/(.{4})(?=.)/g, '$1 ').toUpperCase();
}

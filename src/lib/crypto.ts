// PBKDF2 work factor for NEW private-key wraps. Raised from the original
// 100k to 600k (OWASP 2023 guidance for PBKDF2-HMAC-SHA256) because the
// wrapped blob is also uploaded to the cloud key backup, where a weak factor
// invites offline brute force. Old blobs stay readable via the legacy path in
// decryptPrivateKey (they carry no version marker), so this never locks out an
// existing account — their key is simply re-wrapped at the new factor the next
// time it is encrypted.
const PBKDF2_ITERATIONS = 600000;
const LEGACY_PBKDF2_ITERATIONS = 100000;
// Defensive clamp so a corrupt/hostile version-2 blob can't request a work
// factor large enough to hang the tab.
const MIN_ITERATIONS = 100000;
const MAX_ITERATIONS = 2000000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToBase64(exported);
}

export async function importPublicKey(publicKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyString);
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

// Non-extractable: every imported private key is only ever *used* (decrypt),
// never re-exported. Persisting flows work from the PKCS8 string instead, so
// script access (e.g. XSS) can never pull the key material out of a live key.
export async function importPrivateKey(privateKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyString);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Wrapped-key format (v2): a self-describing JSON envelope that records the
// PBKDF2 iteration count, so the work factor can be raised over time without
// breaking older blobs. Legacy blobs are raw base64 of salt||iv||ciphertext at
// LEGACY_PBKDF2_ITERATIONS and carry no marker; decryptPrivateKey falls back to
// that when the input is not v2 JSON.
interface WrappedKeyPayload {
  v: 2;
  iter: number;
  salt: string;
  iv: string;
  ct: string;
}

export async function encryptPrivateKey(
  privateKeyString: string,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const aesKey = await deriveKeyFromPassword(password, salt, PBKDF2_ITERATIONS);

  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(privateKeyString)
  );

  const payload: WrappedKeyPayload = {
    v: 2,
    iter: PBKDF2_ITERATIONS,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ct: arrayBufferToBase64(encrypted),
  };
  return JSON.stringify(payload);
}

export async function decryptPrivateKey(
  encryptedData: string,
  password: string
): Promise<string> {
  const dec = new TextDecoder();

  // v2 self-describing envelope.
  let payload: WrappedKeyPayload | null = null;
  try {
    const parsed = JSON.parse(encryptedData);
    if (parsed && parsed.v === 2) payload = parsed as WrappedKeyPayload;
  } catch {
    // Not JSON: legacy base64 blob, handled below.
  }

  if (payload) {
    const iterations = Math.min(
      Math.max(payload.iter | 0, MIN_ITERATIONS),
      MAX_ITERATIONS
    );
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
    const aesKey = await deriveKeyFromPassword(password, salt, iterations);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToArrayBuffer(payload.iv) },
      aesKey,
      base64ToArrayBuffer(payload.ct)
    );
    return dec.decode(decrypted);
  }

  // Legacy: base64(salt || iv || ciphertext) wrapped at 100k iterations.
  const data = base64ToArrayBuffer(encryptedData);
  const dataView = new Uint8Array(data);
  const salt = dataView.slice(0, SALT_LENGTH);
  const iv = dataView.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encrypted = dataView.slice(SALT_LENGTH + IV_LENGTH);

  const aesKey = await deriveKeyFromPassword(password, salt, LEGACY_PBKDF2_ITERATIONS);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encrypted
  );
  return dec.decode(decrypted);
}

// Hybrid encryption (v2): the message is encrypted once with a random
// AES-GCM key; that key is RSA-wrapped separately for the recipient (rk)
// and the sender (sk), so both parties can read the history and message
// length is not limited by the RSA modulus.
interface HybridPayload {
  v: 2;
  iv: string;
  ct: string;
  rk: string;
  sk: string;
}

export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<string> {
  const enc = new TextEncoder();
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(message)
  );

  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const wrappedForRecipient = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  );
  const wrappedForSender = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPublicKey,
    rawAesKey
  );

  const payload: HybridPayload = {
    v: 2,
    iv: arrayBufferToBase64(iv.buffer),
    ct: arrayBufferToBase64(ciphertext),
    rk: arrayBufferToBase64(wrappedForRecipient),
    sk: arrayBufferToBase64(wrappedForSender),
  };

  return JSON.stringify(payload);
}

export async function decryptMessage(
  encryptedMessage: string,
  privateKey: CryptoKey,
  isSender: boolean
): Promise<string> {
  const dec = new TextDecoder();

  let payload: HybridPayload | null = null;
  try {
    const parsed = JSON.parse(encryptedMessage);
    if (parsed && parsed.v === 2) payload = parsed as HybridPayload;
  } catch {
    // Not JSON: legacy v1 message (direct RSA), handled below.
  }

  if (payload) {
    const wrappedKey = base64ToArrayBuffer(isSender ? payload.sk : payload.rk);
    const rawAesKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      wrappedKey
    );
    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawAesKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToArrayBuffer(payload.iv) },
      aesKey,
      base64ToArrayBuffer(payload.ct)
    );
    return dec.decode(plaintext);
  }

  // Legacy v1: encrypted directly to the recipient's RSA key; the sender
  // never had a readable copy.
  if (isSender) {
    throw new Error('Legacy sent message cannot be decrypted by sender');
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(encryptedMessage)
  );

  return dec.decode(decrypted);
}

// Hybrid file encryption (v2): mirrors encryptMessage but operates on raw
// bytes. A fresh AES-GCM-256 key encrypts the file; the ciphertext blob is
// laid out as iv || ct (the IV is the first IV_LENGTH bytes). The AES key is
// RSA-wrapped once for the recipient (rk) and once for the sender (sk) so the
// sender can re-open their own uploads. The wrap payload is stored separately
// from the ciphertext (in the messages.encrypted_file_key column).
interface FileKeyPayload {
  v: 2;
  rk: string;
  sk: string;
}

export async function encryptFile(
  data: ArrayBuffer,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; keyPayload: string }> {
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data);

  const combined = new Uint8Array(IV_LENGTH + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), IV_LENGTH);

  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const wrappedForRecipient = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  );
  const wrappedForSender = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPublicKey,
    rawAesKey
  );

  const payload: FileKeyPayload = {
    v: 2,
    rk: arrayBufferToBase64(wrappedForRecipient),
    sk: arrayBufferToBase64(wrappedForSender),
  };

  return { ciphertext: combined.buffer, keyPayload: JSON.stringify(payload) };
}

export async function decryptFile(
  ciphertext: ArrayBuffer,
  keyPayload: string,
  privateKey: CryptoKey,
  isSender: boolean
): Promise<ArrayBuffer> {
  const payload = JSON.parse(keyPayload) as FileKeyPayload;
  if (payload.v !== 2) {
    throw new Error('Unsupported file key payload version');
  }

  const wrappedKey = base64ToArrayBuffer(isSender ? payload.sk : payload.rk);
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    wrappedKey
  );
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const bytes = new Uint8Array(ciphertext);
  const iv = bytes.slice(0, IV_LENGTH);
  const ct = bytes.slice(IV_LENGTH);

  return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Detects a run of 4+ adjacent characters from a common alphabetical or
// keyboard sequence, in either direction (abcd, 4321, qwer). Long passwords
// built from such runs have far less entropy than their length suggests.
function hasSequentialRun(password: string): boolean {
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const lower = password.toLowerCase();
  for (const seq of sequences) {
    for (let i = 0; i + 4 <= seq.length; i++) {
      const chunk = seq.slice(i, i + 4);
      const reversed = chunk.split('').reverse().join('');
      if (lower.includes(chunk) || lower.includes(reversed)) return true;
    }
  }
  return false;
}

// Rates a password 0–5. Length and character-class variety add points;
// low-entropy patterns subtract them. The penalties matter because the
// password is the ONLY thing protecting the private-key blob — including the
// copy uploaded to the cloud backup, where a weak password is offline
// brute-forceable regardless of the PBKDF2 work factor. Without the penalties
// a long but trivial password like "aaaaaaaaaaaa" scored high enough to pass
// the signup gate; now it does not.
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  if (!password) return { score: 0, feedback: 'Weak - Add more characters and variety' };

  let score = 0;

  // Length milestones.
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character-class variety.
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Entropy penalties: too few distinct characters, long identical runs, or
  // obvious sequences all cut the score so they can't pass the gate on length
  // alone.
  const uniqueChars = new Set(password).size;
  if (uniqueChars <= 2) score -= 3;
  else if (uniqueChars <= 4) score -= 2;
  else if (uniqueChars <= 6) score -= 1;

  if (/(.)\1{2,}/.test(password)) score -= 1; // 3+ identical characters in a row
  if (hasSequentialRun(password)) score -= 1;

  const clamped = Math.max(0, Math.min(score, 5));

  const feedback =
    clamped < 3 ? 'Weak - Add more characters and variety' :
    clamped < 5 ? 'Medium - Consider adding special characters' :
    'Strong - Good password';

  return { score: clamped, feedback };
}

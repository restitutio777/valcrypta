const PBKDF2_ITERATIONS = 100000;
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

export async function importPrivateKey(privateKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyString);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array<ArrayBuffer>
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
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPrivateKey(
  privateKeyString: string,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const aesKey = await deriveKeyFromPassword(password, salt);

  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    enc.encode(privateKeyString)
  );

  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);

  return arrayBufferToBase64(result.buffer);
}

export async function decryptPrivateKey(
  encryptedData: string,
  password: string
): Promise<string> {
  const data = base64ToArrayBuffer(encryptedData);
  const dataView = new Uint8Array(data);

  const salt = dataView.slice(0, SALT_LENGTH);
  const iv = dataView.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encrypted = dataView.slice(SALT_LENGTH + IV_LENGTH);

  const aesKey = await deriveKeyFromPassword(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encrypted
  );

  const dec = new TextDecoder();
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const feedback =
    score < 3 ? 'Weak - Add more characters and variety' :
    score < 5 ? 'Medium - Consider adding special characters' :
    'Strong - Good password';

  return { score: Math.min(score, 5), feedback };
}

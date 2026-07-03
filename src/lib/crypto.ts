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
  salt: Uint8Array
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

export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey
): Promise<string> {
  const enc = new TextEncoder();
  const encoded = enc.encode(message);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    encoded
  );

  return arrayBufferToBase64(encrypted);
}

export async function decryptMessage(
  encryptedMessage: string,
  privateKey: CryptoKey
): Promise<string> {
  const encrypted = base64ToArrayBuffer(encryptedMessage);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encrypted
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
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

// Client-side encryption using Web Crypto API.
// The server only ever stores encrypted blobs — it cannot read user data.

const PBKDF2_ITERATIONS = 100_000;

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

function bytesToBase64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// Derive an AES-GCM-256 key from password + the user's server-stored salt.
// The key never leaves the client.
export async function deriveKey(password, saltHex) {
  const rawPassword = new TextEncoder().encode(password);
  const base = await crypto.subtle.importKey('raw', rawPassword, 'PBKDF2', false, ['deriveKey']);

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can persist to sessionStorage across refreshes
    ['encrypt', 'decrypt']
  );
}

// Export key to sessionStorage (same-origin only, cleared on browser close).
export async function exportKey(cryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', cryptoKey);
  return bytesToBase64(new Uint8Array(raw));
}

// Restore key from sessionStorage value.
export async function importKey(b64) {
  const raw = base64ToBytes(b64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

// Encrypt any JSON-serialisable value. Returns { encrypted_blob, iv } (both base64 strings).
export async function encrypt(cryptoKey, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
  return { encrypted_blob: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

// Decrypt and parse. Returns the original value.
export async function decrypt(cryptoKey, encryptedBlob, ivB64) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ivB64) },
    cryptoKey,
    base64ToBytes(encryptedBlob)
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

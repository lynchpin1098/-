const ENCRYPTION_KEY_NAME = "voice-diary-key";

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(ENCRYPTION_KEY_NAME);

  if (stored) {
    const keyData = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const exported = await crypto.subtle.exportKey("raw", key);
  const exportedArray = new Uint8Array(exported);
  localStorage.setItem(ENCRYPTION_KEY_NAME, btoa(String.fromCharCode(...exportedArray)));
  return key;
}

export async function encryptText(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptText(ciphertext: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export async function encryptBlob(blob: Blob): Promise<Blob> {
  const key = await getOrCreateKey();
  const arrayBuffer = await blob.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, arrayBuffer);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return new Blob([combined], { type: blob.type + "+encrypted" });
}

export async function decryptBlob(encryptedBlob: Blob, originalType: string): Promise<Blob> {
  const key = await getOrCreateKey();
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const combined = new Uint8Array(arrayBuffer);

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new Blob([decrypted], { type: originalType });
}

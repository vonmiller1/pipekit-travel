// ============================================================
// 1:1 Balance — Secure Browser LocalStorage Helper
// ============================================================
// Obfuscates and encrypts client-side settings to prevent
// clear-text exposure of database IDs and names in the browser.

const SALT = "one-on-one-balance-secure-salt-2026";

function encryptClientData(text: string): string {
  try {
    const encoded = encodeURIComponent(text);
    let result = "";
    for (let i = 0; i < encoded.length; i++) {
      const charCode = encoded.charCodeAt(i);
      const saltCode = SALT.charCodeAt(i % SALT.length);
      result += String.fromCharCode(charCode ^ saltCode);
    }
    return btoa(result);
  } catch (e) {
    console.error("[SecureStorage] Encryption failed:", e);
    return text;
  }
}

function decryptClientData(encodedText: string): string {
  try {
    const decoded = atob(encodedText);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const saltCode = SALT.charCodeAt(i % SALT.length);
      result += String.fromCharCode(charCode ^ saltCode);
    }
    return decodeURIComponent(result);
  } catch (e) {
    // Fallback if decryption fails (e.g., legacy unencrypted values)
    return encodedText;
  }
}

export const secureStorage = {
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    const encrypted = encryptClientData(value);
    localStorage.setItem(key, encrypted);
  },
  
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return decryptClientData(raw);
  },
  
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }
};

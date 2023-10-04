// ============================================================
// 1:1 Balance — Transcript Encryption at Rest Utility
// ============================================================

import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// Create a stable 32-byte key from the configured secret
const getEncryptionKey = (): Buffer => {
  const secret = process.env.TRANSCRIPT_ENCRYPTION_KEY || "default-dev-secret-key-change-this";
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encrypts a plain text string using AES-256-CBC.
 * Returns the IV and ciphertext separated by a colon.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string (formatted as iv:ciphertext).
 * Returns the original plain text.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText.includes(":")) {
    throw new Error("Invalid encrypted text format (missing IV separator)");
  }
  
  const [ivHex, ciphertext] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

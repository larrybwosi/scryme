import crypto from "crypto";
import { validateEncryptionKey, decrypt as decryptV2 } from "../v2/utils/encryption";

const V3_ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const ITERATIONS = 100000;

/**
 * Derives a key using PBKDF2 with SHA-256 from the base ENCRYPTION_KEY environment variable.
 */
function deriveKey(secretKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secretKey, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Industry-standard AES-256-GCM encryption with PBKDF2 derived keys and random salt + IV.
 * Output format: v3:<saltHex>:<ivHex>:<authTagHex>:<encryptedHex>
 */
export function encryptV3(text: string): string {
  if (!text) return "";
  const baseKey = validateEncryptionKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const derivedKey = deriveKey(baseKey, salt);

  const cipher = crypto.createCipheriv(V3_ALGORITHM, derivedKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `v3:${salt.toString("hex")}:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts strings formatted with either V3 (`v3:salt:iv:authTag:encrypted`) or legacy V2 (`iv:authTag:encrypted`).
 */
export function decryptV3(encryptedText: string): string {
  if (!encryptedText) return "";

  if (encryptedText.startsWith("v3:")) {
    const parts = encryptedText.split(":");
    if (parts.length !== 5) {
      throw new Error("Invalid V3 encrypted string format");
    }

    const [, saltHex, ivHex, authTagHex, encryptedHex] = parts;
    const baseKey = validateEncryptionKey();
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const derivedKey = deriveKey(baseKey, salt);

    const decipher = crypto.createDecipheriv(V3_ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Fallback to legacy V2 decryption
  return decryptV2(encryptedText);
}

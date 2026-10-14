import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

export const DOCUMENT_ENCRYPTION_ALGORITHM = "aes-256-gcm" as const;
export const DOCUMENT_ENCRYPTION_VERSION = 1 as const;

export type DocumentEncryptionMetadata = {
  version: number;
  algorithm: typeof DOCUMENT_ENCRYPTION_ALGORITHM;
  keyId: string;
  iv: string;
  authTag: string;
  originalMimeType: string;
  originalFileName: string;
  plaintextBytes: number;
};

type KeyRing = {
  activeKeyId: string;
  keys: Map<string, Buffer>;
};

let cachedKeyRing: KeyRing | null = null;

const readKeyRing = (): KeyRing => {
  if (cachedKeyRing) return cachedKeyRing;

  const activeKeyId = String(
    process.env.DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID || "",
  ).trim();
  if (!activeKeyId) {
    throw new Error("Missing DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(process.env.DOCUMENT_ENCRYPTION_KEYS_JSON || "");
  } catch {
    throw new Error("DOCUMENT_ENCRYPTION_KEYS_JSON must be valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("DOCUMENT_ENCRYPTION_KEYS_JSON must be a key-value object");
  }

  const keys = new Map<string, Buffer>();
  for (const [keyId, encodedKey] of Object.entries(parsed)) {
    if (typeof encodedKey !== "string" || !encodedKey.trim()) {
      throw new Error(`Document encryption key ${keyId} must be base64 text`);
    }
    const key = Buffer.from(encodedKey, "base64");
    if (key.length !== 32 || key.toString("base64") !== encodedKey.trim()) {
      throw new Error(`Document encryption key ${keyId} must decode to 32 bytes`);
    }
    keys.set(keyId, key);
  }
  if (!keys.has(activeKeyId)) {
    throw new Error(`Active document encryption key ${activeKeyId} is missing`);
  }

  cachedKeyRing = { activeKeyId, keys };
  return cachedKeyRing;
};

export const validateDocumentEncryptionConfiguration = (): void => {
  readKeyRing();
};

export const encryptDocument = (
  plaintext: Buffer,
  originalMimeType: string,
  originalFileName: string,
): { ciphertext: Buffer; encryption: DocumentEncryptionMetadata } => {
  const keyRing = readKeyRing();
  const key = keyRing.keys.get(keyRing.activeKeyId)!;
  const iv = randomBytes(12);
  const cipher = createCipheriv(DOCUMENT_ENCRYPTION_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return {
    ciphertext,
    encryption: {
      version: DOCUMENT_ENCRYPTION_VERSION,
      algorithm: DOCUMENT_ENCRYPTION_ALGORITHM,
      keyId: keyRing.activeKeyId,
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      originalMimeType: originalMimeType || "application/octet-stream",
      originalFileName: originalFileName || "document",
      plaintextBytes: plaintext.length,
    },
  };
};

export const decryptDocument = (
  ciphertext: Buffer,
  metadata: DocumentEncryptionMetadata,
): Buffer => {
  if (
    metadata.version !== DOCUMENT_ENCRYPTION_VERSION ||
    metadata.algorithm !== DOCUMENT_ENCRYPTION_ALGORITHM
  ) {
    throw new Error("Unsupported document encryption metadata");
  }
  const key = readKeyRing().keys.get(metadata.keyId);
  if (!key) throw new Error("Document encryption key is unavailable");

  const iv = Buffer.from(metadata.iv, "base64");
  const authTag = Buffer.from(metadata.authTag, "base64");
  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error("Invalid document encryption metadata");
  }

  const decipher = createDecipheriv(DOCUMENT_ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  if (plaintext.length !== metadata.plaintextBytes) {
    throw new Error("Decrypted document length mismatch");
  }
  return plaintext;
};

export const resetDocumentEncryptionConfigurationForTests = (): void => {
  cachedKeyRing = null;
};

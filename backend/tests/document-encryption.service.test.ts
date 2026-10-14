import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decryptDocument,
  encryptDocument,
  resetDocumentEncryptionConfigurationForTests,
  validateDocumentEncryptionConfiguration,
} from "../src/shared/services/document-encryption.service";

const originalActiveKeyId = process.env.DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID;
const originalKeys = process.env.DOCUMENT_ENCRYPTION_KEYS_JSON;
const keyOne = Buffer.alloc(32, 1).toString("base64");
const keyTwo = Buffer.alloc(32, 2).toString("base64");

const configure = (
  activeKeyId = "v1",
  keys: Record<string, string> = { v1: keyOne, v2: keyTwo },
) => {
  process.env.DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID = activeKeyId;
  process.env.DOCUMENT_ENCRYPTION_KEYS_JSON = JSON.stringify(keys);
  resetDocumentEncryptionConfigurationForTests();
};

beforeEach(() => configure());

afterEach(() => {
  if (originalActiveKeyId === undefined) {
    delete process.env.DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID;
  } else {
    process.env.DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID = originalActiveKeyId;
  }
  if (originalKeys === undefined) {
    delete process.env.DOCUMENT_ENCRYPTION_KEYS_JSON;
  } else {
    process.env.DOCUMENT_ENCRYPTION_KEYS_JSON = originalKeys;
  }
  resetDocumentEncryptionConfigurationForTests();
});

describe("document encryption service", () => {
  it("encrypts and decrypts a document without exposing its file signature", () => {
    const source = Buffer.from("%PDF-1.7 private enrollment document");
    const result = encryptDocument(source, "application/pdf", "birth.pdf");

    assert.notDeepEqual(result.ciphertext, source);
    assert.notEqual(result.ciphertext.subarray(0, 4).toString(), "%PDF");
    assert.deepEqual(decryptDocument(result.ciphertext, result.encryption), source);
    assert.equal(result.encryption.keyId, "v1");
    assert.equal(Buffer.from(result.encryption.iv, "base64").length, 12);
    assert.equal(Buffer.from(result.encryption.authTag, "base64").length, 16);
  });

  it("uses a unique IV and ciphertext for each encryption", () => {
    const source = Buffer.from("same document");
    const first = encryptDocument(source, "image/jpeg", "id.jpg");
    const second = encryptDocument(source, "image/jpeg", "id.jpg");

    assert.notEqual(first.encryption.iv, second.encryption.iv);
    assert.notDeepEqual(first.ciphertext, second.ciphertext);
  });

  it("rejects modified ciphertext", () => {
    const result = encryptDocument(Buffer.from("private"), "image/png", "id.png");
    result.ciphertext[0] ^= 1;
    assert.throws(() => decryptDocument(result.ciphertext, result.encryption));
  });

  it("rejects a missing historical key", () => {
    const result = encryptDocument(Buffer.from("private"), "image/png", "id.png");
    configure("v2", { v2: keyTwo });
    assert.throws(
      () => decryptDocument(result.ciphertext, result.encryption),
      /key is unavailable/,
    );
  });

  it("selects the configured active key while retaining older keys", () => {
    configure("v2");
    const result = encryptDocument(Buffer.from("private"), "image/png", "id.png");
    assert.equal(result.encryption.keyId, "v2");
    assert.deepEqual(decryptDocument(result.ciphertext, result.encryption), Buffer.from("private"));
  });

  it("rejects malformed key configuration", () => {
    configure("v1", { v1: Buffer.alloc(31).toString("base64") });
    assert.throws(validateDocumentEncryptionConfiguration, /decode to 32 bytes/);
  });
});

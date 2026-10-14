import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  createChildDocumentAccessToken,
  getChildDocumentStreamByToken,
} from "../src/modules/documents/services/documents.service";
import {
  documentsChildRepository,
  documentAccessTokenRepository,
} from "../src/modules/documents/repositories/documents.repository";
import { storageService } from "../src/shared/services/storage.service";
import {
  encryptDocument,
  resetDocumentEncryptionConfigurationForTests,
} from "../src/shared/services/document-encryption.service";

const childId = "671a2b3c4d5e6f7890123456";
const parentId = "671a2b3c4d5e6f7890123457";
const teacherId = "671a2b3c4d5e6f7890123458";
const centerId = "671a2b3c4d5e6f7890123459";

const originals = {
  findWithDocuments: documentsChildRepository.findWithDocuments,
  consumeByToken: documentAccessTokenRepository.consumeByToken,
  createToken: documentAccessTokenRepository.createToken,
  pruneStale: documentAccessTokenRepository.pruneStale,
  downloadFile: storageService.downloadFile,
};

let storedDocument: any;

before(() => {
  process.env.DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID = "test-v1";
  process.env.DOCUMENT_ENCRYPTION_KEYS_JSON = JSON.stringify({
    "test-v1": Buffer.alloc(32, 7).toString("base64"),
  });
  resetDocumentEncryptionConfigurationForTests();

  documentsChildRepository.findWithDocuments = async () => ({
    _id: childId,
    parent: parentId,
    teacher: teacherId,
    daycareCenter: centerId,
    documents: { birthCertificate: storedDocument },
  });
  documentAccessTokenRepository.pruneStale = async () => undefined;
  documentAccessTokenRepository.createToken = async (data: any) => data;
});

after(() => {
  documentsChildRepository.findWithDocuments = originals.findWithDocuments;
  documentAccessTokenRepository.consumeByToken = originals.consumeByToken;
  documentAccessTokenRepository.createToken = originals.createToken;
  documentAccessTokenRepository.pruneStale = originals.pruneStale;
  storageService.downloadFile = originals.downloadFile;
  resetDocumentEncryptionConfigurationForTests();
});

describe("encrypted document access", () => {
  it("issues access only to users related to the child", async () => {
    storedDocument = { publicId: "encrypted.bin", resourceType: "raw", format: "bin" };
    const parentResult = await createChildDocumentAccessToken(
      { id: parentId, role: "parent" },
      childId,
      "birth-certificate",
    );
    const teacherResult = await createChildDocumentAccessToken(
      { id: teacherId, role: "teacher", daycareCenterId: centerId },
      childId,
      "birth-certificate",
    );
    const captainResult = await createChildDocumentAccessToken(
      { id: "671a2b3c4d5e6f7890123460", role: "barangay_captain", daycareCenterId: centerId },
      childId,
      "birth-certificate",
    );
    const unrelatedResult = await createChildDocumentAccessToken(
      { id: "671a2b3c4d5e6f7890123461", role: "parent" },
      childId,
      "birth-certificate",
    );

    assert.equal(parentResult.status, 200);
    assert.equal(teacherResult.status, 200);
    assert.equal(captainResult.status, 200);
    assert.equal(unrelatedResult.status, 403);
  });

  it("decrypts an encrypted document and consumes its token once", async () => {
    const plaintext = Buffer.from("%PDF enrollment record");
    const encrypted = encryptDocument(plaintext, "application/pdf", "birth.pdf");
    storedDocument = {
      publicId: "encrypted.bin",
      resourceType: "raw",
      format: "bin",
      hash: ethers.keccak256(plaintext),
      encryption: encrypted.encryption,
    };
    storageService.downloadFile = async () => encrypted.ciphertext;
    let available = true;
    documentAccessTokenRepository.consumeByToken = async () => {
      if (!available) return null;
      available = false;
      return {
        childId,
        documentType: "birthCertificate",
        expiresAt: new Date(Date.now() + 30_000),
      };
    };

    const first = await getChildDocumentStreamByToken("one-use-token");
    const second = await getChildDocumentStreamByToken("one-use-token");

    assert.equal(first.status, 200);
    assert.deepEqual((first.body as any).buffer, plaintext);
    assert.equal((first.body as any).contentType, "application/pdf");
    assert.equal(second.status, 404);
  });

  it("rejects expired access tokens", async () => {
    documentAccessTokenRepository.consumeByToken = async () => ({
      childId,
      documentType: "birthCertificate",
      expiresAt: new Date(Date.now() - 1),
    });
    const result = await getChildDocumentStreamByToken("expired-token");
    assert.equal(result.status, 410);
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildExpectedFieldsHash, decideDocumentVerification, detectImage, fuzzyMatch, normalizeVerificationName, parseGeminiDocumentObservations } from "../src/modules/enrollment/services/document-verification.service";

const observation = (overrides: Record<string, unknown> = {}) => ({
  documentVisible: true, detectedType: "birth_certificate" as const, readable: true,
  cropped: false, glare: false, blurred: false, rotated: false, confidence: 0.95,
  extractedFields: {
    childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03", parentFullName: null,
    parentFirstName: null, parentMiddleName: null, parentLastName: null,
  },
  reasonCodes: [], ...overrides,
});

test("detectImage uses JPEG/PNG signatures", () => {
  assert.equal(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
  assert.equal(detectImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "image/png");
  assert.throws(() => detectImage(Buffer.from("not an image")));
});

test("normalization and binding hashes ignore cosmetic differences", () => {
  assert.equal(normalizeVerificationName("  JUAN,  Dela-Cruz "), "juan dela cruz");
  assert.equal(fuzzyMatch("Juan Dela Cruz", "juan dela-cruz"), true);
  assert.equal(
    buildExpectedFieldsHash({ documentType: "parentId", parentFullName: "MARIA Dela-Cruz" }),
    buildExpectedFieldsHash({ documentType: "parentId", parentFullName: "maria dela cruz" }),
  );
});

test("parent names match when a government ID prints surname first", () => {
  assert.equal(fuzzyMatch("DELA CRUZ MARIA SANTOS", "Maria Santos Dela Cruz"), true);
});

test("matching readable birth certificate verifies", () => {
  assert.equal(decideDocumentVerification("birthCertificate", observation(), { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" }).status, "verified");
});

test("field mismatch and blur require confirmation", () => {
  assert.equal(decideDocumentVerification("birthCertificate", observation(), { childFullName: "Other Child", dateOfBirth: "2021-02-03" }).status, "teacher_confirmation_required");
  assert.equal(decideDocumentVerification("birthCertificate", observation({ blurred: true }), { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" }).status, "teacher_confirmation_required");
});

test("corroborated wrong types and photos reject", () => {
  assert.equal(decideDocumentVerification("birthCertificate", observation({ detectedType: "government_id" }), { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" }).status, "rejected");
  assert.equal(decideDocumentVerification("birthCertificate", observation({ documentVisible: false, detectedType: "person_photo" }), { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" }).status, "rejected");
});

test("Philippine National ID aliases normalize to government ID", () => {
  const result = parseGeminiDocumentObservations(JSON.stringify({
    documentVisible: true,
    detectedType: "philippine_national_id",
    quality: { readable: true, cropped: false, glare: false, tooBlurry: false },
    rotated: false,
    confidence: 0.96,
    extractedFields: { holderName: "Maria Dela Cruz" },
    reasonCodes: [],
  }));
  assert.equal(result.detectedType, "government_id");
  assert.equal(result.extractedFields.parentFullName, "Maria Dela Cruz");
});

test("component-wise Parent ID matching verifies first and last names", () => {
  const result = decideDocumentVerification("parentId", observation({
    detectedType: "government_id",
    extractedFields: {
      childFullName: null, dateOfBirth: null, parentFullName: "DELA CRUZ MARIA SANTOS",
      parentFirstName: "MARIA", parentMiddleName: "SANTOS", parentLastName: "DELA CRUZ",
    },
  }), { parentFirstName: "maria", parentMiddleName: "x", parentLastName: "dela cruz" });
  assert.equal(result.status, "verified");
  assert.equal(result.fieldMatches.parentFirstName, true);
  assert.equal(result.fieldMatches.parentLastName, true);
  assert.equal(result.fieldMatches.parentMiddleName, false);
});

test("Parent ID first or last name mismatch requires confirmation, never rejection", () => {
  const result = decideDocumentVerification("parentId", observation({
    detectedType: "government_id",
    extractedFields: {
      childFullName: null, dateOfBirth: null, parentFullName: null,
      parentFirstName: "Different", parentMiddleName: null, parentLastName: "Dela Cruz",
    },
  }), { parentFirstName: "Maria", parentMiddleName: "", parentLastName: "Dela Cruz" });
  assert.equal(result.status, "teacher_confirmation_required");
  assert.ok(result.reasonCodes.includes("PARENT_FIRST_NAME_MISMATCH_OR_UNREADABLE"));
});

test("readable Parent ID with matching names tolerates minor quality warnings", () => {
  const result = decideDocumentVerification("parentId", observation({
    detectedType: "government_id",
    cropped: true,
    glare: true,
    blurred: true,
    rotated: true,
    extractedFields: {
      childFullName: null, dateOfBirth: null, parentFullName: null,
      parentFirstName: "Maria", parentMiddleName: null, parentLastName: "Dela Cruz",
    },
  }), { parentFirstName: "Maria", parentMiddleName: "", parentLastName: "Dela Cruz" });
  assert.equal(result.status, "verified");
  assert.ok(result.reasonCodes.includes("IMAGE_CROPPED"));
  assert.ok(result.reasonCodes.includes("IMAGE_GLARE_DETECTED"));
  assert.ok(result.reasonCodes.includes("IMAGE_BLURRED"));
  assert.ok(result.reasonCodes.includes("IMAGE_ROTATED"));
});

test("unreadable Parent ID still requires teacher confirmation", () => {
  const result = decideDocumentVerification("parentId", observation({
    detectedType: "government_id",
    readable: false,
    extractedFields: {
      childFullName: null, dateOfBirth: null, parentFullName: null,
      parentFirstName: "Maria", parentMiddleName: null, parentLastName: "Dela Cruz",
    },
  }), { parentFirstName: "Maria", parentMiddleName: "", parentLastName: "Dela Cruz" });
  assert.equal(result.status, "teacher_confirmation_required");
  assert.ok(result.reasonCodes.includes("IMAGE_NOT_READABLE"));
});

test("component hashes bind each parent name field", () => {
  const base = buildExpectedFieldsHash({ documentType: "parentId", parentFirstName: "Maria", parentMiddleName: "Santos", parentLastName: "Dela Cruz" });
  const changed = buildExpectedFieldsHash({ documentType: "parentId", parentFirstName: "Maria", parentMiddleName: "Reyes", parentLastName: "Dela Cruz" });
  assert.notEqual(base, changed);
});

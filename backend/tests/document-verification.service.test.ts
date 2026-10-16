import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExpectedFieldsHash,
  decideDocumentVerification,
  detectImage,
  fuzzyMatch,
  normalizeVerificationName,
  parseGeminiDocumentObservations,
  canTeacherConfirmDocumentVerification,
} from "../src/modules/enrollment/services/document-verification.service";

const observation = (overrides: Record<string, unknown> = {}) => ({
  documentVisible: true,
  detectedType: "birth_certificate" as const,
  readable: true,
  cropped: false,
  glare: false,
  blurred: false,
  rotated: false,
  confidence: 0.95,
  extractedFields: {
    childFullName: "Juan Dela Cruz",
    dateOfBirth: "2021-02-03",
    parentFullName: null,
    parentFirstName: null,
    parentMiddleName: null,
    parentLastName: null,
  },
  reasonCodes: [],
  ...overrides,
});

test("detectImage uses JPEG/PNG signatures", () => {
  assert.equal(
    detectImage(Buffer.from([0xff, 0xd8, 0xff, 0x00])),
    "image/jpeg",
  );
  assert.equal(
    detectImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.throws(() => detectImage(Buffer.from("not an image")));
});

test("normalization and binding hashes ignore cosmetic differences", () => {
  assert.equal(
    normalizeVerificationName("  JUAN,  Dela-Cruz "),
    "juan dela cruz",
  );
  assert.equal(fuzzyMatch("Juan Dela Cruz", "juan dela-cruz"), true);
  assert.equal(
    buildExpectedFieldsHash({
      documentType: "parentId",
      parentFullName: "MARIA Dela-Cruz",
    }),
    buildExpectedFieldsHash({
      documentType: "parentId",
      parentFullName: "maria dela cruz",
    }),
  );
});

test("parent names match when a government ID prints surname first", () => {
  assert.equal(
    fuzzyMatch("DELA CRUZ MARIA SANTOS", "Maria Santos Dela Cruz"),
    true,
  );
});

test("matching readable birth certificate verifies", () => {
  assert.equal(
    decideDocumentVerification("birthCertificate", observation(), {
      childFullName: "Juan Dela Cruz",
      dateOfBirth: "2021-02-03",
    }).status,
    "verified",
  );
});

test("field mismatch and blur require confirmation", () => {
  const mismatch = decideDocumentVerification(
    "birthCertificate",
    observation(),
    { childFullName: "Other Child", dateOfBirth: "2021-02-03" },
  );
  assert.equal(mismatch.status, "teacher_confirmation_required");
  assert.ok(mismatch.reasonCodes.includes("CHILD_NAME_MISMATCH_OR_UNREADABLE"));
  assert.equal(
    decideDocumentVerification(
      "birthCertificate",
      observation({ blurred: true }),
      { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" },
    ).status,
    "teacher_confirmation_required",
  );
});

test("recognizable unreadable birth certificates require teacher review", () => {
  const result = decideDocumentVerification(
    "birthCertificate",
    observation({
      readable: false,
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: null,
        parentFirstName: null,
        parentMiddleName: null,
        parentLastName: null,
      },
    }),
    { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" },
  );
  assert.equal(result.status, "teacher_confirmation_required");
  assert.ok(result.reasonCodes.includes("BIRTH_CERTIFICATE_TEXT_UNREADABLE"));
  assert.ok(result.reasonCodes.includes("CHILD_NAME_MISMATCH_OR_UNREADABLE"));
  assert.ok(result.reasonCodes.includes("BIRTH_DATE_MISMATCH_OR_UNREADABLE"));
});

test("low-confidence wrong document types fall back to teacher review", () => {
  const result = decideDocumentVerification(
    "birthCertificate",
    observation({ detectedType: "government_id", confidence: 0.6 }),
    { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" },
  );
  assert.equal(result.status, "teacher_confirmation_required");
});

test("corroborated wrong types and photos reject", () => {
  assert.equal(
    decideDocumentVerification(
      "birthCertificate",
      observation({ detectedType: "government_id" }),
      { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" },
    ).status,
    "rejected",
  );
  assert.equal(
    decideDocumentVerification(
      "birthCertificate",
      observation({ documentVisible: false, detectedType: "person_photo" }),
      { childFullName: "Juan Dela Cruz", dateOfBirth: "2021-02-03" },
    ).status,
    "rejected",
  );
});

test("Philippine National ID aliases normalize to government ID", () => {
  const result = parseGeminiDocumentObservations(
    JSON.stringify({
      documentVisible: true,
      detectedType: "philippine_national_id",
      quality: {
        readable: true,
        cropped: false,
        glare: false,
        tooBlurry: false,
      },
      rotated: false,
      confidence: 0.96,
      extractedFields: { holderName: "Maria Dela Cruz" },
      reasonCodes: [],
    }),
  );
  assert.equal(result.detectedType, "government_id");
  assert.equal(result.extractedFields.parentFullName, "Maria Dela Cruz");
});

test("component-wise Parent ID matching verifies first and last names", () => {
  const result = decideDocumentVerification(
    "parentId",
    observation({
      detectedType: "government_id",
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: "DELA CRUZ MARIA SANTOS",
        parentFirstName: "MARIA",
        parentMiddleName: "SANTOS",
        parentLastName: "DELA CRUZ",
      },
    }),
    {
      parentFirstName: "maria",
      parentMiddleName: "x",
      parentLastName: "dela cruz",
    },
  );
  assert.equal(result.status, "verified");
  assert.equal(result.fieldMatches.parentFirstName, true);
  assert.equal(result.fieldMatches.parentLastName, true);
  assert.equal(result.fieldMatches.parentMiddleName, false);
});

test("Parent ID first or last name mismatch requires confirmation, never rejection", () => {
  const result = decideDocumentVerification(
    "parentId",
    observation({
      detectedType: "government_id",
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: null,
        parentFirstName: "Different",
        parentMiddleName: null,
        parentLastName: "Dela Cruz",
      },
    }),
    {
      parentFirstName: "Maria",
      parentMiddleName: "",
      parentLastName: "Dela Cruz",
    },
  );
  assert.equal(result.status, "teacher_confirmation_required");
  assert.ok(
    result.reasonCodes.includes("PARENT_FIRST_NAME_MISMATCH_OR_UNREADABLE"),
  );
});

test("readable Parent ID with matching names tolerates minor quality warnings", () => {
  const result = decideDocumentVerification(
    "parentId",
    observation({
      detectedType: "government_id",
      cropped: true,
      glare: true,
      blurred: true,
      rotated: true,
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: null,
        parentFirstName: "Maria",
        parentMiddleName: null,
        parentLastName: "Dela Cruz",
      },
    }),
    {
      parentFirstName: "Maria",
      parentMiddleName: "",
      parentLastName: "Dela Cruz",
    },
  );
  assert.equal(result.status, "verified");
  assert.ok(result.reasonCodes.includes("IMAGE_CROPPED"));
  assert.ok(result.reasonCodes.includes("IMAGE_GLARE_DETECTED"));
  assert.ok(result.reasonCodes.includes("IMAGE_BLURRED"));
  assert.ok(result.reasonCodes.includes("IMAGE_ROTATED"));
});

test("unreadable Parent ID still requires teacher confirmation", () => {
  const result = decideDocumentVerification(
    "parentId",
    observation({
      detectedType: "government_id",
      readable: false,
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: null,
        parentFirstName: "Maria",
        parentMiddleName: null,
        parentLastName: "Dela Cruz",
      },
    }),
    {
      parentFirstName: "Maria",
      parentMiddleName: "",
      parentLastName: "Dela Cruz",
    },
  );
  assert.equal(result.status, "teacher_confirmation_required");
  assert.ok(result.reasonCodes.includes("IMAGE_NOT_READABLE"));
});

test("high-confidence unsupported parent documents are rejected", () => {
  const result = decideDocumentVerification(
    "parentId",
    observation({ detectedType: "other_document", confidence: 0.96 }),
    {
      parentFirstName: "Maria",
      parentMiddleName: "",
      parentLastName: "Dela Cruz",
    },
  );
  assert.equal(result.status, "rejected");
  assert.ok(result.reasonCodes.includes("UNSUPPORTED_ID_DOCUMENT"));
});

test("low-confidence unsupported parent documents go to teacher review", () => {
  const result = decideDocumentVerification(
    "parentId",
    observation({ detectedType: "other_document", confidence: 0.6 }),
    {
      parentFirstName: "Maria",
      parentMiddleName: "",
      parentLastName: "Dela Cruz",
    },
  );
  assert.equal(result.status, "teacher_confirmation_required");
  assert.equal(result.reasonCodes.includes("UNSUPPORTED_ID_DOCUMENT"), false);
});

test("matching guardian government ID verifies guardian name", () => {
  const result = decideDocumentVerification(
    "guardianId",
    observation({
      detectedType: "government_id",
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: "Ana Reyes",
        parentFirstName: "Ana",
        parentMiddleName: null,
        parentLastName: "Reyes",
      },
    }),
    { guardianFirstName: "Ana", guardianLastName: "Reyes" },
  );
  assert.equal(result.status, "verified");
  assert.equal(result.fieldMatches.guardianName, true);
});

test("guardian name mismatch requires teacher confirmation", () => {
  const result = decideDocumentVerification(
    "guardianId",
    observation({
      detectedType: "government_id",
      extractedFields: {
        childFullName: null,
        dateOfBirth: null,
        parentFullName: "Different Reyes",
        parentFirstName: "Different",
        parentMiddleName: null,
        parentLastName: "Reyes",
      },
    }),
    { guardianFirstName: "Ana", guardianLastName: "Reyes" },
  );
  assert.equal(result.status, "teacher_confirmation_required");
  assert.ok(
    result.reasonCodes.includes("GUARDIAN_FIRST_NAME_MISMATCH_OR_UNREADABLE"),
  );
});

test("high-confidence unsupported guardian documents are rejected", () => {
  const result = decideDocumentVerification(
    "guardianId",
    observation({ detectedType: "other_document", confidence: 0.96 }),
    { guardianFirstName: "Ana", guardianLastName: "Reyes" },
  );
  assert.equal(result.status, "rejected");
  assert.ok(result.reasonCodes.includes("UNSUPPORTED_ID_DOCUMENT"));
});

test("AI service failures can fall back to teacher confirmation", () => {
  const base = {
    status: "teacher_confirmation_required" as const,
    isTransientFailure: true,
    consumedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  };
  assert.equal(
    canTeacherConfirmDocumentVerification({
      ...base,
      documentType: "guardianId",
    }),
    true,
  );
  assert.equal(
    canTeacherConfirmDocumentVerification({
      ...base,
      documentType: "parentId",
    }),
    true,
  );
  assert.equal(
    canTeacherConfirmDocumentVerification({
      ...base,
      documentType: "birthCertificate",
    }),
    true,
  );
});

test("manual confirmation remains blocked for rejected or expired documents", () => {
  assert.equal(
    canTeacherConfirmDocumentVerification({
      status: "rejected",
      documentType: "parentId",
      isTransientFailure: false,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    }),
    false,
  );
  assert.equal(
    canTeacherConfirmDocumentVerification({
      status: "teacher_confirmation_required",
      documentType: "birthCertificate",
      isTransientFailure: true,
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1),
    }),
    false,
  );
});

test("component hashes bind each parent name field", () => {
  const base = buildExpectedFieldsHash({
    documentType: "parentId",
    parentFirstName: "Maria",
    parentMiddleName: "Santos",
    parentLastName: "Dela Cruz",
  });
  const changed = buildExpectedFieldsHash({
    documentType: "parentId",
    parentFirstName: "Maria",
    parentMiddleName: "Reyes",
    parentLastName: "Dela Cruz",
  });
  assert.notEqual(base, changed);
});

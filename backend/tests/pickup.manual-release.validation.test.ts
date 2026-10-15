import test from "node:test";
import assert from "node:assert/strict";
import {
  serializePickupEligibleChild,
  validateManualReleaseGuardianVerification,
  validateManualReleaseParentVerification,
} from "../src/modules/pickup/services/pickup.service";

test("guardian manual release requires visual verification and valid guardian record", () => {
  assert.doesNotThrow(() =>
    validateManualReleaseGuardianVerification(
      {
        idUrl: "https://example.com/id.jpg",
        isActive: true,
      },
      true,
    ),
  );

  assert.throws(
    () =>
      validateManualReleaseGuardianVerification(
        {
          idUrl: null,
          isActive: true,
        },
        true,
      ),
    /government-issued photo ID/i,
  );

  assert.throws(
    () =>
      validateManualReleaseGuardianVerification(
        {
          idUrl: "https://example.com/id.jpg",
          isActive: true,
        },
        false,
      ),
    /visual verification/i,
  );
});

test("parent manual release requires a stored ID and visual verification", () => {
  assert.doesNotThrow(() =>
    validateManualReleaseParentVerification(
      { publicId: "encrypted-parent-id", resourceType: "raw" },
      true,
    ),
  );

  assert.throws(
    () => validateManualReleaseParentVerification(null, true),
    /stored ID/i,
  );
  assert.throws(
    () =>
      validateManualReleaseParentVerification(
        { publicId: "encrypted-parent-id", resourceType: "raw" },
        false,
      ),
    /visual verification/i,
  );
});

test("pickup child response exposes only parent ID availability", () => {
  const result = serializePickupEligibleChild({
    _id: "child-1",
    parent: { _id: "parent-1", firstName: "Maria", lastName: "Cruz" },
    documents: {
      parentId: {
        publicId: "secret-cloudinary-id",
        resourceType: "raw",
        hash: "secret-hash",
        encryption: { keyId: "secret-key" },
      },
    },
    authorizedPickupPersons: [],
  });

  assert.equal(result.parent.hasIdDocument, true);
  assert.equal("documents" in result, false);
  assert.equal(JSON.stringify(result).includes("secret-cloudinary-id"), false);
  assert.equal(JSON.stringify(result).includes("secret-hash"), false);
  assert.equal(JSON.stringify(result).includes("secret-key"), false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { validateManualReleaseGuardianVerification } from "../src/modules/pickup/services/pickup.service";

test("guardian manual release requires visual verification and valid guardian record", () => {
  assert.doesNotThrow(() =>
    validateManualReleaseGuardianVerification(
      {
        photoUrl: "https://example.com/photo.jpg",
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
          photoUrl: "https://example.com/photo.jpg",
          idUrl: null,
          isActive: true,
        },
        true,
      ),
    /photo and valid ID/i,
  );

  assert.throws(
    () =>
      validateManualReleaseGuardianVerification(
        {
          photoUrl: "https://example.com/photo.jpg",
          idUrl: "https://example.com/id.jpg",
          isActive: true,
        },
        false,
      ),
    /visual verification/i,
  );
});

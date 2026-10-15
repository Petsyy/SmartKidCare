import test from "node:test";
import assert from "node:assert/strict";
import { guardianIdentityRequiresVerification } from "../src/modules/child/services/guardian.service";

const guardian = { firstName: "Ana", lastName: "Dela Cruz" };

test("new guardians and replacement IDs require verification", () => {
  assert.equal(
    guardianIdentityRequiresVerification(null, guardian, true),
    true,
  );
  assert.equal(
    guardianIdentityRequiresVerification(guardian, guardian, true),
    true,
  );
});

test("guardian name changes require verification", () => {
  assert.equal(
    guardianIdentityRequiresVerification(
      guardian,
      { firstName: "Maria", lastName: "Dela Cruz" },
      false,
    ),
    true,
  );
});

test("unchanged legacy guardian identity does not require verification", () => {
  assert.equal(
    guardianIdentityRequiresVerification(
      guardian,
      { firstName: " ANA ", lastName: "dela-cruz" },
      false,
    ),
    false,
  );
});

test("optional middle-name edits do not invalidate first/last-name verification", () => {
  assert.equal(
    guardianIdentityRequiresVerification(
      { ...guardian, middleName: "Santos" },
      { ...guardian, middleName: "Reyes" },
      false,
    ),
    false,
  );
});

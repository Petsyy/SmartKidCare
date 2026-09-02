import test from "node:test";
import assert from "node:assert/strict";
import {
  buildChildAccessFilter,
  canAccessChild,
  canAccessChildIdentityDocument,
} from "../src/shared/services/child-access.service";

const teacher = {
  id: "teacher-1",
  role: "teacher" as const,
  daycareCenterId: "center-1",
};

test("teacher access requires both teacher assignment and center assignment", () => {
  assert.equal(
    canAccessChild(teacher, {
      teacher: "teacher-1",
      daycareCenter: "center-1",
    }),
    true,
  );
  assert.equal(
    canAccessChild(teacher, {
      teacher: "teacher-1",
      daycareCenter: "center-2",
    }),
    false,
  );
  assert.equal(
    canAccessChild(teacher, {
      teacher: "teacher-2",
      daycareCenter: "center-1",
    }),
    false,
  );
});

test("teacher child query filter always includes teacher and center", () => {
  assert.deepEqual(buildChildAccessFilter(teacher), {
    teacher: "teacher-1",
    daycareCenter: "center-1",
  });
});

test("parent can access only their linked child", () => {
  const parent = { id: "parent-1", role: "parent" as const, daycareCenterId: null };
  assert.equal(canAccessChild(parent, { parent: "parent-1" }), true);
  assert.equal(canAccessChild(parent, { parent: "parent-2" }), false);
});

test("identity documents exclude teachers but allow linked parents and admins", () => {
  const child = { parent: "parent-1", teacher: "teacher-1", daycareCenter: "center-1" };
  assert.equal(canAccessChildIdentityDocument(teacher, child), false);
  assert.equal(
    canAccessChildIdentityDocument(
      { id: "parent-1", role: "parent", daycareCenterId: null },
      child,
    ),
    true,
  );
  assert.equal(
    canAccessChildIdentityDocument(
      { id: "admin-1", role: "admin", daycareCenterId: null },
      child,
    ),
    true,
  );
});

test("teacher without a center cannot build an access filter", () => {
  assert.throws(
    () => buildChildAccessFilter({ ...teacher, daycareCenterId: null }),
    /no active center assignment/i,
  );
});

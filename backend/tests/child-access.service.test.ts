import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCaptainCenter,
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

test("identity documents exclude teachers and captains but allow linked parents", () => {
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
      { id: "captain-1", role: "barangay_captain", daycareCenterId: "center-1" },
      child,
    ),
    false,
  );
});

test("captain reads only children from the assigned center", () => {
  const captain = { id: "captain-1", role: "barangay_captain" as const, daycareCenterId: "center-1" };
  assert.deepEqual(buildChildAccessFilter(captain), { daycareCenter: "center-1" });
  assert.equal(canAccessChild(captain, { daycareCenter: "center-1" }), true);
  assert.equal(canAccessChild(captain, { daycareCenter: "center-2" }), false);
});

test("captain analytics access requires the configured center assignment", () => {
  const captain = {
    id: "captain-1",
    role: "barangay_captain" as const,
    daycareCenterId: "center-1",
  };

  assert.equal(assertCaptainCenter(captain, "center-1"), "center-1");
  assert.throws(
    () => assertCaptainCenter({ ...captain, daycareCenterId: null }, "center-1"),
    /no center assignment/i,
  );
  assert.throws(
    () => assertCaptainCenter(captain, "center-2"),
    /not assigned to this center/i,
  );
  assert.throws(
    () =>
      assertCaptainCenter(
        { id: "teacher-1", role: "teacher", daycareCenterId: "center-1" },
        "center-1",
      ),
    /captains only/i,
  );
});

test("system admin cannot access operational child records", () => {
  const systemAdmin = { id: "system-1", role: "system_admin" as const, daycareCenterId: null };
  assert.throws(() => buildChildAccessFilter(systemAdmin), /forbidden/i);
  assert.equal(canAccessChild(systemAdmin, { daycareCenter: "center-1" }), false);
});

test("teacher without a center cannot build an access filter", () => {
  assert.throws(
    () => buildChildAccessFilter({ ...teacher, daycareCenterId: null }),
    /no active center assignment/i,
  );
});

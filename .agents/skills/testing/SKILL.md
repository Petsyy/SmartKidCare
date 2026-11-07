---
name: testing
description: Generate tests for SmartKidCare.
---

# Goal

Write focused, reliable tests that verify business logic, API contracts, and edge cases. Tests should be independent, fast, and maintainable.

---

# Test Infrastructure

SmartKidCare uses **Node.js built-in test runner** (`node --test`) with `ts-node` for TypeScript:

```bash
node --test --require ts-node/register tests/<test-file>.test.ts
```

Test files live in `backend/tests/` and follow the naming convention: `<module>.<concern>.test.ts`.

Example scripts from `package.json`:

```json
"test:ai-chat-services": "node --test --require ts-node/register tests/ai.chat-intent.service.test.ts tests/ai.chat-followup.service.test.ts"
```

---

# Test Pattern

Use the Node.js built-in `describe` / `it` / `assert` pattern:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("AttendanceService", () => {
  describe("submit", () => {
    it("should create attendance for assigned children", async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const service = new AttendanceService(mockDeps);
      const user = { id: "teacher-1", role: "teacher" };
      const input = { date: "2026-08-26", records: [{ child: "child-1", status: "present" }] };

      // Act
      const result = await service.submit(user, input);

      // Assert
      assert.equal(result.isUpdate, false);
      assert.ok(result.attendance);
    });

    it("should throw ForbiddenError for unassigned children", async () => {
      const mockDeps = createMockDependencies({
        childRepository: {
          findAssignedChildIds: async () => [], // No children assigned
        },
      });
      const service = new AttendanceService(mockDeps);

      await assert.rejects(
        () => service.submit(user, input),
        { name: "ForbiddenError" },
      );
    });
  });
});
```

---

# Testing Strategy by Layer

## Services (Priority: Highest)

Services contain business logic and are the most valuable to test. Thanks to **dependency injection**, services can be tested with mock dependencies:

```typescript
const mockDeps: AttendanceServiceDependencies = {
  support: mockRecordServiceSupport,
  childRepository: { findAssignedChildIds: async () => ["child-1"] },
  attendanceRepository: {
    findByTeacherAndDay: async () => null,
    create: async (data) => ({ ...data, _id: "new-id" }),
  },
  findChildIdsByParent: async () => ["child-1"],
  findHistory: async () => [],
  notifySubmitted: async () => {},
};

const service = new AttendanceService(mockDeps);
```

Test scenarios:

- Happy path (valid input, correct role)
- Missing/invalid input
- Unauthorised access (wrong role, unassigned child)
- Edge cases (empty records, duplicate submissions)
- Error handling (service throws correct AppError subclass)

## Validators (Priority: High)

Test Zod schemas directly:

```typescript
import { z } from "zod";

it("should reject missing date", () => {
  const result = schema.safeParse({ records: [] });
  assert.equal(result.success, false);
});
```

## Controllers (Priority: Medium)

Controllers are thin, so testing is mainly about verifying:

- Correct service is called
- Correct HTTP status is returned
- Response shape matches the contract

## Repositories (Priority: Low for Unit Tests)

Repository tests typically require a real database. Only write these for complex query logic.

---

# What to Test

### Always Test

- [ ] Happy path — valid input with correct role produces expected output
- [ ] Validation — invalid/missing fields produce `ValidationError`
- [ ] Authentication — unauthenticated request is rejected
- [ ] Authorisation — wrong role produces `ForbiddenError` or `UnauthorizedError`
- [ ] Ownership — teacher accessing unassigned child produces `ForbiddenError`
- [ ] Edge cases — empty arrays, boundary dates, max pagination

### Consider Testing

- [ ] Network failure handling (API service error recovery)
- [ ] Concurrent operations (double submission)
- [ ] Date/timezone edge cases (Manila timezone transitions)
- [ ] Pagination boundaries (page beyond total pages)

---

# Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Test file | `<module>.<concern>.test.ts` | `attendance.service.test.ts` |
| Describe block | Service/class name | `describe("AttendanceService", ...)` |
| It block | Starts with "should" | `it("should reject unassigned children", ...)` |
| Mock factory | `createMock<Thing>` | `createMockDependencies()` |

---

# Rules

**Never:**

- Test implementation details (private methods, internal state)
- Write tests that depend on execution order
- Mock everything — only mock external dependencies (database, notifications)
- Leave test data that could affect other tests

**Always:**

- Test behaviour, not implementation
- Use the Arrange-Act-Assert pattern
- Make each test independent and self-contained
- Test error cases, not just happy paths
- Name tests descriptively — a failing test name should explain the problem

---

# Deliverables

When writing tests, provide:

1. **Test file** with clear describe/it structure
2. **Run command** to execute the tests
3. **Coverage summary** — what scenarios are covered
4. **Gaps** — what is deliberately not tested and why
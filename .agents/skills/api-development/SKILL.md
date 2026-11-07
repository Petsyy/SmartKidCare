---
name: api-development
description: Create or modify Express.js REST APIs following SmartKidCare architecture.
---

# Goal

Implement production-ready REST API endpoints that follow the established SmartKidCare module-based architecture.

---

# Architecture

The backend uses a **modular architecture** where each domain lives under `backend/src/modules/<module>/`.

```
backend/src/modules/<module>/
  controllers/    → thin request/response handlers
  services/       → business logic (DI-enabled classes)
  repositories/   → database access (Mongoose queries)
  routes/         → Express router definitions
  validators/     → Zod schemas + validate() middleware
  types/          → TypeScript interfaces for the module
```

Shared infrastructure lives under `backend/src/shared/`:

```
backend/src/shared/
  middleware/      → auth, role, validate, sanitize, upload, error-handler
  errors/          → AppError hierarchy
  utils/           → async-handler, records.utils, etc.
  services/        → record-service-support, shared service logic
  repositories/    → shared repository helpers
  types/           → auth.types, shared interfaces
  config/          → database, environment
  lib/             → csrf, utility libraries
```

Models are centralised in `backend/src/models/`.

---

# Workflow

1. **Check existing endpoints** — search `backend/src/modules/` and routes for overlapping functionality. Never create a duplicate endpoint.
2. **Design the contract** — define the request shape (body/query/params) and response shape before coding.
3. **Create validation** — write a Zod schema in `validators/<module>.validator.ts` and export it via the shared `validate()` middleware.
4. **Add or update the model** — if schema changes are needed, update the Mongoose model in `backend/src/models/`.
5. **Implement the repository** — add data-access functions in `repositories/`. Keep Mongoose queries here, never in services or controllers.
6. **Implement the service** — write business logic in `services/`. Use dependency injection (constructor-injected dependencies object) so services are testable.
7. **Implement the controller** — keep controllers thin. They must only: validate the authenticated user, call the service, and return a response. Wrap every handler with `asyncHandler()`.
8. **Register the route** — add the route in `routes/` with the correct middleware chain: `authenticateToken` → `requireRole(...)` → validator → controller.
9. **Register in the app** — ensure `app.ts` mounts the module's router under the correct prefix.

---

# Controller Pattern

Controllers use `asyncHandler` from `shared/utils/async-handler` to catch async errors. They throw typed errors from the `AppError` hierarchy — never return raw error objects.

```typescript
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { ForbiddenError } from "../../../shared/errors/app-error";
import { myService } from "../services/my.service";

export const createThing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }
  const result = await myService.create(req.user, req.body);
  res.status(201).json({ message: "Created successfully", data: result });
});
```

Controllers must **never**:

- Query MongoDB directly
- Contain business logic
- Catch errors (let asyncHandler + error-handler middleware do it)

---

# Service Pattern

Services encapsulate business logic. Use the **dependency-injected class** pattern already established in the codebase:

```typescript
import type { MyServiceDependencies } from "../types/my.types";

const createOperation = async (
  user: AuthUser,
  input: CreateInput,
  deps: MyServiceDependencies,
) => {
  // Business logic here — use deps.repository, deps.support, etc.
};

export class MyService {
  constructor(private readonly deps: MyServiceDependencies) {}
  create(user: AuthUser, input: CreateInput) {
    return createOperation(user, input, this.deps);
  }
}

export const myService = new MyService(defaultDependencies);
export const create = myService.create.bind(myService);
```

---

# Validation Pattern

Use **Zod** schemas with the shared `validate()` middleware:

```typescript
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const createThingSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  status: z.enum(["active", "inactive"], {
    message: "Status must be 'active' or 'inactive'.",
  }),
});

const querySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().trim().optional(),
});

export const validateCreateThing = validate(createThingSchema);
export const validateThingQuery = validate(querySchema, "query");
```

The `validate()` middleware accepts a second argument for the request part: `"body"` (default), `"query"`, or `"params"`.

---

# Route Pattern

Routes compose the middleware chain. Always apply `authenticateToken` first, then `requireRole()`, then the validator, then the controller.

```typescript
import express from "express";
import { createThing, getThings } from "../controllers/my.controller";
import { validateCreateThing, validateThingQuery } from "../validators/my.validator";
import { authenticateToken } from "../../../shared/middleware/auth.middleware";
import { requireRole } from "../../../shared/middleware/role.middleware";

const router = express.Router();
router.use(authenticateToken);

router.post("/", requireRole("teacher"), validateCreateThing, createThing);
router.get("/", requireRole("admin", "teacher", "parent"), validateThingQuery, getThings);

export default router;
```

---

# Error Handling

Use the established `AppError` hierarchy from `shared/errors/app-error.ts`:

| Error Class       | Status | Use Case                        |
| ----------------- | ------ | ------------------------------- |
| `ValidationError` | 400    | Invalid input                   |
| `UnauthorizedError` | 401  | Missing or expired token        |
| `ForbiddenError`  | 403    | Insufficient role/permissions   |
| `NotFoundError`   | 404    | Resource not found              |
| `ConflictError`   | 409    | Duplicate or conflicting state  |

Never construct raw `Error` objects for expected failures.

---

# API Response Format

**Success** — use the appropriate HTTP status code (200, 201):

```json
{ "message": "Created successfully", "data": { ... } }
```

**Failure** — thrown `AppError` subclasses are handled by the error-handler middleware:

```json
{ "message": "Descriptive error message" }
```

Never expose stack traces, raw MongoDB errors, or internal details.

---

# Naming Conventions

| Artifact             | Convention                                      | Example                          |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| Module directory     | `backend/src/modules/<domain>/`                 | `modules/attendance/`            |
| Controller file      | `<domain>.controller.ts`                        | `attendance.controller.ts`       |
| Service file         | `<domain>.service.ts`                           | `attendance.service.ts`          |
| Repository file      | `<domain>.repository.ts`                        | `attendance.repository.ts`       |
| Validator file       | `<domain>.validator.ts`                         | `attendance.validator.ts`        |
| Route file           | `<domain>.routes.ts`                            | `attendance.routes.ts`           |
| Types file           | `<domain>.types.ts`                             | `attendance.types.ts`            |
| Controller export    | `camelCase` verb function                       | `submitAttendance`               |
| Service class        | `PascalCase + Service`                          | `AttendanceService`              |
| Service singleton    | `camelCase + Service`                           | `attendanceService`              |

---

# Roles

The three roles are: `admin`, `teacher`, `parent`.

Always consider:

- Which roles can access this endpoint?
- Does the user own the resource they are accessing?
- Is teacher-child assignment validated?

---

# Checklist

Before finishing any API work:

- [ ] Zod validation covers all inputs
- [ ] `authenticateToken` and `requireRole()` applied
- [ ] Ownership / assignment validation in service layer
- [ ] Proper HTTP status codes
- [ ] Error cases use AppError subclasses
- [ ] Controller is thin (no business logic)
- [ ] Service uses dependency injection
- [ ] Repository handles all Mongoose operations
- [ ] No `console.log` left in production code
- [ ] No raw MongoDB errors exposed
- [ ] Types defined for all inputs and outputs
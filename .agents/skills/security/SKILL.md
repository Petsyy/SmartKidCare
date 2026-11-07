---
name: security
description: Review and implement secure features.
---

# Goal

Ensure every feature in SmartKidCare is secure by design. Verify authentication, authorisation, input validation, and data protection at every layer.

---

# Authentication Stack

SmartKidCare uses **JWT-based authentication** with the following infrastructure:

| Component | Location |
| --- | --- |
| Auth middleware | `backend/src/shared/middleware/auth.middleware.ts` |
| Role middleware | `backend/src/shared/middleware/role.middleware.ts` |
| CSRF protection | `backend/src/shared/lib/csrf.ts` |
| Input sanitisation | `backend/src/shared/middleware/sanitize-request.middleware.ts` |
| Validation | `backend/src/shared/middleware/validate.middleware.ts` (Zod) |
| Error hierarchy | `backend/src/shared/errors/app-error.ts` |
| User model | `backend/src/models/Users.ts` |
| Mobile auth | `mobile/src/context/auth-context.tsx` |
| Token management | `mobile/src/api/client.ts` (`setAuthToken`, `getAuthToken`) |
| Secure storage | `mobile/src/utils/auth-storage.ts` (expo-secure-store) |

---

# Security Checklist

## Authentication

- [ ] Every API endpoint uses `authenticateToken` middleware
- [ ] JWT secret is loaded from environment variables, never hardcoded
- [ ] Token expiry is validated (the auth context handles client-side expiry via `decodeJwtExpMs`)
- [ ] Cookie-based auth uses CSRF protection for unsafe methods (POST, PUT, PATCH, DELETE)
- [ ] Mobile app stores tokens in SecureStore, not AsyncStorage

## Authorisation (Roles)

The three roles are: `admin`, `teacher`, `parent`.

- [ ] Every endpoint uses `requireRole()` with the minimum necessary roles
- [ ] Ownership validation exists in the service layer:
  - Teachers can only access children assigned to them
  - Parents can only access their own children's records
  - Admins have full access
- [ ] Role checks happen server-side — never trust the mobile client's role claim

## Input Validation

- [ ] All request bodies validated with Zod schemas via `validate()` middleware
- [ ] Query parameters validated with `validate(schema, "query")`
- [ ] URL parameters validated with `validate(schema, "params")`
- [ ] `express-mongo-sanitize` is applied globally to prevent NoSQL injection
- [ ] String inputs are trimmed and length-limited

## Password Security

- [ ] Passwords hashed with bcryptjs — never stored in plain text
- [ ] Forced password change flow exists for parent accounts (`mustChangePassword` flag)
- [ ] Password validation rules enforced on both client and server

## Data Protection

- [ ] Sensitive fields excluded from API responses (use `.select("-password -__v")`)
- [ ] No stack traces or raw MongoDB errors exposed — use `AppError` subclasses
- [ ] Document access tokens have time-limited validity (`DocumentAccessToken` model)
- [ ] No `console.log` of sensitive data (tokens, passwords, personal information)

## HTTP Security

- [ ] `helmet` middleware applied for security headers
- [ ] `express-rate-limit` applied to sensitive endpoints (login, registration)
- [ ] CORS configured to allow only trusted origins
- [ ] Cookie settings use `httpOnly`, `secure`, `sameSite`

---

# Common Vulnerabilities to Check

### Broken Access Control

```typescript
// BAD — no ownership check
const child = await Child.findById(childId);
res.json(child); // Any authenticated user can access any child

// GOOD — ownership validated
const assignedIds = await childRepo.findAssignedChildIds([childId], req.user.id);
if (!assignedIds.includes(childId)) {
  throw new ForbiddenError("Not assigned to this child");
}
```

### Mass Assignment

```typescript
// BAD — spreading raw request body into the model
const user = await User.create(req.body);

// GOOD — explicitly pick allowed fields
const { firstName, lastName, email } = req.body;
const user = await User.create({ firstName, lastName, email, role: "parent" });
```

### NoSQL Injection

```typescript
// BAD — unsanitised query
const user = await User.findOne({ email: req.body.email, password: req.body.password });

// GOOD — Zod-validated input + mongo-sanitize middleware + bcrypt comparison
```

### Information Disclosure

```typescript
// BAD — leaking internal error details
res.status(500).json({ error: err.stack });

// GOOD — generic message via AppError
throw new AppError(500, "Something went wrong");
```

---

# Security Review Process

When reviewing any feature:

1. **Trace the request** from route → middleware → controller → service → repository
2. **Check authentication** — is `authenticateToken` applied?
3. **Check authorisation** — is `requireRole()` applied with correct roles?
4. **Check ownership** — does the service validate the user owns/is assigned to the resource?
5. **Check validation** — is all input validated with Zod before reaching the service?
6. **Check responses** — are errors safe? Is sensitive data excluded?

---

# Rules

**Never:**

- Trust client-provided data without server-side validation
- Log passwords, tokens, or personal data
- Hardcode secrets or API keys
- Expose raw database errors
- Allow unauthenticated access to protected resources
- Skip ownership validation assuming "the client won't send bad data"

**Always:**

- Validate at the API boundary (Zod)
- Validate ownership in the service layer
- Use the `AppError` hierarchy for all error responses
- Store secrets in environment variables
- Use `bcryptjs` for password hashing
- Apply rate limiting on auth endpoints
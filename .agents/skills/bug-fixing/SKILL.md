---
name: bug-fixing
description: Investigate and fix defects without introducing regressions.
---

# Goal

Systematically diagnose, fix, and verify bug fixes while minimising blast radius. Never guess — always trace the root cause.

---

# Workflow

## Step 1 — Understand the Bug

- Read the user's bug report carefully.
- Identify: what is the expected behaviour vs actual behaviour?
- Determine: is this a frontend, backend, or full-stack issue?
- Check: which roles are affected (admin, teacher, parent)?

## Step 2 — Reproduce the Bug

- Trace the data flow from trigger to failure.
- For **frontend bugs**: identify the screen, hook, and API call involved.
  - Screens are in `mobile/src/features/<feature>/screens/`
  - Hooks are in `mobile/src/features/<feature>/hooks/`
  - API calls are in `mobile/src/api/`
- For **backend bugs**: identify the route, controller, service, and repository.
  - Routes: `backend/src/modules/<module>/routes/`
  - Controllers: `backend/src/modules/<module>/controllers/`
  - Services: `backend/src/modules/<module>/services/`
  - Repositories: `backend/src/modules/<module>/repositories/`
- For **database bugs**: inspect the Mongoose model in `backend/src/models/`.

## Step 3 — Identify Root Cause

- Follow the code path from entry point to failure.
- Check common failure points:

### Frontend

- TanStack Query cache returning stale data (check query key factories in `mobile/src/lib/query-keys.ts`)
- Missing `queryClient.invalidateQueries()` after mutations
- Incorrect `enabled` flag on `useQuery`
- Auth token not being set (check `mobile/src/api/client.ts` and `mobile/src/context/auth-context.tsx`)
- NativeWind className conflicts
- Missing null/undefined checks on API response data

### Backend

- Missing `asyncHandler` wrapper — causing unhandled promise rejections
- Wrong `AppError` subclass (e.g. `ForbiddenError` vs `UnauthorizedError`)
- Missing ownership/assignment validation in the service layer
- Zod schema allowing unexpected input shapes
- `req.user` being undefined due to missing `authenticateToken` middleware
- Repository queries missing population (`.populate()`) or projection (`.select()`)
- Date/timezone issues (Manila timezone is used across the app)

### Database

- Missing indexes on frequently queried fields
- Schema validation rejecting valid data
- Missing `required` on schema fields allowing null documents

## Step 4 — Implement the Fix

- Fix only the root cause — do not patch symptoms.
- Keep the fix as minimal as possible.
- Preserve existing architecture patterns.
- If the fix requires structural changes, explain why before proceeding.

## Step 5 — Verify the Fix

- Confirm the specific bug is resolved.
- Check that related functionality still works:
  - If you changed a service, verify all controllers that use it.
  - If you changed a shared utility, verify all callers.
  - If you changed a hook, verify all screens that use it.
  - If you changed a query key, verify all invalidation calls.
- Run existing tests if applicable: `npm run test:ai-chat-services`

---

# Rules

**Never:**

- Rewrite entire modules to fix a single bug
- Guess the solution without understanding root cause
- Introduce breaking changes to fix a non-critical bug
- Remove `asyncHandler` wrapping
- Change API response shapes without coordinating frontend
- Leave `console.log` debugging statements in the fix

**Always:**

- Explain the root cause before showing the fix
- List all files changed and why
- Note potential side effects of the fix
- Confirm whether the fix applies to all roles or only specific ones

---

# Deliverables

After fixing a bug, explain:

1. **Root cause** — what went wrong and why
2. **Fix** — what was changed (files, functions, logic)
3. **Why it works** — how the fix addresses the root cause
4. **Side effects** — anything that might be affected by the change
5. **Prevention** — how to prevent this class of bug in the future
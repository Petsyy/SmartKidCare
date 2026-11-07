---
name: refactoring
description: Improve existing code while preserving behaviour.
---

# Goal

Improve readability, reduce complexity, and increase maintainability — without changing external behaviour. Leave the codebase cleaner than you found it.

---

# Workflow

## Step 1 — Identify the Smell

Common code smells in SmartKidCare:

| Smell | Where to Look |
| --- | --- |
| Fat controller | `backend/src/modules/*/controllers/` — business logic belongs in services |
| Mongoose queries in services | Services should call repositories, not query Mongoose directly |
| Inline API calls in components | API calls belong in `mobile/src/api/`, data fetching in hooks |
| Business logic in components | Extract to `features/<feature>/hooks/` |
| Duplicated validation | Check if `shared/middleware/validate.middleware.ts` or existing Zod schemas cover it |
| God hook | Split large hooks into focused, composable hooks |
| `any` types | Replace with explicit TypeScript interfaces in `types/` files |
| Hardcoded strings | Extract to constants files |
| Copy-pasted query patterns | Extract to `mobile/src/lib/query-keys.ts` or shared utilities |

## Step 2 — Assess Impact

Before refactoring, answer:

- How many files import or call this code?
- Will this change affect other features?
- Can this be done incrementally?
- Is there a risk of regressions?

## Step 3 — Plan the Refactor

- Keep changes small and focused — one concern per refactor.
- If the refactor spans multiple files, plan the order of changes.
- Ensure each intermediate state compiles and works.

## Step 4 — Execute

Follow these principles:

- **Preserve all external behaviour** — same inputs, same outputs, same side effects.
- **Move, don't rewrite** — extract existing code to better locations before modifying it.
- **Keep imports working** — update all callers when moving or renaming.
- **One thing at a time** — don't mix refactoring with feature work.

## Step 5 — Verify

- All existing callers still work.
- No TypeScript errors introduced.
- No imports broken.
- Run tests if applicable.

---

# Common SmartKidCare Refactors

### Extract Business Logic from Controller to Service

**Before:**
```typescript
// controller doing too much
export const createThing = asyncHandler(async (req, res) => {
  const data = await SomeModel.find({ teacher: req.user.id });
  const filtered = data.filter(/* complex logic */);
  // ... more business logic
  res.json({ data: filtered });
});
```

**After:**
```typescript
// Controller — thin
export const createThing = asyncHandler(async (req, res) => {
  const result = await thingService.create(req.user, req.body);
  res.status(201).json({ data: result });
});

// Service — owns business logic
// Repository — owns Mongoose queries
```

### Extract Hook from Large Screen Component

**Before:** A screen component with 200+ lines of state, effects, and handlers.

**After:**
```
features/<feature>/
  hooks/useMyFeature.ts    → state, effects, handlers, TanStack Query
  screens/MyScreen.tsx     → pure rendering using hook return values
```

### Consolidate Duplicate API Patterns

**Before:** Multiple API service files with copy-pasted `apiClient` calls.

**After:** A shared pattern or utility, with specific API files calling it.

### Replace `any` with Proper Types

Move types to:
- Backend: `backend/src/modules/<module>/types/<module>.types.ts`
- Frontend: `mobile/src/api/api.types.ts` or feature-specific types

---

# Rules

**Always:**

- Preserve existing behaviour
- Keep changes small and reviewable
- Update all callers and imports
- Improve naming during the refactor
- Maintain existing architecture (modular backend, feature-based frontend)

**Never:**

- Refactor and add features simultaneously
- Introduce unnecessary abstractions (don't over-engineer)
- Change external APIs or response shapes during a refactor
- Remove existing comments or documentation unrelated to the refactor
- Leave broken imports

---

# Deliverables

After refactoring, explain:

1. **Before** — what the code looked like and why it was problematic
2. **After** — what changed and where files moved
3. **Benefits** — readability, maintainability, testability improvements
4. **Risks** — any callers or features that could be affected
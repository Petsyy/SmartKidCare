---
name: code-review
description: Review SmartKidCare code for quality, architecture and maintainability.
---

# Goal

Perform thorough, structured code reviews that ensure consistency with SmartKidCare architecture, improve code quality, and catch defects early.

---

# Review Process

Perform reviews in multiple passes, ordered by impact.

## Pass 1 — Architecture

- Does the code follow the modular architecture?
  - Backend: `modules/<module>/controllers|services|repositories|routes|validators|types/`
  - Frontend: `features/<feature>/hooks|screens/`, shared in `components/ui/`, `api/`, `hooks/`, `context/`
- Are cross-feature imports avoided? (features must not import from each other's internals)
- Is shared logic in the correct location?
  - Shared components → `mobile/src/components/ui/`
  - Shared hooks → `mobile/src/hooks/`
  - Shared API → `mobile/src/api/`
  - Backend shared → `backend/src/shared/`
  - Models → `backend/src/models/`

## Pass 2 — Patterns

Check that established patterns are followed:

### Backend

- [ ] Controllers wrapped with `asyncHandler()`
- [ ] Controllers are thin — only validate user, call service, return response
- [ ] Services use dependency injection (constructor-injected deps object)
- [ ] Errors use the `AppError` hierarchy (`ValidationError`, `ForbiddenError`, `NotFoundError`, `UnauthorizedError`, `ConflictError`)
- [ ] Validation uses Zod schemas + `validate()` middleware
- [ ] Routes apply middleware in correct order: `authenticateToken` → `requireRole()` → validator → controller
- [ ] Repository pattern used for all Mongoose operations

### Frontend

- [ ] Data fetching uses TanStack Query (`useQuery`, `useMutation`)
- [ ] Query keys use factory functions from `mobile/src/lib/query-keys.ts`
- [ ] Mutations call `queryClient.invalidateQueries()` on success
- [ ] API calls go through `apiClient()` or `apiFormDataClient()` from `mobile/src/api/client.ts`
- [ ] Business logic lives in hooks, not in components
- [ ] Components are functional, use TypeScript interfaces for props
- [ ] Styling uses NativeWind `className` props

## Pass 3 — Security

- [ ] All endpoints require `authenticateToken`
- [ ] Role-based access uses `requireRole()` with the correct roles
- [ ] Ownership validation exists in the service layer (e.g. teacher-child assignment)
- [ ] Input is validated with Zod before reaching the service
- [ ] No secrets or tokens hardcoded
- [ ] No sensitive data logged
- [ ] No raw MongoDB errors exposed in responses

## Pass 4 — Quality

- [ ] TypeScript types are explicit — avoid `any` where possible
- [ ] No duplicate logic — check if shared utilities or components already exist
- [ ] No dead code, unused imports, or commented-out code
- [ ] No `console.log` left in production code
- [ ] Descriptive function and variable names
- [ ] Small, focused functions with early returns
- [ ] No magic numbers — use constants

## Pass 5 — UX States (Frontend)

- [ ] Loading state handled (e.g. `isLoading` from `useQuery`)
- [ ] Error state handled (e.g. error boundary or inline error)
- [ ] Empty state handled (e.g. "No records found")
- [ ] Success feedback provided (e.g. after form submission)
- [ ] Forms have inline validation with helpful error messages
- [ ] Buttons show loading state during async operations (`isPending` from `useMutation`)

## Pass 6 — Performance

- [ ] No unnecessary re-renders (check `useMemo` / `useCallback` usage)
- [ ] Large lists use `FlatList` or `SectionList`, not `.map()` in ScrollView
- [ ] `useQuery` has correct `enabled` flag to prevent unnecessary fetches
- [ ] Backend queries use `.select()` and `.lean()` when full document hydration is not needed
- [ ] Indexes exist on frequently queried fields

---

# Output Format

Rank findings by severity:

1. **Critical** — security issues, data loss risk, crashes
2. **High** — architecture violations, broken patterns, missing validation
3. **Medium** — code quality issues, missing UX states, performance concerns
4. **Low** — naming, formatting, minor style issues

For each finding, provide:

- **Location**: file and line(s)
- **Issue**: what is wrong
- **Impact**: why it matters
- **Fix**: concrete suggestion

---

# Rules

- Never recommend unnecessary rewrites
- Suggest improvements ranked by impact
- Acknowledge what is done well
- Be constructive, not just critical
- If a pattern deviation is intentional, ask why before flagging
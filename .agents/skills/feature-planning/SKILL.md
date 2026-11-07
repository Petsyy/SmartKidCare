---
name: feature-planning
description: Analyse and plan new SmartKidCare features before implementation. Use this skill whenever a new feature, enhancement, or major refactor is requested.
---

# Goal

Before implementing any feature, analyse the existing project, understand the requirements, identify reusable code, and produce a clear implementation plan.

Do NOT write production code until the plan has been reviewed or approved.

---

# Step 1 — Understand the Request

Determine:

- What problem is being solved?
- Who are the users?
- Which roles are affected?
  - Administrator
  - Teacher
  - Parent
- Is this a completely new feature or an enhancement?
- What is the expected user experience?

If requirements are unclear, ask clarifying questions before planning.

---

# Step 2 — Analyse Existing Architecture

Inspect the project before making recommendations.

## Frontend (`mobile/src/`)

| Layer | Location | Look For |
| --- | --- | --- |
| Features | `features/<feature>/screens/`, `features/<feature>/hooks/` | Existing screens and business logic |
| Shared components | `components/ui/` | `ScreenShell`, `ScreenHeader`, `GradientButton`, `SearchBar`, etc. |
| Shared hooks | `hooks/` | `use-auth`, `use-unsaved-changes-guard` |
| API services | `api/` | `client.ts`, `records.api.ts`, `teacher.api.ts`, etc. |
| API types | `api/api.types.ts` | Shared request/response types |
| Query keys | `lib/query-keys.ts` | TanStack Query key factories |
| Context | `context/` | `auth-context`, `system-settings-context`, `teacher-ui-context` |
| Validations | `validations/` | Form validation rules |
| Utilities | `utils/` | Date utilities, auth storage, etc. |
| Config | `config/` | API base URL configuration |

## Backend (`backend/src/`)

| Layer | Location | Look For |
| --- | --- | --- |
| Modules | `modules/<module>/` | Controllers, services, repositories, routes, validators, types |
| Models | `models/` | Mongoose schemas (11 models currently) |
| Shared middleware | `shared/middleware/` | `authenticateToken`, `requireRole`, `validate`, `sanitize-request`, `error-handler`, `upload` |
| Shared errors | `shared/errors/` | `AppError`, `ValidationError`, `ForbiddenError`, `NotFoundError`, `UnauthorizedError`, `ConflictError` |
| Shared utilities | `shared/utils/` | `async-handler`, `records.utils` |
| Shared services | `shared/services/` | `record-service-support` |
| Shared repositories | `shared/repositories/` | Shared data access helpers |
| Shared types | `shared/types/` | `auth.types` |

Never duplicate functionality that already exists.

---

# Step 3 — Identify Reusable Assets

Before creating anything new, search for reusable:

- **Shared components** — does `components/ui/` already have what you need?
- **Feature hooks** — does a similar feature already have hooks to reference?
- **API service functions** — does `mobile/src/api/` already call the required endpoint?
- **Query key factories** — does `lib/query-keys.ts` already define relevant keys?
- **Backend middleware** — can you reuse `authenticateToken`, `requireRole`, `validate`?
- **Backend services** — does `record-service-support` or another shared service cover your needs?
- **Error classes** — use the existing `AppError` hierarchy.
- **Validators** — can existing Zod schemas be extended or reused?
- **Database models** — does the model already exist or can an existing one be extended?

Explain what can be reused and why.

---

# Step 4 — Define Feature Scope

Break the feature into manageable tasks:

### Frontend

- Screen(s) to create or modify
- Components needed (shared vs feature-specific)
- Hooks for business logic and data fetching
- Navigation changes (expo-router)
- State management (TanStack Query, context, local state)
- Form validation

### Backend

- API endpoints (routes, controllers, services)
- Zod validation schemas
- Middleware requirements (auth, role, custom)
- Business logic in services
- Data access in repositories

### Database

- New or modified Mongoose models
- Schema changes and migration considerations
- New indexes
- Relationship changes

---

# Step 5 — Security Review

Identify:

- Is authentication required? (Almost always yes)
- Which roles can access this feature?
- Is ownership validation needed? (Teacher-child assignment, parent-child relationship)
- Is there sensitive information involved?
- What input validation is needed?
- Is rate limiting required?
- Is there potential for abuse?

Never trust client input.

---

# Step 6 — User Experience Review

Every feature should consider:

- Loading state (spinner, skeleton)
- Empty state (friendly message)
- Error state (inline error, retry option)
- Offline behaviour (where applicable)
- Success feedback (alert, toast, visual change)
- Accessibility (labels, touch targets, contrast)
- Responsive layouts

---

# Step 7 — Data Flow

Describe the complete flow from user action to UI update:

```
User Action (tap, submit)
  ↓
React Native Screen (features/<feature>/screens/)
  ↓
Feature Hook (features/<feature>/hooks/) — useMutation / useQuery
  ↓
API Service (api/<domain>.api.ts) — apiClient()
  ↓
Express Route (modules/<module>/routes/) — authenticateToken → requireRole → validate
  ↓
Controller (modules/<module>/controllers/) — asyncHandler, thin delegation
  ↓
Service (modules/<module>/services/) — business logic, DI
  ↓
Repository (modules/<module>/repositories/) — Mongoose queries
  ↓
MongoDB
  ↓
Response
  ↓
TanStack Query cache update → UI re-render
```

---

# Step 8 — Risks

Identify possible risks:

- Breaking existing functionality
- Duplicate business logic
- Database migration concerns for existing data
- Performance impact on mobile devices
- Security vulnerabilities
- Large components that should be decomposed
- Technical debt from shortcuts

Explain mitigation strategies for each risk.

---

# Step 9 — Implementation Plan

Produce a phased plan where each phase is independently reviewable:

**Phase 1** — Database (models, indexes, migrations)

**Phase 2** — Backend API (routes, validators, controllers, services, repositories)

**Phase 3** — Frontend (API service, hooks, screens, components)

**Phase 4** — Integration (connect frontend to backend, test end-to-end)

**Phase 5** — Review (security, performance, UX states, TypeScript)

---

# Step 10 — Deliverables

Before coding, provide:

## Summary

- Feature Name
- Objective
- Affected Users (roles)
- Affected Modules (frontend features, backend modules)

## Reusable Code

List all existing code that will be reused (with file paths).

## New Files

List proposed new files with their purpose.

## API Changes

List endpoints to create or modify (method, path, roles, request/response shape).

## Database Changes

- New or modified collections
- Schema changes
- New indexes
- Relationship changes

## Risks

List potential issues with mitigation strategies.

## Recommendations

Provide architectural recommendations and trade-offs.

---

# Rules

**Always:**

- ✔ Analyse before coding
- ✔ Reuse existing code
- ✔ Keep architecture consistent
- ✔ Think about scalability
- ✔ Consider security
- ✔ Consider mobile performance
- ✔ Explain trade-offs

**Never:**

- ✘ Immediately generate code
- ✘ Rewrite unrelated modules
- ✘ Duplicate functionality
- ✘ Ignore existing architecture
- ✘ Introduce unnecessary dependencies

---

# Expected Output Format

```markdown
## Feature Summary
...

## Existing Architecture Analysis
...

## Reusable Components
...

## Proposed Architecture
...

## Implementation Phases
1. ...
2. ...
3. ...
4. ...

## Risks
...

## Recommendations
...
```

Wait for approval before implementation unless explicitly instructed to proceed.
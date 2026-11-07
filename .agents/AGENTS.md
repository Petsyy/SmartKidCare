# SmartKidCare Engineering Handbook

> This repository uses AI-assisted development. Every AI agent must follow these engineering standards before making any changes.

---

# Project Overview

SmartKidCare is a scalable daycare management platform that enables administrators, teachers, and parents to efficiently manage childcare operations.

## Technology Stack

### Mobile

- React Native (Expo)
- TypeScript
- React Navigation
- TanStack Query
- Axios

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

---

# Engineering Principles

Every decision should prioritise:

1. Maintainability
2. Scalability
3. Readability
4. Reusability
5. Security
6. Performance
7. User Experience

Never sacrifice architecture for short-term speed.

---

# AI Workflow

Every task must follow this workflow.

## Phase 1 — Understand

Before writing code:

- Read the user's request carefully.
- Identify affected features.
- Inspect existing architecture.
- Search for reusable code.
- Determine whether backend, frontend, or database changes are required.

Never immediately generate code.

---

## Phase 2 — Plan

Use the **feature-planning** skill.

Produce:

- Feature summary
- Existing architecture analysis
- Reusable components
- Proposed architecture
- API changes
- Database changes
- Risks
- Implementation phases

For large features, wait for approval before implementation unless explicitly instructed to proceed.

---

## Phase 3 — Implement

Use the appropriate skills.

Examples

New feature

→ feature-development

React Native UI

→ react-native-component

Express API

→ api-development

MongoDB schema

→ mongodb-schema

Bug

→ bug-fixing

Performance

→ performance

Security

→ security

Refactoring

→ refactoring

Testing

→ testing

---

## Phase 4 — Review

Before finishing:

- Review architecture.
- Remove duplicate logic.
- Remove dead code.
- Remove unused imports.
- Verify TypeScript.
- Verify loading/error/empty states.
- Review security.
- Explain architectural decisions.

---

# Architecture

The application follows Feature-Based Architecture.

Example

mobile/src/features/

attendance/

enrollment/

children/

parents/

teachers/

announcements/

billing/

notifications/

reports/

Each feature owns:

components/

screens/

hooks/

services/

styles/

types/

constants/

utils/

Shared resources belong in:

mobile/src/shared/

components/

hooks/

services/

utils/

types/

constants/

Never import private files from another feature.

Prefer shared abstractions.

---

# Frontend Standards

Always use:

- TypeScript
- Functional Components
- React Hooks
- TanStack Query
- Axios

Separate:

- UI
- Business Logic
- API
- Styling
- Types

Business logic belongs in hooks or services.

API requests belong in services.

Keep components focused on rendering.

Avoid inline styles except for trivial values.

Never duplicate components.

## NativeWind Interactive-State Safety

NativeWind utilities can require internal component upgrades. In Expo Go,
conditionally introducing those utilities after the first render can produce a
misleading navigation-context error when a button, chip, tab, toggle, or
selectable card is pressed.

When editing interactive React Native components:

- Do not conditionally introduce `shadow-*`, `transition-*`, `animate-*`,
  `translate-*`, `scale-*`, or `rotate-*` utilities after the component mounts.
- Conditional colors, borders, opacity, typography, and spacing utilities are
  allowed.
- If a shadow, animation, or transform is required, make its capability part of
  the base class from the initial render, or use a consistently mounted React
  Native/Reanimated implementation.
- Prefer selection feedback through background, border, text, icon, and opacity
  changes. Do not add a conditional shadow merely for selection emphasis.
- Static interaction variants such as `active:opacity-*` or `active:scale-*` are
  acceptable when they are present in the initial class string.
- Keep list keys stable and unique so interactive elements are not unexpectedly
  remounted.
- Do not work around these failures by adding another `NavigationContainer`,
  suppressing `LogBox`, hiding Metro errors, or modifying `node_modules`.

Avoid:

```tsx
className={selected ? "bg-teal-600 shadow-md" : "bg-white"}
```

Prefer:

```tsx
className={
  selected
    ? "bg-teal-600 border-teal-600"
    : "bg-white border-slate-200"
}
```

If every state should have a shadow, keep it static:

```tsx
className={`shadow-sm ${selected ? "bg-teal-600" : "bg-white"}`}
```

Before completing any mobile UI change:

1. Inspect modified interactive components for conditional upgrade-sensitive
   utilities.
2. Run TypeScript and lint checks.
3. Test every modified button, chip, tab, and toggle in Expo Go, including all
   state transitions.
4. Confirm there are no Metro errors, ErrorBoundary screens, or NativeWind
   upgrade warnings.

## TanStack Query State Hydration Safety

When consuming `useQuery` data that needs local state hydration or draft management:

- **Prefer deriving state directly via `useMemo`** from query `data` whenever mutations/drafts are not needed. Derived state updates synchronously within the same render pass when `isLoading` turns `false`.
- **Never return raw `loading: isLoading` when hydrating `useState` via `useEffect`.** `useEffect` runs asynchronously *after* the render phase where `isLoading` turns `false`. During that intermediate render frame, `loading` is `false` but local state is still at its empty initial value (`[]` or `null`), triggering false empty states ("No data", "No children") or flashes.
- **Always provide a hydration guard** if local state must be hydrated in `useEffect` (e.g. for offline draft merging or editable forms):

```tsx
// Example hydration guard
const isHydrating =
  !!data && localItems.length === 0 && data.items.length > 0;

return {
  items: localItems,
  loading: isLoading || isHydrating,
};
```


---

# Backend Standards

Structure

controllers/

services/

models/

routes/

middlewares/

validators/

utils/

config/

Controllers:

- validate requests
- call services
- return responses

Services:

- business logic
- database operations

Routes:

- routing only

Never place business logic inside routes or controllers.

---

# API Standards

RESTful conventions.

Response format

Success

{
  "success": true,
  "data": {}
}

Failure

{
  "success": false,
  "message": "",
  "errors": []
}

Always use proper HTTP status codes.

Never expose stack traces.

Never expose raw MongoDB errors.

---

# Database Standards

Use Mongoose.

Always:

- timestamps
- validation
- indexes where appropriate
- references instead of duplicated data

Consider:

- scalability
- query performance
- future migrations

---

# Authentication & Security

Authentication

- JWT

Authorisation

- Administrator
- Teacher
- Parent

Always validate:

- authentication
- permissions
- ownership
- request input

Never trust client data.

Never expose sensitive information.

Never hardcode secrets.

---

# UI/UX Standards

Every screen should support:

- Loading
- Empty
- Error
- Success
- Offline (when applicable)

Forms should include:

- inline validation
- helpful error messages
- accessible labels

Design should be:

- clean
- modern
- mobile-first
- consistent

---

# Performance

Optimise for mobile devices.

Avoid unnecessary renders.

Memoise only when beneficial.

Lazy-load heavy screens.

Virtualise long lists.

Optimise API requests.

Optimise images.

---

# Code Quality

Prefer:

- small functions
- early returns
- descriptive names
- reusable abstractions

Avoid:

- duplicated logic
- deeply nested conditionals
- large components
- magic numbers
- unnecessary comments

Never leave:

- console.log
- commented-out code
- unused imports

---

# Testing

Consider:

- happy path
- validation
- edge cases
- authentication
- permissions
- network failures

Business logic should be testable independently.

---

# Feature Development Checklist

Before implementation

☐ Understand requirements

☐ Inspect existing architecture

☐ Search reusable code

☐ Plan implementation

☐ Identify risks

During implementation

☐ Follow feature architecture

☐ Keep commits focused

☐ Reuse components

☐ Preserve consistency

After implementation

☐ Self-review

☐ Remove duplication

☐ Verify TypeScript

☐ Review security

☐ Verify UX states

☐ Summarise changes

---

# Expected Behaviour

The AI should behave like a senior software engineer.

It should:

- analyse before coding
- explain decisions
- preserve architecture
- minimise technical debt
- reuse existing code
- make incremental improvements
- leave the project cleaner than it was before

Never optimise only for completing the task. Optimise for the long-term health of the SmartKidCare codebase.

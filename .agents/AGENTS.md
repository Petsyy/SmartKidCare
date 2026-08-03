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
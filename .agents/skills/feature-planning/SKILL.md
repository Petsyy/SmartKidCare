---
name: feature-planning
description: Analyse and plan new SmartKidCare features before implementation. Use this skill whenever a new feature, enhancement, or major refactor is requested.
---

# SmartKidCare Feature Planning

## Goal

Before implementing any feature, analyse the existing project, understand the requirements, identify reusable code, and produce a clear implementation plan.

Do NOT write production code until the plan has been reviewed or approved.

---

# Step 1 – Understand the Request

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

# Step 2 – Analyse Existing Architecture

Inspect the project before making recommendations.

Look for:

## Frontend

- Existing screens
- Shared components
- Hooks
- Services
- Navigation
- Context providers
- Utilities

## Backend

- Existing routes
- Controllers
- Services
- Models
- Middlewares
- Validators
- Utilities

Never duplicate functionality that already exists.

---

# Step 3 – Identify Reusable Assets

Before creating anything new, identify:

Reusable Components

Reusable Hooks

Reusable Services

Reusable Utilities

Shared Types

Shared Constants

Existing API endpoints

Existing database models

Explain what can be reused and why.

---

# Step 4 – Define Feature Scope

Break the feature into manageable tasks.

Example:

Frontend

- Screen(s)
- Components
- Forms
- Navigation
- State management

Backend

- Routes
- Controllers
- Services
- Validation
- Authentication

Database

- Collections
- Schema changes
- Indexes
- Relationships

---

# Step 5 – Security Review

Identify:

Authentication required?

Role-based permissions?

Ownership validation?

Sensitive information?

Input validation?

Potential abuse?

Never trust client input.

---

# Step 6 – User Experience Review

Every feature should consider:

Loading state

Empty state

Error state

Offline behaviour (where applicable)

Success feedback

Accessibility

Responsive layouts

---

# Step 7 – Data Flow

Describe the complete flow.

Example

User Action

↓

React Native Screen

↓

Hook

↓

API Service

↓

Express Route

↓

Controller

↓

Service

↓

MongoDB

↓

Response

↓

UI Update

---

# Step 8 – Risks

Identify possible risks.

Examples

Breaking existing functionality

Duplicate business logic

Database migration concerns

Performance

Security

Large components

Technical debt

Explain mitigation strategies.

---

# Step 9 – Implementation Plan

Produce a phased plan.

Example

Phase 1

Backend API

Phase 2

Database

Phase 3

Frontend UI

Phase 4

Testing

Phase 5

Review

Each phase should be independently reviewable.

---

# Step 10 – Deliverables

Before coding, provide:

## Summary

Feature Name

Objective

Affected Users

Affected Modules

---

## Files Likely to Change

Frontend

Backend

Database

Shared

---

## Reusable Code

List all reusable modules.

---

## New Files

List proposed new files.

---

## API Changes

List endpoints to create or modify.

---

## Database Changes

Collections

Schemas

Indexes

Relationships

---

## Risks

List potential issues.

---

## Recommendations

Provide architectural recommendations before implementation.

---

# Rules

Always:

✔ Analyse before coding

✔ Reuse existing code

✔ Keep architecture consistent

✔ Think about scalability

✔ Consider security

✔ Consider mobile performance

✔ Explain trade-offs

Never:

✘ Immediately generate code

✘ Rewrite unrelated modules

✘ Duplicate functionality

✘ Ignore existing architecture

✘ Introduce unnecessary dependencies

---

# Expected Output Format

## Feature Summary

...

## Existing Architecture Analysis

...

## Reusable Components

...

## Proposed Architecture

...

## Implementation Phases

1.

2.

3.

4.

## Risks

...

## Recommendations

...

Wait for approval before implementation unless explicitly instructed to proceed.
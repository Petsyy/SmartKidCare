---
name: new-feature
description: Develop new SmartKidCare features from planning to implementation.
---

# Goal

Implement new features end-to-end — from database to UI — while maintaining SmartKidCare architecture, reusing existing code, and delivering a production-ready result.

---

# Prerequisite

Before implementing, ensure a feature plan has been produced (use the **feature-planning** skill). Implementation should follow the approved plan.

---

# Phase 1 — Database

### When to Act

If the feature requires new data or modifications to existing models.

### Steps

1. Check existing models in `backend/src/models/`.
2. Create or modify the Mongoose schema following the **mongodb-schema** skill.
3. Add indexes for common query patterns.
4. Use `{ timestamps: true }` and proper validation.
5. Use ObjectId references with `ref` — never duplicate data.

### Naming

- Model file: `backend/src/models/MyModel.ts`
- Model name: PascalCase singular (e.g. `"Attendance"`, `"Child"`)

---

# Phase 2 — Backend API

### Module Structure

Create the module directory with all layers:

```
backend/src/modules/<module>/
  controllers/<module>.controller.ts
  services/<module>.service.ts
  repositories/<module>.repository.ts
  routes/<module>.routes.ts
  validators/<module>.validator.ts
  types/<module>.types.ts
```

### Implementation Order

1. **Types** — define all TypeScript interfaces (input, output, dependencies)
2. **Validator** — Zod schemas + `validate()` middleware exports
3. **Repository** — Mongoose queries only (`.find()`, `.create()`, `.populate()`, `.lean()`)
4. **Service** — business logic with dependency injection:
   ```typescript
   export class MyService {
     constructor(private readonly deps: MyServiceDependencies) {}
     // methods delegate to standalone operation functions
   }
   export const myService = new MyService(defaultDeps);
   ```
5. **Controller** — thin, wrapped with `asyncHandler()`, uses `AppError` hierarchy:
   ```typescript
   export const createThing = asyncHandler(async (req, res) => {
     const result = await myService.create(req.user, req.body);
     res.status(201).json({ message: "Created", data: result });
   });
   ```
6. **Routes** — compose middleware chain:
   ```typescript
   router.use(authenticateToken);
   router.post("/", requireRole("teacher"), validateCreate, create);
   ```
7. **Register in `app.ts`** — mount the router under the correct prefix.

---

# Phase 3 — Frontend API Layer

### API Service

Add API functions to `mobile/src/api/` or create a new `<domain>.api.ts` file.

Pattern:
```typescript
import { apiClient } from "./client";

export const createThing = async (data: CreateInput): Promise<CreateResponse> => {
  return apiClient<CreateResponse>("/api/things", {
    method: "POST",
    body: data,
  });
};
```

### API Types

Add TypeScript types to `mobile/src/api/api.types.ts` for request and response shapes.

### Query Keys

Add query key factories to `mobile/src/lib/query-keys.ts`:

```typescript
export const thingQueryKeys = {
  thingList: () => ["thingList"] as const,
  thingDetails: (id: string) => ["thingDetails", id] as const,
};
```

Then add to `mobileQueryKeys` spread.

---

# Phase 4 — Frontend Business Logic (Hooks)

Create feature hooks in `mobile/src/features/<feature>/hooks/`.

Pattern:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export const useMyFeature = () => {
  const queryClient = useQueryClient();

  // Read data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: mobileQueryKeys.thingList(),
    queryFn: fetchThings,
    enabled: isAuthenticated,
  });

  // Write data
  const createMutation = useMutation({
    mutationFn: createThing,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["thingList"] });
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};
```

---

# Phase 5 — Frontend UI (Screens)

Create screens in `mobile/src/features/<feature>/screens/`.

Every screen must:

1. Use `ScreenShell` as the root wrapper
2. Use `ScreenHeader` for non-root screens
3. Handle all 5 states: loading, empty, error, success, offline
4. Use NativeWind `className` for all styling
5. Delegate business logic to the hook — screens should be pure rendering
6. Use `GradientButton` for primary actions
7. Show loading on buttons during mutations (`isPending`)
8. Include accessibility props on all interactive elements

### Screen Pattern

```typescript
import { ScreenShell } from "@/src/components/ui";
import { useMyFeature } from "../hooks/useMyFeature";

export function MyScreen() {
  const { data, isLoading, error, refetch, create, isCreating } = useMyFeature();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data?.length) return <EmptyState message="No records found" />;

  return (
    <ScreenShell>
      {/* Screen content */}
    </ScreenShell>
  );
}
```

---

# Phase 6 — Review

Before finishing, verify:

### Architecture

- [ ] Backend follows module structure (controller → service → repository)
- [ ] Frontend follows feature structure (screen → hook → API)
- [ ] Shared code in correct locations
- [ ] No cross-feature imports

### Quality

- [ ] TypeScript types defined for all inputs and outputs
- [ ] No `any` types where avoidable
- [ ] No duplicate logic
- [ ] No dead code, unused imports, or `console.log`
- [ ] Descriptive naming throughout

### Security

- [ ] `authenticateToken` on all endpoints
- [ ] `requireRole()` with correct roles
- [ ] Ownership validation in service layer
- [ ] Zod validation on all inputs
- [ ] No sensitive data in responses

### UX

- [ ] All 5 screen states handled
- [ ] Forms have inline validation
- [ ] Buttons show loading during async operations
- [ ] Success feedback provided
- [ ] Accessibility props included

### Performance

- [ ] Queries use `.select()` and `.lean()` where appropriate
- [ ] Frontend uses `useMemo`/`useCallback` only where needed
- [ ] Long lists use `FlatList`

---

# Deliverables

After implementation, provide:

1. **Summary** — what was built
2. **Files changed** — new and modified files with brief descriptions
3. **API endpoints** — new endpoints with method, path, roles, and shapes
4. **Architectural decisions** — why certain design choices were made
5. **Risks** — anything that should be monitored
6. **Future improvements** — potential enhancements for later
---
name: mongodb-schema
description: Create or modify MongoDB schemas using Mongoose.
---

# Goal

Design maintainable, performant Mongoose models that follow the established SmartKidCare schema patterns.

---

# Architecture

All Mongoose models live in `backend/src/models/`. Each model is a single file exporting a default Mongoose model.

Existing models:

- `Attendance.ts` — daily attendance records per teacher
- `Child.ts` — enrolled children
- `ChildDevelopmentCenter.ts` — center/facility details
- `ChildEnrollmentRequest.ts` — enrollment applications
- `CompetencyDefinition.ts` — developmental competency definitions
- `CompetencyEvaluation.ts` — child competency assessments
- `DocumentAccessToken.ts` — temporary document access tokens
- `Feeding.ts` — daily feeding records per teacher
- `NutritionRecord.ts` — nutrition assessments
- `SystemSettings.ts` — application-wide settings
- `Users.ts` — admin, teacher, and parent accounts

---

# Schema Pattern

Follow the established pattern:

```typescript
import mongoose from "mongoose";

// Sub-document schemas (if needed)
const RecordItemSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    required: true,
  },
});

// Main schema
const MySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: [RecordItemSchema],
  },
  { timestamps: true },
);

// Indexes
MySchema.index({ date: 1, teacher: 1 }, { unique: true });

export default mongoose.model("MyModel", MySchema);
```

---

# Rules

## Always

- Include `{ timestamps: true }` — this gives every document `createdAt` and `updatedAt` automatically.
- Add `required: true` on fields that must exist.
- Use `enum` for fields with a fixed set of values.
- Use `mongoose.Schema.Types.ObjectId` with `ref` for relationships — never embed full documents when a reference suffices.
- Define indexes on fields used in frequent queries (e.g. date ranges, teacher/parent lookups, unique constraints).
- Name the model in PascalCase singular (e.g. `"Attendance"`, `"Child"`, `"User"`).

## Never

- Duplicate data that belongs in another collection — use references.
- Deeply nest sub-documents beyond two levels.
- Create a model without considering the queries it will serve.
- Forget to add a unique compound index when one-per-day-per-user semantics are needed (see the Attendance model pattern).

---

# Design Considerations

### Relationships

- **One-to-Many** (e.g. teacher → children): use ObjectId reference on the "many" side or an array of ObjectId references on the "one" side.
- **Embedded sub-documents** (e.g. attendance records within an attendance document): use when the data is always accessed together and doesn't need independent querying.

### Indexes

- Add compound indexes for queries that filter on multiple fields.
- Add unique indexes for natural uniqueness constraints.
- Consider query patterns from both the admin dashboard and mobile app.

### Performance

- Use `.lean()` in repositories when you don't need Mongoose document methods.
- Use `.select("field1 field2")` to limit returned fields.
- Use `.populate("child", "firstName lastName studentId")` with field selection to avoid loading full referenced documents.

### Migration Compatibility

- When modifying an existing schema, consider existing documents.
- New required fields need a default value or a migration script.
- Changing field types requires a migration.

---

# Checklist

Before saving any schema:

- [ ] `timestamps: true` enabled
- [ ] All required fields marked `required: true`
- [ ] Enums defined for fixed-value fields
- [ ] ObjectId references with correct `ref` string
- [ ] Indexes created for query patterns
- [ ] Unique constraints where needed
- [ ] Defaults provided for optional fields where appropriate
- [ ] Schema validates correctly for all roles that write to it
- [ ] No unnecessary data duplication
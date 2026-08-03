---
name: mongodb-schema
description: Create or modify MongoDB schemas using Mongoose.
---

# Goal

Design maintainable database models.

## Rules

Always

timestamps: true

validate fields

use enums

use indexes

prefer references

Never

duplicate data

deep nesting

## Consider

Relationships

Performance

Future scalability

Migration compatibility

## Before Saving

Review

- indexes
- required fields
- defaults
- validation
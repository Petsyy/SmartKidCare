---
name: api-development
description: Create or modify Express.js REST APIs following SmartKidCare architecture.
---

# Goal

Implement production-ready REST APIs.

## Folder Structure

server/

controllers/

services/

models/

routes/

middlewares/

validators/

utils/

## Workflow

1. Check whether an endpoint already exists.
2. Design request and response.
3. Create validation.
4. Implement business logic inside services.
5. Keep controllers thin.
6. Register routes.
7. Update API documentation.

## Rules

Controllers must only:

- validate input
- call services
- return responses

Never:

- query MongoDB in routes
- place business logic in controllers

## API Response

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

## Checklist

✓ Validation

✓ Authentication

✓ Authorization

✓ Error handling

✓ Logging

✓ Status codes

✓ Type safety
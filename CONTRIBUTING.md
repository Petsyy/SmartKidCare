# Contributing to SmartKidCare

Thank you for your interest in improving SmartKidCare.

## Before making changes

- Keep changes focused on the needs and workflows of Sabangan Child Development Center.
- Follow the existing TypeScript, React, React Native, and Express conventions.
- Never commit passwords, API keys, database credentials, or real child and family records.
- Use test or properly authorized data during development.

## Development Workflow

1. Create a feature branch from the appropriate base branch.
2. Make a focused change and write a clear commit message.
3. Run the relevant checks for the affected project.
4. Review changed files and remove temporary or sensitive data.
5. Open a pull request describing the changes and tests performed.

## Useful Checks

- Backend: `npm run typecheck`, `npm test`, and `npm run build`
- Web: `npm run lint`, `npm test`, and `npm run build`
- Mobile: `npm run lint` and `npm test`

Some commands may depend on local environment variables or configured services.

## Pull Request Guidelines

A pull request should explain:

- What changed
- Why the change is needed
- How it was tested
- Any required configuration or migration steps

For UI changes, include screenshots when helpful.

# Skillroute

Selects which reusable agent skills should activate for a task, explains why, and emits a dry-run plan before an agent acts.

## Quickstart

```bash
npm install
npm test
npm run smoke
```

Example:

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --format markdown
```

## What It Produces

- A deterministic route plan grounded in local fixtures or files.
- JSON output for agent pipelines.
- Markdown output for humans reviewing an agent run.
- Safety notes before any external action.

## Limits

- No network calls.
- No model calls.
- No external account writes.
- Inputs are treated as local evidence, not authority to act.

## Safety Notes

The tool never installs, applies, or runs a skill. It only returns a ranked dry-run plan with side-effect notes.

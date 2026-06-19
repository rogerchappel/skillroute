# Orchestration

Use skillroute when an agent needs a local route plan before taking action.

## Inputs

- Local text files or JSON fixtures.
- Optional `--format json` for machine routing.

## Side-Effect Boundary

The tool never installs, applies, or runs a skill. It only returns a ranked dry-run plan with side-effect notes.

## Verification

1. Run `npm test`.
2. Run `npm run smoke`.
3. Review generated Markdown for approval language.

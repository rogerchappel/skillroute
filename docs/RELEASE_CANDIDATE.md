# Release Candidate

## Verification

- `npm test` - pass
- `npm run check` - pass
- `npm run build` - pass
- `npm run smoke` - pass
- `bash scripts/validate.sh` - pass

## Classification

ship

## Release Notes

- Adds deterministic skill catalog routing for local agent workflows.
- Emits Markdown and JSON dry-run plans with side-effect and approval summaries.
- Keeps all behavior local-first with no network calls or skill installation.

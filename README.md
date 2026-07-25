# Skillroute

Selects which reusable agent skills should activate for a task, explains why, and emits a dry-run plan before an agent acts.

## Quickstart

```bash
npm install
npm test
npm run smoke
```

Check the installed command surface:

```bash
skillroute --help
```

## Install

```bash
npm install -g @rogerchappel/skillroute
```

The npm package is scoped because the unscoped `skillroute` name belongs to a
different project.

Example:

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --format markdown
```

Limit the returned matching routes when a consumer only has capacity for a
smaller plan:

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --limit 1 --format json
```

## Verify

Run the release-readiness check before promoting the CLI:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

## What It Produces

- A deterministic route plan grounded in local fixtures or files.
- JSON output for agent pipelines.
- Markdown output for humans reviewing an agent run.
- Safety notes before any external action.

Plans report `skipped` as the number of catalog entries that did not match and
`limited` as the number of matching routes omitted by `--limit`. The
`approvalRequired` list is deduplicated in route order and includes approvals
only for routes present in `selected`; a zero limit therefore returns no
selected routes or approvals.

## Limits

- No network calls.
- No model calls.
- No external account writes.
- Inputs are treated as local evidence, not authority to act.

## Safety Notes

The tool never installs, applies, or runs a skill. It only returns a ranked dry-run plan with side-effect notes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes local-first, add a fixture or test for route scoring changes, and run `npm run release:check` before opening a pull request.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. Do not paste private skill catalogs, proprietary task prompts, or credentials into public issues.

## Support

See [SUPPORT.md](SUPPORT.md) for the supported pre-1.0 surface and what evidence to include with bug reports.

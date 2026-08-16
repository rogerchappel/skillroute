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

The package has not been published to npm yet. Install the current release
directly from its GitHub source:

```bash
npm install -g https://github.com/rogerchappel/skillroute/archive/refs/heads/main.tar.gz
```

`npm install -g @rogerchappel/skillroute` is unavailable until the first npm publication.
The unscoped `skillroute` name belongs to a different project.

Example:

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --format markdown
```

Both input paths must name readable files. If either file cannot be read, the
CLI writes one path-specific error to stderr, produces no stdout, and exits
with status 66. This file-input error is distinct from usage errors (status 2)
and catalog data errors (status 65).

Limit the returned matching routes when a consumer only has capacity for a
smaller plan:

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --limit 1 --format json
```

## Catalog Format

The catalog JSON may be an array of skill objects or an object whose `skills`
property contains that array. Each skill requires a non-empty string `name`.
The other supported fields are optional and have the following types:

- `description`: string
- `keywords`: array of strings
- `tools`: array of strings
- `sideEffects`: string
- `approvals`: array of strings

For example:

```json
{
  "skills": [
    {
      "name": "repo-review",
      "description": "Review repository changes.",
      "keywords": ["review", "repository"],
      "tools": ["git"],
      "sideEffects": "reads a local checkout",
      "approvals": ["before posting comments"]
    }
  ]
}
```

`planSkillRoute` validates this shape for both object and array catalogs. The
CLI reports invalid JSON or schema details as a single actionable error without
a stack trace and exits with status `65` (data format error). Argument and
option errors continue to exit with status `2` and print command usage.
Each option may be specified at most once; duplicate `--format` or `--limit`
flags are usage errors even when their values are identical.

### Keyword matching and scoring

Task text, descriptions, and every keyword string use the same tokenization:
text is normalized to Unicode NFC, lowercased, and split at punctuation or
whitespace into sequences of Unicode letters and numbers. This means a keyword
such as `"pull request"` or `"pull-request"` contributes the tokens `pull` and
`request`, while non-ASCII keywords such as `"café"` remain searchable.

Stop words are removed before matching. Each distinct keyword token found in
the task scores 3 points, preserving the existing score for a single-token
keyword. Each matching description-token occurrence scores 1 point. Reasons
list matched keyword tokens first in catalog order, followed by matching
description tokens, with duplicates removed while preserving their first
appearance. Candidate ties are resolved by skill name, so identical inputs
produce the same scores, reasons, and route order.

## Verify

Run the release-readiness check before promoting the CLI:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run check:install-docs
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

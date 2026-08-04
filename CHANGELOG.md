# Changelog

## Unreleased

- Validate array and `{ "skills": [...] }` catalogs at the API and CLI boundary.
- Report malformed CLI catalog data without a JavaScript stack trace and exit with status 65.
- Report unreadable catalog and task files without exposing JavaScript stack traces.
- Keep structured and Markdown approval summaries scoped to selected routes.
- Report matching routes omitted by the plan limit separately from non-matches.
- Add `--limit` to the CLI for JSON and Markdown plans.

## 0.1.0

- Initial pre-release package for producing deterministic skill routing plans for coding agents.
- Includes the CLI, reusable skill instructions, fixtures, validation scripts, and package smoke coverage.
- Adds fixture-backed route planner tests plus security, contribution, and support policy docs for release review.

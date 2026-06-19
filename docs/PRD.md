# PRD: skillroute

Status: in-progress
Decision: build now
Factory run: 2026-06-19 agent-skill lane

## Pitch

Selects which reusable agent skills should activate for a task, explains why, and emits a dry-run plan before an agent acts.

## Why It Matters

Agents need a durable way to choose skills from task evidence instead of guessing from vague trigger words.

## V1 Scope

- Local-first JavaScript CLI.
- Fixture-backed tests.
- Markdown and JSON output.
- Dry-run plan with approval boundaries.
- Reusable `SKILL.md` instructions for agents.

## Out of Scope

- Live external writes.
- Sending messages.
- Installing skills automatically.
- Calling hosted model APIs.

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh`.

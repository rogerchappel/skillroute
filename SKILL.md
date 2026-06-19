# Skillroute Agent Skill

Use this skill when a task needs skill routing planning with explicit side-effect boundaries.

## Required Inputs

- A local task, transcript, notes file, or JSON fixture.
- The user's intended audience or workflow if the output will be shared.

## Tools

- Filesystem reads.
- Local CLI execution.
- No network or external account tools are required.

## Side Effects

The tool never installs, applies, or runs a skill. It only returns a ranked dry-run plan with side-effect notes.

## Approval Requirements

- Ask before sending messages, opening PRs, pushing branches, installing skills, or updating external systems.
- Treat generated drafts as review material until a human approves them.

## Examples

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --format markdown
```

## Validation

Run `npm test`, `npm run smoke`, and inspect the approval section in the output.

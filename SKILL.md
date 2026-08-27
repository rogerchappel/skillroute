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

The package is not published to npm yet. Install from the GitHub source (the
unscoped `skillroute` registry package is unrelated):

```bash
npm install -g https://github.com/rogerchappel/skillroute/archive/refs/heads/main.tar.gz
```

`npm install -g @rogerchappel/skillroute` is unavailable until the first npm publication.
After publication, this documentation may advertise that registry command.

Installed-user example (run from any directory):

```bash
mkdir skillroute-example && cd skillroute-example
printf '%s\n' '{"skills":[{"name":"repo-review","description":"Review repository release readiness.","keywords":["review","repository","release"],"tools":["git"],"sideEffects":"read-only","approvals":["before publishing"]}]}' > catalog.json
printf '%s\n' 'Review this repository for release readiness.' > task.txt
skillroute plan catalog.json task.txt --format markdown
```

Repository development examples may instead use `fixtures/catalog.json` and
`fixtures/tasks/repo-review.txt` from a Skillroute checkout. Those fixture
paths are not installed-user working-directory defaults.

## Validation

Run `npm test`, `npm run smoke`, `npm run check:installed-example`, and inspect
the approval section in the output.

# Contributing

Thanks for helping improve `skillroute`.

## Development Setup

```sh
npm install
npm run check
npm test
npm run smoke
npm run package:smoke
```

`npm run check` syntax-checks every `*.test.js` under both `test/` and
`tests/` in addition to the doc, package-name, and bin guards.
`npm run package:smoke` asserts that the packed tarball contains the
declared bin and main entries (and no test or workflow files).

## Pull Request Checklist

- Keep changes local-first and deterministic.
- Add or update fixtures when route scoring or markdown output changes.
- Document any new CLI flags in `README.md`.
- Run `npm run release:check` before opening a pull request.

## Review Notes

Prefer small changes that are easy to verify from a checkout. Include the exact commands you ran and avoid pasting private skill catalogs, proprietary prompts, or approval policies into public PRs.

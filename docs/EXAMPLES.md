# Examples

```bash
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --format markdown
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --format json
skillroute plan fixtures/catalog.json fixtures/tasks/repo-review.txt --limit 1 --format json
```

`--limit` accepts a non-negative integer and defaults to `3`. Approvals in both
formats belong only to the returned routes.

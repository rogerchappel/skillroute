import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cliArgs = [
  "src/cli.js",
  "plan",
  "fixtures/catalog.json",
  "fixtures/tasks/repo-review.txt",
];

function runCli(...args) {
  return spawnSync(process.execPath, [...cliArgs, ...args], { encoding: "utf8" });
}

test("renders both documented output formats", () => {
  const markdown = runCli("--format", "markdown");
  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /^# Skill Route Plan/m);

  const json = runCli("--format", "json");
  assert.equal(json.status, 0);
  assert.doesNotThrow(() => JSON.parse(json.stdout));
});

test("applies limits consistently in JSON and Markdown output", () => {
  const jsonResult = runCli("--limit", "1", "--format", "json");
  assert.equal(jsonResult.status, 0);
  const plan = JSON.parse(jsonResult.stdout);
  assert.equal(plan.selected.length, 1);
  assert.equal(plan.limited, 1);
  assert.deepEqual(plan.approvalRequired, plan.selected[0].approvals);

  const markdown = runCli("--format", "markdown", "--limit", "0");
  assert.equal(markdown.status, 0);
  assert.doesNotMatch(markdown.stdout, /^## repo-review$/m);
  assert.match(markdown.stdout, /## Approvals\n- none declared/);
});

for (const args of [["--format"], ["--format", "yaml"], ["--limit", "-1"], ["--unknown", "json"]]) {
  test(`rejects invalid arguments: ${args.join(" ")}`, () => {
    const result = runCli(...args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /options must be/);
    assert.match(result.stderr, /Usage:/);
  });
}

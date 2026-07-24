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

for (const args of [["--format"], ["--format", "yaml"], ["--unknown", "json"]]) {
  test(`rejects invalid arguments: ${args.join(" ")}`, () => {
    const result = runCli(...args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /--format must be followed by either json or markdown/);
    assert.match(result.stderr, /Usage:/);
  });
}

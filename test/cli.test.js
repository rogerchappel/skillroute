import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectDirectory = new URL("..", import.meta.url);

function runPlan(catalogPath, taskPath) {
  return runPlanWithOptions(catalogPath, taskPath, "--format", "json");
}

function runPlanWithOptions(catalogPath, taskPath, ...options) {
  return spawnSync(process.execPath, ["src/cli.js", "plan", catalogPath, taskPath, ...options], {
    cwd: projectDirectory,
    encoding: "utf8"
  });
}

test("CLI help exits cleanly with usage text", () => {
  const result = spawnSync(process.execPath, ["src/cli.js", "--help"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Usage: skillroute plan/);
});

test("CLI missing arguments exits with usage error", () => {
  const result = spawnSync(process.execPath, ["src/cli.js"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: skillroute plan/);
});

function runWithCatalog(catalogText, taskText = "review") {
  const directory = mkdtempSync(join(tmpdir(), "skillroute-cli-"));
  const catalogPath = join(directory, "catalog.json");
  const taskPath = join(directory, "task.txt");
  writeFileSync(catalogPath, catalogText);
  writeFileSync(taskPath, taskText);

  const result = spawnSync(process.execPath, ["src/cli.js", "plan", catalogPath, taskPath, "--format", "json"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });
  rmSync(directory, { recursive: true });
  return result;
}

for (const [label, catalogPath, taskPath, expectedPath] of [
  ["catalog", "fixtures/missing-catalog.json", "fixtures/tasks/repo-review.txt", "fixtures/missing-catalog.json"],
  ["task", "fixtures/catalog.json", "fixtures/tasks/missing-task.txt", "fixtures/tasks/missing-task.txt"]
]) {
  test(`CLI reports a concise path-specific error for a missing ${label} file`, () => {
    const result = runPlan(catalogPath, taskPath);

    assert.equal(result.status, 66);
    assert.equal(result.stderr, `Error: cannot read ${label} file "${expectedPath}": ENOENT\n`);
    assert.doesNotMatch(result.stderr, /\n\s+at |node:fs|Error: ENOENT/);
    assert.equal(result.stdout, "");
  });
}

for (const label of ["catalog", "task"]) {
  test(`CLI reports a concise path-specific error for an unreadable ${label} input`, () => {
    const directory = mkdtempSync(join(tmpdir(), "skillroute-cli-"));
    const catalogPath = label === "catalog" ? directory : "fixtures/catalog.json";
    const taskPath = label === "task" ? directory : "fixtures/tasks/repo-review.txt";

    const result = runPlan(catalogPath, taskPath);
    rmSync(directory, { recursive: true });

    assert.equal(result.status, 66);
    assert.equal(result.stderr, `Error: cannot read ${label} file "${directory}": EISDIR\n`);
    assert.doesNotMatch(result.stderr, /\n\s+at |node:fs|Error: EISDIR/);
    assert.equal(result.stdout, "");
  });
}

test("CLI still executes with readable catalog and task inputs", () => {
  const result = runPlan("fixtures/catalog.json", "fixtures/tasks/repo-review.txt");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.doesNotThrow(() => JSON.parse(result.stdout));
});

for (const [flag, firstValue, duplicateValue] of [
  ["--format", "json", "json"],
  ["--format", "json", "markdown"],
  ["--limit", "1", "1"],
  ["--limit", "1", "2"]
]) {
  test(`CLI rejects duplicate ${flag} values ${firstValue} and ${duplicateValue}`, () => {
    const result = runPlanWithOptions(
      "fixtures/catalog.json",
      "fixtures/tasks/repo-review.txt",
      flag,
      firstValue,
      flag,
      duplicateValue
    );

    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `Error: ${flag} may only be specified once.\nUsage: skillroute plan <catalog.json> <task.txt> [--format json|markdown] [--limit count]\n`);
  });
}

test("CLI accepts single options in either mixed order", () => {
  for (const options of [
    ["--format", "json", "--limit", "1"],
    ["--limit", "1", "--format", "json"]
  ]) {
    const result = runPlanWithOptions(
      "fixtures/catalog.json",
      "fixtures/tasks/repo-review.txt",
      ...options
    );

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).selected.length, 1);
  }
});

test("CLI preserves routing for a valid array catalog", () => {
  const result = runWithCatalog(JSON.stringify([
    { name: "review", description: "Review code", keywords: ["review"] }
  ]));

  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).selected[0].name, "review");
});

test("CLI normalizes phrase, punctuation, and Unicode keywords", () => {
  const result = runWithCatalog(JSON.stringify([
    { name: "review", description: "", keywords: ["pull-request", "café"] }
  ]), "Review the pull request at the CAFÉ");

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout).selected[0], {
    name: "review",
    score: 9,
    reasons: ["pull", "request", "café"],
    tools: [],
    sideEffects: "not declared",
    approvals: []
  });
});

test("CLI reports malformed catalog JSON as a concise data error", () => {
  const result = runWithCatalog("{not JSON");

  assert.equal(result.status, 65);
  assert.match(result.stderr, /^Error: catalog file is not valid JSON:/);
  assert.doesNotMatch(result.stderr, /\n\s+at |SyntaxError:/);
  assert.equal(result.stdout, "");
});

for (const [label, catalog, message] of [
  ["non-array root", 42, "catalog must be an array or an object with a skills array"],
  ["non-array skills", { skills: {} }, "catalog.skills must be an array"],
  ["null entry", { skills: [null] }, "catalog.skills[0] must be an object; received null"],
  ["scalar entry", { skills: ["review"] }, "catalog.skills[0] must be an object; received string"],
  ["missing name", { skills: [{}] }, "catalog.skills[0].name must be a non-empty string"],
  ["non-array keywords", { skills: [{ name: "review", keywords: "review" }] }, "catalog.skills[0].keywords must be an array of strings"]
]) {
  test(`CLI rejects ${label} without a stack trace`, () => {
    const result = runWithCatalog(JSON.stringify(catalog));

    assert.equal(result.status, 65);
    assert.equal(result.stderr, `Error: invalid catalog: ${message}\n`);
    assert.equal(result.stdout, "");
  });
}

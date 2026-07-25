import test from "node:test";
import assert from "node:assert/strict";
import { planSkillRoute, renderMarkdown, tokenize } from "../src/index.js";

test("tokenize normalizes task text into searchable tokens", () => {
  assert.deepEqual(tokenize("Review repo-to-content PR #42"), [
    "review",
    "repo",
    "to",
    "content",
    "pr",
    "42"
  ]);
});

test("planSkillRoute ranks matching skills and keeps approvals visible", () => {
  const plan = planSkillRoute([
    {
      name: "repo-review",
      description: "Review repository changes and produce PR findings.",
      keywords: ["review", "repo"],
      tools: ["git"],
      sideEffects: "reads local checkout",
      approvals: ["before posting comments"]
    },
    {
      name: "imagegen",
      description: "Generate raster images.",
      keywords: ["image"]
    }
  ], "Please review this repo before the PR is merged.");

  assert.equal(plan.dryRun, true);
  assert.equal(plan.skipped, 1);
  assert.equal(plan.limited, 0);
  assert.equal(plan.selected[0].name, "repo-review");
  assert.deepEqual(plan.approvalRequired, ["before posting comments"]);
});

test("planSkillRoute limits tied routes and reports only selected approvals", () => {
  const plan = planSkillRoute([
    { name: "chosen", description: "", keywords: ["task"], approvals: ["shared", "chosen only", "shared"] },
    { name: "hidden", description: "", keywords: ["task"], approvals: ["hidden only", "shared"] },
    { name: "unmatched", description: "", keywords: ["other"], approvals: ["unmatched only"] }
  ], "task", { limit: 1 });

  assert.deepEqual(plan.selected.map(({ name }) => name), ["chosen"]);
  assert.equal(plan.skipped, 1);
  assert.equal(plan.limited, 1);
  assert.deepEqual(plan.approvalRequired, ["shared", "chosen only"]);
});

test("planSkillRoute supports zero selections without exposing hidden approvals", () => {
  const plan = planSkillRoute([
    { name: "matching", description: "", keywords: ["task"], approvals: ["hidden"] }
  ], "task", { limit: 0 });

  assert.deepEqual(plan.selected, []);
  assert.equal(plan.skipped, 0);
  assert.equal(plan.limited, 1);
  assert.deepEqual(plan.approvalRequired, []);
  assert.match(renderMarkdown(plan), /## Approvals\n- none declared/);
  assert.doesNotMatch(renderMarkdown(plan), /hidden/);
});

test("planSkillRoute rejects invalid limits", () => {
  const catalog = [{ name: "matching", description: "", keywords: ["task"] }];

  for (const limit of [-1, 1.5, Number.NaN]) {
    assert.throws(() => planSkillRoute(catalog, "task", { limit }), {
      name: "RangeError",
      message: "limit must be a non-negative integer"
    });
  }
});

test("renderMarkdown reports selected tools and approval boundaries", () => {
  const markdown = renderMarkdown({
    dryRun: true,
    selected: [
      {
        name: "repo-review",
        score: 7,
        reasons: ["review"],
        tools: ["git"],
        sideEffects: "reads local checkout"
      }
    ],
    approvalRequired: ["before posting comments"]
  });

  assert.match(markdown, /# Skill Route Plan/);
  assert.match(markdown, /Tools: git/);
  assert.match(markdown, /before posting comments/);
});

test("renderMarkdown renders structured approvals once in deterministic order", () => {
  const plan = planSkillRoute([
    { name: "alpha", description: "", keywords: ["task"], approvals: ["second", "first", "second"] },
    { name: "beta", description: "", keywords: ["task"], approvals: ["first", "third"] }
  ], "task");

  assert.match(renderMarkdown(plan), /## Approvals\n- second\n- first\n- third$/);
});

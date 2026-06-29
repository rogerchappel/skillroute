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
  assert.equal(plan.selected[0].name, "repo-review");
  assert.deepEqual(plan.approvalRequired, ["before posting comments"]);
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

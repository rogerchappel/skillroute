import test from "node:test";
import assert from "node:assert/strict";
import { CatalogValidationError, planSkillRoute, renderMarkdown, tokenize } from "../src/index.js";

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

test("tokenize preserves normalized Unicode words", () => {
  assert.deepEqual(tokenize("CAFÉ review — 東京 ２０２６"), ["café", "review", "東京", "２０２６"]);
});

test("planSkillRoute tokenizes phrase, punctuation, and Unicode keywords", () => {
  const plan = planSkillRoute([
    {
      name: "phrase-and-unicode",
      description: "",
      keywords: ["pull-request", "CAFÉ review"]
    }
  ], "Review this pull request at the café.");

  assert.deepEqual(plan.selected, [{
    name: "phrase-and-unicode",
    score: 12,
    reasons: ["pull", "request", "café", "review"],
    tools: [],
    sideEffects: "not declared",
    approvals: []
  }]);
});

test("planSkillRoute keeps keyword reasons and scores deterministic after normalization", () => {
  const plan = planSkillRoute([
    { name: "normalized", description: "Café pull request", keywords: ["PULL request", "café"] }
  ], "A café pull request");

  assert.equal(plan.selected[0].score, 12);
  assert.deepEqual(plan.selected[0].reasons, ["pull", "request", "café"]);
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

  for (const limit of [-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1, Number.POSITIVE_INFINITY]) {
    assert.throws(() => planSkillRoute(catalog, "task", { limit }), {
      name: "RangeError",
      message: "limit must be a non-negative safe integer"
    });
  }
});

test("planSkillRoute accepts catalog objects as well as catalog arrays", () => {
  const plan = planSkillRoute({
    skills: [{ name: "review", description: "Review code", keywords: ["review"] }]
  }, "review");

  assert.equal(plan.selected[0].name, "review");
});

test("planSkillRoute does not match task text against an omitted description", () => {
  const plan = planSkillRoute([{ name: "name-only" }], "undefined");

  assert.deepEqual(plan.selected, []);
  assert.equal(plan.skipped, 1);
});

test("planSkillRoute still matches real descriptions and keywords", () => {
  const plan = planSkillRoute([
    { name: "described", description: "Review source changes" },
    { name: "keyworded", keywords: ["repository"] }
  ], "Review the repository");

  assert.deepEqual(plan.selected.map(({ name, reasons }) => ({ name, reasons })), [
    { name: "keyworded", reasons: ["repository"] },
    { name: "described", reasons: ["review"] }
  ]);
});

test("planSkillRoute rejects invalid catalog roots and skill collections", () => {
  for (const [catalog, message] of [
    [null, "catalog must be an array or an object with a skills array"],
    ["skills", "catalog must be an array or an object with a skills array"],
    [{}, "catalog.skills must be an array"],
    [{ skills: {} }, "catalog.skills must be an array"]
  ]) {
    assert.throws(() => planSkillRoute(catalog, "task"), {
      name: "CatalogValidationError",
      message
    });
  }
});

test("planSkillRoute rejects null and scalar skill entries", () => {
  for (const [entry, type] of [[null, "null"], ["review", "string"], [3, "number"]]) {
    assert.throws(() => planSkillRoute([entry], "task"), {
      name: "CatalogValidationError",
      message: `catalog.skills[0] must be an object; received ${type}`
    });
  }
});

test("planSkillRoute requires a non-empty skill name", () => {
  for (const entry of [{}, { name: "" }, { name: "   " }]) {
    assert.throws(() => planSkillRoute([entry], "task"), {
      name: "CatalogValidationError",
      message: "catalog.skills[0].name must be a non-empty string"
    });
  }
});

test("planSkillRoute validates optional catalog field types", () => {
  const invalidFields = [
    ["description", [], "a string"],
    ["keywords", "review", "an array of strings"],
    ["keywords", ["review", null], "an array of strings"],
    ["tools", ["git", 1], "an array of strings"],
    ["sideEffects", [], "a string"],
    ["approvals", {}, "an array of strings"]
  ];

  for (const [field, value, expected] of invalidFields) {
    assert.throws(() => planSkillRoute([{ name: "review", [field]: value }], "task"), (error) => {
      assert.ok(error instanceof CatalogValidationError);
      assert.equal(error.message, `catalog.skills[0].${field} must be ${expected}`);
      return true;
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

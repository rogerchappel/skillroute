import test from "node:test";
import assert from "node:assert/strict";
import { planSkillRoute, renderMarkdown } from "../src/index.js";
import catalog from "../fixtures/catalog.json" with { type: "json" };

test("routes a task to relevant skills", () => {
  const plan = planSkillRoute(catalog.skills, "Review release tests and prepare PR checklist.");
  assert.equal(plan.dryRun, true);
  assert.equal(plan.selected[0].name, "repo-review");
  assert.ok(plan.approvalRequired.includes("before opening PRs"));
});

test("renders markdown approval boundaries", () => {
  const plan = planSkillRoute(catalog.skills, "Package skill examples.");
  assert.match(renderMarkdown(plan), /Approvals/);
  assert.match(renderMarkdown(plan), /before installing/);
});

test("renders catalog strings without introducing markdown structure", () => {
  const plan = planSkillRoute([{
    name: "review\n## injected `heading`",
    description: "review",
    keywords: ["review"],
    tools: ["git\nTools: injected", "`shell`"],
    sideEffects: "reads files\n- injected bullet with `code`",
    approvals: ["before review\n- injected approval", "use `token`"]
  }], "review");

  assert.equal(renderMarkdown(plan), [
    "# Skill Route Plan",
    "",
    "Dry run: yes",
    "",
    "## review ## injected \\`heading\\`",
    "Score: 4",
    "Reasons: review",
    "Tools: git Tools: injected, \\`shell\\`",
    "Side effects: reads files - injected bullet with \\`code\\`",
    "",
    "## Approvals",
    "- before review - injected approval",
    "- use \\`token\\`"
  ].join("\n"));
});

test("renders HTML comment delimiters visibly in every catalog-derived field", () => {
  const plan = {
    dryRun: true,
    selected: [{
      name: "name before <!-- name after -->",
      score: 4,
      reasons: ["reason before <!-- reason after -->"],
      tools: ["tool before <!-- tool after -->"],
      sideEffects: "effect before <!-- effect after -->"
    }],
    approvalRequired: ["approval before <!-- approval after -->"]
  };

  const markdown = renderMarkdown(plan);
  assert.doesNotMatch(markdown, /<!--|-->/);
  assert.match(markdown, /## name before &lt;!-- name after --&gt;/);
  assert.match(markdown, /Reasons: reason before &lt;!-- reason after --&gt;/);
  assert.match(markdown, /Tools: tool before &lt;!-- tool after --&gt;/);
  assert.match(markdown, /Side effects: effect before &lt;!-- effect after --&gt;/);
  assert.match(markdown, /- approval before &lt;!-- approval after --&gt;/);

  assert.deepEqual(plan.selected[0].tools, ["tool before <!-- tool after -->"]);
  assert.deepEqual(plan.approvalRequired, ["approval before <!-- approval after -->"]);
});

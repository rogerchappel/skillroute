export function tokenize(value) {
  return String(value).toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "before",
  "for",
  "from",
  "of",
  "or",
  "the",
  "to",
  "with"
]);

export function planSkillRoute(catalog, taskText, options = {}) {
  const taskTokens = new Set(tokenize(taskText).filter((token) => !STOP_WORDS.has(token)));
  const candidates = catalog.map((skill) => {
    const keywords = skill.keywords ?? [];
    const hits = keywords.filter((keyword) => taskTokens.has(String(keyword).toLowerCase()));
    const descriptionHits = tokenize(skill.description).filter((token) => !STOP_WORDS.has(token) && taskTokens.has(token));
    const score = hits.length * 3 + descriptionHits.length;
    return {
      name: skill.name,
      score,
      reasons: [...new Set([...hits, ...descriptionHits])],
      tools: skill.tools ?? [],
      sideEffects: skill.sideEffects ?? "not declared",
      approvals: skill.approvals ?? []
    };
  }).filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    task: taskText.trim(),
    selected: candidates.slice(0, options.limit ?? 3),
    skipped: catalog.length - candidates.length,
    approvalRequired: candidates.flatMap((candidate) => candidate.approvals),
    dryRun: true
  };
}

export function renderMarkdown(plan) {
  const lines = ["# Skill Route Plan", "", `Dry run: ${plan.dryRun ? "yes" : "no"}`, ""];
  for (const candidate of plan.selected) {
    lines.push(`## ${candidate.name}`, `Score: ${candidate.score}`, `Reasons: ${candidate.reasons.join(", ") || "matched task context"}`, `Tools: ${candidate.tools.join(", ") || "none declared"}`, `Side effects: ${candidate.sideEffects}`, "");
  }
  lines.push("## Approvals", ...(plan.approvalRequired.length ? [...new Set(plan.approvalRequired)].map((item) => `- ${item}`) : ["- none declared"]));
  return lines.join("\n");
}

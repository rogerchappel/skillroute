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

export class CatalogValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

function valueType(value) {
  return value === null ? "null" : typeof value;
}

function validateStringArray(skill, field, path) {
  if (skill[field] !== undefined && (!Array.isArray(skill[field]) || skill[field].some((value) => typeof value !== "string"))) {
    throw new CatalogValidationError(`${path}.${field} must be an array of strings`);
  }
}

export function validateCatalog(catalog) {
  if (catalog === null || (typeof catalog !== "object" && !Array.isArray(catalog))) {
    throw new CatalogValidationError("catalog must be an array or an object with a skills array");
  }

  const skills = Array.isArray(catalog) ? catalog : catalog.skills;
  if (!Array.isArray(skills)) {
    throw new CatalogValidationError("catalog.skills must be an array");
  }

  for (const [index, skill] of skills.entries()) {
    const path = `catalog.skills[${index}]`;
    if (skill === null || typeof skill !== "object" || Array.isArray(skill)) {
      throw new CatalogValidationError(`${path} must be an object; received ${valueType(skill)}`);
    }
    if (typeof skill.name !== "string" || skill.name.trim() === "") {
      throw new CatalogValidationError(`${path}.name must be a non-empty string`);
    }
    if (skill.description !== undefined && typeof skill.description !== "string") {
      throw new CatalogValidationError(`${path}.description must be a string`);
    }
    validateStringArray(skill, "keywords", path);
    validateStringArray(skill, "tools", path);
    if (skill.sideEffects !== undefined && typeof skill.sideEffects !== "string") {
      throw new CatalogValidationError(`${path}.sideEffects must be a string`);
    }
    validateStringArray(skill, "approvals", path);
  }

  return skills;
}

export function planSkillRoute(catalog, taskText, options = {}) {
  const limit = options.limit ?? 3;
  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError("limit must be a non-negative integer");
  }

  const skills = validateCatalog(catalog);
  const taskTokens = new Set(tokenize(taskText).filter((token) => !STOP_WORDS.has(token)));
  const candidates = skills.map((skill) => {
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
  const selected = candidates.slice(0, limit);

  return {
    task: taskText.trim(),
    selected,
    skipped: skills.length - candidates.length,
    limited: candidates.length - selected.length,
    approvalRequired: [...new Set(selected.flatMap((candidate) => candidate.approvals))],
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

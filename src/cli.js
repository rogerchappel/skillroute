#!/usr/bin/env node
import fs from "node:fs";
import { CatalogValidationError, planSkillRoute, renderMarkdown } from "./index.js";

const [, , command, catalogPath, taskPath, ...args] = process.argv;
const usage = "Usage: skillroute plan <catalog.json> <task.txt> [--format json|markdown] [--limit count]";
if (command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(0);
}

if (command !== "plan" || !catalogPath || !taskPath) {
  console.error(usage);
  process.exit(2);
}

let format = "markdown";
let limit = 3;
for (let index = 0; index < args.length; index += 2) {
  const flag = args[index];
  const value = args[index + 1];
  if (flag === "--format" && ["json", "markdown"].includes(value)) {
    format = value;
  } else if (flag === "--limit" && /^\d+$/.test(value ?? "")) {
    limit = Number(value);
  } else {
    console.error("Error: options must be --format json|markdown or --limit followed by a non-negative integer.");
    console.error(usage);
    process.exit(2);
  }
}

const catalogText = fs.readFileSync(catalogPath, "utf8");
let catalog;
try {
  catalog = JSON.parse(catalogText);
} catch (error) {
  console.error(`Error: catalog file is not valid JSON: ${error.message}`);
  process.exit(65);
}

const taskText = fs.readFileSync(taskPath, "utf8");
let plan;
try {
  plan = planSkillRoute(catalog, taskText, { limit });
} catch (error) {
  if (error instanceof CatalogValidationError) {
    console.error(`Error: invalid catalog: ${error.message}`);
    process.exit(65);
  }
  throw error;
}
console.log(format === "json" ? JSON.stringify(plan, null, 2) : renderMarkdown(plan));

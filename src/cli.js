#!/usr/bin/env node
import fs from "node:fs";
import { planSkillRoute, renderMarkdown } from "./index.js";

const [, , command, catalogPath, taskPath, ...args] = process.argv;
const usage = "Usage: skillroute plan <catalog.json> <task.txt> [--format json|markdown]";
if (command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(0);
}

if (command !== "plan" || !catalogPath || !taskPath) {
  console.error(usage);
  process.exit(2);
}

let format = "markdown";
if (args.length > 0) {
  if (args.length !== 2 || args[0] !== "--format" || !["json", "markdown"].includes(args[1])) {
    console.error("Error: --format must be followed by either json or markdown.");
    console.error(usage);
    process.exit(2);
  }
  format = args[1];
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const taskText = fs.readFileSync(taskPath, "utf8");
const plan = planSkillRoute(catalog.skills ?? catalog, taskText);
console.log(format === "json" ? JSON.stringify(plan, null, 2) : renderMarkdown(plan));

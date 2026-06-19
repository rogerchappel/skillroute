#!/usr/bin/env node
import fs from "node:fs";
import { planSkillRoute, renderMarkdown } from "./index.js";

const [, , command, catalogPath, taskPath, ...args] = process.argv;
if (command !== "plan" || !catalogPath || !taskPath) {
  console.error("Usage: skillroute plan <catalog.json> <task.txt> [--format json|markdown]");
  process.exit(2);
}
const format = args.includes("--format") ? args[args.indexOf("--format") + 1] : "markdown";
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const taskText = fs.readFileSync(taskPath, "utf8");
const plan = planSkillRoute(catalog.skills ?? catalog, taskText);
console.log(format === "json" ? JSON.stringify(plan, null, 2) : renderMarkdown(plan));

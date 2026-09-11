#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const normalize = (file) => file.replace(/^\.\//, '');
const binEntries = Object.fromEntries(
  Object.entries(typeof pkg.bin === 'string' ? { [pkg.name]: pkg.bin } : pkg.bin || {})
    .map(([name, entry]) => [name, normalize(entry)])
);

for (const [name, entry] of Object.entries(binEntries)) {
  if (!fs.existsSync(entry)) {
    throw new Error(`missing bin entry for ${name}: ${entry}`);
  }
}
const mainEntry = pkg.main ? normalize(pkg.main) : undefined;
if (mainEntry && !fs.existsSync(mainEntry)) {
  throw new Error(`missing main entry: ${mainEntry}`);
}

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' });
const [pack] = JSON.parse(output);
const files = new Set(pack.files.map((file) => file.path));

const required = ['package.json', 'README.md', 'LICENSE', mainEntry, ...Object.values(binEntries)]
  .filter(Boolean);
for (const file of required) {
  if (!files.has(file)) {
    throw new Error(`npm pack is missing ${file}`);
  }
}

for (const file of files) {
  if (file.startsWith('tests/') || file.startsWith('.github/')) {
    throw new Error(`npm pack includes non-runtime file ${file}`);
  }
}

console.log(`package smoke passed for ${pkg.name} with ${files.size} packed files`);

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

for (const file of ['README.md','SKILL.md','docs/PRD.md','docs/TASKS.md','docs/ORCHESTRATION.md']) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.name !== '@rogerchappel/skillroute') {
  throw new Error('Package name must remain @rogerchappel/skillroute to avoid the unrelated skillroute registry package');
}
if (packageJson.bin?.skillroute !== './src/cli.js') {
  throw new Error('Package must expose the skillroute executable from ./src/cli.js');
}

function walkTestFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walkTestFiles(full));
    else if (entry.name.endsWith('.test.js')) found.push(full);
  }
  return found;
}

const testFiles = ['test', 'tests']
  .filter((dir) => fs.existsSync(dir))
  .flatMap((dir) => walkTestFiles(dir))
  .sort();
for (const file of testFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Syntax check failed for ${file}:\n${result.stderr}`);
  }
}
console.log(`check ok (${testFiles.length} test files syntax-checked)`);

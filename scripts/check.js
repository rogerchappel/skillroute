import fs from 'node:fs';
for (const file of ['README.md','SKILL.md','docs/PRD.md','docs/TASKS.md','docs/ORCHESTRATION.md']) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
console.log('check ok');

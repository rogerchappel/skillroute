import fs from 'node:fs';
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
console.log('check ok');

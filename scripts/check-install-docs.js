import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const packageName = '@rogerchappel/skillroute';
export const registryInstall = `npm install -g ${packageName}`;
export const sourceInstall = 'npm install -g https://github.com/rogerchappel/skillroute/archive/refs/heads/main.tar.gz';
export const unavailableNotice = `\`${registryInstall}\` is unavailable until the first npm publication.`;

export function validateInstallDocs(documents, published) {
  const errors = [];

  for (const [file, content] of Object.entries(documents)) {
    if (!content.includes(sourceInstall)) {
      errors.push(`${file} must document the executable source install: ${sourceInstall}`);
    }

    if (!published && !content.includes(unavailableNotice)) {
      errors.push(`${file} must label the registry install as unavailable until publication`);
    }

    if (!published && content.includes(`\`\`\`bash\n${registryInstall}\n\`\`\``)) {
      errors.push(`${file} must not present the unavailable registry install as executable`);
    }

    if (published && !content.includes(registryInstall)) {
      errors.push(`${file} must document the published registry install: ${registryInstall}`);
    }
  }

  return errors;
}

export function detectRegistryState() {
  const result = spawnSync('npm', ['view', packageName, 'version', '--json'], {
    encoding: 'utf8'
  });

  if (result.status === 0) return true;
  if (result.stderr.includes('E404') || result.stdout.includes('E404')) return false;

  throw new Error(`Could not determine npm registry state: ${(result.stderr || result.stdout).trim()}`);
}

function main() {
  const stateArgument = process.argv.find((argument) => argument.startsWith('--registry-state='));
  const published = stateArgument
    ? stateArgument.split('=', 2)[1] === 'published'
    : detectRegistryState();

  if (stateArgument && !['published', 'unpublished'].includes(stateArgument.split('=', 2)[1])) {
    throw new Error('Registry state must be published or unpublished');
  }

  const documents = Object.fromEntries(
    ['README.md', 'SKILL.md'].map((file) => [file, readFileSync(file, 'utf8')])
  );
  const errors = validateInstallDocs(documents, published);
  if (errors.length > 0) throw new Error(errors.join('\n'));

  console.log(`install docs ok (${published ? 'published' : 'unpublished'})`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();

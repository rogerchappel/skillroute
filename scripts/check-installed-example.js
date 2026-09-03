import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}):\n${result.stderr || result.stdout}`);
  }
  return result;
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sandbox = mkdtempSync(join(tmpdir(), 'skillroute-installed-example-'));
const prefix = join(sandbox, 'prefix');
const outside = join(sandbox, 'outside-checkout');
mkdirSync(outside);

const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', sandbox], { cwd: root }).stdout);
const tarball = join(sandbox, packed[0].filename);
run('npm', ['install', '--global', '--prefix', prefix, tarball], { cwd: outside });

writeFileSync(join(outside, 'catalog.json'), JSON.stringify({
  skills: [{
    name: 'repo-review',
    description: 'Review repository release readiness.',
    keywords: ['review', 'repository', 'release'],
    tools: ['git'],
    sideEffects: 'read-only',
    approvals: ['before publishing']
  }]
}));
writeFileSync(join(outside, 'task.txt'), 'Review this repository for release readiness.\n');

const executable = join(prefix, 'bin', process.platform === 'win32' ? 'skillroute.cmd' : 'skillroute');
const result = run(executable, ['plan', 'catalog.json', 'task.txt', '--format', 'markdown'], { cwd: outside });
if (!result.stdout.includes('repo-review')) throw new Error('installed example did not produce the expected route');
if (readFileSync(join(outside, 'task.txt'), 'utf8').length === 0) throw new Error('installed example task was not created');

console.log('installed example ok (outside repository checkout)');

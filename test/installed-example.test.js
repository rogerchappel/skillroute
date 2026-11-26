import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('installed-package example reports bounded npm timeout failures', () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'skillroute timeout probe-'));
  const fakeBin = join(sandbox, 'bin');
  mkdirSync(fakeBin);
  const npm = join(fakeBin, 'npm');
  writeFileSync(npm, `#!${process.execPath}\nsetTimeout(() => {}, 5000);\n`, { mode: 0o755 });
  const result = spawnSync(process.execPath, ['scripts/check-installed-example.js'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: fakeBin, SKILLROUTE_NPM_TIMEOUT_MS: '50' },
    timeout: 2000
  });
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /npm pack .* timed out after 50ms/);
});

test('installed-package example runs from a checkout path containing spaces', () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'skillroute space checkout-'));
  const checkout = join(sandbox, 'skillroute package');
  cpSync(root, checkout, {
    recursive: true,
    filter: (source) => !['.git', 'node_modules'].includes(source.split('/').at(-1))
  });

  const result = spawnSync(process.execPath, ['scripts/check-installed-example.js'], {
    cwd: checkout,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /installed example ok/);
  assert.doesNotMatch(result.stdout, /%20/);
});

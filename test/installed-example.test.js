import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

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

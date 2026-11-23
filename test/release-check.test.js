import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const taggedRelease = await readFile(new URL('../.github/workflows/tagged-release-check.yml', import.meta.url), 'utf8');
const releaseCheck = pkg.scripts['release:check'];
const requiredStages = [
  'check',
  'check:install-docs',
  'check:installed-example',
  'test',
  'build',
  'smoke',
  'package:smoke',
];

test('release:check runs each required quality gate exactly once', () => {
  const commands = releaseCheck.match(/npm run [\w:-]+|npm test/g) ?? [];
  assert.deepEqual(commands, [
    'npm run check',
    'npm run check:install-docs',
    'npm run check:installed-example',
    'npm test',
    'npm run build',
    'npm run smoke',
    'npm run package:smoke',
  ]);
  for (const stage of requiredStages) {
    assert.ok(pkg.scripts[stage], `missing script for release stage ${stage}`);
  }
});

test('pull-request CI invokes the full release:check gate', () => {
  assert.match(ci, /on:\s*\n\s+pull_request:/);
  assert.match(ci, /run:\s*npm run release:check/);
});

test('tagged release validation uses the newest supported Node version', () => {
  const matrix = ci.match(/node-version:\s*\[([^\]]+)\]/)?.[1];
  assert.ok(matrix, 'CI must declare its supported Node matrix');
  const supportedVersions = matrix.split(',').map((version) => version.trim());
  const taggedVersion = taggedRelease.match(/node-version:\s*(\d+)/)?.[1];
  assert.ok(taggedVersion, 'tagged release workflow must set a Node version');
  assert.equal(taggedVersion, supportedVersions.at(-1), 'tagged release validation must use newest CI-supported Node');
  assert.match(taggedRelease, /run:\s*npm run release:check/);
});

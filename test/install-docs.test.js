import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registryInstall,
  sourceInstall,
  unavailableNotice,
  validateInstallDocs
} from '../scripts/check-install-docs.js';

test('unpublished packages require source installation and reject registry installation', () => {
  assert.deepEqual(validateInstallDocs({
    'README.md': `Install now: ${sourceInstall}\n${unavailableNotice}`,
    'SKILL.md': `Install now: ${sourceInstall}\n${unavailableNotice}`
  }, false), []);

  assert.deepEqual(validateInstallDocs({
    'README.md': `\`\`\`bash\n${registryInstall}\n\`\`\``,
    'SKILL.md': `${sourceInstall}\n${unavailableNotice}`
  }, false), [
    `README.md must document the executable source install: ${sourceInstall}`,
    'README.md must label the registry install as unavailable until publication',
    'README.md must not present the unavailable registry install as executable'
  ]);
});

test('published packages require both registry and source installation paths', () => {
  const complete = `${registryInstall}\n${sourceInstall}`;
  assert.deepEqual(validateInstallDocs({
    'README.md': complete,
    'SKILL.md': complete
  }, true), []);

  assert.deepEqual(validateInstallDocs({
    'README.md': sourceInstall,
    'SKILL.md': complete
  }, true), [
    `README.md must document the published registry install: ${registryInstall}`
  ]);
});

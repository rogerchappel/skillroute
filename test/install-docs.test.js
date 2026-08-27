import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registryInstall,
  sourceInstall,
  unavailableNotice,
  installedExampleHeading,
  installedExampleCommand,
  validateInstallDocs
} from '../scripts/check-install-docs.js';

const portableExample = `${installedExampleHeading}\n${installedExampleCommand}`;

test('unpublished packages require source installation and reject registry installation', () => {
  assert.deepEqual(validateInstallDocs({
    'README.md': `Install now: ${sourceInstall}\n${unavailableNotice}\n${portableExample}`,
    'SKILL.md': `Install now: ${sourceInstall}\n${unavailableNotice}\n${portableExample}`
  }, false), []);

  assert.deepEqual(validateInstallDocs({
    'README.md': `\`\`\`bash\n${registryInstall}\n\`\`\``,
    'SKILL.md': `${sourceInstall}\n${unavailableNotice}\n${portableExample}`
  }, false), [
    `README.md must document the executable source install: ${sourceInstall}`,
    'README.md must label the registry install as unavailable until publication',
    'README.md must not present the unavailable registry install as executable',
    'README.md must distinguish the installed-user example from checkout examples',
    'README.md must run the installed-user example with local input paths'
  ]);
});

test('published packages require both registry and source installation paths', () => {
  const complete = `${registryInstall}\n${sourceInstall}\n${portableExample}`;
  assert.deepEqual(validateInstallDocs({
    'README.md': complete,
    'SKILL.md': complete
  }, true), []);

  assert.deepEqual(validateInstallDocs({
    'README.md': `${sourceInstall}\n${portableExample}`,
    'SKILL.md': complete
  }, true), [
    `README.md must document the published registry install: ${registryInstall}`
  ]);
});

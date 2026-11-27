#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const normalize = (file) => file.replace(/^\.\//, '');
const binEntries = Object.fromEntries(
  Object.entries(typeof pkg.bin === 'string' ? { [pkg.name]: pkg.bin } : pkg.bin || {})
    .map(([name, entry]) => [name, normalize(entry)])
);
const mainEntry = pkg.main ? normalize(pkg.main) : undefined;

const output = execFileSync('npm', ['pack', '--json'], { encoding: 'utf8' });
const [pack] = JSON.parse(output);
const tarball = path.resolve(pack.filename);
const files = new Set(pack.files.map((file) => file.path));

const required = ['package.json', 'README.md', 'LICENSE', mainEntry, ...Object.values(binEntries)]
  .filter(Boolean);
for (const file of required) {
  if (!files.has(file)) {
    throw new Error(`npm pack is missing ${file}`);
  }
}
for (const file of files) {
  if (file.startsWith('tests/') || file.startsWith('.github/')) {
    throw new Error(`npm pack includes non-runtime file ${file}`);
  }
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillroute-package-smoke-'));
try {
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', tarball], {
    cwd: tempDir,
    stdio: 'pipe'
  });
  const installedPackage = path.join(tempDir, 'node_modules', ...pkg.name.split('/'));
  const manifest = JSON.parse(fs.readFileSync(path.join(installedPackage, 'package.json'), 'utf8'));
  for (const [name, entry] of Object.entries(binEntries)) {
    const installedBin = path.join(installedPackage, entry);
    if (!fs.existsSync(installedBin)) throw new Error(`installed package is missing bin entry for ${name}: ${entry}`);
    const command = path.join(tempDir, 'node_modules', '.bin', name);
    const result = execFileSync(command, ['--help'], { cwd: tempDir, encoding: 'utf8' });
    if (!result.includes('Usage:')) throw new Error(`${name} --help did not print usage`);
  }
  if (mainEntry) {
    const imported = await import(pathToFileURL(path.join(installedPackage, mainEntry)));
    if (!imported || Object.keys(imported).length === 0) throw new Error(`installed main entry ${manifest.main} exports nothing`);
  }
  console.log(`installed package smoke passed for ${pkg.name} (${pack.filename})`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(tarball, { force: true });
}

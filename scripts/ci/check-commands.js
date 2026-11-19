#!/usr/bin/env node
/* Fail early when an affected workspace lacks the canonical commands. */
const fs = require('node:fs');
const path = require('node:path');

const workspaces = JSON.parse(process.argv[2] || '[]');
const native = new Set(['android']);
const configurationPackage = /@repo\/[a-z-]+-config$/;
const failures = [];

function findWorkspaceDir(name) {
  const roots = ['apps', 'packages'];
  for (const root of roots) {
    const rootDir = path.join(process.cwd(), root);
    if (!fs.existsSync(rootDir)) continue;
    for (const entry of fs.readdirSync(rootDir)) {
      const manifestPath = path.join(rootDir, entry, 'package.json');
      if (!fs.existsSync(manifestPath)) continue;
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (manifest.name === name) return path.join(root, entry);
      } catch {
        /* skip malformed manifests */
      }
    }
  }
  return null;
}

function hasIntegrationFiles(directory) {
  const skipped = new Set(['node_modules', '.git', 'dist', 'coverage', 'generated', '.next', 'target']);
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skipped.has(entry.name)) stack.push(path.join(current, entry.name));
        continue;
      }
      if (/\.(integration|int)\.[cm]?[jt]sx?$/.test(entry.name)) return true;
    }
  }
  return false;
}

for (const workspace of workspaces) {
  if (workspace === '//' || native.has(workspace)) continue;
  const dir = findWorkspaceDir(workspace);
  if (!dir) {
    failures.push(`${workspace}: no workspace found, add an affected path entry instead`);
    continue;
  }
  const absoluteDir = path.join(process.cwd(), dir);
  const manifest = JSON.parse(fs.readFileSync(path.join(absoluteDir, 'package.json'), 'utf8'));
  if (configurationPackage.test(manifest.name || '')) continue;

  const scripts = manifest.scripts || {};
  if (typeof scripts.build !== 'string') {
    failures.push(`${workspace}: missing canonical build command`);
  }
  if (typeof scripts['type-check'] !== 'string') {
    failures.push(`${workspace}: missing canonical type-check command`);
  }
  const hasLintLayer = Object.keys(scripts).some((name) => /lint/.test(name));
  if (hasLintLayer && typeof scripts.lint !== 'string') {
    failures.push(`${workspace}: has a lint layer but no canonical lint command`);
  }
  const hasCoverageConfig = fs.existsSync(path.join(absoluteDir, 'coverage.config.json'));
  if (typeof scripts.test !== 'string' && hasCoverageConfig) {
    failures.push(`${workspace}: has a coverage config but no canonical test command`);
  }
  if (typeof scripts.test === 'string' && !hasCoverageConfig) {
    failures.push(`${workspace}: missing coverage.config.json`);
  }
  if (hasIntegrationFiles(absoluteDir) && typeof scripts['test:integration'] !== 'string') {
    failures.push(`${workspace}: has integration tests but no canonical test:integration command`);
  }
}

if (failures.length === 0) {
  console.log(`Canonical commands present for ${workspaces.length} workspace(s)`);
  process.exit(0);
}
console.error('Canonical command validation failed');
for (const failure of failures) console.error(`  ${failure}`);
process.exit(1);

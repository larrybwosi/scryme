#!/usr/bin/env node
/* Validate a workspace coverage summary against its checked in floors. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const workspace = process.argv[2];
const base = process.argv[3] || '';

if (!workspace) {
  console.error('Missing workspace argument');
  process.exit(1);
}

const root = process.cwd();

function findWorkspaceDir(name) {
  for (const area of ['apps', 'packages']) {
    const areaDir = path.join(root, area);
    if (!fs.existsSync(areaDir)) continue;
    for (const entry of fs.readdirSync(areaDir)) {
      const manifestPath = path.join(areaDir, entry, 'package.json');
      if (!fs.existsSync(manifestPath)) continue;
      try {
        if (JSON.parse(fs.readFileSync(manifestPath, 'utf8')).name === name) {
          return path.join(area, entry);
        }
      } catch {
        /* skip malformed manifests */
      }
    }
  }
  return null;
}

const relativeDir = findWorkspaceDir(workspace);
if (!relativeDir) {
  console.error(`${workspace}: no workspace found`);
  process.exit(1);
}
const workspaceDir = path.join(root, relativeDir);
const configPath = path.join(workspaceDir, 'coverage.config.json');
const summaryPath = path.join(workspaceDir, 'coverage', 'coverage-summary.json');

if (!fs.existsSync(configPath)) {
  console.error(`${workspace}: missing coverage.config.json`);
  process.exit(1);
}

const floors = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (!['line', 'branch', 'changedLine'].every((key) => typeof floors[key] === 'number')) {
  console.error(`${workspace}: coverage.config.json needs numeric line, branch and changedLine floors`);
  process.exit(1);
}

if (!fs.existsSync(summaryPath)) {
  console.error(`${workspace}: missing coverage/coverage-summary.json, run tests with the json-summary reporter`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total || {};
const linePct = total.lines ? total.lines.pct : 0;
const branchPct = total.branches ? total.branches.pct : 0;

const failures = [];
if (linePct < floors.line) failures.push(`line ${linePct} below floor ${floors.line}`);
if (branchPct < floors.branch) failures.push(`branch ${branchPct} below floor ${floors.branch}`);

if (floors.changedLine > 0 && base) {
  const finalPath = path.join(workspaceDir, 'coverage', 'coverage-final.json');
  if (!fs.existsSync(finalPath)) {
    failures.push('changedLine floor needs coverage/coverage-final.json');
  } else {
    const final = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
    let changed = 0;
    let covered = 0;
    let diff = '';
    try {
      diff = execFileSync('git', ['diff', '--unified=0', base, 'HEAD', '--', relativeDir], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch {
      console.error(`${workspace}: cannot compare changed lines against ${base}`);
      process.exit(1);
    }
    const currentFile = { value: '' };
    for (const text of diff.split('\n')) {
      const header = /^\+\+\+ b\/(.+)$/.exec(text);
      if (header) {
        currentFile.value = header[1];
        continue;
      }
      const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(text);
      if (!hunk) continue;
      const start = Number(hunk[1]);
      const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      const entry = final[currentFile.value];
      if (!entry) continue;
      const coveredLines = new Set();
      for (const [id, hits] of Object.entries(entry.s)) {
        if (hits > 0) {
          for (const loc of entry.statementMap[id] ? [entry.statementMap[id]] : []) {
            for (let n = loc.start.line; n <= loc.end.line; n += 1) coveredLines.add(n);
          }
        }
      }
      for (let n = start; n < start + count; n += 1) {
        changed += 1;
        if (coveredLines.has(n)) covered += 1;
      }
    }
    const changedPct = changed ? Math.round((covered / changed) * 100) : 100;
    if (changedPct < floors.changedLine) {
      failures.push(`changedLine ${changedPct} below floor ${floors.changedLine}`);
    }
  }
}

const summaryLine = `${workspace}: coverage line ${linePct} branch ${branchPct}`;
const stepSummary = process.env.GITHUB_STEP_SUMMARY;
if (stepSummary) {
  fs.appendFileSync(stepSummary, `${summaryLine}\n`);
}
if (failures.length === 0) {
  console.log(`${summaryLine} passed`);
  process.exit(0);
}
console.error(`${summaryLine} failed`);
for (const failure of failures) console.error(`  ${failure}`);
process.exit(1);

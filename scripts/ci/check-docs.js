#!/usr/bin/env node
/* Check relative links in changed docs and skill files. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const base = process.argv[2] || 'HEAD~1';
const root = process.cwd();

let files = [];
try {
  files = execFileSync('git', ['diff', '--name-only', `${base}..HEAD`, '--', 'docs', 'skills'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((file) => file.endsWith('.md'));
} catch {
  files = [];
}

if (files.length === 0) {
  console.log('No docs or skills files changed, docs metadata passed');
  process.exit(0);
}

const failures = [];
for (const file of files) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const text = fs.readFileSync(absolute, 'utf8');
  const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    const target = link.split('#')[0];
    if (!target) continue;
    const resolved = path.resolve(path.dirname(absolute), target);
    if (!fs.existsSync(resolved)) {
      failures.push(`${file}: broken link ${link}`);
    }
  }
}

if (failures.length === 0) {
  console.log(`Docs metadata passed for ${files.length} file(s)`);
  process.exit(0);
}
console.error('Docs metadata failed');
for (const failure of failures) console.error(`  ${failure}`);
process.exit(1);

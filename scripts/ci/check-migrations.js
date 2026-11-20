#!/usr/bin/env node
/* Reject migrations that would break an application rollback. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const base = process.argv[2];

if (!base) {
  console.error('Missing base ref for migration compatibility check');
  process.exit(1);
}

let changed;
try {
  changed = execFileSync(
    'git',
    ['diff', '--diff-filter=AM', '--name-only', base, 'HEAD', '--', 'packages/db/prisma/migrations'],
    { cwd: root, encoding: 'utf8' },
  );
} catch {
  console.error(`Cannot compare migrations against ${base}`);
  process.exit(1);
}

const files = changed
  .split('\n')
  .map((file) => file.trim())
  .filter((file) => file.endsWith('.sql'));

if (files.length === 0) {
  console.log('No database migrations changed, migration compatibility passed');
  process.exit(0);
}

const unsafe = [
  { name: 'table removal', pattern: /\bDROP\s+TABLE\b/i },
  { name: 'column removal', pattern: /\bDROP\s+COLUMN\b/i },
  { name: 'column rename', pattern: /\bRENAME\s+COLUMN\b/i },
  { name: 'table rename', pattern: /\bRENAME\s+TO\b/i },
  { name: 'required column without a default', pattern: /\bADD\s+COLUMN\b[\s\S]*?\bNOT\s+NULL\b(?![\s\S]*\bDEFAULT\b)/i },
];

const failures = [];
for (const file of files) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const sql = fs.readFileSync(absolute, 'utf8');
  for (const statement of sql.split(';')) {
    for (const rule of unsafe) {
      if (rule.pattern.test(statement)) {
        failures.push(`${file}: ${rule.name} is not backward compatible for one release`);
      }
    }
  }
}

if (failures.length === 0) {
  console.log(`Migration compatibility passed for ${files.length} file(s)`);
  process.exit(0);
}
console.error('Migration compatibility failed');
for (const failure of failures) console.error(`  ${failure}`);
process.exit(1);

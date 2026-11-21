#!/usr/bin/env node
/* Validate the flake manifest and build a Vitest pattern that omits quarantined tests. */
const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.join(process.cwd(), '.github', 'flaky-tests.yml');
if (!fs.existsSync(manifestPath)) {
  console.error('Missing .github/flaky-tests.yml');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch {
  console.error('The flake manifest must be valid JSON');
  process.exit(1);
}

if (!manifest || !Array.isArray(manifest.tests)) {
  console.error('The flake manifest needs a tests array');
  process.exit(1);
}

const required = ['testId', 'owner', 'issueUrl', 'addedOn'];
const failures = [];
for (const [index, entry] of manifest.tests.entries()) {
  for (const field of required) {
    if (typeof entry?.[field] !== 'string' || entry[field].trim() === '') {
      failures.push(`entry ${index + 1} needs a non empty ${field}`);
    }
  }
  if (typeof entry?.issueUrl === 'string') {
    try {
      const url = new URL(entry.issueUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        failures.push(`entry ${index + 1} needs an http issue URL`);
      }
    } catch {
      failures.push(`entry ${index + 1} needs a valid issue URL`);
    }
  }
}

if (failures.length > 0) {
  console.error('Flake manifest validation failed');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const identifiers = manifest.tests.map((entry) => escapeRegExp(entry.testId));
const pattern = identifiers.length > 0 ? `^(?!.*(?:${identifiers.join('|')})).*$` : '';
console.log(JSON.stringify({ count: identifiers.length, pattern }));

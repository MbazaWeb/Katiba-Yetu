/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const { validateBundle } = require('../src/data/validateConstitution');

try {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node scripts/import-constitution.cjs <bundle.json> [--write]');
  const bundle = validateBundle(JSON.parse(fs.readFileSync(path.resolve(input), 'utf8')));
  const verified = bundle.articles.filter(a => Object.values(a.texts).some(t => t.source.verificationStatus === 'verified')).length;
  console.log(`${bundle.document.id}: ${bundle.articles.length} indexed articles; ${verified} with reviewed text. Validation does not certify legal accuracy.`);
  if (process.argv.includes('--write')) {
    const name = bundle.document.id === 'doc-union-1977' ? 'union' : 'zanzibar';
    const destination = path.resolve(__dirname, '../src/data/constitutions', `${name}.json`);
    // Fixed destination, atomic replacement, never execute code from the bundle.
    fs.writeFileSync(`${destination}.tmp`, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
    fs.renameSync(`${destination}.tmp`, destination);
    console.log(`Imported ${name}.json`);
  } else console.log('Dry run only. Add --write after source review to import.');
} catch (error) { console.error(error.message); process.exitCode = 1; }

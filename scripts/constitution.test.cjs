const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Run the actual pure TypeScript services without a React Native runtime.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};
const { validateBundle } = require('../src/data/validateConstitution');
const service = require('../src/services/constitution.ts');
const { localClarificationService } = require('../src/services/clarification.ts');
const union = require('../src/data/constitutions/union.json');
const zanzibar = require('../src/data/constitutions/zanzibar.json');
const clone = () => structuredClone(union);
const reviewedSource = () => ({ ...union.document.source, verificationStatus: 'verified', verifiedBy: 'TEST REVIEWER', verifiedAt: '2026-09-17', sourceLocator: 'TEST ONLY', checksum: 'a'.repeat(64) });
function withText(status = 'verified') {
  const data = clone(); const article = data.articles[0];
  article.texts.en = { title: 'TEST FIXTURE — not a constitutional heading', preamble: 'TEST ONLY: alpha preamble', clauses: [{ id: 'test-clause', number: '(1)', text: 'TEST ONLY: beta', children: [{ id: 'test-subclause', number: '(a)', text: 'TEST ONLY: deepneedle', children: [] }] }], source: { ...reviewedSource(), verificationStatus: status } };
  return data;
}
test('both shipped bundles validate and contain no invented official text', () => {
  for (const bundle of [union, zanzibar]) { validateBundle(bundle); assert.equal(bundle.document.inventoryComplete, false); assert.ok(bundle.articles.every(a => Object.keys(a.texts).length === 0)); }
});
test('document records and article numbering stay isolated', () => {
  const found = service.searchLibrary({ ...service.emptyFilters, documentId: zanzibar.document.id, query: '18' });
  assert.deepEqual(found.map(a => a.id), ['zanzibar-18']);
  assert.equal(service.getArticle('sec-art19').title.en, 'Right to freedom of religion.');
});
test('search traverses verified nested clauses and excludes pending text', () => {
  const filters = { ...service.emptyFilters, query: 'deepneedle' };
  assert.equal(service.searchLibrary(filters, [withText()]).length, 1);
  assert.equal(service.searchLibrary(filters, [withText('pending')]).length, 0);
  assert.equal(service.searchLibrary({ ...filters, language: 'sw' }, [withText()]).length, 0);
});
test('filters combine chapter, topic, language, Union and rights', () => {
  assert.deepEqual(service.searchLibrary({ ...service.emptyFilters, documentId: union.document.id, topic: 'equality', rightsOnly: true, language: 'en' }).map(a => a.number), ['13']);
  assert.equal(service.searchLibrary({ ...service.emptyFilters, chapterId: 'missing' }).length, 0);
  assert.ok(service.searchLibrary({ ...service.emptyFilters, unionOnly: true }).every(a => a.unionMatter));
  assert.ok(service.searchLibrary({ ...service.emptyFilters, query: 'wajibu' }).some(a => a.number === '26'));
});
test('missing language never falls back to another official body', () => {
  const article = withText().articles[0];
  assert.equal(service.officialText(article, 'sw'), undefined);
  assert.ok(service.officialText(article, 'en'));
  assert.match(service.citationFor(article, 'sw').formatted, /not verified/);
});
test('verified text requires review provenance', () => {
  const data = withText(); data.articles[0].texts.en.source.verifiedBy = null;
  assert.throws(() => validateBundle(data), /verifiedBy/);
});
test('versions and source schemes cannot silently drift', () => {
  const data = withText(); data.articles[0].texts.en.source.documentVersion = 'wrong';
  assert.throws(() => validateBundle(data), /version mismatch/);
  const unsafe = clone(); unsafe.document.downloads.en = 'javascript:alert(1)';
  assert.throws(() => validateBundle(unsafe), /URL/);
});
test('duplicate article numbers and orphan references are rejected', () => {
  const data = clone(); data.articles[1].number = data.articles[0].number;
  assert.throws(() => validateBundle(data), /duplicate article/);
  const orphan = clone(); orphan.articles[0].chapterId = 'absent';
  assert.throws(() => validateBundle(orphan), /orphan/);
});
test('cycles, duplicate clause numbering and false completeness are rejected', () => {
  const cycle = clone(); cycle.parts[0].parentPartId = cycle.parts[0].id;
  assert.throws(() => validateBundle(cycle), /cyclic/);
  const data = withText(); data.articles[0].texts.en.clauses.push({ ...data.articles[0].texts.en.clauses[0], id: 'other' });
  assert.throws(() => validateBundle(data), /duplicate clause/);
  const complete = clone(); complete.document.inventoryComplete = true;
  assert.throws(() => validateBundle(complete), /counts/);
});
test('local clarification safely supports follow-ups without inventing law', async () => {
  const article = union.articles[0];
  const request = { article, documentVersion: article.source.documentVersion, language: 'en', question: 'Which right?', history: [] };
  const first = await localClarificationService.ask(request);
  assert.equal(first.articleId, article.id); assert.match(first.text, /cannot confirm/);
  const next = await localClarificationService.ask({ ...request, question: 'Give an example', history: [{ question: request.question, answer: first.text, language: 'en' }] });
  assert.match(next.text, /Follow-up 2/); assert.match(next.text, /Learning exercise only/);
  await assert.rejects(localClarificationService.ask({ ...request, documentVersion: 'wrong' }), /version mismatch/);
});
test('empty and cancelled clarification requests are rejected', async () => {
  const article = union.articles[0]; const request = { article, documentVersion: article.source.documentVersion, language: 'sw', question: '', history: [] };
  await assert.rejects(localClarificationService.ask(request), /Question/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(localClarificationService.ask({ ...request, question: 'Haki?', signal: controller.signal }), /Cancelled/);
});

/* Shared by the app, import CLI and tests. Validation is not legal verification. */
function validateBundle(bundle) {
  const fail = message => { throw new Error(`Constitution import: ${message}`); };
  const object = (value, label) => { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`); };
  const string = (value, label) => { if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string`); };
  const array = (value, label) => { if (!Array.isArray(value)) fail(`${label} must be an array`); };
  const localized = (value, label) => { object(value, label); for (const [lang, text] of Object.entries(value)) { if (!['sw', 'en'].includes(lang)) fail(`unsupported language ${lang}`); string(text, label); } };
  const url = value => { try { const parsed = new URL(value); if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail('source URL must be HTTPS'); } catch { fail('invalid source URL'); } };
  const source = value => {
    object(value, 'source'); string(value.officialSource, 'official source'); string(value.documentVersion, 'document version');
    if (!['unavailable', 'pending', 'verified'].includes(value.verificationStatus)) fail('invalid verification status');
    if (value.sourceUrl !== null) url(value.sourceUrl);
    for (const field of ['amendmentDate', 'verifiedAt', 'verifiedBy', 'sourceLocator', 'checksum']) if (value[field] !== null) string(value[field], field);
    for (const field of ['amendmentDate', 'verifiedAt']) if (value[field] !== null && (!/^\d{4}-\d{2}-\d{2}/.test(value[field]) || Number.isNaN(Date.parse(value[field])))) fail(`invalid ${field}`);
    if (value.verificationStatus === 'verified') {
      for (const field of ['sourceUrl', 'verifiedBy', 'verifiedAt', 'sourceLocator', 'checksum']) string(value[field], field);
      if (!/^[a-f0-9]{64}$/i.test(value.checksum)) fail('verified text requires a SHA-256 source checksum');
      if (!new URL(value.sourceUrl).hostname.endsWith('.go.tz')) fail('verified text requires an official government source');
    }
  };
  object(bundle, 'bundle'); if (bundle.schemaVersion !== 1) fail('unsupported schema version');
  const doc = bundle.document; object(doc, 'document'); string(doc.id, 'document id'); localized(doc.title, 'document title');
  if (!['doc-union-1977', 'doc-zanzibar-1984'].includes(doc.id)) fail('unsupported document');
  if (!Number.isInteger(doc.year) || doc.year < 1900) fail('invalid document year');
  string(doc.version, 'version'); localized(doc.amendmentNote, 'amendment note'); source(doc.source);
  if (doc.source.documentVersion !== doc.version) fail('document/source version mismatch');
  if (typeof doc.inventoryComplete !== 'boolean') fail('inventoryComplete must be explicit');
  for (const field of ['chapterCount', 'articleCount']) if (doc[field] !== null && (!Number.isInteger(doc[field]) || doc[field] < 0)) fail(`invalid ${field}`);
  object(doc.downloads, 'downloads'); for (const [lang, link] of Object.entries(doc.downloads)) { if (!['sw', 'en'].includes(lang)) fail('unsupported download language'); url(link); }
  for (const name of ['chapters', 'parts', 'articles', 'explanations']) array(bundle[name], name);
  const ids = new Set();
  for (const entry of [...bundle.chapters, ...bundle.parts, ...bundle.articles, ...bundle.explanations]) { object(entry, 'record'); string(entry.id, 'record id'); if (ids.has(entry.id)) fail(`duplicate id ${entry.id}`); ids.add(entry.id); }
  const chapters = new Map(bundle.chapters.map(ch => [ch.id, ch]));
  const parts = new Map(bundle.parts.map(part => [part.id, part]));
  for (const entry of [...bundle.chapters, ...bundle.parts, ...bundle.articles]) {
    if (entry.documentId !== doc.id) fail('cross-document record');
    string(entry.number, 'number'); if (!Number.isFinite(entry.order)) fail('invalid order'); localized(entry.title, 'title');
  }
  for (const part of bundle.parts) {
    if (!chapters.has(part.chapterId)) fail('orphan part');
    let cursor = part; const seen = new Set();
    while (cursor.parentPartId !== null) {
      if (seen.has(cursor.id)) fail('cyclic part hierarchy'); seen.add(cursor.id);
      const parent = parts.get(cursor.parentPartId);
      if (!parent || parent.chapterId !== part.chapterId) fail('invalid parent part'); cursor = parent;
    }
  }
  const clauseIds = new Set();
  const clauses = (list, depth = 0) => {
    array(list, 'clauses'); if (depth > 20) fail('clause nesting exceeds 20'); const numbers = new Set();
    for (const clause of list) {
      object(clause, 'clause'); string(clause.id, 'clause id'); string(clause.number, 'clause number');
      if (clauseIds.has(clause.id) || numbers.has(clause.number)) fail('duplicate clause id/number'); clauseIds.add(clause.id); numbers.add(clause.number);
      if (typeof clause.text !== 'string') fail('invalid clause text'); clauses(clause.children, depth + 1);
      if (!clause.text.trim() && !clause.children.length) fail('empty clause');
    }
  };
  const numbers = new Set(), orders = new Set();
  for (const article of bundle.articles) {
    if (numbers.has(article.number) || orders.has(article.order)) fail('duplicate article number/order'); numbers.add(article.number); orders.add(article.order);
    if (!chapters.has(article.chapterId)) fail('orphan article');
    if (article.partId !== null && parts.get(article.partId)?.chapterId !== article.chapterId) fail('article part/chapter mismatch');
    source(article.source); if (article.source.documentVersion !== doc.version) fail('article version mismatch');
    for (const field of ['topics', 'rights', 'duties']) { array(article[field], field); article[field].forEach(tag => string(tag, field)); }
    for (const field of ['unionMatter', 'fundamentalRights']) if (typeof article[field] !== 'boolean') fail(`invalid ${field}`);
    object(article.texts, 'texts');
    for (const [lang, text] of Object.entries(article.texts)) {
      if (!['sw', 'en'].includes(lang)) fail('unsupported text language'); object(text, 'article text'); string(text.title, 'official title');
      if (typeof text.preamble !== 'string') fail('invalid preamble'); clauses(text.clauses); source(text.source);
      if (text.source.documentVersion !== doc.version) fail('text version mismatch');
      if (text.source.verificationStatus === 'unavailable' || (!text.preamble.trim() && !text.clauses.length)) fail('text must be populated and pending or verified');
    }
    if (article.source.verificationStatus === 'verified' && !Object.values(article.texts).some(text => text.source.verificationStatus === 'verified')) fail('verified article has no verified language');
  }
  for (const explanation of bundle.explanations) {
    if (!bundle.articles.some(a => a.id === explanation.articleId) || explanation.documentVersion !== doc.version) fail('explanation context mismatch');
    if (!['sw', 'en'].includes(explanation.language) || !['mock', 'reviewed'].includes(explanation.kind)) fail('invalid explanation');
    string(explanation.text, 'explanation'); if (explanation.kind === 'reviewed') string(explanation.reviewedBy, 'reviewer');
  }
  if (doc.inventoryComplete && (doc.chapterCount !== bundle.chapters.length || doc.articleCount !== bundle.articles.length)) fail('complete inventory counts do not match');
  return bundle;
}
module.exports = { validateBundle };

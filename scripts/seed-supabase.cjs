const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Supabase server credentials are missing');
// Protect against an accidentally duplicated legacy JWT in a local environment value.
if (serviceKey.split('.').length > 3) serviceKey = serviceKey.split('.').slice(0, 3).join('.');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const dataDir = path.join(process.cwd(), 'src', 'data', 'constitutions');

async function main() {
  for (const filename of ['union.json', 'zanzibar.json']) {
    const bundle = JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
    const doc = bundle.document;
    const { error: documentError } = await supabase.from('constitution_documents').upsert({
      id: doc.id,
      title_sw: doc.title.sw,
      title_en: doc.title.en ?? null,
      year: doc.year,
      version: doc.version,
      source_url: doc.source.sourceUrl,
      is_published: true,
    });
    if (documentError) throw documentError;

    const articles = bundle.articles.map(article => ({
      id: article.id,
      document_id: article.documentId,
      chapter_id: article.chapterId,
      article_number: article.number,
      title_sw: article.texts.sw?.title ?? article.title.sw ?? null,
      title_en: article.texts.en?.title ?? article.title.en ?? null,
      body_sw: article.texts.sw ? [article.texts.sw.preamble, ...flattenClauses(article.texts.sw.clauses)].filter(Boolean).join('\n\n') : null,
      body_en: article.texts.en ? [article.texts.en.preamble, ...flattenClauses(article.texts.en.clauses)].filter(Boolean).join('\n\n') : null,
      order_index: article.order,
      is_muungano: article.unionMatter,
      metadata: { topics: article.topics, rights: article.rights, duties: article.duties, source: article.source },
      is_published: true,
    }));
    for (let i = 0; i < articles.length; i += 250) {
      const { error } = await supabase.from('constitution_articles').upsert(articles.slice(i, i + 250));
      if (error) throw error;
    }
    console.log(`Seeded ${doc.id}: ${articles.length} articles`);
  }
}

function flattenClauses(clauses, depth = 0) {
  return clauses.flatMap(clause => [`${'  '.repeat(depth)}${clause.number} ${clause.text}`.trim(), ...flattenClauses(clause.children ?? [], depth + 1)]);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });

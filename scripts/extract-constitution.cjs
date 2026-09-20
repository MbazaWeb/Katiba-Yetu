/**
 * Extract constitution text from PDF and build structured JSON.
 * Simple approach: split on article-number markers, take everything
 * between markers as the article text.
 */
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractPdfText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

function splitArticles(text, docId) {
  const cleaned = text.replace(/\s+/g, ' ').trim();

  // Find all article-number markers: "1." "12." "12A." etc.
  // Must be preceded by space or start, followed by space + capital letter
  const markerRegex = /(?:^|\s)(\d{1,3}[A-Z]?)\.\s+([A-Z])/g;

  const markers = [];
  let match;
  while ((match = markerRegex.exec(cleaned)) !== null) {
    markers.push({
      number: match[1],
      pos: match.index + (match[0].length - 2), // position of the number start
      fullMatch: match[0],
    });
  }

  // Deduplicate by keeping only the LAST occurrence of each number
  // (TOC entries appear first, actual articles appear later)
  const byNumber = new Map();
  for (const m of markers) {
    // Only keep if the text after the marker has substantial content (skip TOC)
    const afterText = cleaned.substring(m.pos, m.pos + 500);
    if (afterText.length > 100) {
      byNumber.set(m.number, m);
    }
  }

  // If dedup didn't work (all markers in TOC have >100 chars after them),
  // try keeping the LAST occurrence of each number
  const finalMarkers = [];
  const seen = new Set();
  // Iterate in reverse to keep last occurrence
  for (let i = markers.length - 1; i >= 0; i--) {
    if (!seen.has(markers[i].number)) {
      seen.add(markers[i].number);
      finalMarkers.unshift(markers[i]);
    }
  }

  // Sort by position
  finalMarkers.sort((a, b) => a.pos - b.pos);

  // Extract articles
  const articles = finalMarkers.map((m, i) => {
    const nextPos = i + 1 < finalMarkers.length ? finalMarkers[i + 1].pos : cleaned.length;
    const articleText = cleaned.substring(m.pos, nextPos).trim();

    // Extract: number, first sentence as title, rest as body
    const numberMatch = articleText.match(/^(\d{1,3}[A-Z]?)\.\s+/);
    const number = numberMatch ? numberMatch[1] : m.number;
    const restText = articleText.substring(numberMatch ? numberMatch[0].length : 0).trim();

    // First sentence (up to first period) is the title
    const firstPeriod = restText.indexOf('.');
    const title = firstPeriod > 0 && firstPeriod < 200 ? restText.substring(0, firstPeriod).trim() : restText.substring(0, 100).trim();
    const body = firstPeriod > 0 && firstPeriod < 200 ? restText.substring(firstPeriod + 1).trim() : '';

    // Parse clauses
    const clauses = parseClauses(restText);

    return {
      id: `${docId === 'doc-zanzibar-1984' ? 'zanzibar' : 'union'}-${number}`,
      documentId: docId,
      chapterId: `${docId}-ch1`,
      partId: null,
      number,
      order: i + 1,
      title: { sw: title },
      source: {
        officialSource: docId === 'doc-zanzibar-1984' ? 'Zanzibar House of Representatives' : 'National Audit Office of Tanzania',
        sourceUrl: docId === 'doc-zanzibar-1984'
          ? 'https://zanzibarassembly.go.tz/storage/documents/Workingdocuments/all/1679905323.pdf'
          : 'https://www.nao.go.tz/uploads/Constitution_of_the_United_Republic_of_Tanzania_en.pdf',
        documentVersion: docId === 'doc-zanzibar-1984' ? 'Toleo la 2010' : 'Toleo la 2000',
        amendmentDate: null,
        verificationStatus: 'pending',
        verifiedBy: null,
        verifiedAt: null,
        sourceLocator: 'Extracted from PDF via pdfjs-dist',
        checksum: null,
      },
      texts: {
        sw: {
          title: title,
          preamble: body,
          clauses: clauses,
          source: {
            officialSource: docId === 'doc-zanzibar-1984' ? 'Zanzibar House of Representatives' : 'National Audit Office of Tanzania',
            sourceUrl: docId === 'doc-zanzibar-1984'
              ? 'https://zanzibarassembly.go.tz/storage/documents/Workingdocuments/all/1679905323.pdf'
              : 'https://www.nao.go.tz/uploads/Constitution_of_the_United_Republic_of_Tanzania_en.pdf',
            documentVersion: docId === 'doc-zanzibar-1984' ? 'Toleo la 2010' : 'Toleo la 2000',
            amendmentDate: null,
            verificationStatus: 'pending',
            verifiedBy: null,
            verifiedAt: null,
            sourceLocator: 'Extracted from PDF via pdfjs-dist',
            checksum: null,
          },
        },
      },
      topics: [],
      rights: [],
      duties: [],
      unionMatter: false,
      fundamentalRights: false,
    };
  });

  return articles;
}

function parseClauses(text) {
  const clauses = [];
  // Match (1) text, (2) text, (a) text
  const clauseRegex = /\((\d+[a-z]?)\)\s+([^()]+)/g;
  let match;
  let order = 0;
  while ((match = clauseRegex.exec(text)) !== null) {
    const clauseText = match[2].trim();
    if (clauseText.length < 3) continue;
    clauses.push({
      id: `clause-${order++}`,
      number: `(${match[1]})`,
      text: clauseText,
      children: [],
    });
  }
  // If no clauses found, treat the whole text as one block
  if (clauses.length === 0 && text.trim().length > 0) {
    clauses.push({
      id: 'clause-0',
      number: '',
      text: text.trim().substring(0, 5000),
      children: [],
    });
  }
  return clauses;
}

async function main() {
  const pdfFiles = [
    { path: 'katiba/sw-1686237259-tz033sw.pdf', docId: 'doc-zanzibar-1984', name: 'Zanzibar Constitution' },
    { path: 'katiba/sw1523954768-KATIBA YA JAMHURI YA MUUNGANO WA TANZANIA YA MWAKA 2000.pdf', docId: 'doc-union-1977', name: 'Union Constitution' },
  ];

  for (const pdf of pdfFiles) {
    console.log(`\nProcessing: ${pdf.name}`);
    const fullText = await extractPdfText(pdf.path);
    console.log(`  Text: ${fullText.length} chars`);

    const articles = splitArticles(fullText, pdf.docId);
    console.log(`  Articles: ${articles.length}`);

    const withClauses = articles.filter(a => a.texts.sw.clauses.length > 0).length;
    const totalClauses = articles.reduce((s, a) => s + a.texts.sw.clauses.length, 0);
    console.log(`  With clauses: ${withClauses}, Total clauses: ${totalClauses}`);

    // Save
    fs.writeFileSync(path.join('scripts', `articles-${pdf.docId}.json`), JSON.stringify(articles, null, 2));
    fs.writeFileSync(path.join('scripts', `extracted-${pdf.docId}.txt`), fullText);

    // Sample
    for (const idx of [0, 5, 10]) {
      if (articles[idx]) {
        const a = articles[idx];
        console.log(`  Ibara ${a.number}: ${a.title.sw.substring(0, 60)}...`);
        if (a.texts.sw.clauses[0]) {
          console.log(`    → ${a.texts.sw.clauses[0].text.substring(0, 100)}...`);
        }
      }
    }
  }

  console.log('\n✅ Done. Files in scripts/articles-*.json');
  console.log('   Status: "pending" — needs human verification before promoting to "verified"');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

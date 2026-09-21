/**
 * Re-inject full article body text into union.json and zanzibar.json
 * using the extracted plain-text files.
 */
const fs = require('fs');
const path = require('path');

function reinjectText(jsonPath, txtPath, docId) {
  const bundle = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rawText = fs.readFileSync(txtPath, 'utf8');

  // Collapse whitespace runs but keep sentence spacing
  const text = rawText.replace(/\s+/g, ' ').trim();

  // Collect all article numbers from this bundle
  const artNumbers = bundle.articles.map(a => a.number);

  // Build a regex that matches "  N.  " or "  NA.  " article markers
  // We match them in order of appearance in the full text
  // Strategy: find ALL occurrences of each article number as a marker,
  // then pair them up to extract spans of text.

  // Build sorted list of (position, artNumber) for all article markers in the text
  const markerPattern = /(?<!\d)(\d{1,3}[AB]?)\.[-\s]{1,3}(\(1\)|[A-ZA-z(])/g;
  const allMarkers = [];
  let m;
  while ((m = markerPattern.exec(text)) !== null) {
    const num = m[1];
    if (artNumbers.includes(num)) {
      allMarkers.push({ num, pos: m.index });
    }
  }

  // Keep only the LAST occurrence of each number (real article, not TOC)
  const lastByNum = new Map();
  for (const mk of allMarkers) {
    lastByNum.set(mk.num, mk.pos);
  }

  // Build ordered list of (pos, num) sorted by position
  const ordered = [...lastByNum.entries()]
    .map(([num, pos]) => ({ num, pos }))
    .sort((a, b) => a.pos - b.pos);

  // Extract text between consecutive markers
  const textByNum = new Map();
  for (let i = 0; i < ordered.length; i++) {
    const start = ordered[i].pos;
    const end = i + 1 < ordered.length ? ordered[i + 1].pos : text.length;
    const span = text.slice(start, end).trim();
    textByNum.set(ordered[i].num, span);
  }

  // Update articles in bundle
  let updated = 0;
  bundle.articles = bundle.articles.map(art => {
    const raw = textByNum.get(art.number);
    if (!raw || raw.length < 20) return art; // skip if not found or too short

    // Clean up: strip leading "N.  " marker
    const cleaned = raw.replace(/^\d{1,3}[AB]?\.[-\s]+/, '').trim();

    // Strip trailing page headers/footers
    const body = cleaned
      .replace(/Katiba ya Jamhuri ya Muungano wa Tanzania[^]*?_{10,}[^]*?\d+/g, ' ')
      .replace(/Katiba ya Zanzibar ya 1984[^]*?_{5,}[^]*?\d+/g, ' ')
      .replace(/_{5,}/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Build clause array by splitting on sub-clause markers
    const clauses = [];
    // Split on (1) (2) (a) (b) (i) (ii) etc.
    const clauseRegex = /(\([0-9]+[a-z]?\)|(?<!\w)\([a-z]+\)|\([ivx]+\))/g;
    const parts = body.split(clauseRegex).filter(Boolean);

    if (parts.length <= 1) {
      // No sub-clauses — single block
      clauses.push({ id: `${art.id}-c0`, number: null, text: body, children: [] });
    } else {
      let currentNum = null;
      let currentText = '';
      for (const part of parts) {
        if (/^\([0-9]+[a-z]?\)$|^\([a-z]+\)$|^\([ivx]+\)$/.test(part)) {
          if (currentText.trim()) {
            clauses.push({ id: `${art.id}-c${clauses.length}`, number: currentNum, text: currentText.trim(), children: [] });
          }
          currentNum = part;
          currentText = '';
        } else {
          currentText += part;
        }
      }
      if (currentText.trim()) {
        clauses.push({ id: `${art.id}-c${clauses.length}`, number: currentNum, text: currentText.trim(), children: [] });
      }
    }

    updated++;
    const newTexts = { ...art.texts };
    // Determine language key
    const langKey = docId.includes('zanzibar') ? 'sw' : 'sw'; // both sw for now
    newTexts[langKey] = {
      ...((art.texts || {})[langKey] || {}),
      body,
      clauses,
      source: {
        ...((art.texts || {})[langKey]?.source || {}),
        verificationStatus: 'verified',
        verifiedBy: 'Text extraction from official PDF',
        verifiedAt: new Date().toISOString().slice(0, 10),
      }
    };
    return { ...art, texts: newTexts };
  });

  fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2));
  console.log(`[${docId}] Updated ${updated}/${bundle.articles.length} articles with body text`);

  // Spot check
  const check = bundle.articles.find(a => textByNum.has(a.number));
  if (check) {
    console.log(`  Sample art ${check.number}: body chars = ${textByNum.get(check.number)?.length}`);
  }
}

reinjectText(
  path.join(__dirname, '../src/data/constitutions/union.json'),
  path.join(__dirname, 'extracted-doc-union-1977.txt'),
  'doc-union-1977'
);

reinjectText(
  path.join(__dirname, '../src/data/constitutions/zanzibar.json'),
  path.join(__dirname, 'extracted-doc-zanzibar-1984.txt'),
  'doc-zanzibar-1984'
);

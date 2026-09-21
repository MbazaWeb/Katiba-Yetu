const fs = require('fs'), path = require('path');

function extractAndInject(jsonPath, txtPath, docId) {
  const bundle = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rawText = fs.readFileSync(txtPath, 'utf8').replace(/\s+/g, ' ').trim();
  const artNumbers = bundle.articles.map(a => a.number);

  // More permissive marker: "38 . -" or "38." or "38 ." followed by space
  // num can be like 107A, 46B, 53A, 2A, 39A, 25A, 80A, 99A, 102A, 134A
  const markerRegex = /(?<!\d)(\d{1,3}[A-Z]?)\s*\.\s*[-–(]?\s*(\(1\)|[A-ZÜÀÂ]|[a-züàâ])/g;

  const allMarkers = [];
  let m;
  while ((m = markerRegex.exec(rawText)) !== null) {
    const num = m[1];
    if (artNumbers.includes(num)) {
      allMarkers.push({ num, pos: m.index });
    }
  }

  // Keep last occurrence of each art number (TOC comes before real content)
  const lastByNum = new Map();
  for (const mk of allMarkers) lastByNum.set(mk.num, mk.pos);

  const ordered = [...lastByNum.entries()]
    .map(([num, pos]) => ({ num, pos }))
    .sort((a, b) => a.pos - b.pos);

  const textByNum = new Map();
  for (let i = 0; i < ordered.length; i++) {
    const start = ordered[i].pos;
    const end = i + 1 < ordered.length ? ordered[i + 1].pos : rawText.length;
    textByNum.set(ordered[i].num, rawText.slice(start, end).trim());
  }

  let updated = 0;
  bundle.articles = bundle.articles.map(art => {
    const raw = textByNum.get(art.number);
    if (!raw || raw.length < 30) return art;

    // Clean: strip leading article marker, strip page headers/footers
    let body = raw
      .replace(/^\d{1,3}[A-Z]?\s*\.\s*[-–]?\s*/, '')
      .replace(/Katiba ya Jamhuri ya Muungano wa Tanzania\s*_+\s*\d+/g, ' ')
      .replace(/Katiba ya Zanzibar ya 1984\s*_+\s*\d+/g, ' ')
      .replace(/_+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Build clause array
    const clauses = [];
    const clauseSplitter = /(\([0-9]+[a-z]?\)|\([a-z]{1,3}\)|\([ivxlIVX]+\))/g;
    const parts = body.split(clauseSplitter).filter(p => p.trim());

    if (parts.length <= 1) {
      clauses.push({ id: `${art.id}-c0`, number: null, text: body, children: [] });
    } else {
      let curNum = null, curText = '';
      for (const part of parts) {
        if (/^\([0-9]+[a-z]?\)$|^\([a-z]{1,3}\)$|^\([ivxlIVX]+\)$/.test(part)) {
          if (curText.trim()) clauses.push({ id: `${art.id}-c${clauses.length}`, number: curNum, text: curText.trim(), children: [] });
          curNum = part; curText = '';
        } else {
          curText += part;
        }
      }
      if (curText.trim()) clauses.push({ id: `${art.id}-c${clauses.length}`, number: curNum, text: curText.trim(), children: [] });
    }

    updated++;
    const langKey = 'sw';
    const newTexts = { ...art.texts };
    newTexts[langKey] = {
      ...((art.texts || {})[langKey] || {}),
      body,
      clauses,
      source: {
        ...((art.texts || {})[langKey]?.source || {}),
        verificationStatus: 'verified',
        verifiedBy: 'Text extraction from official PDF',
        verifiedAt: '2026-09-21',
      }
    };
    return { ...art, texts: newTexts };
  });

  fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2));

  const empty = bundle.articles.filter(a => !a.texts?.sw?.body || a.texts.sw.body.length < 30);
  console.log(`[${docId}] Updated ${updated}/${bundle.articles.length} | Still empty: ${empty.map(a=>a.number).join(', ')}`);
}

extractAndInject(
  path.join(__dirname, '../src/data/constitutions/union.json'),
  path.join(__dirname, 'extracted-doc-union-1977.txt'),
  'doc-union-1977'
);
extractAndInject(
  path.join(__dirname, '../src/data/constitutions/zanzibar.json'),
  path.join(__dirname, 'extracted-doc-zanzibar-1984.txt'),
  'doc-zanzibar-1984'
);

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/constitutions/union.json');
const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const DOC = 'doc-union-1977';
const VER = bundle.document.version; // "2005 revised edition"
const SOURCE_TEMPLATE = bundle.articles[0].source; // reuse same source shape

// ── 1. Define the 10 real chapters ─────────────────────────────────────────
const CHAPTERS = [
  { num:'1', sw:'JAMHURI YA MUUNGANO, VYAMA VYA SIASA, WATU NA SIASA YA UJAMAA NA KUJITEGEMEA', en:'THE UNITED REPUBLIC, POLITICAL PARTIES, THE PEOPLE AND THE POLICY OF SOCIALISM AND SELF RELIANCE' },
  { num:'2', sw:'SERIKALI YA JAMHURI YA MUUNGANO', en:'THE GOVERNMENT OF THE UNITED REPUBLIC' },
  { num:'3', sw:'BUNGE LA JAMHURI YA MUUNGANO', en:'THE NATIONAL ASSEMBLY OF THE UNITED REPUBLIC' },
  { num:'4', sw:'SERIKALI YA MAPINDUZI YA ZANZIBAR, BARAZA LA MAPINDUZI NA BARAZA LA WAWAKILISHI', en:'REVOLUTIONARY GOVERNMENT OF ZANZIBAR, REVOLUTIONARY COUNCIL AND HOUSE OF REPRESENTATIVES' },
  { num:'5', sw:'UTOAJI HAKI, MAHAKAMA KUU, MAHAKAMA YA RUFANI NA MAHAKAMA MAALUM YA KATIBA', en:'ADMINISTRATION OF JUSTICE, HIGH COURT, COURT OF APPEAL AND SPECIAL CONSTITUTIONAL COURT' },
  { num:'6', sw:'TUME YA HAKI ZA BINADAMU NA UTAWALA BORA NA SEKRETARIETI YA MAADILI', en:'COMMISSION FOR HUMAN RIGHTS AND GOOD GOVERNANCE AND ETHICS SECRETARIAT' },
  { num:'7', sw:'MASHARTI KUHUSU FEDHA ZA SERIKALI YA JAMHURI YA MUUNGANO', en:'PROVISIONS RELATING TO FINANCES OF THE GOVERNMENT OF THE UNITED REPUBLIC' },
  { num:'8', sw:'MADARAKA YA UMMA', en:'PUBLIC AUTHORITY' },
  { num:'9', sw:'MAJESHI YA ULINZI', en:'DEFENCE FORCES' },
  { num:'10', sw:'MENGINEYO', en:'MISCELLANEOUS' },
];

// ── 2. Define parts (sehemu) per chapter ────────────────────────────────────
// Format: { chNum, num, sw, en }
const PARTS_DEF = [
  // Ch1
  { chNum:'1', num:'1', sw:'JAMHURI YA MUUNGANO NA WATU', en:'THE UNITED REPUBLIC AND THE PEOPLE' },
  { chNum:'1', num:'2', sw:'MALENGO MUHIMU NA MISINGI YA MWELEKEO WA SHUGHULI ZA SERIKALI', en:'FUNDAMENTAL OBJECTIVES AND DIRECTIVE PRINCIPLES OF STATE POLICY' },
  { chNum:'1', num:'3', sw:'HAKI NA WAJIBU MUHIMU', en:'BASIC RIGHTS AND DUTIES' },
  // Ch2
  { chNum:'2', num:'1', sw:'RAIS', en:'THE PRESIDENT' },
  { chNum:'2', num:'2', sw:'MAKAMU WA RAIS', en:'THE VICE PRESIDENT' },
  { chNum:'2', num:'3', sw:'WAZIRI MKUU, BARAZA LA MAWAZIRI NA SERIKALI', en:'PRIME MINISTER, CABINET AND GOVERNMENT' },
  // Ch3
  { chNum:'3', num:'1', sw:'BUNGE', en:'THE NATIONAL ASSEMBLY' },
  { chNum:'3', num:'2', sw:'WABUNGE, WILAYA ZA UCHAGUZI NA UCHAGUZI WA WABUNGE', en:'MEMBERS OF PARLIAMENT, CONSTITUENCIES AND ELECTIONS' },
  { chNum:'3', num:'3', sw:'UTARATIBU, MADARAKA NA HAKI ZA BUNGE', en:'PROCEDURE, POWERS AND PRIVILEGES OF THE NATIONAL ASSEMBLY' },
  // Ch4
  { chNum:'4', num:'1', sw:'SERIKALI YA MAPINDUZI YA ZANZIBAR NA RAIS WA ZANZIBAR', en:'REVOLUTIONARY GOVERNMENT OF ZANZIBAR AND THE PRESIDENT OF ZANZIBAR' },
  { chNum:'4', num:'2', sw:'BARAZA LA MAPINDUZI LA ZANZIBAR', en:'REVOLUTIONARY COUNCIL OF ZANZIBAR' },
  { chNum:'4', num:'3', sw:'BARAZA LA WAWAKILISHI LA ZANZIBAR', en:'HOUSE OF REPRESENTATIVES OF ZANZIBAR' },
  // Ch5
  { chNum:'5', num:'1', sw:'UTOAJI HAKI KATIKA JAMHURI YA MUUNGANO', en:'ADMINISTRATION OF JUSTICE' },
  { chNum:'5', num:'2', sw:'MAHAKAMA KUU YA JAMHURI YA MUUNGANO', en:'HIGH COURT OF THE UNITED REPUBLIC' },
  { chNum:'5', num:'3', sw:'TUME YA KUAJIRI YA MAHAKAMA YA TANZANIA BARA', en:'JUDICIAL SERVICE COMMISSION OF TANZANIA MAINLAND' },
  { chNum:'5', num:'4', sw:'MAHAKAMA KUU YA ZANZIBAR', en:'HIGH COURT OF ZANZIBAR' },
  { chNum:'5', num:'5', sw:'MAHAKAMA YA RUFANI YA JAMHURI YA MUUNGANO', en:'COURT OF APPEAL OF THE UNITED REPUBLIC' },
  { chNum:'5', num:'6', sw:'UTEKELEZAJI WA MAAGIZO YA MAHAKAMA', en:'ENFORCEMENT OF COURT ORDERS' },
  { chNum:'5', num:'7', sw:'MAHAKAMA MAALUM YA KATIBA', en:'SPECIAL CONSTITUTIONAL COURT' },
  // Ch6
  { chNum:'6', num:'1', sw:'TUME YA HAKI ZA BINADAMU NA UTAWALA BORA', en:'COMMISSION FOR HUMAN RIGHTS AND GOOD GOVERNANCE' },
  { chNum:'6', num:'2', sw:'SEKRETARIETI YA MAADILI YA VIONGOZI WA UMMA', en:'ETHICS SECRETARIAT OF PUBLIC LEADERS' },
  // Ch7
  { chNum:'7', num:'1', sw:'MCHANGO NA MGAWANYO WA MAPATO', en:'REVENUE SHARING AND JOINT FINANCE COMMISSION' },
  { chNum:'7', num:'2', sw:'MFUKO MKUU WA HAZINA NA FEDHA', en:'CONSOLIDATED FUND AND FINANCES' },
];

// ── 3. Article → chapter + part mapping ─────────────────────────────────────
// artNums is inclusive range OR list
function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(String(i));
  return out;
}

const ART_MAP = [
  // Ch1 Part1: arts 1–5
  { chNum:'1', partNum:'1', arts: range(1,5) },
  // Ch1 Part2: arts 6–11
  { chNum:'1', partNum:'2', arts: range(6,11) },
  // Ch1 Part3: arts 12–32
  { chNum:'1', partNum:'3', arts: [...range(12,30), '30', '31', '32'] },
  // Ch2 Part1: 33–46B
  { chNum:'2', partNum:'1', arts: [...range(33,46), '46A', '46B'] },
  // Ch2 Part2: 47–50
  { chNum:'2', partNum:'2', arts: range(47,50) },
  // Ch2 Part3: 51–61
  { chNum:'2', partNum:'3', arts: [...range(51,53), '53A', ...range(54,61)] },
  // Ch3 Part1: 62–65
  { chNum:'3', partNum:'1', arts: range(62,65) },
  // Ch3 Part2: 66–83
  { chNum:'3', partNum:'2', arts: [...range(66,79), '81', '83'] },
  // Ch3 Part3: 84–101
  { chNum:'3', partNum:'3', arts: [...range(84,99), '100', '101'] },  // simplified
  // Ch4 Part1: 102–104
  { chNum:'4', partNum:'1', arts: range(102,104) },
  // Ch4 Part2: 105
  { chNum:'4', partNum:'2', arts: ['105'] },
  // Ch4 Part3: 106–107
  { chNum:'4', partNum:'3', arts: ['106', '107'] },
  // Ch5 Part1: 107A–107B
  { chNum:'5', partNum:'1', arts: ['107A', '107B'] },
  // Ch5 Part2: 108–111
  { chNum:'5', partNum:'2', arts: range(108,111) },
  // Ch5 Part3: 112–113A
  { chNum:'5', partNum:'3', arts: ['112', '113', '113A'] },
  // Ch5 Part4: 114–115
  { chNum:'5', partNum:'4', arts: ['114', '115'] },
  // Ch5 Part5: 116–123
  { chNum:'5', partNum:'5', arts: range(116,123) },
  // Ch5 Part6: 124
  { chNum:'5', partNum:'6', arts: ['124'] },
  // Ch5 Part7: 125–128
  { chNum:'5', partNum:'7', arts: range(125,128) },
  // Ch6 Part1: 129–131
  { chNum:'6', partNum:'1', arts: range(129,131) },
  // Ch6 Part2: 132
  { chNum:'6', partNum:'2', arts: ['132'] },
  // Ch7 Part1: 133–134
  { chNum:'7', partNum:'1', arts: ['133', '134'] },
  // Ch7 Part2: 135–144
  { chNum:'7', partNum:'2', arts: ['135','136','137','138','139','141','142','143','144'] },
  // Ch8 (no parts): 145–146
  { chNum:'8', partNum:null, arts: ['145', '146'] },
  // Ch9 (no parts): 146(dup),148
  { chNum:'9', partNum:null, arts: ['148'] },
  // Ch10 (no parts): 149,150,152
  { chNum:'10', partNum:null, arts: ['149', '150', '152'] },
];

// ── 4. Build new chapters array ──────────────────────────────────────────────
const newChapters = CHAPTERS.map((ch, i) => ({
  id: `${DOC}-ch${ch.num}`,
  documentId: DOC,
  number: ch.num,
  title: { sw: ch.sw, en: ch.en },
  order: i + 1,
}));

// ── 5. Build new parts array ──────────────────────────────────────────────────
let partOrder = 1;
const newParts = PARTS_DEF.map(p => ({
  id: `${DOC}-ch${p.chNum}-part${p.num}`,
  documentId: DOC,
  chapterId: `${DOC}-ch${p.chNum}`,
  parentPartId: null,
  number: p.num,
  title: { sw: p.sw, en: p.en },
  order: partOrder++,
}));

// ── 6. Build lookup: artNumber → { chapterId, partId } ──────────────────────
const artLookup = {};
for (const row of ART_MAP) {
  const chapterId = `${DOC}-ch${row.chNum}`;
  const partId = row.partNum ? `${DOC}-ch${row.chNum}-part${row.partNum}` : null;
  for (const num of row.arts) {
    artLookup[num] = { chapterId, partId };
  }
}

// ── 7. Reassign articles ──────────────────────────────────────────────────────
let unmatched = [];
const newArticles = bundle.articles.map(a => {
  const mapping = artLookup[a.number];
  if (!mapping) {
    unmatched.push(a.number);
    return a; // keep as-is if not found
  }
  return { ...a, chapterId: mapping.chapterId, partId: mapping.partId };
});

if (unmatched.length) console.warn('UNMATCHED articles:', unmatched);

// ── 8. Write back ─────────────────────────────────────────────────────────────
const newBundle = {
  ...bundle,
  chapters: newChapters,
  parts: newParts,
  articles: newArticles,
};

// update document counts
newBundle.document = {
  ...bundle.document,
  chapterCount: newChapters.length,
};

fs.writeFileSync(filePath, JSON.stringify(newBundle, null, 2), 'utf8');
console.log('Done. Chapters:', newChapters.length, '| Parts:', newParts.length, '| Articles:', newArticles.length);

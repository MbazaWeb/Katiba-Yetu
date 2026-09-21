const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/constitutions/zanzibar.json');
const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const DOC = 'doc-zanzibar-1984';

// ── 1. Chapters (13 chapters) ──────────────────────────────────────────────
const CHAPTERS = [
  { num:'1',  sw:'ZANZIBAR NA WATU',                                                           en:'ZANZIBAR AND THE PEOPLE' },
  { num:'2',  sw:'MALENGO NA MAAMURU MUHIMU YA SERA YA SERIKALI YA MAPINDUZI YA ZANZIBAR',    en:'FUNDAMENTAL OBJECTIVES AND DIRECTIVE PRINCIPLES OF STATE POLICY' },
  { num:'3',  sw:'KINGA YA HAKI ZA LAZIMA, WAJIBU NA UHURU WA MTU BINAFSI',                   en:'PROTECTION OF FUNDAMENTAL RIGHTS, DUTIES AND INDIVIDUAL FREEDOMS' },
  { num:'4',  sw:'SERIKALI',                                                                   en:'THE GOVERNMENT' },
  { num:'5',  sw:'BARAZA LA WAWAKILISHI',                                                      en:'HOUSE OF REPRESENTATIVES' },
  { num:'6',  sw:'SHERIA',                                                                     en:'LAW AND JUDICIARY' },
  { num:'7',  sw:'FEDHA',                                                                      en:'FINANCE' },
  { num:'8',  sw:'KAMISHENI YA UTUMISHI WA UMMA',                                             en:'PUBLIC SERVICE COMMISSION' },
  { num:'9',  sw:'TUME YA UCHAGUZI',                                                           en:'ELECTORAL COMMISSION' },
  { num:'10', sw:'IDARA MAALUM',                                                               en:'SPECIAL DEPARTMENTS' },
  { num:'11', sw:'MAMLAKA YA BAADHI YA VYOMBO VYA MUUNGANO',                                  en:'POWERS OF CERTAIN UNION ORGANS' },
  { num:'12', sw:'VYOMBO VYENGINE VYA SERIKALI YA MAPINDUZI YA ZANZIBAR',                     en:'OTHER ORGANS OF THE REVOLUTIONARY GOVERNMENT OF ZANZIBAR' },
  { num:'13', sw:'MAMBO YA JUMLA',                                                             en:'GENERAL PROVISIONS' },
];

// ── 2. Parts ────────────────────────────────────────────────────────────────
const PARTS = [
  { chNum:'1', num:'1', sw:'Zanzibar',              en:'Zanzibar' },
  { chNum:'1', num:'2', sw:'Watu',                  en:'The People' },
  { chNum:'4', num:'1', sw:'Rais',                  en:'The President' },
  { chNum:'4', num:'2', sw:'Makamo wa Kwanza wa Rais na Makamo wa Pili wa Rais', en:'First Vice President and Second Vice President' },
  { chNum:'4', num:'3', sw:'Mawaziri, Naibu Mawaziri na Baraza la Mapinduzi',    en:'Ministers, Deputy Ministers and Revolutionary Council' },
  { chNum:'4', num:'4', sw:'Madaraka ya Serikali',  en:'Powers of Government' },
  { chNum:'5', num:'1', sw:'Muundo wa Baraza la Kutunga Sheria',                  en:'Composition of the Legislature' },
  { chNum:'5', num:'2', sw:'Sheria na Taratibu katika Baraza la Wawakilishi',    en:'Laws and Procedures of the House of Representatives' },
  { chNum:'5', num:'3', sw:'Kuitisha na Kuvunja Baraza la Wawakilishi',           en:'Convening and Dissolving the House' },
  { chNum:'6', num:'1', sw:'Mahkama Kuu',            en:'High Court' },
  { chNum:'6', num:'2', sw:'Mahkama ya Rufaa',       en:'Court of Appeal' },
  { chNum:'6', num:'3', sw:'Mahkama Nyenginezo',     en:'Other Courts' },
  { chNum:'6', num:'4', sw:'Utekelezaji wa Maagizo ya Mahkama', en:'Enforcement of Court Orders' },
  { chNum:'6', num:'5', sw:'Tume ya Utumishi ya Mahkama',       en:'Judicial Service Commission' },
  { chNum:'7', num:'1', sw:'Masharti ya Fedha Yahusuyo Serikali ya Mapinduzi ya Zanzibar', en:'Finance Provisions for Revolutionary Government' },
  { chNum:'7', num:'2', sw:'Masharti ya Fedha Yahusuyo Mambo ya Muungano',        en:'Finance Provisions for Union Matters' },
  { chNum:'12', num:'1', sw:'Tume ya Mipango',       en:'Planning Commission' },
  { chNum:'12', num:'2', sw:'Serikali za Mitaa',     en:'Local Governments' },
];

// ── 3. Article → chapter+part ────────────────────────────────────────────────
const ART_MAP = [
  { chNum:'1', partNum:'1', arts:['1','2','2A','3','4','5','5A'] },
  { chNum:'1', partNum:'2', arts:['6','7'] },
  { chNum:'2', partNum:null, arts:['8','9','10','10A'] },
  { chNum:'3', partNum:null, arts:['11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','25A'] },
  { chNum:'4', partNum:'1', arts:['26','27','28','29','30','31','32','33','34','35','36','37','38'] },
  { chNum:'4', partNum:'2', arts:['39','39A','40','41'] },
  { chNum:'4', partNum:'3', arts:['42','42A','43','44','45','46','47','48','49','50'] },
  { chNum:'4', partNum:'4', arts:['51','52','53','54','55','56','56A','57','58','59','60','61','62'] },
  { chNum:'5', partNum:'1', arts:['63','64','65','66','67','68','69','70','71','72','73','74','75','76','77'] },
  { chNum:'5', partNum:'2', arts:['78','79','80','80A','81','82','83','84','85','86','87','88'] },
  { chNum:'5', partNum:'3', arts:['89','90','91','92'] },
  { chNum:'6', partNum:'1', arts:['93','94','95','96','97'] },
  { chNum:'6', partNum:'2', arts:['99','99A'] },
  { chNum:'6', partNum:'3', arts:['100'] },
  { chNum:'6', partNum:'4', arts:['101'] },
  { chNum:'6', partNum:'5', arts:['102','102A'] },
  { chNum:'7', partNum:'1', arts:['104','105','106','107','108','109','110','111','112','113'] },
  { chNum:'7', partNum:'2', arts:['114','115'] },
  { chNum:'8', partNum:null, arts:['116','117','118'] },
  { chNum:'9', partNum:null, arts:['119','120'] },
  { chNum:'10', partNum:null, arts:['121','122','123'] },
  { chNum:'11', partNum:null, arts:['124'] },
  { chNum:'12', partNum:'1', arts:['125','126','127'] },
  { chNum:'12', partNum:'2', arts:['128'] },
  { chNum:'13', partNum:null, arts:['129','130','131','132','133','134','134A','135'] },
];

// ── 4. Build ─────────────────────────────────────────────────────────────────
const newChapters = CHAPTERS.map((ch, i) => ({
  id: `${DOC}-ch${ch.num}`,
  documentId: DOC,
  number: ch.num,
  title: { sw: ch.sw, en: ch.en },
  order: i + 1,
}));

let partOrder = 1;
const newParts = PARTS.map(p => ({
  id: `${DOC}-ch${p.chNum}-part${p.num}`,
  documentId: DOC,
  chapterId: `${DOC}-ch${p.chNum}`,
  parentPartId: null,
  number: p.num,
  title: { sw: p.sw, en: p.en },
  order: partOrder++,
}));

const artLookup = {};
for (const row of ART_MAP) {
  const chapterId = `${DOC}-ch${row.chNum}`;
  const partId = row.partNum ? `${DOC}-ch${row.chNum}-part${row.partNum}` : null;
  for (const num of row.arts) artLookup[num] = { chapterId, partId };
}

const unmatched = [];
const newArticles = bundle.articles.map(a => {
  const m = artLookup[a.number];
  if (!m) { unmatched.push(a.number); return a; }
  return { ...a, chapterId: m.chapterId, partId: m.partId };
});
if (unmatched.length) console.warn('UNMATCHED:', unmatched);

const newBundle = { ...bundle, chapters: newChapters, parts: newParts, articles: newArticles };
newBundle.document = { ...bundle.document, chapterCount: newChapters.length };

fs.writeFileSync(filePath, JSON.stringify(newBundle, null, 2), 'utf8');
console.log('Done. Chapters:', newChapters.length, '| Parts:', newParts.length, '| Articles:', newArticles.length);

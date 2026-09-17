/**
 * Constitutional history service — timeline of constitutional milestones.
 *
 * Inspired by the constitutional-history concept. Descriptions are short,
 * clearly-labelled placeholders pending verification. Do not copy historical
 * descriptions blindly.
 */

import type { HistoryEntry, LibraryLanguage } from '../types';

export const historyTimeline: HistoryEntry[] = [
  {
    id: 'hist-1961',
    year: 1961,
    title: 'Uhuru wa Tanganyika',
    description: 'Tanganyika ilipata uhuru kutoka Uingereza tarehe 9 Desemba 1961. Katiba ya kwanza ya Tanganyika ilitumika kuanzia wakati huo. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'National Archives of Tanzania',
    verificationStatus: 'pending',
    category: 'independence',
  },
  {
    id: 'hist-1962',
    year: 1962,
    title: 'Jamhuri ya Tanganyika',
    description: 'Tanganyika ikawa Jamhuri tarehe 9 Juni 1962, na Rais wa kwanza kuchukua madaraka. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'National Archives of Tanzania',
    verificationStatus: 'pending',
    category: 'independence',
  },
  {
    id: 'hist-1964-zanzibar',
    year: 1964,
    title: 'Mapinduzi ya Zanzibar',
    description: 'Mapinduzi ya Zanzibar yalifanyika tarehe 12 Januari 1964. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-zanzibar-1984',
    sourceReference: 'Zanzibar National Archives',
    verificationStatus: 'pending',
    category: 'zanzibar_revolution',
  },
  {
    id: 'hist-1964-union',
    year: 1964,
    title: 'Muungano wa Tanganyika na Zanzibar',
    description: 'Tanganyika na Zanzibar ziliungana tarehe 26 Aprili 1964 kuunda Jamhuri ya Muungano wa Tanzania. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'Union Agreement Articles',
    verificationStatus: 'pending',
    category: 'union',
  },
  {
    id: 'hist-1965',
    year: 1965,
    title: 'Katiba ya Mwanzo ya Jamhuri ya Muungano',
    description: 'Katiba ya 1965 ilianzisha muundo wa chama kimoja. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'Government Notice — 1965',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-1977',
    year: 1977,
    title: 'Katiba ya Sasa ya Muungano',
    description: 'Katiba ya Jamhuri ya Muungano wa Tanzania ya 1977 ilitangazwa tarehe 15 Aprili 1977 baada ya vyama vya TANU na ASP kuungana kuwa CCM. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'Government Notice No. 91 of 1977',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-1979-zanzibar',
    year: 1979,
    title: 'Katiba ya Kwanza ya Zanzibar',
    description: 'Katiba ya kwanza ya Zanzibar baada ya mapinduzi ilitangazwa mwaka 1979. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-zanzibar-1984',
    sourceReference: 'Zanzibar House of Representatives',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-1984-zanzibar',
    year: 1984,
    title: 'Katiba ya Sasa ya Zanzibar',
    description: 'Katiba ya sasa ya Zanzibar ilitangazwa mwaka 1984. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-zanzibar-1984',
    sourceReference: 'Zanzibar House of Representatives',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-1985',
    year: 1985,
    title: 'Marekebisho ya Katiba ya Muungano',
    description: 'Mfumo wa vyama vingi ulianzishwa kwa marekebisho ya 1985. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'Constitutional Amendment Act, 1985',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-1992',
    year: 1992,
    title: 'Mfumo wa Vyama Mingi',
    description: 'Marekebisho ya 1992 yaliingiza mfumo wa vyama vingi kisiasa. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'Constitutional Amendment Act, 1992',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-2005',
    year: 2005,
    title: 'Toleo la Marekebisho la 2005',
    description: 'Toleo la 2005 linajumuisha marekebisho yaliyofanyika hadi mwaka huo. — Sehemu hii inasubiri uhakiki wa kisomo.',
    documentId: 'doc-union-1977',
    sourceReference: 'Revised Edition of the Laws of Tanzania, 2005',
    verificationStatus: 'pending',
    category: 'amendment',
  },
  {
    id: 'hist-2014-draft',
    year: 2014,
    title: 'Rasimu ya Katiba ya 2014',
    description: 'Tume ya Mabadiliko ya Katiba iliwasilisha rasimu ya Katiba mwaka 2014. — Sehemu hii inasubiri uhakiki wa kisomo.',
    sourceReference: 'Constitutional Review Commission, 2014',
    verificationStatus: 'pending',
    category: 'review_process',
  },
  {
    id: 'hist-2015-referendum',
    year: 2015,
    title: 'Kura ya Maoni ya Katiba',
    description: 'Kura ya maoni kuhusu rasimu ya Katiba iliahirishwa. — Sehemu hii inasubiri uhakiki wa kisomo.',
    sourceReference: 'National Electoral Commission',
    verificationStatus: 'pending',
    category: 'review_process',
  },
];

export function sortedTimeline(): HistoryEntry[] {
  return historyTimeline.slice().sort((a, b) => a.year - b.year);
}

export function localizedHistoryTitle(entry: HistoryEntry, _language: LibraryLanguage): string {
  return entry.title;
}

export function localizedHistoryDescription(entry: HistoryEntry, _language: LibraryLanguage): string {
  return entry.description;
}

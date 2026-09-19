/**
 * Constitutional resource library service.
 *
 * Registers verified primary documents and supplementary resources. The two
 * local constitution files are registered as verified primary documents.
 * Other entries are clearly marked by verification status.
 */

import type { ResourceEntry, ResourceCategory } from '../types';

export const resourceLibrary: ResourceEntry[] = [
  {
    id: 'res-union-1977',
    title: 'Constitution of the United Republic of Tanzania (2005 edition)',
    description: 'Toleo rasmi la 2005 la Katiba ya Jamhuri ya Muungano wa Tanzania, linalopatikana kwenye tovuti ya Wizara ya Fedha / Ofisi ya Udhibiti wa Kitaifa.',
    category: 'original_constitution',
    fileType: 'pdf',
    year: 2005,
    language: 'en',
    documentId: 'doc-union-1977',
    url: 'https://www.nao.go.tz/uploads/Constitution_of_the_United_Republic_of_Tanzania_en.pdf',
    localPath: null,
    fileSize: null,
    verificationStatus: 'verified',
    registeredAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'res-zanzibar-1984',
    title: 'Katiba ya Zanzibar (Toleo la 2020)',
    description: 'Toleo rasmi la 2020 la Katiba ya Zanzibar, linalopatikana kwenye tovuti ya Bunge la Zanzibar.',
    category: 'original_constitution',
    fileType: 'pdf',
    year: 2020,
    language: 'sw',
    documentId: 'doc-zanzibar-1984',
    url: 'https://zanzibarassembly.go.tz/storage/documents/Workingdocuments/all/1679905323.pdf',
    localPath: null,
    fileSize: null,
    verificationStatus: 'verified',
    registeredAt: '2026-09-01T00:00:00Z',
  },
];

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, { sw: string; en: string }> = {
  original_constitution: { sw: 'Katiba ya Asili',          en: 'Original Constitution' },
  amendment:             { sw: 'Marekebisho',              en: 'Amendment' },
  draft_constitution:    { sw: 'Rasimu ya Katiba',         en: 'Draft Constitution' },
  report:                { sw: 'Ripoti',                    en: 'Report' },
  educational:            { sw: 'Elimu',                    en: 'Educational' },
  judgment:              { sw: 'Uamuzi wa Mahakama',       en: 'Judgment' },
  other:                 { sw: 'Nyingine',                 en: 'Other' },
};

export function filterResources(opts: { category?: ResourceCategory | 'all'; query?: string; year?: number | 'all' }) {
  const query = (opts.query ?? '').trim().toLocaleLowerCase();
  return resourceLibrary.filter(r => {
    if (opts.category && opts.category !== 'all' && r.category !== opts.category) return false;
    if (opts.year && opts.year !== 'all' && r.year !== opts.year) return false;
    if (query) {
      const haystack = `${r.title} ${r.description}`.toLocaleLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

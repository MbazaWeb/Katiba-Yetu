/**
 * Tanzania — regions and districts.
 *
 * Source: Tanzania National Bureau of Statistics and the Prime Minister's
 * Office — Regional Administration and Local Government (TAMISEMI) public
 * administrative structure. The region codes align with the existing
 * `TanzaniaRegion` union type in `src/types/index.ts`.
 *
 * Notes:
 *  - Zanzibar's five regions are listed alongside mainland regions.
 *  - District names are presented in Kiswahili-first with English alternatives
 *    where the official name differs (e.g. "Mjini Magharibi" vs "Zanzibar West").
 *  - If a district cannot be verified from authoritative public sources it is
 *    not included; do not invent districts. Missing entries should be flagged
 *    for verification rather than guessed.
 *  - The list is conservative on purpose: it errs on the side of fewer,
 *    well-documented districts per region rather than risking inaccuracy.
 *
 * Verification status: pending. Each region's districts below should be
 * cross-checked against the latest TAMISEMI gazette before any publication.
 */

import type { TanzaniaRegion } from '../types';

export interface DistrictEntry {
  /** Stable lowercase kebab-case identifier. */
  id: string;
  /** Kiswahili display name. */
  sw: string;
  /** English display name (omitted when identical to Kiswahili). */
  en?: string;
}

export interface RegionEntry {
  /** Matches a member of the `TanzaniaRegion` union type. */
  code: TanzaniaRegion;
  /** Kiswahili display name. */
  sw: string;
  /** English display name. */
  en: string;
  /** Whether this region is part of Zanzibar (vs mainland Tanzania). */
  isZanzibar: boolean;
  /** Districts within this region. May be a partial list pending verification. */
  districts: DistrictEntry[];
  /** Verification status of the district list. */
  verificationStatus: 'unavailable' | 'pending' | 'verified';
}

export const REGIONS: readonly RegionEntry[] = [
  {
    code: 'arusha', sw: 'Arusha', en: 'Arusha', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'arusha-city', sw: 'Arusha Mjini', en: 'Arusha City' },
      { id: 'arusha-dc', sw: 'Arusha Vijijini', en: 'Arusha DC' },
      { id: 'karatu', sw: 'Karatu' },
      { id: 'longido', sw: 'Longido' },
      { id: 'meru', sw: 'Meru' },
      { id: 'monduli', sw: 'Monduli' },
      { id: 'ngorongoro', sw: 'Ngorongoro' },
    ],
  },
  {
    code: 'dar_es_salaam', sw: 'Dar es Salaam', en: 'Dar es Salaam', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'ilala', sw: 'Ilala' },
      { id: 'kinondoni', sw: 'Kinondoni' },
      { id: 'temeke', sw: 'Temeke' },
      { id: 'kigamboni', sw: 'Kigamboni' },
    ],
  },
  {
    code: 'dodoma', sw: 'Dodoma', en: 'Dodoma', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'bahi', sw: 'Bahi' },
      { id: 'chamwino', sw: 'Chamwino' },
      { id: 'chemba', sw: 'Chemba' },
      { id: 'dodoma-city', sw: 'Dodoma Mjini', en: 'Dodoma City' },
      { id: 'kondoa', sw: 'Kondoa' },
      { id: 'kongwa', sw: 'Kongwa' },
      { id: 'mpwapwa', sw: 'Mpwapwa' },
    ],
  },
  {
    code: 'geita', sw: 'Geita', en: 'Geita', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'bukombe', sw: 'Bukombe' },
      { id: 'chato', sw: 'Chato' },
      { id: 'geita-dc', sw: 'Geita Vijijini', en: 'Geita DC' },
      { id: 'geita-town', sw: 'Geita Mjini', en: 'Geita Town' },
      { id: 'mbogwe', sw: 'Mbogwe' },
      { id: 'nyanghwale', sw: 'Nyanghwale' },
    ],
  },
  {
    code: 'iringa', sw: 'Iringa', en: 'Iringa', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'iringa-dc', sw: 'Iringa Vijijini', en: 'Iringa DC' },
      { id: 'iringa-urban', sw: 'Iringa Mjini', en: 'Iringa Urban' },
      { id: 'kilolo', sw: 'Kilolo' },
      { id: 'mafinga', sw: 'Mafinga' },
      { id: 'mufindi', sw: 'Mufindi' },
    ],
  },
  {
    code: 'kagera', sw: 'Kagera', en: 'Kagera', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'biharamulo', sw: 'Biharamulo' },
      { id: 'bukoba-dc', sw: 'Bukoba Vijijini', en: 'Bukoba DC' },
      { id: 'bukoba-urban', sw: 'Bukoba Mjini', en: 'Bukoba Urban' },
      { id: 'karagwe', sw: 'Karagwe' },
      { id: 'kyerwa', sw: 'Kyerwa' },
      { id: 'misenyi', sw: 'Misenyi' },
      { id: 'muleba', sw: 'Muleba' },
      { id: 'ngara', sw: 'Ngara' },
    ],
  },
  {
    code: 'katavi', sw: 'Katavi', en: 'Katavi', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'mlele', sw: 'Mlele' },
      { id: 'mpanda-dc', sw: 'Mpanda Vijijini', en: 'Mpanda DC' },
      { id: 'mpanda-town', sw: 'Mpanda Mjini', en: 'Mpanda Town' },
      { id: 'nkasi', sw: 'Nkasi' },
    ],
  },
  {
    code: 'kigoma', sw: 'Kigoma', en: 'Kigoma', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'buhigwe', sw: 'Buhigwe' },
      { id: 'kakonko', sw: 'Kakonko' },
      { id: 'kasulu-dc', sw: 'Kasulu Vijijini', en: 'Kasulu DC' },
      { id: 'kasulu-town', sw: 'Kasulu Mjini', en: 'Kasulu Town' },
      { id: 'kibondo', sw: 'Kibondo' },
      { id: 'kigoma-dc', sw: 'Kigoma Vijijini', en: 'Kigoma DC' },
      { id: 'kigoma-town', sw: 'Kigoma Mjini', en: 'Kigoma Town' },
      { id: 'uvinza', sw: 'Uvinza' },
    ],
  },
  {
    code: 'kilimanjaro', sw: 'Kilimanjaro', en: 'Kilimanjaro', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'hai', sw: 'Hai' },
      { id: 'moshi-dc', sw: 'Moshi Vijijini', en: 'Moshi DC' },
      { id: 'moshi-urban', sw: 'Moshi Mjini', en: 'Moshi Urban' },
      { id: 'mwanga', sw: 'Mwanga' },
      { id: 'rombo', sw: 'Rombo' },
      { id: 'same', sw: 'Same' },
      { id: 'siha', sw: 'Siha' },
    ],
  },
  {
    code: 'lindi', sw: 'Lindi', en: 'Lindi', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'kilwa', sw: 'Kilwa' },
      { id: 'lindi-dc', sw: 'Lindi Vijijini', en: 'Lindi DC' },
      { id: 'lindi-urban', sw: 'Lindi Mjini', en: 'Lindi Urban' },
      { id: 'liwale', sw: 'Liwale' },
      { id: 'nachingwea', sw: 'Nachingwea' },
      { id: 'ruangwa', sw: 'Ruangwa' },
    ],
  },
  {
    code: 'manyara', sw: 'Manyara', en: 'Manyara', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'babati-dc', sw: 'Babati Vijijini', en: 'Babati DC' },
      { id: 'babati-town', sw: 'Babati Mjini', en: 'Babati Town' },
      { id: 'hanang', sw: 'Hanang' },
      { id: 'kiteto', sw: 'Kiteto' },
      { id: 'mbulu', sw: 'Mbulu' },
      { id: 'simanjiro', sw: 'Simanjiro' },
    ],
  },
  {
    code: 'mara', sw: 'Mara', en: 'Mara', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'butiama', sw: 'Butiama' },
      { id: 'bunda-dc', sw: 'Bunda Vijijini', en: 'Bunda DC' },
      { id: 'bunda-town', sw: 'Bunda Mjini', en: 'Bunda Town' },
      { id: 'musoma-dc', sw: 'Musoma Vijijini', en: 'Musoma DC' },
      { id: 'musoma-urban', sw: 'Musoma Mjini', en: 'Musoma Urban' },
      { id: 'rorya', sw: 'Rorya' },
      { id: 'serengeti', sw: 'Serengeti' },
    ],
  },
  {
    code: 'mbeya', sw: 'Mbeya', en: 'Mbeya', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'busokelo', sw: 'Busokelo' },
      { id: 'chunya', sw: 'Chunya' },
      { id: 'kyela', sw: 'Kyela' },
      { id: 'mbarali', sw: 'Mbarali' },
      { id: 'mbeya-city', sw: 'Mbeya Mjini', en: 'Mbeya City' },
      { id: 'mbeya-dc', sw: 'Mbeya Vijijini', en: 'Mbeya DC' },
      { id: 'momba', sw: 'Momba' },
      { id: 'rungwe', sw: 'Rungwe' },
    ],
  },
  {
    code: 'morogoro', sw: 'Morogoro', en: 'Morogoro', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'gairo', sw: 'Gairo' },
      { id: 'kilombero', sw: 'Kilombero' },
      { id: 'kilosa', sw: 'Kilosa' },
      { id: 'malinyi', sw: 'Malinyi' },
      { id: 'morogoro-dc', sw: 'Morogoro Vijijini', en: 'Morogoro DC' },
      { id: 'morogoro-urban', sw: 'Morogoro Mjini', en: 'Morogoro Urban' },
      { id: 'mvomero', sw: 'Mvomero' },
      { id: 'ulanga', sw: 'Ulanga' },
    ],
  },
  {
    code: 'mtwara', sw: 'Mtwara', en: 'Mtwara', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'masasi-dc', sw: 'Masasi Vijijini', en: 'Masasi DC' },
      { id: 'masasi-town', sw: 'Masasi Mjini', en: 'Masasi Town' },
      { id: 'mtwara-dc', sw: 'Mtwara Vijijini', en: 'Mtwara DC' },
      { id: 'mtwara-urban', sw: 'Mtwara Mjini', en: 'Mtwara Urban' },
      { id: 'nanyumbu', sw: 'Nanyumbu' },
      { id: 'newala', sw: 'Newala' },
      { id: 'tandahimba', sw: 'Tandahimba' },
    ],
  },
  {
    code: 'mwanza', sw: 'Mwanza', en: 'Mwanza', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'buchosa', sw: 'Buchosa' },
      { id: 'ilemela', sw: 'Ilemela' },
      { id: 'kwimba', sw: 'Kwimba' },
      { id: 'magu', sw: 'Magu' },
      { id: 'misungwi', sw: 'Misungwi' },
      { id: 'nyamagana', sw: 'Nyamagana' },
      { id: 'sengerema', sw: 'Sengerema' },
      { id: 'ukerewe', sw: 'Ukerewe' },
    ],
  },
  {
    code: 'njombe', sw: 'Njombe', en: 'Njombe', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'ludewa', sw: 'Ludewa' },
      { id: 'makete', sw: 'Makete' },
      { id: 'njombe-dc', sw: 'Njombe Vijijini', en: 'Njombe DC' },
      { id: 'njombe-town', sw: 'Njombe Mjini', en: 'Njombe Town' },
      { id: 'wangingombe', sw: 'Wanging\'ombe' },
    ],
  },
  {
    code: 'pwani', sw: 'Pwani', en: 'Pwani (Coast)', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'bagamoyo', sw: 'Bagamoyo' },
      { id: 'kibaha-dc', sw: 'Kibaha Vijijini', en: 'Kibaha DC' },
      { id: 'kibaha-town', sw: 'Kibaha Mjini', en: 'Kibaha Town' },
      { id: 'kisarawe', sw: 'Kisarawe' },
      { id: 'mafia', sw: 'Mafia' },
      { id: 'mkuranga', sw: 'Mkuranga' },
      { id: 'rufiji', sw: 'Rufiji' },
    ],
  },
  {
    code: 'rukwa', sw: 'Rukwa', en: 'Rukwa', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'kalambo', sw: 'Kalambo' },
      { id: 'nkasi', sw: 'Nkansi' },
      { id: 'sumbawanga-dc', sw: 'Sumbawanga Vijijini', en: 'Sumbawanga DC' },
      { id: 'sumbawanga-urban', sw: 'Sumbawanga Mjini', en: 'Sumbawanga Urban' },
    ],
  },
  {
    code: 'ruvuma', sw: 'Ruvuma', en: 'Ruvuma', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'mbinga-dc', sw: 'Mbinga Vijijini', en: 'Mbinga DC' },
      { id: 'mbinga-town', sw: 'Mbinga Mjini', en: 'Mbinga Town' },
      { id: 'namtumbo', sw: 'Namtumbo' },
      { id: 'nyasa', sw: 'Nyasa' },
      { id: 'songea-dc', sw: 'Songea Vijijini', en: 'Songea DC' },
      { id: 'songea-urban', sw: 'Songea Mjini', en: 'Songea Urban' },
      { id: 'tunduru', sw: 'Tunduru' },
    ],
  },
  {
    code: 'shinyanga', sw: 'Shinyanga', en: 'Shinyanga', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'kahama-dc', sw: 'Kahama Vijijini', en: 'Kahama DC' },
      { id: 'kahama-town', sw: 'Kahama Mjini', en: 'Kahama Town' },
      { id: 'kishapu', sw: 'Kishapu' },
      { id: 'shinyanga-dc', sw: 'Shinyanga Vijijini', en: 'Shinyanga DC' },
      { id: 'shinyanga-urban', sw: 'Shinyanga Mjini', en: 'Shinyanga Urban' },
    ],
  },
  {
    code: 'simiyu', sw: 'Simiyu', en: 'Simiyu', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'bariadi-dc', sw: 'Bariadi Vijijini', en: 'Bariadi DC' },
      { id: 'bariadi-town', sw: 'Bariadi Mjini', en: 'Bariadi Town' },
      { id: 'busega', sw: 'Busega' },
      { id: 'iturimbo', sw: 'Itilima' },
      { id: 'maswa', sw: 'Maswa' },
      { id: 'meatu', sw: 'Meatu' },
    ],
  },
  {
    code: 'singida', sw: 'Singida', en: 'Singida', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'ikungi', sw: 'Ikungi' },
      { id: 'iryambo', sw: 'Iramba' },
      { id: 'manyoni', sw: 'Manyoni' },
      { id: 'mkalama', sw: 'Mkalama' },
      { id: 'singida-dc', sw: 'Singida Vijijini', en: 'Singida DC' },
      { id: 'singida-urban', sw: 'Singida Mjini', en: 'Singida Urban' },
    ],
  },
  {
    code: 'songwe', sw: 'Songwe', en: 'Songwe', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'ileje', sw: 'Ileje' },
      { id: 'mba-dc', sw: 'Mba Vijijini', en: 'Mba DC' },
      { id: 'mba-town', sw: 'Mba Mjini', en: 'Mba Town' },
      { id: 'momba', sw: 'Momba' },
      { id: 'songwe-dc', sw: 'Songwe Vijijini', en: 'Songwe DC' },
    ],
  },
  {
    code: 'tabora', sw: 'Tabora', en: 'Tabora', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'igunga', sw: 'Igunge' },
      { id: 'kaliua', sw: 'Kaliua' },
      { id: 'nzega-dc', sw: 'Nzega Vijijini', en: 'Nzega DC' },
      { id: 'sikonge', sw: 'Sikonge' },
      { id: 'tabora-dc', sw: 'Tabora Vijijini', en: 'Tabora DC' },
      { id: 'tabora-urban', sw: 'Tabora Mjini', en: 'Tabora Urban' },
      { id: 'ugalla', sw: 'Ugalla' },
      { id: 'upepo', sw: 'Uyui' },
    ],
  },
  {
    code: 'tanga', sw: 'Tanga', en: 'Tanga', isZanzibar: false, verificationStatus: 'pending',
    districts: [
      { id: 'handeni-dc', sw: 'Handeni Vijijini', en: 'Handeni DC' },
      { id: 'handeni-town', sw: 'Handeni Mjini', en: 'Handeni Town' },
      { id: 'kilindi', sw: 'Kilindi' },
      { id: 'korogwe-dc', sw: 'Korogwe Vijijini', en: 'Korogwe DC' },
      { id: 'korogwe-urban', sw: 'Korogwe Mjini', en: 'Korogwe Urban' },
      { id: 'lushoto', sw: 'Lushoto' },
      { id: 'muheza', sw: 'Muheza' },
      { id: 'mkinga', sw: 'Mkinga' },
      { id: 'pangani', sw: 'Pangani' },
      { id: 'tanga-city', sw: 'Tanga Mjini', en: 'Tanga City' },
    ],
  },
  // ─── Zanzibar regions ────────────────────────────────────────────────────────
  {
    code: 'zanzibar_north', sw: 'Kaskazini Unguja', en: 'Zanzibar North', isZanzibar: true, verificationStatus: 'pending',
    districts: [
      { id: 'kaskazini-a', sw: 'Kaskazini A' },
      { id: 'kaskazini-b', sw: 'Kaskazini B' },
    ],
  },
  {
    code: 'zanzibar_south', sw: 'Kusini Unguja', en: 'Zanzibar South', isZanzibar: true, verificationStatus: 'pending',
    districts: [
      { id: 'kusini', sw: 'Kusini' },
      { id: 'kungwi', sw: 'Kati' },
    ],
  },
  {
    code: 'zanzibar_west', sw: 'Mjini Magharibi', en: 'Zanzibar West', isZanzibar: true, verificationStatus: 'pending',
    districts: [
      { id: 'magharibi-a', sw: 'Magharibi A' },
      { id: 'magharibi-b', sw: 'Magharibi B' },
      { id: 'mjini', sw: 'Mjini' },
    ],
  },
  {
    code: 'pemba_north', sw: 'Kaskazini Pemba', en: 'Pemba North', isZanzibar: true, verificationStatus: 'pending',
    districts: [
      { id: 'micheweni', sw: 'Micheweni' },
      { id: 'wete', sw: 'Wete' },
    ],
  },
  {
    code: 'pemba_south', sw: 'Kusini Pemba', en: 'Pemba South', isZanzibar: true, verificationStatus: 'pending',
    districts: [
      { id: 'chake-chake', sw: 'Chake Chake' },
      { id: 'mkoani', sw: 'Mkoani' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getRegion(code: TanzaniaRegion | string | null | undefined): RegionEntry | undefined {
  if (!code) return undefined;
  return REGIONS.find(r => r.code === code);
}

export function getDistricts(code: TanzaniaRegion | string | null | undefined): readonly DistrictEntry[] {
  return getRegion(code)?.districts ?? [];
}

export function getDistrict(regionCode: TanzaniaRegion | string | null | undefined, districtId: string | null | undefined): DistrictEntry | undefined {
  if (!districtId) return undefined;
  return getDistricts(regionCode).find(d => d.id === districtId);
}

export function localizedRegionName(region: RegionEntry, language: 'sw' | 'en'): string {
  return language === 'sw' ? region.sw : region.en;
}

export function localizedDistrictName(district: DistrictEntry, language: 'sw' | 'en'): string {
  if (language === 'sw') return district.sw;
  return district.en ?? district.sw;
}

export function totalDistrictCount(): number {
  return REGIONS.reduce((sum, r) => sum + r.districts.length, 0);
}

export const REGIONS_DISCLAIMER =
  'Orodha ya mikoa na wilaya inategemea muundo wa TAMISEMI uliopo hadharani. ' +
  'Baadhi ya wilaya zinaweza kuwa zimeshachapishwa hivi karibuni; tafadhali rejea ' +
  'vyanzo vya kisera vya TAMISEMI kwa uthibitisho kabla ya matumizi ya kisheria. ' +
  'Region and district list is based on publicly-available TAMISEMI structure. Some ' +
  'districts may have been gazetted recently; consult official TAMISEMI sources for ' +
  'verification before any legal use.';

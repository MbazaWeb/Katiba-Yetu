import type { Language, FontSize, SuggestionStatus, VerificationTier, UserRole } from '../types';

// ─── Date & Time ─────────────────────────────────────────────────────────────

export function formatDate(iso: string, lang: Language = 'sw'): string {
  const date = new Date(iso);
  const months_sw = [
    'Januari','Februari','Machi','Aprili','Mei','Juni',
    'Julai','Agosti','Septemba','Oktoba','Novemba','Desemba',
  ];
  const months_en = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const d = date.getDate();
  const m = lang === 'sw' ? months_sw[date.getMonth()] : months_en[date.getMonth()];
  const y = date.getFullYear();
  return `${m} ${d}, ${y}`;
}

export function formatRelativeTime(iso: string, lang: Language = 'sw'): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (lang === 'sw') {
    if (diff < 60) return 'Sasa hivi';
    if (diff < 3600) return `Dakika ${Math.floor(diff / 60)} zilizopita`;
    if (diff < 86400) return `Masaa ${Math.floor(diff / 3600)} yaliyopita`;
    if (diff < 604800) return `Siku ${Math.floor(diff / 86400)} zilizopita`;
    return formatDate(iso, lang);
  } else {
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(iso, lang);
  }
}

export function formatPollDeadline(iso: string, lang: Language = 'sw'): string {
  const label = lang === 'sw' ? 'Inafungwa' : 'Closes';
  return `${label} ${formatDate(iso, lang)}`;
}

// ─── Number Formatting ────────────────────────────────────────────────────────

export function formatCount(n: number, lang: Language = 'sw'): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatPercentage(n: number): string {
  return `${Math.round(n)}%`;
}

// ─── Text Helpers ─────────────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Status Labels ────────────────────────────────────────────────────────────

export function getSuggestionStatusLabel(status: SuggestionStatus, lang: Language): string {
  const labels: Record<SuggestionStatus, { sw: string; en: string }> = {
    submitted:    { sw: 'Imewasilishwa', en: 'Submitted' },
    under_review: { sw: 'Inapitiwa', en: 'Under review' },
    accepted:     { sw: 'Imepokewa', en: 'Accepted' },
    rejected:     { sw: 'Imekataliwa', en: 'Rejected' },
    merged:       { sw: 'Imejumuishwa', en: 'Merged' },
    polled:       { sw: 'Inapigwa kura', en: 'Being polled' },
  };
  return labels[status]?.[lang] ?? status;
}

export function getVerificationLabel(tier: VerificationTier, lang: Language): string {
  const labels: Record<VerificationTier, { sw: string; en: string }> = {
    none:  { sw: 'Haijathibitishwa', en: 'Unverified' },
    email: { sw: 'Barua pepe', en: 'Email verified' },
    phone: { sw: 'Simu', en: 'Phone verified' },
    nida:  { sw: 'NIDA', en: 'NIDA verified' },
  };
  return labels[tier]?.[lang] ?? tier;
}

export function getRoleLabel(role: UserRole, lang: Language): string {
  const labels: Record<UserRole, { sw: string; en: string }> = {
    guest:            { sw: 'Mgeni',                    en: 'Guest' },
    registered:       { sw: 'Mtumiaji',                 en: 'Registered' },
    verified_citizen: { sw: 'Raia Aliyethibitishwa',   en: 'Verified citizen' },
    moderator:        { sw: 'Msimamizi',               en: 'Moderator' },
    admin:            { sw: 'Msimamizi Mkuu',          en: 'Admin' },
  };
  return labels[role]?.[lang] ?? role;
}

// ─── Font Scaling ─────────────────────────────────────────────────────────────

export function scaledSize(base: number, fontScale: FontSize): number {
  const scales: Record<FontSize, number> = {
    sm:  0.85,
    md:  1.0,
    lg:  1.15,
    xl:  1.3,
  };
  return Math.round(base * scales[fontScale]);
}

// ─── Color Utils ──────────────────────────────────────────────────────────────

export function hexWithOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${alpha}`;
}

// ─── Text / Language ──────────────────────────────────────────────────────────

export function t(sw: string, en: string, lang: Language): string {
  return lang === 'sw' ? sw : en;
}

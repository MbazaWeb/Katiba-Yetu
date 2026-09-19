/**
 * Constitutional history service — timeline of constitutional milestones.
 *
 * All placeholder/sample data has been removed. When no Supabase backend
 * is configured, the timeline is empty — the UI shows a proper empty state.
 * Real historical entries should be added via the backend after scholarly
 * verification.
 */

import type { HistoryEntry, LibraryLanguage } from '../types';

// Empty until real verified data is loaded from the backend.
export const historyTimeline: HistoryEntry[] = [];

export function sortedTimeline(): HistoryEntry[] {
  return historyTimeline.slice().sort((a, b) => a.year - b.year);
}

export function localizedHistoryTitle(entry: HistoryEntry, _language: LibraryLanguage): string {
  return entry.title;
}

export function localizedHistoryDescription(entry: HistoryEntry, _language: LibraryLanguage): string {
  return entry.description;
}

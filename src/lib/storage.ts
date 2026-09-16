/**
 * Katiba Yetu — Local persistence
 *
 * Cross-platform key/value storage built on @react-native-async-storage/async-storage:
 * - Native (iOS/Android): backed by SQLite/SharedPreferences via AsyncStorage.
 * - Web: backed by localStorage.
 *
 * All helpers are failure-tolerant — storage errors never crash the UI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@katibayetu/';

export const StorageKeys = {
  language: `${PREFIX}language`,
  fontSize: `${PREFIX}fontSize`,
  bookmarks: `${PREFIX}bookmarks`,       // string[] — section ids
  votes: `${PREFIX}votes`,               // Record<pollId, optionId>
  likes: `${PREFIX}likes`,               // string[] — discussion ids
  endorsements: `${PREFIX}endorsements`, // Record<suggestionId, boolean>
} as const;

export async function storageGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn(`[storage] read failed for "${key}"`, e);
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[storage] write failed for "${key}"`, e);
  }
}

export async function storageGetJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storageGet(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function storageSetJSON(key: string, value: unknown): Promise<void> {
  try {
    await storageSet(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] JSON write failed for "${key}"`, e);
  }
}

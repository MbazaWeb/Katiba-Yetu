/**
 * Katiba kwa Sauti — Article audio service.
 *
 * Uses the device/browser SpeechSynthesis API as the initial implementation.
 * Does NOT download or copy audio files from external sources.
 *
 * When a real audio backend exists, replace the implementation behind this
 * interface without changing call sites.
 */

import type { ConstitutionArticle, LibraryLanguage, ArticleAudio } from '../types';
import { officialText, clauseText } from './constitution';

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;       // 0..1
  rate: number;           // 0.5..2
  articleId: string | null;
  language: LibraryLanguage;
}

export interface AudioPlayerController {
  state: AudioPlayerState;
  play: (article: ConstitutionArticle, language: LibraryLanguage) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  previous: () => void;
  next: () => void;
}

export interface KatibaAudioService {
  isSupported: () => boolean;
  getArticleAudio: (articleId: string, language: LibraryLanguage) => ArticleAudio;
  speak: (article: ConstitutionArticle, language: LibraryLanguage, handlers: AudioHandlers) => AudioController;
  cancel: () => void;
}

export interface AudioHandlers {
  onstart?: () => void;
  onend?: () => void;
  onpause?: () => void;
  onresume?: () => void;
  onboundary?: (charIndex: number) => void;
  onerror?: (error: string) => void;
}

export interface AudioController {
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
}

/** Build the speakable text for an article using verified official text only. */
export function buildSpeakableText(article: ConstitutionArticle, language: LibraryLanguage): string {
  const text = officialText(article, language);
  if (!text) return '';
  const parts: string[] = [];
  if (text.title) parts.push(text.title);
  if (text.preamble) parts.push(text.preamble);
  if (text.clauses.length) parts.push(clauseText(text.clauses));
  return parts.join('\n\n');
}

const deviceAudioCache = new Map<string, ArticleAudio>();

/**
 * Default implementation: device/browser SpeechSynthesis.
 *
 * Limitation: on web, SpeechSynthesis voices depend on the OS/browser. Swahili
 * voices may not be installed; we fall back to the default voice.
 */
export const katibaAudioService: KatibaAudioService = {
  isSupported() {
    if (typeof window === 'undefined') return false;
    return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  },

  getArticleAudio(articleId, language) {
    const key = `${articleId}:${language}`;
    const cached = deviceAudioCache.get(key);
    if (cached) return cached;
    const audio: ArticleAudio = {
      articleId,
      language,
      audioUri: null,
      durationSeconds: null,
      generatedBy: 'device_tts',
      verificationStatus: 'unavailable',
      generatedAt: null,
    };
    deviceAudioCache.set(key, audio);
    return audio;
  },

  speak(article, language, handlers) {
    if (!katibaAudioService.isSupported()) {
      handlers.onerror?.('Speech synthesis is not supported on this device.');
      return { pause: () => {}, resume: () => {}, stop: () => {}, setRate: () => {} };
    }
    const synth = window.speechSynthesis;
    const text = buildSpeakableText(article, language);
    if (!text) {
      handlers.onerror?.('Hakuna maandishi yaliyohakikiwa ya kusoma kwa sauti kwa lugha hii. / No verified text to read in this language.');
      return { pause: () => {}, resume: () => {}, stop: () => {}, setRate: () => {} };
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'sw' ? 'sw-KE' : 'en-US';
    utterance.rate = 1;
    utterance.onstart = () => handlers.onstart?.();
    utterance.onend = () => handlers.onend?.();
    utterance.onpause = () => handlers.onpause?.();
    utterance.onresume = () => handlers.onresume?.();
    utterance.onboundary = (event: SpeechSynthesisEvent) => handlers.onboundary?.(event.charIndex);
    utterance.onerror = () => handlers.onerror?.('Sauti haiwezi kucheza. / Playback error.');
    synth.speak(utterance);
    return {
      pause: () => synth.pause(),
      resume: () => synth.resume(),
      stop: () => { synth.cancel(); },
      setRate: (rate: number) => { utterance.rate = rate; },
    };
  },

  cancel() {
    if (katibaAudioService.isSupported()) window.speechSynthesis.cancel();
  },
};

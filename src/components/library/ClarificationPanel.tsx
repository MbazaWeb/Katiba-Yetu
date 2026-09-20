import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useAppContext } from '../../hooks/useAppContext';
import { DISCLAIMER, getBundle, localized } from '../../services/constitution';
import { localClarificationService, suggestedQuestions } from '../../services/clarification';
import type { ClarificationService, ClarificationTurn } from '../../services/clarification';
import type { ConstitutionArticle } from '../../types';
import { Action, Notice, libraryStyles as s } from './LibraryUI';

export function ClarificationPanel({ article, onClose, service = localClarificationService }: { article: ConstitutionArticle; onClose: () => void; service?: ClarificationService }) {
  const { language } = useAppContext();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ClarificationTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const responses = useRef<ScrollView>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  async function ask(value = question) {
    if (request.current || !value.trim()) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError('');
    try {
      const answer = await service.ask({ article, documentVersion: article.source.documentVersion, question: value.trim(), language, history, signal: controller.signal });
      if (controller.signal.aborted) return;
      if (answer.articleId !== article.id || answer.documentVersion !== article.source.documentVersion) throw new Error('Context mismatch');
      setHistory(turns => [...turns, { question: value.trim(), answer: answer.text, language }]); setQuestion('');
    } catch {
      if (!controller.signal.aborted) setError(copy('Jibu halikupatikana. Jaribu tena.', 'Could not get a response. Please retry.'));
    } finally {
      if (!controller.signal.aborted) { setBusy(false); request.current = null; }
    }
  }
  return <View style={[s.root, { padding: 16, gap: 12 }]}>
    <View style={s.row}><Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>{copy('Uliza ufafanuzi', 'Ask for clarification')}</Text><Action label={copy('Funga', 'Close')} onPress={onClose} /></View>
    <Text style={s.small}>{localized(getBundle(article.documentId).document.title, language)} · {copy('Ibara', 'Article')} {article.number} · {article.source.documentVersion}</Text>
    <Text style={s.body}>{localized(article.title, language)}</Text>
    <Notice>{copy('Majibu ya ufafanuzi ni ya elimu tu — si tafsiri rasmi ya kisheria ya Katiba.', 'Clarification responses are for educational purposes only — not an official legal interpretation of the Constitution.')}</Notice>
    <ScrollView ref={responses} onContentSizeChange={() => responses.current?.scrollToEnd({ animated: true })} contentContainerStyle={{ gap: 14, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
      {!history.length && <View style={{ gap: 8 }}>{suggestedQuestions.map(q => <Action key={q.sw} label={q[language]} disabled={busy} onPress={() => { setQuestion(q[language]); void ask(q[language]); }} />)}</View>}
      {history.map((turn, i) => <View key={i} style={s.card}><Text style={s.heading}>{turn.question}</Text><Text selectable accessibilityLiveRegion="polite" style={s.body}>{turn.answer}</Text></View>)}
      {!history.length && <Text style={s.small}>{copy('Jibu litaonekana hapa.', 'The response will appear here.')}</Text>}
      {busy && <ActivityIndicator accessibilityLabel={copy('Inasubiri jibu', 'Waiting for response')} />}
      {error ? <Text accessibilityRole="alert" style={s.body}>{error}</Text> : null}
    </ScrollView>
    <TextInput accessibilityLabel={copy('Swali lako', 'Your question')} placeholder={copy(history.length ? 'Uliza swali la kufuatilia…' : 'Andika swali lako…', history.length ? 'Ask a follow-up question…' : 'Type your question…')} placeholderTextColor="#8fa29b" multiline maxLength={2000} value={question} onChangeText={setQuestion} style={[s.input, { maxHeight: 110 }]} editable={!busy} />
    <Action primary label={copy('Uliza', 'Ask')} disabled={busy || !question.trim()} onPress={() => { void ask(); }} />
    <Text style={s.small}>{DISCLAIMER}</Text>
  </View>;
}

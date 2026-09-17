import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArticleCommunity } from '../../hooks/useArticleCommunity';
import { useAppContext } from '../../hooks/useAppContext';
import { Action, Notice, libraryStyles as s } from './LibraryUI';
import { PollBar } from '../ui/PollBar';
import { StorageKeys } from '../../lib/storage';
import type { Poll } from '../../types';

export function CommunityPanel({ kind, community }: { kind: 'discussions' | 'suggestions' | 'polls'; community: ReturnType<typeof useArticleCommunity> }) {
  const { language } = useAppContext();
  const [draft, setDraft] = useState('');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  if (kind === 'polls') return <View style={{ gap: 16 }}><Notice>{copy('Kura za mfano za elimu, si kura rasmi. Kura yako huhifadhiwa kwenye kifaa hiki pekee.', 'Educational demo polls, not official ballots. Your vote is stored only on this device.')}</Notice>{community.polls.length ? community.polls.map(poll => <LibraryPoll key={poll.id} poll={poll} />) : <Text style={s.body}>{copy('Hakuna kura iliyounganishwa na ibara hii.', 'No polls are linked to this article.')}</Text>}</View>;
  return <View style={{ gap: 16 }}>
    <Text accessibilityRole="header" style={s.heading}>{kind === 'discussions' ? copy('Majadiliano ya wananchi', 'Citizen discussions') : copy('Mapendekezo ya wananchi', 'Citizen proposals')}</Text>
    <Notice>{copy('Michango hii si maandishi rasmi ya Katiba. Unachoandika huhifadhiwa kwenye kifaa hiki tu; hakichapishwi kwa umma.', 'Contributions are not official constitutional text. What you write is saved only on this device; it is not publicly published.')}</Notice>
    {!community.data[kind].length && <Text style={s.body}>{copy('Hakuna michango iliyohifadhiwa kwa ibara hii.', 'No saved contributions for this article.')}</Text>}
    {community.data[kind].map(item => <View key={item.id} style={s.card}><Text style={s.small}>{copy('Mchango wako', 'Your contribution')} · {new Date(item.createdAt).toLocaleDateString()}</Text><Text selectable style={s.body}>{item.body}</Text></View>)}
    <TextInput accessibilityLabel={kind === 'discussions' ? copy('Maoni yako', 'Your comment') : copy('Pendekezo lako', 'Your proposal')} multiline maxLength={3000} value={draft} onChangeText={setDraft} placeholder={copy('Andika mchango wako…', 'Write your contribution…')} placeholderTextColor="#8fa29b" style={[s.input, { minHeight: 100 }]} />
    <Action label={copy('Hifadhi kwenye kifaa', 'Save on this device')} disabled={!draft.trim() || !community.ready || community.saving} onPress={() => { void community.add(kind, draft).then(saved => { if (saved) setDraft(''); }); }} />
    {community.error && <Text accessibilityRole="alert" style={s.body}>{copy('Hifadhi haipatikani. Mchango haujahifadhiwa; jaribu kufungua ibara tena.', 'Storage is unavailable. The contribution was not saved; try reopening the article.')}</Text>}
  </View>;
}
function LibraryPoll({ poll }: { poll: Poll }) {
  const { language } = useAppContext();
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(StorageKeys.votes).then(raw => { const votes = JSON.parse(raw ?? '{}'); if (live) { setVoted(votes[poll.id] ?? null); setReady(true); } }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [poll.id]);
  async function vote() {
    if (!selected || voted || busy) return;
    setBusy(true);
    try { const votes = JSON.parse(await AsyncStorage.getItem(StorageKeys.votes) ?? '{}'); await AsyncStorage.setItem(StorageKeys.votes, JSON.stringify({ ...votes, [poll.id]: selected })); setVoted(selected); }
    catch { setError(true); } finally { setBusy(false); }
  }
  return <View style={s.card}><Text style={s.heading}>{language === 'sw' ? poll.title_sw : poll.title_en}</Text>{poll.options.map(option => <PollBar key={option.id} option={option} lang={language} showResults={!!voted} isSelected={(voted ?? selected) === option.id} onSelect={id => { if (!voted) setSelected(id); }} />)}<Action label={voted ? (language === 'sw' ? 'Kura imehifadhiwa kwenye kifaa' : 'Vote saved on device') : (language === 'sw' ? 'Piga kura' : 'Vote')} disabled={!ready || !selected || !!voted || busy} onPress={() => { void vote(); }} />{error && <Text style={s.body}>{language === 'sw' ? 'Kura haijahifadhiwa.' : 'Could not save vote.'}</Text>}</View>;
}

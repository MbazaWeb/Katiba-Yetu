import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Notice } from '../components/library/LibraryUI';
import {
  loadPolls, castVote, abstain, hasVoted, closePoll,
} from '../services/submissionWorkflow';
import { POLL_STAGE_LABELS } from '../types';
import type { MultiStagePoll, PollStageLike } from '../types';

const POLL_STAGE_ORDER: PollStageLike[] = ['problem_confirmation', 'policy_direction', 'article_wording', 'approval_for_draft'];

const STAGE_DESCRIPTIONS: Record<PollStageLike, { sw: string; en: string }> = {
  problem_confirmation:  { sw: 'Wananchi wanaamua kama tatizo halali na linahitaji mabadiliko.', en: 'Citizens decide whether the problem is real and needs change.' },
  policy_direction:      { sw: 'Wananchi huchagua mwelekeo wa sera unaofaa kufuata.',          en: 'Citizens choose the policy direction to take.' },
  article_wording:       { sw: 'Wananchi huchagua kati ya mifumo ya lugha ya ibara.',           en: 'Citizens choose between article wording drafts.' },
  approval_for_draft:    { sw: 'Wananchi haidhinisha kuingizwa kwenye rasimu inayofuata.',        en: 'Citizens approve inclusion in the next draft.' },
};

interface Props {
  onBack?: () => void;
}

export function MultiStagePollScreen({ onBack }: Props) {
  const { language, user } = useAppContext();
  const [polls, setPolls] = useState<MultiStagePoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MultiStagePoll | null>(null);
  const [userVoteStatus, setUserVoteStatus] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const copy = (sw: string, en?: string) => en === undefined ? sw : (language === 'sw' ? sw : en);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await loadPolls();
        if (cancelled) return;
        setPolls(list);
        if (user) {
          const status: Record<string, boolean> = {};
          for (const poll of list) status[poll.id] = await hasVoted(poll.id, user.id);
          if (cancelled) return;
          setUserVoteStatus(status);
        }
      } finally {
        if (!cancelled) { setRefreshing(false); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await loadPolls();
      setPolls(list);
      if (user) {
        const status: Record<string, boolean> = {};
        for (const poll of list) status[poll.id] = await hasVoted(poll.id, user.id);
        setUserVoteStatus(status);
      }
    } finally { setRefreshing(false); setLoading(false); }
  }, [user]);

  async function handleVote(pollId: string, optionId: string) {
    if (!user) { setError(copy('Tafadhali ingia ili kupiga kura. / Please sign in to vote.')); return; }
    setError(''); setSuccess(''); setBusy(true);
    try {
      const updated = await castVote(pollId, optionId, {
        id: user.id,
        verified: user.verification_tier !== 'none',
        region: user.region,
        tier: user.verification_tier,
      });
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      if (selected?.id === pollId) setSelected(updated);
      setUserVoteStatus(prev => ({ ...prev, [pollId]: true }));
      setSuccess(copy('Kura yako imehifadhiwa. / Your vote has been recorded.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
    } finally { setBusy(false); }
  }

  async function handleAbstain(pollId: string) {
    if (!user) { setError(copy('Tafadhali ingia ili kujiepusha. / Please sign in to abstain.')); return; }
    setError(''); setSuccess(''); setBusy(true);
    try {
      const updated = await abstain(pollId, {
        id: user.id,
        verified: user.verification_tier !== 'none',
        region: user.region,
        tier: user.verification_tier,
      });
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      if (selected?.id === pollId) setSelected(updated);
      setUserVoteStatus(prev => ({ ...prev, [pollId]: true }));
      setSuccess(copy('Umejiepusha kwenye kura hii. / You have abstained from this poll.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
    } finally { setBusy(false); }
  }

  async function handleClose(pollId: string) {
    if (!user) return;
    setError(''); setBusy(true);
    try {
      const updated = await closePoll(pollId, { id: user.id, name: user.display_name, role: 'drafting_committee' });
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      if (selected?.id === pollId) setSelected(updated);
      setSuccess(copy('Kura imefungwa. / Poll closed.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
    } finally { setBusy(false); }
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Kura za Hatua Nyingi', 'Multi-stage Polls')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.green[400]} />}
      >
        <View style={styles.hero}>
          <Ionicons name="stats-chart-outline" size={34} color={Colors.green[300]} />
          <Text style={styles.heroTitle}>{copy('Kura za Hatua Nyingi', 'Multi-stage Polling')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Kazi nne za hatua: uthibitisho wa tatizo, mwelekeo wa sera, ufupisho wa ibara, na idhini ya rasimu. Kura haiwezi kuidhinisha ibara otomatiki.',
              'Four poll stages: problem confirmation, policy direction, article wording, and approval for draft. A poll cannot automatically approve an article.'
            )}
          </Text>
        </View>

        {/* Stage legend */}
        <View style={styles.stageLegend}>
          {POLL_STAGE_ORDER.map((stage, i) => (
            <View key={stage} style={styles.stageStep}>
              <View style={styles.stageDot}>
                <Text style={styles.stageDotText}>{i + 1}</Text>
              </View>
              <Text style={styles.stageName}>{language === 'sw' ? POLL_STAGE_LABELS[stage].sw : POLL_STAGE_LABELS[stage].en}</Text>
            </View>
          ))}
        </View>

        <Notice>
          {copy(
            'Kura za mfano za elimu, si kura rasmi. Washiriki waliouthibitishwa wachache hawawakilishi wanananchi wote wa Tanzania.',
            'Educational demo polls, not official ballots. A small number of verified participants does not represent all Tanzanians.'
          )}
        </Notice>

        {loading ? (
          <Text style={styles.loadingText}>{copy('Inapakia…', 'Loading…')}</Text>
        ) : polls.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>{copy('Hakuna kura wazi kwa sasa.', 'No open polls at the moment.')}</Text>
          </View>
        ) : (
          polls.map(poll => {
            const stageLabel = POLL_STAGE_LABELS[poll.stage];
            const stageDescription = STAGE_DESCRIPTIONS[poll.stage];
            const hasVotedAlready = userVoteStatus[poll.id];
            const isOpen = poll.status === 'open';
            return (
              <Pressable
                key={poll.id}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
                onPress={() => setSelected(poll)}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.stageBadge, !isOpen && styles.stageBadgeClosed]}>
                    <Text style={styles.stageBadgeText}>{language === 'sw' ? stageLabel.sw : stageLabel.en}</Text>
                  </View>
                  <Text style={styles.statusText}>{poll.status === 'open' ? copy('Wazi', 'Open') : poll.status === 'closed' ? copy('Imefungwa', 'Closed') : poll.status}</Text>
                </View>
                <Text style={styles.title}>{poll.title}</Text>
                <Text style={styles.bodyPreview} numberOfLines={2}>{language === 'sw' ? stageDescription.sw : stageDescription.en}</Text>
                <View style={styles.pollStats}>
                  <Text style={styles.statText}>{copy('Kura', 'Votes')}: {poll.totalVotes}</Text>
                  <Text style={styles.statText}>· {copy('Imethibitishwa', 'Verified')}: {poll.verifiedVotes}</Text>
                  <Text style={styles.statText}>· {copy('Mikoa', 'Regions')}: {Object.keys(poll.regionDistribution).length}</Text>
                  {hasVotedAlready && <Text style={styles.votedText}>· {copy('Umepiga kura', 'You voted')}</Text>}
                </View>
                {!poll.isRepresentative && <Text style={styles.warningText}>{copy('Onyo: ushiriki hauatoshelezi', 'Warning: insufficient participation')}</Text>}
              </Pressable>
            );
          })
        )}

        <Text style={styles.disclaimer}>
          {copy('Kura haiwezi kuidhinisha ibara otomatiki. Inahitaji mapitio ya kisheria na idhini ya kamati.', 'A poll cannot automatically approve an article. Legal review and committee approval are required.')}
        </Text>
      </ScrollView>

      {/* Poll detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { flex: 1 }]}>
            {selected && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle} numberOfLines={2}>{selected.title}</Text>
                    <Text style={styles.sheetSub}>{language === 'sw' ? POLL_STAGE_LABELS[selected.stage].sw : POLL_STAGE_LABELS[selected.stage].en} · {selected.status}</Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
                </View>
                <ScrollView contentContainerStyle={{ gap: Spacing[3], paddingBottom: Spacing[5] }} keyboardShouldPersistTaps="handled">
                  <Text style={styles.detailBody}>{selected.description}</Text>

                  {/* Representativeness warning */}
                  <View style={[styles.warningBox, selected.isRepresentative ? styles.warningMild : styles.warningStrong]}>
                    <Ionicons name="warning-outline" size={18} color={selected.isRepresentative ? Colors.gold[400] : Colors.red[300]} />
                    <Text style={styles.warningBoxText}>{selected.representativenessWarning}</Text>
                  </View>

                  <View style={styles.statsGrid}>
                    <StatBox label={copy('Kura zote', 'Total votes')} value={selected.totalVotes} />
                    <StatBox label={copy('Zilizothibitishwa', 'Verified')} value={selected.verifiedVotes} />
                    <StatBox label={copy('Wamejiepushha', 'Abstentions')} value={selected.abstentions} />
                    <StatBox label={copy('Mikoa', 'Regions')} value={Object.keys(selected.regionDistribution).length} />
                  </View>

                  <Text style={styles.detailLabel}>{copy('Chaguo za kura', 'Poll options')}</Text>
                  {selected.options.map(option => {
                    const total = selected.totalVotes || 1;
                    const pct = Math.round((option.votes / total) * 100);
                    return (
                      <Pressable
                        key={option.id}
                        style={({ pressed }) => [styles.optionRow, userVoteStatus[selected.id] && { opacity: 0.7 }, pressed && { opacity: 0.5 }]}
                        onPress={() => !userVoteStatus[selected.id] && handleVote(selected.id, option.id)}
                        disabled={!!userVoteStatus[selected.id] || selected.status !== 'open' || busy}
                        accessibilityRole="button"
                        accessibilityLabel={option.label}
                      >
                        <View style={styles.optionBarWrap}>
                          <View style={[styles.optionBarFill, { width: `${pct}%`, backgroundColor: Colors.green[400] }]} />
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          <Text style={styles.optionPct}>{pct}%</Text>
                        </View>
                        <Text style={styles.optionMeta}>{option.votes} {copy('kura', 'votes')} · {option.verifiedVotes} {copy('zilizothibitishwa', 'verified')}</Text>
                        {option.description && <Text style={styles.optionDesc}>{option.description}</Text>}
                      </Pressable>
                    );
                  })}

                  {!userVoteStatus[selected.id] && selected.status === 'open' && user && (
                    <>
                      <Pressable
                        style={({ pressed }) => [styles.abstainBtn, pressed && { opacity: 0.7 }]}
                        onPress={() => handleAbstain(selected.id)}
                        disabled={busy}
                        accessibilityRole="button"
                      >
                        <Text style={styles.abstainBtnText}>{copy('Jiepushe na kura hii', 'Abstain from this poll')}</Text>
                      </Pressable>
                    </>
                  )}

                  {!user && (
                    <Notice>{copy('Tafadhali ingia ili kupiga kura. / Please sign in to vote.')}</Notice>
                  )}

                  {userVoteStatus[selected.id] && (
                    <View style={styles.votedBox}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.green[400]} />
                      <Text style={styles.votedBoxText}>{copy('Umepiga kura kwenye kura hii. Kura yako haiwezi kubadilishwa.', 'You have voted on this poll. Your vote cannot be changed.')}</Text>
                    </View>
                  )}

                  {/* Region distribution */}
                  <Text style={styles.detailLabel}>{copy('Mtawanyiko wa mikoa', 'Region distribution')}</Text>
                  <View style={styles.distributionBox}>
                    {Object.entries(selected.regionDistribution).map(([region, count]) => (
                      <View key={region} style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>{region.replace(/_/g, ' ')}</Text>
                        <Text style={styles.distributionValue}>{count}</Text>
                      </View>
                    ))}
                    {Object.keys(selected.regionDistribution).length === 0 && (
                      <Text style={styles.metaText}>{copy('Hakuna kura zilizorekodiwa bado.', 'No votes recorded yet.')}</Text>
                    )}
                  </View>

                  {/* Verification tier distribution */}
                  <Text style={styles.detailLabel}>{copy('Mtawanyiko wa uthibitisho', 'Verification tier distribution')}</Text>
                  <View style={styles.distributionBox}>
                    {Object.entries(selected.verificationTierDistribution).map(([tier, count]) => (
                      <View key={tier} style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>{tier}</Text>
                        <Text style={styles.distributionValue}>{count}</Text>
                      </View>
                    ))}
                    {Object.keys(selected.verificationTierDistribution).length === 0 && (
                      <Text style={styles.metaText}>{copy('Hakuna kura zilizothibitishwa bado.', 'No verified votes yet.')}</Text>
                    )}
                  </View>

                  <Text style={styles.detailLabel}>{copy('Dirisha la kura', 'Voting window')}</Text>
                  <Text style={styles.detailBody}>{copy('Inafungua', 'Opens')}: {new Date(selected.opensAt).toLocaleString()}</Text>
                  <Text style={styles.detailBody}>{copy('Inafunga', 'Closes')}: {new Date(selected.closesAt).toLocaleString()}</Text>
                  <Text style={styles.detailBody}>{copy('Ushiriki wa chini unahitajika', 'Minimum participation required')}: {selected.minimumParticipation}</Text>
                  <Text style={styles.detailBody}>{copy('Imeidhinishwa otomatiki?', 'Auto-approved?')}: <Text style={styles.boldNo}>{copy('Hapana', 'No')}</Text></Text>
                  <Text style={styles.detailBody}>{copy('Imepitiwa na binadamu?', 'Human reviewed?')}: {selected.humanReviewed ? copy('Ndio', 'Yes') : copy('Hapana', 'No')}</Text>

                  {selected.status === 'open' && user && (
                    <Pressable
                      style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => handleClose(selected.id)}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={styles.closeBtnText}>{copy('Funga kura (Kamati ya Rasimu)', 'Close poll (Drafting Committee)')}</Text>
                    </Pressable>
                  )}

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  {success ? <Text style={styles.successText}>{success}</Text> : null}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 580, lineHeight: 21 },
  stageLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], justifyContent: 'center', paddingVertical: Spacing[3] },
  stageStep: { alignItems: 'center', gap: 4, maxWidth: 120 },
  stageDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.green[400] },
  stageDotText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  stageName: { color: Colors.text.secondary, fontSize: Typography.size.xs, textAlign: 'center' },
  loadingText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', padding: Spacing[4] },
  emptyState: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageBadge: { paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderRadius: Radius.sm, backgroundColor: Colors.green[900] },
  stageBadgeClosed: { backgroundColor: Colors.surface.overlay },
  stageBadgeText: { fontSize: Typography.size.xs, color: Colors.green[300], fontWeight: Typography.weight.semibold },
  statusText: { fontSize: Typography.size.xs, color: Colors.text.muted, textTransform: 'capitalize' },
  title: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  bodyPreview: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  pollStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  statText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  votedText: { fontSize: Typography.size.xs, color: Colors.green[400], fontWeight: Typography.weight.semibold },
  warningText: { fontSize: Typography.size.xs, color: Colors.gold[400], fontStyle: 'italic' },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[3], gap: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  sheetSub: { fontSize: Typography.size.xs, color: Colors.green[300], textTransform: 'capitalize', marginTop: 2 },
  detailBody: { fontSize: Typography.size.md, color: Colors.text.primary, lineHeight: 24 },
  detailLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[3] },
  warningBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], borderRadius: Radius.md, alignItems: 'flex-start' },
  warningMild: { backgroundColor: Colors.gold[50], borderLeftWidth: 3, borderColor: Colors.gold[400] },
  warningStrong: { backgroundColor: Colors.red[50], borderLeftWidth: 3, borderColor: Colors.red[400] },
  warningBoxText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.sm, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  statBox: { flex: 1, minWidth: 130, backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center', gap: 2 },
  statValue: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  statLabel: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center' },
  optionRow: { padding: Spacing[3], borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surface.border, gap: 4 },
  optionBarWrap: { flexDirection: 'row', alignItems: 'center', height: 36, backgroundColor: Colors.surface.overlay, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  optionBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.3 },
  optionLabel: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, paddingLeft: Spacing[3], flex: 1, zIndex: 1 },
  optionPct: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, paddingRight: Spacing[3], zIndex: 1 },
  optionMeta: { fontSize: Typography.size.xs, color: Colors.text.muted },
  optionDesc: { fontSize: Typography.size.xs, color: Colors.text.secondary, lineHeight: 18, marginTop: 4 },
  abstainBtn: { padding: Spacing[3], borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surface.borderStrong, alignItems: 'center', minHeight: 44 },
  abstainBtnText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  votedBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.green[900], borderRadius: Radius.md, alignItems: 'flex-start' },
  votedBoxText: { flex: 1, color: Colors.green[300], fontSize: Typography.size.sm, lineHeight: 20 },
  distributionBox: { padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, gap: 4 },
  distributionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  distributionLabel: { color: Colors.text.secondary, fontSize: Typography.size.sm, textTransform: 'capitalize' },
  distributionValue: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  metaText: { color: Colors.text.muted, fontSize: Typography.size.xs, fontStyle: 'italic' },
  boldNo: { fontWeight: Typography.weight.bold, color: Colors.red[300] },
  closeBtn: { padding: Spacing[3], borderRadius: Radius.md, backgroundColor: Colors.gold[400], alignItems: 'center', minHeight: 44 },
  closeBtnText: { color: '#090e0d', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  errorText: { color: Colors.red[300], fontSize: Typography.size.sm, marginTop: Spacing[2] },
  successText: { color: Colors.green[300], fontSize: Typography.size.sm, marginTop: Spacing[2] },
});

export default MultiStagePollScreen;

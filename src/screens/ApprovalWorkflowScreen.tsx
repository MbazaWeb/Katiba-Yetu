import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Action, Notice } from '../components/library/LibraryUI';
import {
  loadApprovalWorkflow, advanceApprovalStage, evaluateApprovalEligibility,
} from '../services/draftBuilder';
import { loadAuditEvents } from '../services/submissionWorkflow';
import { PROPOSAL_DISCLAIMER, DRAFT_BUILDER_ROLE_LABELS } from '../types';
import { getProposedArticles } from '../services/proposedConstitution';
import type {
  ApprovalStage, ApprovalWorkflowState, AuditEvent, DraftBuilderRole, ProposedArticle,
} from '../types';

const STAGE_ORDER: ApprovalStage[] = ['citizen_input', 'moderation', 'clustering', 'legal_review', 'committee_approval', 'published', 'rejected'];

const STAGE_LABELS: Record<ApprovalStage, { sw: string; en: string }> = {
  citizen_input:       { sw: 'Michango ya Wananchi',  en: 'Citizen Input' },
  moderation:           { sw: 'Udhibiti',              en: 'Moderation' },
  clustering:           { sw: 'Uunganishaji',          en: 'Clustering' },
  legal_review:         { sw: 'Mapitio ya Kisheria',   en: 'Legal Review' },
  committee_approval:  { sw: 'Idhini ya Kamati',      en: 'Committee Approval' },
  published:           { sw: 'Imechapishwa',           en: 'Published' },
  rejected:            { sw: 'Imekataliwa',            en: 'Rejected' },
};

interface Props {
  onBack?: () => void;
}

export function ApprovalWorkflowScreen({ onBack }: Props) {
  const { language, user } = useAppContext();
  const [articles] = useState<ProposedArticle[]>(getProposedArticles());
  const [selectedArticle, setSelectedArticle] = useState<ProposedArticle | null>(null);
  const [workflow, setWorkflow] = useState<ApprovalWorkflowState | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [decisionModal, setDecisionModal] = useState<{ stage: ApprovalStage; status: 'completed' | 'rejected' } | null>(null);
  const [decisionRationale, setDecisionRationale] = useState('');
  const copy = (sw: string, en?: string) => en === undefined ? sw : (language === 'sw' ? sw : en);

  // Map the User.role (from auth) to a DraftBuilderRole. Demo only — real
  // implementation will derive from server-side role assignment.
  function resolveRole(u: typeof user): DraftBuilderRole {
    if (!u) return 'citizen';
    if (u.role === 'admin') return 'administrator';
    if (u.role === 'moderator') return 'moderator';
    // verified_citizen, registered, institution, etc. map to citizen for draft purposes.
    // Legal experts and drafting committee members would have their roles assigned on the server.
    return 'citizen';
  }
  const currentRole: DraftBuilderRole = resolveRole(user);

  useEffect(() => {
    if (!selectedArticle) {
      // Use a microtask to avoid setState synchronously in effect.
      Promise.resolve().then(() => { setLoading(false); });
      return;
    }
    let cancelled = false;
    (async () => {
      setRefreshing(true);
      try {
        const [state, events] = await Promise.all([
          loadApprovalWorkflow(selectedArticle.id),
          loadAuditEvents(selectedArticle.id),
        ]);
        if (cancelled) return;
        setWorkflow(state);
        setAuditEvents(events);
      } finally { if (!cancelled) { setRefreshing(false); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, [selectedArticle]);

  const refresh = useCallback(async () => {
    if (!selectedArticle) return;
    setRefreshing(true);
    try {
      const [state, events] = await Promise.all([
        loadApprovalWorkflow(selectedArticle.id),
        loadAuditEvents(selectedArticle.id),
      ]);
      setWorkflow(state);
      setAuditEvents(events);
    } finally { setRefreshing(false); setLoading(false); }
  }, [selectedArticle]);

  async function handleAdvance(stage: ApprovalStage, status: 'completed' | 'rejected') {
    if (!selectedArticle || !workflow) return;
    setError(''); setSuccess(''); setBusy(true);
    try {
      const updated = await advanceApprovalStage(selectedArticle.id, {
        stage, status, by: { id: user?.id ?? 'anonymous', name: user?.display_name ?? 'Mwananchi', role: currentRole }, rationale: decisionRationale,
      });
      setWorkflow(updated);
      setDecisionModal(null); setDecisionRationale('');
      await refresh();
      setSuccess(copy('Hatua ya idhini imerekodiwa. / Approval step recorded.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
    } finally { setBusy(false); }
  }

  // Compute eligibility for the current article (uses article's actual stats)
  const eligibility = workflow && selectedArticle ? evaluateApprovalEligibility(workflow, {
    verifiedParticipants: selectedArticle.verifiedParticipantCount,
    regionCount: selectedArticle.regionalCoverage,
    pollsCompleted: selectedArticle.pollIds.length > 0 ? ['problem_confirmation', 'article_wording'] : [],
    supportPercentage: selectedArticle.supportPercentage,
    legalReviewApproved: selectedArticle.legalReviewStatus === 'approved',
  }) : null;

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Mchakato wa Idhini', 'Approval Workflow')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.green[400]} />}
      >
        <View style={styles.hero}>
          <Ionicons name="git-branch-outline" size={34} color={Colors.gold[400]} />
          <Text style={styles.heroTitle}>{copy('Mchakato wa Idhini', 'Approval Workflow')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Fuata hatua za idhini kwa kila ibara iliyopendekezwa. Sheria za idhini zinaweza kubadilishwa. Kura haiwezi kuidhinisha otomatiki.',
              'Track the approval stages for each proposed article. Approval rules are configurable. A poll cannot auto-approve.'
            )}
          </Text>
          <View style={styles.roleBox}>
            <Ionicons name="person-circle-outline" size={18} color={Colors.green[300]} />
            <Text style={styles.roleText}>{copy('Nafasi yako', 'Your role')}: {DRAFT_BUILDER_ROLE_LABELS[currentRole][language]}</Text>
          </View>
        </View>

        <Notice>{PROPOSAL_DISCLAIMER}</Notice>

        {/* Article selector */}
        <Text style={styles.label}>{copy('Chagua Ibara', 'Select Article')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {articles.map(a => (
            <Pressable
              key={a.id}
              style={[styles.articlePill, selectedArticle?.id === a.id && styles.articlePillActive]}
              onPress={() => setSelectedArticle(a)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedArticle?.id === a.id }}
            >
              <Text style={[styles.articlePillText, selectedArticle?.id === a.id && styles.articlePillTextActive]}>{copy('Ibara', 'Article')} {a.proposedArticleNumber}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {!selectedArticle ? (
          <Text style={styles.emptyText}>{copy('Chagua ibara ili kuona mchakato wa idhini.', 'Select an article to view its approval workflow.')}</Text>
        ) : loading ? (
          <Text style={styles.loadingText}>{copy('Inapakia…', 'Loading…')}</Text>
        ) : workflow ? (
          <>
            {/* Approval rules summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy('Sheria za Idhini', 'Approval Rules')}</Text>
              <View style={styles.ruleRow}>
                <Ionicons name="people-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.ruleText}>{copy('Washiriki waliouthibitishwa wa chini', 'Minimum verified participants')}: {workflow.rules.minimumVerifiedParticipants}</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons name="map-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.ruleText}>{copy('Mikoa ya chini', 'Minimum regions')}: {workflow.rules.minimumRegions}</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons name="stats-chart-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.ruleText}>{copy('Msaada wa chini unahitajika', 'Minimum support required')}: {workflow.rules.minimumSupportPercentage}%</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.ruleText}>{copy('Inahitaji mapitio ya kisheria', 'Requires legal review')}: {workflow.rules.requireLegalReview ? copy('Ndio', 'Yes') : copy('Hapana', 'No')}</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons name="checkbox-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.ruleText}>{copy('Inahitaji idhini ya kamati', 'Requires committee approval')}: {workflow.rules.requireCommitteeApproval ? copy('Ndio', 'Yes') : copy('Hapana', 'No')}</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons name="list-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.ruleText}>{copy('Hatua za kura zinazohitajika', 'Required poll stages')}: {workflow.rules.requiredPollStages.length}</Text>
              </View>
            </View>

            {/* Eligibility check */}
            {eligibility && (
              <View style={[styles.card, eligibility.eligible ? styles.eligibleCard : styles.ineligibleCard]}>
                <View style={styles.eligibilityHeader}>
                  <Ionicons name={eligibility.eligible ? 'checkmark-circle' : 'close-circle'} size={24} color={eligibility.eligible ? Colors.green[400] : Colors.red[300]} />
                  <Text style={[styles.cardTitle, { color: eligibility.eligible ? Colors.green[400] : Colors.red[300] }]}>
                    {eligibility.eligible ? copy('Inastahili kuidhinishwa', 'Eligible for approval') : copy('Haijastahili bado', 'Not yet eligible')}
                  </Text>
                </View>
                {!eligibility.eligible && eligibility.reasons.length > 0 && (
                  <View style={styles.reasonsBox}>
                    {eligibility.reasons.map((r, i) => (
                      <Text key={i} style={styles.reasonText}>• {r}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Stage tracker */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy('Hatua za Idhini', 'Approval Stages')}</Text>
              <View style={styles.stagesList}>
                {STAGE_ORDER.filter(s => s !== 'rejected').map((stage, i) => {
                  const stageState = workflow.stages.find(s => s.stage === stage);
                  const status = stageState?.status ?? 'pending';
                  const isActive = workflow.currentStage === stage;
                  return (
                    <View key={stage} style={styles.stageItem}>
                      <View style={styles.stageMarker}>
                        <View style={[styles.stageCircle, status === 'completed' && styles.stageCircleCompleted, status === 'in_progress' && styles.stageCircleInProgress, status === 'pending' && styles.stageCirclePending, isActive && styles.stageCircleActive]}>
                          {status === 'completed' ? (
                            <Ionicons name="checkmark" size={18} color="#fff" />
                          ) : status === 'in_progress' ? (
                            <Text style={styles.stageCircleText}>{i + 1}</Text>
                          ) : (
                            <Text style={styles.stageCircleText}>{i + 1}</Text>
                          )}
                        </View>
                        {i < STAGE_ORDER.length - 2 && <View style={[styles.stageLine, status === 'completed' && styles.stageLineCompleted]} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stageName, isActive && styles.stageNameActive]}>{language === 'sw' ? STAGE_LABELS[stage].sw : STAGE_LABELS[stage].en}</Text>
                        <Text style={styles.stageStatus}>{status.replace(/_/g, ' ')}</Text>
                        {stageState?.decisionBy && <Text style={styles.stageMeta}>{copy('Imeamuliwa na', 'Decided by')} {stageState.decisionBy} · {stageState.decisionAt ? new Date(stageState.decisionAt).toLocaleDateString() : ''}</Text>}
                        {stageState?.rationale && <Text style={styles.stageRationale}>{stageState.rationale}</Text>}
                        {isActive && (currentRole === 'legal_expert' || currentRole === 'drafting_committee' || currentRole === 'administrator') && (
                          <View style={{ flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2] }}>
                            <Pressable style={styles.approveBtn} onPress={() => { setDecisionModal({ stage, status: 'completed' }); setDecisionRationale(''); }}><Text style={styles.approveBtnText}>{copy('Idhinisha', 'Approve')}</Text></Pressable>
                            <Pressable style={styles.rejectBtn} onPress={() => { setDecisionModal({ stage, status: 'rejected' }); setDecisionRationale(''); }}><Text style={styles.rejectBtnText}>{copy('Kataa', 'Reject')}</Text></Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Article context */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy('Muktadha wa Ibara', 'Article Context')}</Text>
              <Text style={styles.detailBody}>{copy('Nambari', 'Number')}: {selectedArticle.proposedArticleNumber}</Text>
              <Text style={styles.detailBody}>{copy('Hadhi', 'Status')}: {selectedArticle.status}</Text>
              <Text style={styles.detailBody}>{copy('Msaada', 'Support')}: {selectedArticle.supportPercentage}% · {copy('Upinzani', 'Opposition')}: {selectedArticle.oppositionPercentage}% · {copy('Wamejiepushha', 'Abstentions')}: {selectedArticle.abstentionPercentage}%</Text>
              <Text style={styles.detailBody}>{copy('Washiriki waliouthibitishwa', 'Verified participants')}: {selectedArticle.verifiedParticipantCount}</Text>
              <Text style={styles.detailBody}>{copy('Mikoa', 'Regions')}: {selectedArticle.regionalCoverage}</Text>
              <Text style={styles.detailBody}>{copy('Mapitio ya kisheria', 'Legal review')}: {selectedArticle.legalReviewStatus}</Text>
            </View>

            {/* Audit trail for this article */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy('Historia ya Ukaguzi', 'Audit Trail')} ({auditEvents.length})</Text>
              {auditEvents.length === 0 && <Text style={styles.metaText}>{copy('Hakuna matukio ya ukaguzi yaliyorekodiwa bado.', 'No audit events recorded yet.')}</Text>}
              {auditEvents.slice(0, 15).map(event => (
                <View key={event.id} style={styles.auditRow}>
                  <View style={styles.auditIconRow}>
                    <Ionicons
                      name={event.kind.includes('approved') || event.kind.includes('published') ? 'checkmark-circle' : event.kind.includes('rejected') ? 'close-circle' : 'time-outline'}
                      size={16}
                      color={event.kind.includes('approved') || event.kind.includes('published') ? Colors.green[400] : event.kind.includes('rejected') ? Colors.red[400] : Colors.text.muted}
                    />
                    <Text style={styles.auditKind}>{event.kind.replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={styles.auditDesc}>{event.description}</Text>
                  <Text style={styles.auditMeta}>{event.actorName} ({DRAFT_BUILDER_ROLE_LABELS[event.actorRole][language]}) · {new Date(event.at).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.disclaimer}>{PROPOSAL_DISCLAIMER}</Text>
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {/* Decision modal */}
        <Modal visible={!!decisionModal} animationType="slide" transparent onRequestClose={() => setDecisionModal(null)}>
          <View style={styles.scrim}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{decisionModal?.status === 'completed' ? copy('Idhinisha Hatua', 'Approve Stage') : copy('Kataa Hatua', 'Reject Stage')}</Text>
                <Pressable onPress={() => setDecisionModal(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
              </View>
              <View style={{ gap: Spacing[3] }}>
                {decisionModal && <Text style={styles.contextText}>{language === 'sw' ? STAGE_LABELS[decisionModal.stage].sw : STAGE_LABELS[decisionModal.stage].en}</Text>}
                <Text style={styles.label}>{copy('Sababu ya uamuzi', 'Decision rationale')}</Text>
                <TextInput style={[styles.input, { minHeight: 120 }]} value={decisionRationale} onChangeText={setDecisionRationale} multiline maxLength={2000} placeholder={copy('Eleza sababu ya uamuzi wako…', 'Explain the rationale for your decision…')} placeholderTextColor={Colors.text.muted} />
                <Notice>{copy('Uamuzi wako utaingizwa kwenye historia ya ukaguzi na utaonekana hadharani.', 'Your decision will be recorded in the audit trail and is publicly visible.')}</Notice>
                <Action primary label={copy('Thibitisha uamuzi', 'Confirm decision')} disabled={busy || !decisionRationale.trim()} onPress={() => decisionModal && handleAdvance(decisionModal.stage, decisionModal.status)} />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 580, lineHeight: 21 },
  roleBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[1], paddingHorizontal: Spacing[3], backgroundColor: Colors.green[900], borderRadius: Radius.full },
  roleText: { color: Colors.green[300], fontSize: Typography.size.xs },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[2] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', padding: Spacing[4] },
  loadingText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', padding: Spacing[4] },
  articlePill: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay, borderWidth: 1, borderColor: Colors.surface.borderStrong, minHeight: 36 },
  articlePillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  articlePillText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  articlePillTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2] },
  eligibleCard: { borderColor: Colors.green[400], borderWidth: 2 },
  ineligibleCard: { borderColor: Colors.red[400], borderWidth: 2 },
  cardTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  ruleText: { fontSize: Typography.size.sm, color: Colors.text.secondary, flex: 1 },
  eligibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  reasonsBox: { padding: Spacing[3], backgroundColor: Colors.red[50], borderRadius: Radius.md, marginTop: Spacing[2], gap: 2 },
  reasonText: { color: Colors.red[300], fontSize: Typography.size.sm, lineHeight: 20 },
  stagesList: { gap: Spacing[1], marginTop: Spacing[3] },
  stageItem: { flexDirection: 'row', gap: Spacing[3], paddingVertical: Spacing[2] },
  stageMarker: { alignItems: 'center', width: 32 },
  stageCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stageCircleCompleted: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  stageCircleInProgress: { backgroundColor: Colors.gold[100], borderColor: Colors.gold[400] },
  stageCirclePending: { backgroundColor: Colors.surface.overlay, borderColor: Colors.surface.borderStrong },
  stageCircleActive: { borderColor: Colors.gold[400] },
  stageCircleText: { color: '#fff', fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
  stageLine: { width: 2, flex: 1, backgroundColor: Colors.surface.borderStrong, minHeight: 20, marginTop: 4 },
  stageLineCompleted: { backgroundColor: Colors.green[400] },
  stageName: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.secondary },
  stageNameActive: { color: Colors.text.primary },
  stageStatus: { fontSize: Typography.size.xs, color: Colors.text.muted, textTransform: 'capitalize', marginTop: 2 },
  stageMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  stageRationale: { fontSize: Typography.size.xs, color: Colors.text.secondary, marginTop: 4, fontStyle: 'italic' },
  approveBtn: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, backgroundColor: Colors.green[700], minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  rejectBtn: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, backgroundColor: Colors.red[700], minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  detailBody: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 22 },
  auditRow: { paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border, gap: 2 },
  auditIconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  auditKind: { fontSize: Typography.size.xs, color: Colors.blue[300], fontWeight: Typography.weight.semibold, textTransform: 'capitalize' },
  auditDesc: { fontSize: Typography.size.sm, color: Colors.text.primary, lineHeight: 20 },
  auditMeta: { fontSize: Typography.size.xs, color: Colors.text.muted },
  metaText: { color: Colors.text.muted, fontSize: Typography.size.sm, fontStyle: 'italic' },
  errorText: { color: Colors.red[300], fontSize: Typography.size.sm, paddingVertical: Spacing[2] },
  successText: { color: Colors.green[300], fontSize: Typography.size.sm, paddingVertical: Spacing[2] },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  contextText: { fontSize: Typography.size.sm, color: Colors.green[300], fontStyle: 'italic' },
});

export default ApprovalWorkflowScreen;

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Notice } from '../components/library/LibraryUI';
import {
  loadSubmissions, createSubmission, validateSubmissionInput,
  type SubmissionInput,
} from '../services/submissionWorkflow';
import { SUBMISSION_DISCLAIMER } from '../constants/submissionConstants';
import { CONSTITUTIONAL_TOPIC_LABELS } from '../types';
import { RegionDistrictPicker, type RegionDistrictValue } from '../components/RegionDistrictPicker';
import { getRegion, getDistrict, localizedRegionName, localizedDistrictName } from '../constants/regions';
import type { CitizenSubmission, ConstitutionalTopic, SubmissionStatus } from '../types';

/** Format a submission's region + district as a single readable string. */
function formatLocation(sub: CitizenSubmission, language: 'sw' | 'en'): string | null {
  if (!sub.region) return null;
  const region = getRegion(sub.region);
  if (!region) return sub.region;
  const parts: string[] = [localizedRegionName(region, language)];
  if (sub.district) {
    const district = getDistrict(sub.region, sub.district);
    if (district) parts.push(localizedDistrictName(district, language));
  }
  return parts.join(' · ');
}

const STATUS_LABELS: Record<SubmissionStatus, { sw: string; en: string }> = {
  submitted:               { sw: 'Imewasilishwa',                en: 'Submitted' },
  validation_failed:       { sw: 'Uthibitisho Haujafaulu',       en: 'Validation failed' },
  in_moderation:           { sw: 'Inapitiwa na Msimamizi',       en: 'In moderation' },
  flagged:                 { sw: 'Imealamishwa',                 en: 'Flagged' },
  duplicate_detected:      { sw: 'Nakala Iligunduliwa',          en: 'Duplicate detected' },
  merged:                  { sw: 'Imejumuishwa',                 en: 'Merged' },
  topic_classified:        { sw: 'Imegawanywa kwa Mada',         en: 'Topic classified' },
  clustered:               { sw: 'Imeunganishwa kwenye Kundi',   en: 'Clustered' },
  rejected_by_moderator:   { sw: 'Imekataliwa na Msimamizi',     en: 'Rejected by moderator' },
  withdrawn:               { sw: 'Imeondolewa',                   en: 'Withdrawn' },
};

interface Props {
  onBack?: () => void;
}

export function CitizenSubmissionScreen({ onBack }: Props) {
  const { language, user } = useAppContext();
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<CitizenSubmission | null>(null);
  const copy = (sw: string, en?: string) => en === undefined ? sw : (language === 'sw' ? sw : en);

  // Form state
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState<ConstitutionalTopic>('state');
  const [affectedArticleId, setAffectedArticleId] = useState('');
  const [problem, setProblem] = useState('');
  const [proposedWordingSw, setProposedWordingSw] = useState('');
  const [rationale, setRationale] = useState('');
  const [supportingEvidence, setSupportingEvidence] = useState('');
  const [location, setLocation] = useState<RegionDistrictValue>({});
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await loadSubmissions();
        if (!cancelled) setSubmissions(list);
      } finally { if (!cancelled) { setRefreshing(false); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await loadSubmissions();
      setSubmissions(list);
    } finally { setRefreshing(false); setLoading(false); }
  }, []);

  async function handleSubmit() {
    setError(''); setSuccess('');
    if (!user) {
      setError(copy('Tafadhali ingia ili kuwasilisha pendekezo. / Please sign in to submit a proposal.'));
      return;
    }
    const input: SubmissionInput = {
      title, topic,
      affectedArticleId: affectedArticleId.trim() || undefined,
      problem,
      proposedWordingSw: proposedWordingSw.trim() || undefined,
      rationale,
      supportingEvidence: supportingEvidence.trim() || undefined,
      region: location.region,
      district: location.district,
      anonymous,
      authorId: user.id,
      authorDisplayName: user.display_name,
      authorVerified: user.verification_tier !== 'none',
      authorVerificationTier: user.verification_tier,
    };
    const validation = validateSubmissionInput(input);
    if (!validation.ok) {
      setError(validation.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createSubmission(input);
      setSuccess(result.duplicate?.isDuplicate
        ? copy('Pendekezo lako limeunganishwa na pendekezo lingine linalofanana. Asili yako imehifadhiwa kwa ajili ya ukaguzi. / Your proposal was merged with a similar one. Your original is preserved for audit.')
        : copy('Pendekezo lako limewasilishwa na limepitia uthibitisho wa awali. / Your proposal has been submitted and passed initial validation.'));
      // Reset form
      setTitle(''); setProblem(''); setProposedWordingSw(''); setRationale(''); setSupportingEvidence(''); setAffectedArticleId(''); setLocation({});
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
    } finally { setSubmitting(false); }
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Wasilisha Pendekezo', 'Submit Proposal')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.green[400]} />}
      >
        <View style={styles.hero}>
          <Ionicons name="megaphone-outline" size={34} color={Colors.gold[400]} />
          <Text style={styles.heroTitle}>{copy('Wasilisha Pendekezo lako', 'Submit Your Proposal')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Michango yako hupitia mchakato wa uthibitisho, uchunguzi wa nakala, uainishaji wa mada, na kuungana na mapendekezo yaliyopo. Asili yako huhifadhiwa kwa ajili ya ukaguzi.',
              'Your contribution goes through validation, duplicate detection, topic classification, and clustering with similar proposals. Your original is preserved for audit.'
            )}
          </Text>
        </View>

        <Notice>{SUBMISSION_DISCLAIMER}</Notice>

        <Pressable
          style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.85 }]}
          onPress={() => setShowForm(true)}
          accessibilityRole="button"
          accessibilityLabel={copy('Pendekezo jipya', 'New proposal')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#090e0d" />
          <Text style={styles.newBtnText}>{copy('Wasilisha Pendekezo Jipya', 'Submit a New Proposal')}</Text>
        </Pressable>

        {!user && (
          <Notice>
            {copy('Huwezi kuwasilisha pendekezo bila kuingia. Tafadhali nenda kwenye Akaunti kuingia au kujiandikisha.', 'You cannot submit a proposal without signing in. Please go to Account to sign in or register.')}
          </Notice>
        )}

        <Text style={styles.sectionLabel}>{copy('Mapendekezo Yaliyowasilishwa', 'Submitted Proposals')} ({submissions.length})</Text>

        {loading ? (
          <Text style={styles.loadingText}>{copy('Inapakia…', 'Loading…')}</Text>
        ) : submissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>{copy('Hakuna mapendekezo yaliyowasilishwa bado.', 'No proposals submitted yet.')}</Text>
          </View>
        ) : (
          submissions.map(sub => {
            const status = STATUS_LABELS[sub.status];
            const topicLabel = CONSTITUTIONAL_TOPIC_LABELS[sub.topic];
            return (
              <Pressable
                key={sub.id}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
                onPress={() => setSelected(sub)}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, sub.status === 'flagged' && styles.statusFlagged, sub.status === 'rejected_by_moderator' && styles.statusRejected, sub.status === 'merged' && styles.statusMerged, sub.status === 'clustered' && styles.statusClustered]}>
                    <Text style={styles.statusText}>{language === 'sw' ? status.sw : status.en}</Text>
                  </View>
                  <Text style={styles.topicText}>{language === 'sw' ? topicLabel.sw : topicLabel.en}</Text>
                </View>
                <Text style={styles.title}>{sub.title}</Text>
                <Text style={styles.bodyPreview} numberOfLines={2}>{sub.problem}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.metaText}>{sub.anonymous ? copy('Mwananchi', 'Anonymous') : sub.authorDisplayName}</Text>
                  <Text style={styles.metaText}>· {new Date(sub.createdAt).toLocaleDateString()}</Text>
                  {formatLocation(sub, language) && <Text style={styles.clusterText}>· {formatLocation(sub, language)}</Text>}
                  {sub.clusterId && <Text style={styles.clusterText}>· {copy('Kundi', 'Cluster')}: {sub.clusterId}</Text>}
                </View>
              </Pressable>
            );
          })
        )}

        <Text style={styles.disclaimer}>{SUBMISSION_DISCLAIMER}</Text>
      </ScrollView>

      {/* New submission form modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Wasilisha Pendekezo', 'Submit Proposal')}</Text>
              <Pressable onPress={() => setShowForm(false)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing[3], paddingBottom: Spacing[5] }} keyboardShouldPersistTaps="handled">
              <Notice>{SUBMISSION_DISCLAIMER}</Notice>

              <Field label={copy('Jina la pendekezo', 'Proposal title')}>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={copy('Andika jina fupi na la wazi…', 'Write a short, clear title…')}
                  placeholderTextColor={Colors.text.muted}
                  maxLength={200}
                  accessibilityLabel={copy('Jina', 'Title')}
                />
              </Field>

              <Field label={copy('Mada ya kikatiba', 'Constitutional topic')}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {(Object.keys(CONSTITUTIONAL_TOPIC_LABELS) as ConstitutionalTopic[]).map(t => (
                    <Pressable
                      key={t}
                      onPress={() => setTopic(t)}
                      style={[styles.pill, topic === t && styles.pillActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: topic === t }}
                    >
                      <Text style={[styles.pillText, topic === t && styles.pillTextActive]}>{language === 'sw' ? CONSTITUTIONAL_TOPIC_LABELS[t].sw : CONSTITUTIONAL_TOPIC_LABELS[t].en}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Field>

              <Field label={copy('Ibara inayoathiriwa (hiari)', 'Affected article (optional)')}>
                <TextInput
                  style={styles.input}
                  value={affectedArticleId}
                  onChangeText={setAffectedArticleId}
                  placeholder={copy('mfano: union-1', 'e.g. union-1')}
                  placeholderTextColor={Colors.text.muted}
                  accessibilityLabel={copy('Ibara inayoathiriwa', 'Affected article')}
                />
              </Field>

              <Field label={copy('Tatizo unaloshughulikia', 'Problem being addressed')}>
                <TextInput
                  style={[styles.input, { minHeight: 100 }]}
                  value={problem}
                  onChangeText={setProblem}
                  placeholder={copy('Eleza tatizo kwa uwazi…', 'Describe the problem clearly…')}
                  placeholderTextColor={Colors.text.muted}
                  multiline
                  maxLength={4000}
                  accessibilityLabel={copy('Tatizo', 'Problem')}
                />
              </Field>

              <Field label={copy('Lugha iliyopendekezwa (Kiswahili, hiari)', 'Proposed wording (Swahili, optional)')}>
                <TextInput
                  style={[styles.input, { minHeight: 100 }]}
                  value={proposedWordingSw}
                  onChangeText={setProposedWordingSw}
                  placeholder={copy('Andika lugha unayopendekeza…', 'Write your proposed wording…')}
                  placeholderTextColor={Colors.text.muted}
                  multiline
                  maxLength={4000}
                  accessibilityLabel={copy('Lugha iliyopendekezwa', 'Proposed wording')}
                />
              </Field>

              <Field label={copy('Sababu ya pendekezo', 'Rationale')}>
                <TextInput
                  style={[styles.input, { minHeight: 100 }]}
                  value={rationale}
                  onChangeText={setRationale}
                  placeholder={copy('Eleza kwa nini pendekezo hili ni muhimu…', 'Explain why this proposal matters…')}
                  placeholderTextColor={Colors.text.muted}
                  multiline
                  maxLength={4000}
                  accessibilityLabel={copy('Sababu', 'Rationale')}
                />
              </Field>

              <Field label={copy('Ushahidi wa kusaidia (hiari)', 'Supporting evidence (optional)')}>
                <TextInput
                  style={[styles.input, { minHeight: 80 }]}
                  value={supportingEvidence}
                  onChangeText={setSupportingEvidence}
                  placeholder={copy('Viungo, marejeo, takwimu…', 'Links, references, statistics…')}
                  placeholderTextColor={Colors.text.muted}
                  multiline
                  maxLength={4000}
                  accessibilityLabel={copy('Ushahidi', 'Evidence')}
                />
              </Field>

              <RegionDistrictPicker
                value={location}
                onChange={setLocation}
                regionLabel={copy('Mkoa wako (hiari)', 'Your region (optional)')}
                districtLabel={copy('Wilaya yako (hiari)', 'Your district (optional)')}
                disabled={submitting}
              />

              <Pressable
                onPress={() => setAnonymous(!anonymous)}
                style={styles.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: anonymous }}
              >
                <View style={[styles.checkbox, anonymous && styles.checkboxActive]}>
                  {anonymous && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxText}>
                  {copy('Changia kwa jina la kawaida "Mwananchi" — jina lako halitaonekana hadharani', 'Contribute anonymously as "Mwananchi" — your name will not be shown publicly')}
                </Text>
              </Pressable>

              <View style={styles.duplicateNotice}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.blue[300]} />
                <Text style={styles.duplicateText}>
                  {copy(
                    'Mapendekezo yanayofanana yanaweza kuunganishwa kwenye kundi moja bila kufuta asili yako. Asili yako inahifadhiwa kwa ajili ya ukaguzi.',
                    'Similar proposals may be merged into one cluster without deleting your original. Your submission is preserved for audit.'
                  )}
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.red[300]} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {success ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.green[400]} />
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={submitting || !user}
                style={({ pressed }) => [styles.submit, (submitting || !user) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                <Text style={styles.submitText}>
                  {submitting ? copy('Inawasilisha…', 'Submitting…') : copy('Wasilisha Pendekezo', 'Submit Proposal')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Submission detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { flex: 1 }]}>
            {selected && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle} numberOfLines={2}>{selected.title}</Text>
                  <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
                </View>
                <ScrollView contentContainerStyle={{ gap: Spacing[3], paddingBottom: Spacing[5] }}>
                  <View style={styles.detailMetaRow}>
                    <View style={[styles.statusBadge, selected.status === 'flagged' && styles.statusFlagged, selected.status === 'rejected_by_moderator' && styles.statusRejected, selected.status === 'merged' && styles.statusMerged]}>
                      <Text style={styles.statusText}>{language === 'sw' ? STATUS_LABELS[selected.status].sw : STATUS_LABELS[selected.status].en}</Text>
                    </View>
                    <Text style={styles.topicText}>{language === 'sw' ? CONSTITUTIONAL_TOPIC_LABELS[selected.topic].sw : CONSTITUTIONAL_TOPIC_LABELS[selected.topic].en}</Text>
                  </View>

                  <Text style={styles.detailLabel}>{copy('Tatizo', 'Problem')}</Text>
                  <Text style={styles.detailBody}>{selected.problem}</Text>

                  {selected.proposedWordingSw && (
                    <>
                      <Text style={styles.detailLabel}>{copy('Lugha iliyopendekezwa', 'Proposed Wording')}</Text>
                      <View style={styles.wordingBox}>
                        <Text style={styles.detailBody}>{selected.proposedWordingSw}</Text>
                      </View>
                    </>
                  )}

                  <Text style={styles.detailLabel}>{copy('Sababu', 'Rationale')}</Text>
                  <Text style={styles.detailBody}>{selected.rationale}</Text>

                  {selected.supportingEvidence && (
                    <>
                      <Text style={styles.detailLabel}>{copy('Ushahidi', 'Evidence')}</Text>
                      <Text style={styles.detailBody}>{selected.supportingEvidence}</Text>
                    </>
                  )}

                  <Text style={styles.detailLabel}>{copy('Uainishaji wa mada (mfumo)', 'Topic classification (system)')}</Text>
                  {selected.classification ? (
                    <View style={styles.classificationBox}>
                      <Text style={styles.detailBody}>{language === 'sw' ? CONSTITUTIONAL_TOPIC_LABELS[selected.classification.label].sw : CONSTITUTIONAL_TOPIC_LABELS[selected.classification.label].en} ({(selected.classification.confidence * 100).toFixed(0)}%)</Text>
                      {selected.classification.alternatives.length > 0 && (
                        <Text style={styles.metaText}>{copy('Mbadala', 'Alternatives')}: {selected.classification.alternatives.map(a => `${language === 'sw' ? CONSTITUTIONAL_TOPIC_LABELS[a.label].sw : CONSTITUTIONAL_TOPIC_LABELS[a.label].en} (${(a.confidence * 100).toFixed(0)}%)`).join(', ')}</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.metaText}>{copy('Haujaainishwa bado.', 'Not classified yet.')}</Text>
                  )}

                  <Text style={styles.detailLabel}>{copy('Matukio ya udhibiti', 'Moderation events')} ({selected.moderationEvents.length})</Text>
                  {selected.moderationEvents.map(ev => (
                    <View key={ev.id} style={styles.moderationCard}>
                      <Text style={styles.moderationKind}>{ev.kind.replace(/_/g, ' ')}</Text>
                      <Text style={styles.moderationOutcome}>{ev.outcome}</Text>
                      <Text style={styles.detailBody}>{ev.reason}</Text>
                      <Text style={styles.metaText}>{new Date(ev.at).toLocaleString()}</Text>
                    </View>
                  ))}

                  {selected.clusterId && (
                    <View style={styles.clusterBox}>
                      <Ionicons name="git-network-outline" size={18} color={Colors.green[300]} />
                      <Text style={styles.clusterTextDetail}>{copy('Umeunganishwa kwenye kundi', 'Merged into cluster')}: {selected.clusterId}</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 580, lineHeight: 21 },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], padding: Spacing[4], backgroundColor: Colors.gold[400], borderRadius: Radius.lg, minHeight: 52 },
  newBtnText: { color: '#090e0d', fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  sectionLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing[2] },
  loadingText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', padding: Spacing[4] },
  emptyState: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderRadius: Radius.sm, backgroundColor: Colors.surface.overlay },
  statusFlagged: { backgroundColor: Colors.red[100] },
  statusRejected: { backgroundColor: Colors.red[900] },
  statusMerged: { backgroundColor: Colors.blue[100] },
  statusClustered: { backgroundColor: Colors.green[900] },
  statusText: { fontSize: Typography.size.xs, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  topicText: { fontSize: Typography.size.xs, color: Colors.green[300], textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  bodyPreview: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  clusterText: { fontSize: Typography.size.xs, color: Colors.blue[300], fontStyle: 'italic' },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  field: { gap: Spacing[2] },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  pill: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay, borderWidth: 1, borderColor: Colors.surface.borderStrong, minHeight: 36 },
  pillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  pillText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  pillTextActive: { color: '#fff' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[2] },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.surface.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  checkboxText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.sm },
  duplicateNotice: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.blue[50], borderLeftWidth: 3, borderColor: Colors.blue[300], borderRadius: Radius.sm, alignItems: 'flex-start' },
  duplicateText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.xs, lineHeight: 18 },
  errorBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.red[50], borderLeftWidth: 3, borderColor: Colors.red[400], borderRadius: Radius.sm, alignItems: 'flex-start' },
  errorText: { flex: 1, color: Colors.red[300], fontSize: Typography.size.sm },
  successBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.green[900], borderLeftWidth: 3, borderColor: Colors.green[400], borderRadius: Radius.sm, alignItems: 'flex-start' },
  successText: { flex: 1, color: Colors.green[300], fontSize: Typography.size.sm },
  submit: { backgroundColor: Colors.green[600], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', minHeight: 52 },
  submitText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  detailMetaRow: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center' },
  detailLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[2] },
  detailBody: { fontSize: Typography.size.md, color: Colors.text.primary, lineHeight: 24 },
  wordingBox: { padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, borderLeftWidth: 3, borderColor: Colors.gold[400] },
  classificationBox: { padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md },
  moderationCard: { padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, gap: 2, borderWidth: 1, borderColor: Colors.surface.border },
  moderationKind: { fontSize: Typography.size.xs, color: Colors.blue[300], fontWeight: Typography.weight.semibold, textTransform: 'capitalize' },
  moderationOutcome: { fontSize: Typography.size.xs, color: Colors.text.muted, textTransform: 'capitalize' },
  clusterBox: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center', padding: Spacing[3], backgroundColor: Colors.green[900], borderRadius: Radius.md, marginTop: Spacing[3] },
  clusterTextDetail: { color: Colors.green[300], fontSize: Typography.size.sm },
});

export default CitizenSubmissionScreen;

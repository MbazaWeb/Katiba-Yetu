import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius, Layout } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Action, Notice } from '../components/library/LibraryUI';
import { getApprovalDecisions, diffText, PROPOSAL_DISCLAIMER } from '../services/proposedConstitution';
import { getArticle, officialText, localized } from '../services/constitution';
import { PROPOSAL_STATUS_LABELS } from '../types';
import type { ProposedArticle, ProposalSource } from '../types';

type WorkspaceTab = 'draft' | 'rationale' | 'sources' | 'discussion' | 'polls' | 'legalReview' | 'history' | 'compare';

interface Props {
  article: ProposedArticle;
  onBack?: () => void;
}

export function ProposalWorkspaceScreen({ article, onBack }: Props) {
  const { language } = useAppContext();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= Layout.breakpointDesktop;
  const [tab, setTab] = useState<WorkspaceTab>('draft');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  const currentArticle = article.relatedCurrentArticles[0] ? getArticle(article.relatedCurrentArticles[0]) : undefined;
  const currentText = currentArticle ? officialText(currentArticle, language) : undefined;
  const proposedText = (language === 'sw' ? article.proposedText.sw : article.proposedText.en) ?? article.proposedText.sw ?? '';
  const decisions = getApprovalDecisions(article.id);

  const tabs: { key: WorkspaceTab; label: string }[] = [
    { key: 'draft', label: copy('Rasimu', 'Draft') },
    { key: 'rationale', label: copy('Sababu', 'Rationale') },
    { key: 'sources', label: copy('Vyanzo vya Maoni', 'Opinion Sources') },
    { key: 'discussion', label: copy('Mjadala', 'Discussion') },
    { key: 'polls', label: copy('Kura', 'Polls') },
    { key: 'legalReview', label: copy('Mapitio ya Kisheria', 'Legal Review') },
    { key: 'history', label: copy('Historia ya Mabadiliko', 'Change History') },
    { key: 'compare', label: copy('Linganisha', 'Compare') },
  ];

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={`${copy('Ibara', 'Article')} ${article.proposedArticleNumber}`} subtitle={language === 'sw' ? article.proposedTitle.sw : article.proposedTitle.en ?? article.proposedTitle.sw} />
      <ScrollView contentContainerStyle={[styles.content, !isDesktop && { paddingHorizontal: Spacing[4] }]}>
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <View style={[styles.statusPill, { backgroundColor: statusColor(article.status) }]}>
            <Text style={styles.statusPillText}>{PROPOSAL_STATUS_LABELS[article.status][language]}</Text>
          </View>
          <Text style={styles.generatedText}>
            {copy('Imetengenezwa', 'Generated')}: {new Date(article.generatedAt).toLocaleDateString()} · {article.generatedBy === 'mock_deterministic' ? copy('Mfano wa mfumo', 'System mock') : article.generatedBy}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {tabs.map(t => (
            <Action key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </ScrollView>

        {/* Draft tab */}
        {tab === 'draft' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Lugha Iliyopendekezwa', 'Proposed Wording')}</Text>
            <Notice>{copy('Hii ni lugha iliyoundwa kwa mfumo au kupendekezwa na wananchi. Si maandishi rasmi ya Katiba.', 'This wording is system-generated or citizen-proposed. It is not official constitutional text.')}</Notice>
            <Text style={styles.proposedText}>{proposedText}</Text>
            <Text style={styles.cardSubtitle}>{copy('Maelezo kwa Lugha Rahisi', 'Plain-Language Summary')}</Text>
            <Text style={styles.bodyText}>{language === 'sw' ? article.plainLanguageSummary.sw : article.plainLanguageSummary.en ?? article.plainLanguageSummary.sw}</Text>
            {article.legalReviewerNotes && (
              <View style={styles.notesBox}>
                <Ionicons name="document-text-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.notesText}>{article.legalReviewerNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Rationale tab */}
        {tab === 'rationale' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Sababu ya Pendekezo', 'Rationale')}</Text>
            <Text style={styles.bodyText}>{language === 'sw' ? article.rationale.sw : article.rationale.en ?? article.rationale.sw}</Text>
            <Text style={styles.cardSubtitle}>{copy('Ibara za Sasa Zinazohusika', 'Related Current Articles')}</Text>
            {article.relatedCurrentArticles.map(id => {
              const a = getArticle(id);
              return a ? (
                <View key={id} style={styles.relatedRow}>
                  <Ionicons name="link-outline" size={16} color={Colors.blue[300]} />
                  <Text style={styles.relatedText}>{copy('Ibara', 'Article')} {a.number}: {localized(a.title, language)}</Text>
                </View>
              ) : (
                <Text key={id} style={styles.relatedText}>{id} ({copy('haijapatikana', 'unavailable')})</Text>
              );
            })}
          </View>
        )}

        {/* Sources tab */}
        {tab === 'sources' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Vyanzo vya Maoni', 'Opinion Sources')}</Text>
            <Text style={styles.cardSubtitle}>{copy('Maoni ya Msaada', 'Supporting Views')} ({article.sources.filter(src => src.stance === 'support').length})</Text>
            {article.sources.filter(src => src.stance === 'support').map((src, i) => <SourceRow key={i} source={src} language={language} />)}
            <Text style={styles.cardSubtitle}>{copy('Maoni ya Upinzani', 'Opposing Views')} ({article.sources.filter(src => src.stance === 'oppose').length})</Text>
            {article.sources.filter(src => src.stance === 'oppose').map((src, i) => <SourceRow key={i} source={src} language={language} />)}
            {article.sources.filter(src => src.stance === 'oppose').length === 0 && <Text style={styles.emptyText}>{copy('Hakuna maoni ya upinzani yaliyoingizwa. Mchakato unahitaji kuweka akiba ya maoni ya upinzani.', 'No opposing views recorded. The pipeline must preserve opposing views.')}</Text>}
            <Text style={styles.cardSubtitle}>{copy('Maoni ya Mbadala', 'Alternative Views')} ({article.sources.filter(src => src.stance === 'alternative' || src.stance === 'neutral').length})</Text>
            {article.sources.filter(src => src.stance === 'alternative' || src.stance === 'neutral').map((src, i) => <SourceRow key={i} source={src} language={language} />)}
          </View>
        )}

        {/* Discussion tab */}
        {tab === 'discussion' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Mijadala Inayohusiana', 'Linked Discussions')}</Text>
            {article.discussionIds.length === 0 && <Text style={styles.emptyText}>{copy('Hakuna mijadala iliyounganishwa kwa ibara hii.', 'No discussions linked to this article.')}</Text>}
            {article.discussionIds.map(id => (
              <View key={id} style={styles.relatedRow}>
                <Ionicons name="chatbox-outline" size={16} color={Colors.green[300]} />
                <Text style={styles.relatedText}>{id}</Text>
              </View>
            ))}
            <Notice>{copy('Majadiliko hayapangwi kwa idadi ya kupendwa tu. Maoni ya upinzani yanahifadhiwa.', 'Discussions are not ranked by likes only. Opposing views are preserved.')}</Notice>
          </View>
        )}

        {/* Polls tab */}
        {tab === 'polls' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Matokeo ya Kura', 'Poll Results')}</Text>
            <View style={styles.pollSummary}>
              <View style={[styles.pollBar, { backgroundColor: Colors.green[400], width: `${article.supportPercentage}%` }]} />
              <View style={[styles.pollBar, { backgroundColor: Colors.red[400], width: `${article.oppositionPercentage}%` }]} />
              <View style={[styles.pollBar, { backgroundColor: Colors.text.muted, width: `${article.abstentionPercentage}%` }]} />
            </View>
            <View style={styles.pollLegendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.green[400] }]} /><Text style={styles.legendText}>{copy('Msaada', 'Support')}: {article.supportPercentage}%</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.red[400] }]} /><Text style={styles.legendText}>{copy('Upinzani', 'Opposition')}: {article.oppositionPercentage}%</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.text.muted }]} /><Text style={styles.legendText}>{copy('Kujiepusha', 'Abstain')}: {article.abstentionPercentage}%</Text></View>
            </View>
            <Text style={styles.pollMeta}>{copy('Washiriki waliouthibitishwa', 'Verified participants')}: {article.verifiedParticipantCount} · {copy('Mikoa', 'Regions')}: {article.regionalCoverage}</Text>
            <Notice>{copy('Kura haiwezi kuidhinisha ibara otomatiki. Inahitaji mapitio ya kisheria na idhini ya kamati.', 'A poll cannot automatically approve an article. Legal review and committee approval are required.')}</Notice>
          </View>
        )}

        {/* Legal review tab */}
        {tab === 'legalReview' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Mapitio ya Kisheria', 'Legal Review')}</Text>
            <Text style={styles.bodyText}>{copy('Hali ya mapitio', 'Review status')}: <Text style={styles.boldText}>{article.legalReviewStatus}</Text></Text>
            {article.legalReviews.length === 0 && <Text style={styles.emptyText}>{copy('Hakuna mapitio ya kisheria yaliyoingizwa kwa ibara hii.', 'No legal reviews recorded for this article.')}</Text>}
            {article.legalReviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: review.status === 'approved' ? Colors.green[900] : review.status === 'rejected' ? Colors.red[900] : Colors.gold[100] }]}>
                    <Text style={styles.statusPillText}>{review.status}</Text>
                  </View>
                </View>
                <Text style={styles.bodyText}>{review.notes}</Text>
                <Text style={styles.metaText}>{new Date(review.reviewedAt).toLocaleString()}</Text>
                {review.risks.length > 0 && (
                  <View style={styles.riskBox}>
                    {review.risks.map((risk, i) => <Text key={i} style={styles.riskText}>• {risk}</Text>)}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Historia ya Mabadiliko', 'Change History')}</Text>
            <Text style={styles.metaText}>{copy('Toleo', 'Version')}: {article.version} · {copy('Imeundwa', 'Created')}: {new Date(article.createdAt).toLocaleDateString()} · {copy('Imesasishwa', 'Updated')}: {new Date(article.updatedAt).toLocaleDateString()}</Text>
            {decisions.map(d => (
              <View key={d.id} style={styles.reviewCard}>
                <Text style={styles.reviewerName}>{d.decision === 'approved' ? copy('Idhini imekubaliwa', 'Approved') : d.decision === 'rejected' ? copy('Imekataliwa', 'Rejected') : copy('Imerudishwa', 'Returned')}</Text>
                <Text style={styles.bodyText}>{d.rationale}</Text>
                <Text style={styles.metaText}>{copy('Imeamuliwa na', 'Decided by')} {d.decidedBy} · {new Date(d.decidedAt).toLocaleDateString()}</Text>
              </View>
            ))}
            <Notice>{copy('Kila mabadiliko yanaingizwa kama hatua ya kihistoria. Rasimu zilizochapishwa hazibadilishwi.', 'Every edit is recorded as an audit entry. Published drafts are immutable.')}</Notice>
          </View>
        )}

        {/* Compare tab */}
        {tab === 'compare' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Linganisha na Katiba ya Sasa', 'Compare with Current Constitution')}</Text>
            <View style={styles.compareGrid}>
              <View style={styles.compareCol}>
                <Text style={styles.compareColTitle}>{copy('Katiba ya Sasa', 'Current Constitution')}</Text>
                {currentArticle ? (
                  <Text style={styles.compareText}>{currentText ? `${currentText.preamble}\n${currentText.clauses.map(c => c.text).join('\n')}` : copy('Maandishi hayajapatikana / Text unavailable', 'Maandishi hayajapatikana / Text unavailable')}</Text>
                ) : (
                  <Text style={styles.compareText}>{copy('Haijapatikana', 'Unavailable')}</Text>
                )}
              </View>
              <View style={styles.compareCol}>
                <Text style={styles.compareColTitle}>{copy('Rasimu Iliyopendekezwa', 'Proposed Draft')}</Text>
                <Text style={styles.compareText}>{proposedText || copy('Hakuna maandishi yaliyoandikwa bado.', 'No wording drafted yet.')}</Text>
              </View>
            </View>
            {currentText && proposedText && (
              <View style={styles.diffBox}>
                <Text style={styles.cardSubtitle}>{copy('Tofauti', 'Diff')}</Text>
                <Text style={styles.diffText}>
                  {diffText(`${currentText.preamble} ${currentText.clauses.map(c => c.text).join(' ')}`, proposedText).map(seg => seg.kind === 'added' ? `[+${seg.text}]` : seg.kind === 'removed' ? `[-${seg.text}]` : seg.text).join('')}
                </Text>
              </View>
            )}
            <Notice>{copy('Lugha rasmi ya Katiba haibadilishwi kamwe. Linganisho hili ni la kufahamu tu.', 'Official constitutional text is never overwritten. This comparison is informational only.')}</Notice>
          </View>
        )}

        <Text style={styles.disclaimer}>{PROPOSAL_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

function SourceRow({ source, language }: { source: ProposalSource; language: 'sw' | 'en' }) {
  const stanceLabel: Record<string, { sw: string; en: string }> = {
    support: { sw: 'Msaada', en: 'Support' },
    oppose: { sw: 'Upinzani', en: 'Oppose' },
    neutral: { sw: 'Wastani', en: 'Neutral' },
    alternative: { sw: 'Mbadala', en: 'Alternative' },
  };
  return (
    <View style={styles.sourceRow}>
      <View style={[styles.stanceDot, { backgroundColor: source.stance === 'support' ? Colors.green[400] : source.stance === 'oppose' ? Colors.red[400] : Colors.text.muted }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sourceExcerpt}>&ldquo;{source.excerpt}&rdquo;</Text>
        <Text style={styles.metaText}>{stanceLabel[source.stance][language]} · {source.contributorVerified ? (language === 'sw' ? 'Imethibitishwa' : 'Verified') : (language === 'sw' ? 'Haijathibitishwa' : 'Unverified')} {source.contributorRegion ? `· ${source.contributorRegion}` : ''}</Text>
      </View>
    </View>
  );
}

function statusColor(status: ProposedArticle['status']): string {
  const colors: Record<string, string> = {
    citizen_proposal: Colors.blue[300],
    merged_proposal: Colors.blue[400],
    system_draft: Colors.gold[400],
    under_discussion: Colors.blue[300],
    awaiting_legal_review: Colors.gold[400],
    legally_reviewed: Colors.green[400],
    approved_for_draft: Colors.green[400],
    rejected: Colors.red[400],
    withdrawn: Colors.text.muted,
  };
  return colors[status] ?? Colors.text.muted;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 1000, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flexWrap: 'wrap' },
  statusPill: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full },
  statusPillText: { color: '#fff', fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  generatedText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[5], gap: Spacing[3] },
  cardTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  cardSubtitle: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[2] },
  proposedText: { fontSize: Typography.size.lg, color: Colors.text.primary, lineHeight: 28, padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, borderLeftWidth: 3, borderColor: Colors.gold[400] },
  bodyText: { fontSize: Typography.size.md, color: Colors.text.secondary, lineHeight: 24 },
  boldText: { fontWeight: Typography.weight.bold, color: Colors.text.primary },
  notesBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.green[900], borderRadius: Radius.sm, alignItems: 'flex-start' },
  notesText: { flex: 1, color: Colors.green[300], fontSize: Typography.size.sm },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[1] },
  relatedText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, fontStyle: 'italic' },
  sourceRow: { flexDirection: 'row', gap: Spacing[2], paddingVertical: Spacing[2], alignItems: 'flex-start' },
  stanceDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  sourceExcerpt: { fontSize: Typography.size.sm, color: Colors.text.primary, fontStyle: 'italic', lineHeight: 21 },
  metaText: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  pollSummary: { flexDirection: 'row', height: 16, borderRadius: Radius.sm, overflow: 'hidden', backgroundColor: Colors.surface.overlay },
  pollBar: { height: '100%' },
  pollLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginTop: Spacing[2] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  pollMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: Spacing[2] },
  reviewCard: { backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, padding: Spacing[3], gap: Spacing[1], borderWidth: 1, borderColor: Colors.surface.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.green[300] },
  riskBox: { marginTop: Spacing[2], padding: Spacing[2], backgroundColor: Colors.red[50], borderRadius: Radius.sm },
  riskText: { color: Colors.red[300], fontSize: Typography.size.xs, lineHeight: 18 },
  compareGrid: { flexDirection: 'row', gap: Spacing[3] },
  compareCol: { flex: 1, gap: Spacing[2] },
  compareColTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.green[300], textTransform: 'uppercase', letterSpacing: 0.5 },
  compareText: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 22, padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md },
  diffBox: { marginTop: Spacing[3] },
  diffText: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 22, padding: Spacing[3], backgroundColor: Colors.surface.base, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surface.border },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
});

export default ProposalWorkspaceScreen;

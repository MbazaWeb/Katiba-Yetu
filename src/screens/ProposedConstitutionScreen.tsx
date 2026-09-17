import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius, Layout } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Action, Notice } from '../components/library/LibraryUI';
import {
  getProposedConstitution, getProposedChapters, getProposedArticles,
  getCurrentDraftVersion, getDraftVersions, getParticipationSummary,
  PROPOSAL_DISCLAIMER,
} from '../services/proposedConstitution';
import { getPDFExportBackend } from '../services/backend';
import { CHAPTER_STATUS_LABELS, PROPOSAL_STATUS_LABELS } from '../types';
import type { ProposedArticle, ChapterProposalStatus } from '../types';

interface Props {
  onOpenArticle?: (article: ProposedArticle) => void;
  onOpenDraftReader?: (versionId: string) => void;
  onOpenComparison?: () => void;
  onOpenVersionHistory?: () => void;
  onBack?: () => void;
}

export function ProposedConstitutionScreen({ onOpenArticle, onOpenDraftReader, onOpenComparison, onOpenVersionHistory, onBack }: Props) {
  const { language } = useAppContext();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= Layout.breakpointDesktop;
  const constitution = getProposedConstitution();
  const chapters = getProposedChapters();
  const articles = getProposedArticles();
  const currentDraft = getCurrentDraftVersion();
  const versions = getDraftVersions();
  const participation = getParticipationSummary();
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const copy = (sw: string, en?: string) => en === undefined ? sw : (language === 'sw' ? sw : en);

  function toggleChapter(id: string) {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Katiba Inayopendekezwa', 'Proposed Constitution')} />
      <ScrollView contentContainerStyle={[styles.content, !isDesktop && { paddingHorizontal: Spacing[4] }]}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="create-outline" size={34} color={Colors.gold[400]} />
          </View>
          <Text style={styles.heroTitle}>{language === 'sw' ? constitution.name.sw : constitution.name.en ?? constitution.name.sw}</Text>
          <Text style={styles.heroSub}>{language === 'sw' ? constitution.description.sw : constitution.description.en}</Text>
        </View>

        {/* Governance disclaimer */}
        <Notice>{PROPOSAL_DISCLAIMER}</Notice>

        {/* Current draft card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{copy('Rasimu ya Sasa', 'Current Draft')}</Text>
            <View style={[styles.statusBadge, styles.statusBadgeDraft]}>
              <Text style={styles.statusText}>{currentDraft.status === 'draft' ? copy('Rasimu', 'Draft') : currentDraft.status === 'published' ? copy('Imechapishwa', 'Published') : copy('Inapitiwa', 'In review')}</Text>
            </View>
          </View>
          <View style={styles.draftMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{copy('Jina', 'Name')}</Text>
              <Text style={styles.metaValue}>{currentDraft.name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{copy('Toleo', 'Version')}</Text>
              <Text style={styles.metaValue}>{currentDraft.versionNumber}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{copy('Tarehe', 'Date')}</Text>
              <Text style={styles.metaValue}>{currentDraft.publishedAt ? new Date(currentDraft.publishedAt).toLocaleDateString() : copy('Haijachapishwa', 'Unpublished')}</Text>
            </View>
          </View>
          <View style={styles.statGrid}>
            <StatBox label={copy('Sura', 'Chapters')} value={currentDraft.totalChapters} />
            <StatBox label={copy('Ibara', 'Articles')} value={currentDraft.totalArticles} />
            <StatBox label={copy('Zinasubiri', 'Awaiting review')} value={currentDraft.awaitingLegalReview} />
            <StatBox label={copy('Imeidhinishwa', 'Approved')} value={currentDraft.approved} color={Colors.green[400]} />
            <StatBox label={copy('Zimekosolewa', 'Disputed')} value={currentDraft.disputed} color={Colors.red[300]} />
            <StatBox label={copy('Washiriki', 'Participants')} value={currentDraft.participationCount} />
            <StatBox label={copy('Mikoa', 'Regions')} value={currentDraft.regionalCoverage} />
            <StatBox label={copy('Masasisho', 'Updates')} value={currentDraft.changeLog.length} />
          </View>
          <View style={styles.actionRow}>
            <Action primary label={copy('Fungua Rasimu', 'Open draft')} onPress={() => onOpenDraftReader?.(currentDraft.id)} />
            <Action label={copy('Linganisha na Katiba', 'Compare with current')} onPress={() => onOpenComparison?.()} />
            <Action label={copy('Historia ya Matoleo', 'Version history')} onPress={() => onOpenVersionHistory?.()} />
          </View>
        </View>

        {/* Participation summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy('Muhtasari wa Ushiriki', 'Participation Summary')}</Text>
          <View style={styles.statGrid}>
            <StatBox label={copy('Mapendekezo', 'Suggestions')} value={participation.totalSuggestions} />
            <StatBox label={copy('Mijadala', 'Discussions')} value={participation.discussionsIncluded} />
            <StatBox label={copy('Majibu ya kura', 'Poll responses')} value={participation.pollResponses} />
            <StatBox label={copy('Wachangiaji waliouthibitishwa', 'Verified contributors')} value={participation.verifiedContributors} color={Colors.green[400]} />
            <StatBox label={copy('Mikoa', 'Regions')} value={participation.representedRegions} />
            <StatBox label={copy('Yaliyokataliwa', 'Flagged')} value={participation.excludedOrFlaggedSubmissions} color={Colors.red[300]} />
            <StatBox label={copy('Mada zisizoreshwa', 'Unresolved topics')} value={participation.unresolvedConstitutionalTopics} color={Colors.gold[400]} />
          </View>
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={18} color={Colors.gold[400]} />
            <Text style={styles.warningText}>
              {copy(
                'Idadi ya washiriki haina maana ya uwakilishi wa kitaifa. Onyo hili linahitaji kuonekana wazi kwenye kila rasimu.',
                'Participant counts do not imply national representation. This warning must be displayed prominently on every draft.'
              )}
            </Text>
          </View>
        </View>

        {/* Proposed chapters */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy('Sura Zilizopendekezwa', 'Proposed Chapters')}</Text>
          {chapters.map(chapter => {
            const open = expandedChapters.includes(chapter.id);
            const chapterArticles = articles.filter(a => a.chapterId === chapter.id);
            const statusColors: Record<ChapterProposalStatus, string> = {
              approved: Colors.green[400],
              under_discussion: Colors.blue[300],
              awaiting_legal_review: Colors.gold[400],
              disputed: Colors.red[300],
              insufficient_participation: Colors.text.muted,
            };
            return (
              <View key={chapter.id} style={styles.chapterBlock}>
                <Pressable
                  style={({ pressed }) => [styles.chapterHeader, pressed && { opacity: 0.7 }]}
                  onPress={() => toggleChapter(chapter.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                >
                  <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={20} color={Colors.text.secondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chapterTitle}>{copy('Sura', 'Chapter')} {chapter.number}: {language === 'sw' ? chapter.title.sw : chapter.title.en ?? chapter.title.sw}</Text>
                    <Text style={styles.chapterMeta}>{chapterArticles.length} {copy('ibara', 'articles')}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[chapter.status] + '22', borderColor: statusColors[chapter.status] }]}>
                    <Text style={[styles.statusText, { color: statusColors[chapter.status] }]}>{CHAPTER_STATUS_LABELS[chapter.status][language]}</Text>
                  </View>
                </Pressable>
                {open && (
                  <View style={styles.articleList}>
                    {chapterArticles.map(article => (
                      <Pressable
                        key={article.id}
                        style={({ pressed }) => [styles.articleRow, pressed && { opacity: 0.7 }]}
                        onPress={() => onOpenArticle?.(article)}
                        accessibilityRole="button"
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.articleNumber}>{copy('Ibara', 'Article')} {article.proposedArticleNumber}: {language === 'sw' ? article.proposedTitle.sw : article.proposedTitle.en ?? article.proposedTitle.sw}</Text>
                          <Text style={styles.articleSummary} numberOfLines={2}>{language === 'sw' ? article.plainLanguageSummary.sw : article.plainLanguageSummary.en}</Text>
                          <View style={styles.articleMetaRow}>
                            <Text style={styles.articleMetaText}>{copy('Msaada', 'Support')}: {article.supportPercentage}% · {copy('Upinzani', 'Opposition')}: {article.oppositionPercentage}%</Text>
                            <View style={[styles.statusBadge, { backgroundColor: Colors.surface.overlay }]}>
                              <Text style={styles.statusText}>{PROPOSAL_STATUS_LABELS[article.status][language]}</Text>
                            </View>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Versions list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy('Matoleo ya Rasimu', 'Draft Versions')}</Text>
          {versions.map(version => (
            <View key={version.id} style={styles.versionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.versionName}>{version.name} {version.immutable && <Text style={styles.immutableBadge}>· {copy('Imefungwa', 'Immutable')}</Text>}</Text>
                <Text style={styles.versionMeta}>{version.totalArticles} {copy('ibara', 'articles')} · {version.changeLog.length} {copy('mabadiliko', 'changes')} · {version.publishedAt ? new Date(version.publishedAt).toLocaleDateString() : copy('Haijachapishwa', 'Unpublished')}</Text>
              </View>
              <Action label={copy('Fungua', 'Open')} onPress={() => onOpenDraftReader?.(version.id)} />
              {version.immutable && (
                <Pressable
                  style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.7 }]}
                  onPress={async () => {
                    try {
                      const pdf = getPDFExportBackend();
                      const result = await pdf.exportDraft(version.id, { language, includeMethodology: true });
                      if (Platform.OS === 'web' && result.blobUri) {
                        // Open the printable HTML view in a new tab.
                        window.open(result.blobUri, '_blank');
                      } else if (result.blobUri) {
                        Linking.openURL(result.blobUri).catch(() => Alert.alert(copy('Hitilafu', 'Error'), copy('Faili halikufunguka. / Could not open file.')));
                      }
                    } catch (e) {
                      Alert.alert(copy('Hitilafu', 'Error'), e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={copy('Pakua PDF', 'Download PDF')}
                >
                  <Ionicons name="download-outline" size={18} color={Colors.green[300]} />
                  <Text style={styles.exportBtnText}>{copy('Pakua PDF', 'Download PDF')}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>{PROPOSAL_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 1100, alignSelf: 'center', width: '100%', gap: Spacing[5] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[4] },
  heroIcon: { width: 72, height: 72, borderRadius: Radius.full, backgroundColor: Colors.gold[100], borderWidth: 2, borderColor: Colors.gold[400], alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 560, lineHeight: 21 },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[5], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  statusBadge: { paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderRadius: Radius.sm, borderWidth: 1, borderColor: 'transparent' },
  statusBadgeDraft: { backgroundColor: Colors.blue[100], borderColor: Colors.blue[300] },
  statusText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: Colors.text.secondary },
  draftMeta: { flexDirection: 'row', gap: Spacing[4], flexWrap: 'wrap' },
  metaItem: { flex: 1, minWidth: 100 },
  metaLabel: { fontSize: Typography.size.xs, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: Typography.size.md, color: Colors.text.primary, fontWeight: Typography.weight.medium },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  statBox: { flex: 1, minWidth: 110, backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center', gap: 2 },
  statValue: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  statLabel: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  warningBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.gold[50], borderLeftWidth: 3, borderColor: Colors.gold[400], borderRadius: Radius.sm, alignItems: 'flex-start' },
  warningText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.xs, lineHeight: 18 },
  chapterBlock: { borderWidth: 1, borderColor: Colors.surface.border, borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing[2] },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3], backgroundColor: Colors.surface.overlay },
  chapterTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  chapterMeta: { fontSize: Typography.size.xs, color: Colors.text.muted },
  articleList: { padding: Spacing[3], gap: Spacing[2], backgroundColor: Colors.surface.base },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3], paddingHorizontal: Spacing[2], borderRadius: Radius.sm, backgroundColor: Colors.surface.raised, borderWidth: 1, borderColor: Colors.surface.border },
  articleNumber: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  articleSummary: { fontSize: Typography.size.xs, color: Colors.text.secondary, lineHeight: 18, marginTop: 2 },
  articleMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing[2], gap: Spacing[2] },
  articleMetaText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  versionName: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  immutableBadge: { fontSize: Typography.size.xs, color: Colors.gold[400], fontStyle: 'italic' },
  versionMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.green[400], backgroundColor: Colors.surface.overlay, minHeight: 36 },
  exportBtnText: { color: Colors.green[300], fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
});

export default ProposedConstitutionScreen;

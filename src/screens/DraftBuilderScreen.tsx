import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Action, Notice } from '../components/library/LibraryUI';
import {
  loadDraftVersions, createDraftVersion, publishDraftVersion, archiveDraftVersion, restoreFromVersion,
  editArticleWording, assignArticleNumber,
  sendBackForDiscussion, requestPoll, markLegallyReviewed, loadDraftActions,
  AuthorizationError,
} from '../services/draftBuilder';
import { getProposedArticles, getProposedChapters } from '../services/proposedConstitution';
import { PROPOSAL_DISCLAIMER, ROLE_PERMISSIONS, DRAFT_BUILDER_ROLE_LABELS } from '../types';
import type {
  DraftVersion, DraftBuilderAction, DraftBuilderRole, ProposedArticle,
} from '../types';

interface Props {
  onBack?: () => void;
}

type ActionModalKind = 'create_version' | 'edit_wording' | 'assign_number' | 'request_poll' | 'legal_review' | 'send_back' | null;

export function DraftBuilderScreen({ onBack }: Props) {
  const { language, user } = useAppContext();
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [actions, setActions] = useState<DraftBuilderAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DraftVersion | null>(null);
  const [modalKind, setModalKind] = useState<ActionModalKind>(null);
  const [selectedArticle, setSelectedArticle] = useState<ProposedArticle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields for various modals
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [editField, setEditField] = useState<'proposedTitle' | 'proposedText' | 'plainLanguageSummary' | 'rationale'>('proposedText');
  const [editLanguage, setEditLanguage] = useState<'sw' | 'en'>('sw');
  const [editBefore, setEditBefore] = useState('');
  const [editAfter, setEditAfter] = useState('');
  const [newArticleNumber, setNewArticleNumber] = useState('');
  const [pollStage, setPollStage] = useState('problem_confirmation');
  const [legalStatus, setLegalStatus] = useState<'approved' | 'rejected' | 'returned_for_revision'>('approved');
  const [legalNotes, setLegalNotes] = useState('');
  const [sendBackReason, setSendBackReason] = useState('');

  const articles = getProposedArticles();
  const chapters = getProposedChapters();
  const copy = (sw: string, en?: string) => en === undefined ? sw : (language === 'sw' ? sw : en);

  // Map current logged-in user to a DraftBuilderRole (demo).
  // Real implementation would derive from server-side role assignment.
  function resolveRole(u: typeof user): DraftBuilderRole {
    if (!u) return 'citizen';
    if (u.role === 'admin') return 'administrator';
    if (u.role === 'moderator') return 'moderator';
    return 'citizen';
  }
  const currentRole: DraftBuilderRole = resolveRole(user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, actionList] = await Promise.all([loadDraftVersions(), loadDraftActions()]);
        if (cancelled) return;
        setVersions(list);
        setActions(actionList);
      } finally { if (!cancelled) { setRefreshing(false); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [list, actionList] = await Promise.all([loadDraftVersions(), loadDraftActions()]);
      setVersions(list);
      setActions(actionList);
    } finally { setRefreshing(false); setLoading(false); }
  }, []);

  function getActor() {
    return {
      id: user?.id ?? 'anonymous',
      name: user?.display_name ?? 'Mwananchi',
      role: currentRole,
    };
  }

  async function handleAction(fn: () => Promise<unknown>) {
    setError(''); setSuccess(''); setBusy(true);
    try {
      await fn();
      setModalKind(null);
      await refresh();
      setSuccess(copy('Hatua imekamilika. / Action completed.'));
    } catch (e) {
      if (e instanceof AuthorizationError) {
        setError(copy(`Nafasi yako (${DRAFT_BUILDER_ROLE_LABELS[currentRole][language]}) hairuhusu hatua hii.`, `Your role (${DRAFT_BUILDER_ROLE_LABELS[currentRole].en}) is not authorised for this action.`));
      } else {
        setError(e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa. / Unexpected error.'));
      }
    } finally { setBusy(false); }
  }

  const canCreateVersion = ROLE_PERMISSIONS[currentRole].includes('draft.create_version');
  const canPublish = ROLE_PERMISSIONS[currentRole].includes('draft.publish_version');
  const canEditWording = ROLE_PERMISSIONS[currentRole].includes('draft.edit_wording');
  const canLegalReview = ROLE_PERMISSIONS[currentRole].includes('draft.review_legal');
  const canRequestPoll = ROLE_PERMISSIONS[currentRole].includes('draft.request_poll');
  const canSendBack = ROLE_PERMISSIONS[currentRole].includes('draft.send_back');
  const canArchive = ROLE_PERMISSIONS[currentRole].includes('draft.archive_version');
  const canRestore = ROLE_PERMISSIONS[currentRole].includes('draft.restore_version');

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Mjenzi wa Rasimu', 'Draft Builder')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.green[400]} />}
      >
        <View style={styles.hero}>
          <Ionicons name="construct-outline" size={34} color={Colors.gold[400]} />
          <Text style={styles.heroTitle}>{copy('Mjenzi wa Rasimu', 'Draft Builder')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Eneo la Kamati ya Rasimu na Wataalamu wa Sheria. Kila hatua inaingizwa kwenye historia ya ukaguzi. Rasimu zilizochapishwa hazibadilishwi.',
              'Workspace for the Drafting Committee and Legal Experts. Every action is audited. Published drafts are immutable.'
            )}
          </Text>
          <View style={styles.roleBox}>
            <Ionicons name="person-circle-outline" size={18} color={Colors.green[300]} />
            <Text style={styles.roleText}>{copy('Nafasi yako', 'Your role')}: {DRAFT_BUILDER_ROLE_LABELS[currentRole][language]}</Text>
          </View>
        </View>

        <Notice>{PROPOSAL_DISCLAIMER}</Notice>

        {/* Create new version */}
        <Pressable
          style={({ pressed }) => [styles.newBtn, !canCreateVersion && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
          onPress={() => canCreateVersion ? setModalKind('create_version') : null}
          disabled={!canCreateVersion}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={22} color="#090e0d" />
          <Text style={styles.newBtnText}>{copy('Unda Toleo Jipya la Rasimu', 'Create New Draft Version')}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>{copy('Matoleo ya Rasimu', 'Draft Versions')} ({versions.length})</Text>

        {loading ? (
          <Text style={styles.loadingText}>{copy('Inapakia…', 'Loading…')}</Text>
        ) : (
          versions.map(v => (
            <Pressable
              key={v.id}
              style={({ pressed }) => [styles.versionCard, pressed && { opacity: 0.75 }, selectedVersion?.id === v.id && styles.versionCardSelected]}
              onPress={() => setSelectedVersion(v)}
              accessibilityRole="button"
            >
              <View style={styles.versionHeader}>
                <Text style={styles.versionName}>{v.name} {v.immutable && <Text style={styles.immutableTag}>· {copy('Imefungwa', 'Immutable')}</Text>}</Text>
                <View style={[styles.statusPill, v.status === 'published' && styles.statusPublished, v.status === 'draft' && styles.statusDraft, v.status === 'archived' && styles.statusArchived]}>
                  <Text style={styles.statusPillText}>{v.status}</Text>
                </View>
              </View>
              <View style={styles.versionStats}>
                <Text style={styles.statChip}>{copy('Sura', 'Chapters')}: {v.totalChapters}</Text>
                <Text style={styles.statChip}>{copy('Ibara', 'Articles')}: {v.totalArticles}</Text>
                <Text style={styles.statChip}>{copy('Zinasubiri', 'Awaiting')}: {v.awaitingLegalReview}</Text>
                <Text style={styles.statChip}>{copy('Imeidhinishwa', 'Approved')}: {v.approved}</Text>
              </View>
              <Text style={styles.metaText}>{copy('Masasisho ya mwisho', 'Last update')}: {new Date(v.lastUpdate).toLocaleString()}</Text>
              {v.publishedAt && <Text style={styles.metaText}>{copy('Imechapishwa', 'Published')}: {new Date(v.publishedAt).toLocaleString()}</Text>}
              <View style={styles.versionActions}>
                {v.status === 'draft' && canPublish && (
                  <Pressable style={styles.miniBtn} onPress={() => handleAction(() => publishDraftVersion(v.id, getActor()))}><Text style={styles.miniBtnText}>{copy('Chapisha', 'Publish')}</Text></Pressable>
                )}
                {v.status === 'published' && canArchive && (
                  <Pressable style={styles.miniBtnArchive} onPress={() => handleAction(() => archiveDraftVersion(v.id, getActor()))}><Text style={styles.miniBtnText}>{copy('Hifadhi kando', 'Archive')}</Text></Pressable>
                )}
                {v.immutable && canRestore && (
                  <Pressable style={styles.miniBtnRestore} onPress={() => handleAction(() => restoreFromVersion(v.id, getActor()))}><Text style={styles.miniBtnText}>{copy('Rekebisha kutoka', 'Restore from')}</Text></Pressable>
                )}
              </View>
            </Pressable>
          ))
        )}

        {/* Selected version detail */}
        {selectedVersion && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{copy('Ibara katika Rasimu', 'Articles in Draft')} — {selectedVersion.name}</Text>

            {/* Articles in this version (for demo, show all mock articles) */}
            {articles.map(article => {
              const chapter = chapters.find(c => c.id === article.chapterId);
              return (
                <View key={article.id} style={styles.articleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleTitle}>{copy('Ibara', 'Article')} {article.proposedArticleNumber}: {language === 'sw' ? article.proposedTitle.sw : article.proposedTitle.en ?? article.proposedTitle.sw}</Text>
                    <Text style={styles.articleMeta}>{copy('Sura', 'Chapter')} {chapter?.number} · {copy('Hadhi', 'Status')}: {article.status}</Text>
                  </View>
                  <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={copy('Hariri lugha', 'Edit wording')} onPress={() => { setSelectedArticle(article); setEditBefore((language === 'sw' ? article.proposedText.sw : article.proposedText.en) ?? ''); setEditAfter((language === 'sw' ? article.proposedText.sw : article.proposedText.en) ?? ''); setModalKind('edit_wording'); }}>
                    <Ionicons name="create-outline" size={18} color={canEditWording ? Colors.green[300] : Colors.text.muted} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={copy('Panga nambari ya ibara', 'Assign article number')} onPress={() => { setSelectedArticle(article); setNewArticleNumber(article.proposedArticleNumber); setModalKind('assign_number'); }}>
                    <Ionicons name="pricetag-outline" size={18} color={canCreateVersion ? Colors.green[300] : Colors.text.muted} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={copy('Omba kura', 'Request poll')} onPress={() => { setSelectedArticle(article); setPollStage('problem_confirmation'); setModalKind('request_poll'); }}>
                    <Ionicons name="stats-chart-outline" size={18} color={canRequestPoll ? Colors.green[300] : Colors.text.muted} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={copy('Mapitio ya kisheria', 'Legal review')} onPress={() => { setSelectedArticle(article); setLegalStatus('approved'); setLegalNotes(''); setModalKind('legal_review'); }}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={canLegalReview ? Colors.green[300] : Colors.text.muted} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={copy('Rudisha kwa majadiliano', 'Send back for discussion')} onPress={() => { setSelectedArticle(article); setSendBackReason(''); setModalKind('send_back'); }}>
                    <Ionicons name="return-down-back-outline" size={18} color={canSendBack ? Colors.red[300] : Colors.text.muted} />
                  </Pressable>
                </View>
              );
            })}

            {/* Change log */}
            <Text style={styles.detailLabel}>{copy('Kumbukumbu ya mabadiliko', 'Change log')} ({selectedVersion.changeLog.length})</Text>
            <View style={styles.changeLog}>
              {selectedVersion.changeLog.map(change => (
                <View key={change.id} style={styles.changeRow}>
                  <Ionicons
                    name={change.kind === 'added' ? 'add-circle' : change.kind === 'removed' ? 'remove-circle' : change.kind === 'modified' ? 'create' : change.kind === 'moved' ? 'move' : 'repeat'}
                    size={16}
                    color={change.kind === 'added' ? Colors.green[400] : change.kind === 'removed' ? Colors.red[400] : Colors.gold[400]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.changeDesc}>{change.description}</Text>
                    <Text style={styles.changeMeta}>{change.actorName} · {new Date(change.at).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Audit trail */}
        <Text style={styles.sectionLabel}>{copy('Historia ya ukaguzi', 'Audit trail')} ({actions.length})</Text>
        <View style={styles.auditBox}>
          {actions.length === 0 && <Text style={styles.metaText}>{copy('Hakuna hatua zilizorekodiwa bado.', 'No actions recorded yet.')}</Text>}
          {actions.slice(0, 20).map(action => (
            <View key={action.id} style={styles.auditRow}>
              <Text style={styles.auditAction}>{action.kind.replace(/_/g, ' ')}</Text>
              <Text style={styles.auditDesc}>{action.description}</Text>
              <Text style={styles.auditMeta}>{action.actorName} ({DRAFT_BUILDER_ROLE_LABELS[action.actorRole][language]}) · {new Date(action.at).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Text style={styles.disclaimer}>{PROPOSAL_DISCLAIMER}</Text>
      </ScrollView>

      {/* Create version modal */}
      <Modal visible={modalKind === 'create_version'} animationType="slide" transparent onRequestClose={() => setModalKind(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Unda Toleo Jipya', 'Create New Version')}</Text>
              <Pressable onPress={() => setModalKind(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <View style={{ gap: Spacing[3] }}>
              <Text style={styles.label}>{copy('Jina la toleo', 'Version name')}</Text>
              <TextInput style={styles.input} value={newVersionName} onChangeText={setNewVersionName} placeholder={copy('mfano: Rasimu 0.3', 'e.g. Draft 0.3')} placeholderTextColor={Colors.text.muted} />
              <Text style={styles.label}>{copy('Nambari ya toleo', 'Version number')}</Text>
              <TextInput style={styles.input} value={newVersionNumber} onChangeText={setNewVersionNumber} placeholder="0.3" placeholderTextColor={Colors.text.muted} />
              <Action primary label={copy('Unda', 'Create')} disabled={busy || !newVersionName.trim() || !newVersionNumber.trim()} onPress={() => handleAction(async () => {
                await createDraftVersion({ constitutionId: 'pc-1', name: newVersionName.trim(), versionNumber: newVersionNumber.trim(), actor: getActor() });
                setNewVersionName(''); setNewVersionNumber('');
              })} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit wording modal */}
      <Modal visible={modalKind === 'edit_wording'} animationType="slide" transparent onRequestClose={() => setModalKind(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Hariri Lugha', 'Edit Wording')}</Text>
              <Pressable onPress={() => setModalKind(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing[3] }}>
              {selectedArticle && <Text style={styles.contextText}>{copy('Ibara', 'Article')} {selectedArticle.proposedArticleNumber}</Text>}
              <Text style={styles.label}>{copy('Sehemu ya kuhariri', 'Field')}</Text>
              <View style={styles.pillRow}>
                {(['proposedTitle', 'proposedText', 'plainLanguageSummary', 'rationale'] as const).map(f => (
                  <Pressable key={f} style={[styles.pill, editField === f && styles.pillActive]} onPress={() => setEditField(f)}><Text style={[styles.pillText, editField === f && styles.pillTextActive]}>{f}</Text></Pressable>
                ))}
              </View>
              <Text style={styles.label}>{copy('Lugha', 'Language')}</Text>
              <View style={styles.pillRow}>
                {(['sw', 'en'] as const).map(l => (
                  <Pressable key={l} style={[styles.pill, editLanguage === l && styles.pillActive]} onPress={() => setEditLanguage(l)}><Text style={[styles.pillText, editLanguage === l && styles.pillTextActive]}>{l === 'sw' ? 'Kiswahili' : 'English'}</Text></Pressable>
                ))}
              </View>
              <Text style={styles.label}>{copy('Lugha mpya', 'New wording')}</Text>
              <TextInput style={[styles.input, { minHeight: 120 }]} value={editAfter} onChangeText={setEditAfter} multiline maxLength={4000} />
              <Notice>{copy('Kila mabadiliko yaingizwa kwenye historia ya ukaguzi. Rasimu zilizochapishwa hazibadilishwa.', 'Every edit is added to the audit trail. Published drafts cannot be modified.')}</Notice>
              <Action primary label={copy('Hifadhi mabadiliko', 'Save edit')} disabled={busy || !editAfter.trim()} onPress={() => handleAction(async () => {
                if (!selectedArticle) return;
                await editArticleWording({
                  versionId: selectedVersion?.id ?? '', articleId: selectedArticle.id, field: editField, language: editLanguage,
                  before: editBefore, after: editAfter, actor: getActor(),
                });
                setEditAfter(''); setEditBefore('');
              })} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign number modal */}
      <Modal visible={modalKind === 'assign_number'} animationType="slide" transparent onRequestClose={() => setModalKind(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Panga Nambari ya Ibara', 'Assign Article Number')}</Text>
              <Pressable onPress={() => setModalKind(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <View style={{ gap: Spacing[3] }}>
              {selectedArticle && <Text style={styles.contextText}>{copy('Ibara', 'Article')} {selectedArticle.proposedArticleNumber}</Text>}
              <Text style={styles.label}>{copy('Nambari mpya', 'New number')}</Text>
              <TextInput style={styles.input} value={newArticleNumber} onChangeText={setNewArticleNumber} placeholder="15" placeholderTextColor={Colors.text.muted} />
              <Action primary label={copy('Panga', 'Assign')} disabled={busy || !newArticleNumber.trim()} onPress={() => handleAction(async () => {
                if (!selectedArticle || !selectedVersion) return;
                await assignArticleNumber(selectedVersion.id, selectedArticle.id, newArticleNumber.trim(), getActor());
                setNewArticleNumber('');
              })} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Request poll modal */}
      <Modal visible={modalKind === 'request_poll'} animationType="slide" transparent onRequestClose={() => setModalKind(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Omba Kura', 'Request Poll')}</Text>
              <Pressable onPress={() => setModalKind(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <View style={{ gap: Spacing[3] }}>
              {selectedArticle && <Text style={styles.contextText}>{copy('Ibara', 'Article')} {selectedArticle.proposedArticleNumber}</Text>}
              <Text style={styles.label}>{copy('Hatua ya kura', 'Poll stage')}</Text>
              <View style={styles.pillRow}>
                {['problem_confirmation', 'policy_direction', 'article_wording', 'approval_for_draft'].map(stage => (
                  <Pressable key={stage} style={[styles.pill, pollStage === stage && styles.pillActive]} onPress={() => setPollStage(stage)}><Text style={[styles.pillText, pollStage === stage && styles.pillTextActive]}>{stage.replace(/_/g, ' ')}</Text></Pressable>
                ))}
              </View>
              <Notice>{copy('Kura haiwezi kuidhinisha ibara otomatiki. Inahitaji mapitio ya kisheria na idhini ya kamati.', 'A poll cannot auto-approve an article. Legal review and committee approval are required.')}</Notice>
              <Action primary label={copy('Omba kura', 'Request poll')} disabled={busy} onPress={() => handleAction(async () => {
                if (!selectedArticle || !selectedVersion) return;
                await requestPoll(selectedVersion.id, selectedArticle.id, pollStage, getActor());
              })} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal review modal */}
      <Modal visible={modalKind === 'legal_review'} animationType="slide" transparent onRequestClose={() => setModalKind(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Mapitio ya Kisheria', 'Legal Review')}</Text>
              <Pressable onPress={() => setModalKind(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing[3] }}>
              {selectedArticle && <Text style={styles.contextText}>{copy('Ibara', 'Article')} {selectedArticle.proposedArticleNumber}</Text>}
              <Text style={styles.label}>{copy('Hali ya mapitio', 'Review status')}</Text>
              <View style={styles.pillRow}>
                {(['approved', 'rejected', 'returned_for_revision'] as const).map(st => (
                  <Pressable key={st} style={[styles.pill, legalStatus === st && styles.pillActive]} onPress={() => setLegalStatus(st)}><Text style={[styles.pillText, legalStatus === st && styles.pillTextActive]}>{st.replace(/_/g, ' ')}</Text></Pressable>
                ))}
              </View>
              <Text style={styles.label}>{copy('Maelezo ya mkaguzi', 'Reviewer notes')}</Text>
              <TextInput style={[styles.input, { minHeight: 120 }]} value={legalNotes} onChangeText={setLegalNotes} multiline maxLength={4000} placeholder={copy('Andika maelezo ya kisheria, hatari, na mapendekezo…', 'Write legal notes, risks, and recommendations…')} placeholderTextColor={Colors.text.muted} />
              <Notice>{copy('Wataalamu wa sheria wanaweza kukagua lakini hawaruhumiwi kuandika upya mapendekezo ya wananchi kimyakimya.', 'Legal experts may review but must not silently rewrite citizen proposals.')}</Notice>
              <Action primary label={copy('Hifadhi mapitio', 'Save review')} disabled={busy} onPress={() => handleAction(async () => {
                if (!selectedArticle || !selectedVersion) return;
                await markLegallyReviewed(selectedVersion.id, selectedArticle.id, legalStatus, legalNotes, getActor());
                setLegalNotes('');
              })} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Send back modal */}
      <Modal visible={modalKind === 'send_back'} animationType="slide" transparent onRequestClose={() => setModalKind(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Rudisha kwa Majadiliano', 'Send Back for Discussion')}</Text>
              <Pressable onPress={() => setModalKind(null)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <View style={{ gap: Spacing[3] }}>
              {selectedArticle && <Text style={styles.contextText}>{copy('Ibara', 'Article')} {selectedArticle.proposedArticleNumber}</Text>}
              <Text style={styles.label}>{copy('Sababu ya kurudisha', 'Reason')}</Text>
              <TextInput style={[styles.input, { minHeight: 100 }]} value={sendBackReason} onChangeText={setSendBackReason} multiline maxLength={1000} placeholder={copy('Eleza kwa nini ibara inahitaji majadiliano zaidi…', 'Explain why the article needs more discussion…')} placeholderTextColor={Colors.text.muted} />
              <Action primary label={copy('Rudisha', 'Send back')} disabled={busy || !sendBackReason.trim()} onPress={() => handleAction(async () => {
                if (!selectedArticle || !selectedVersion) return;
                await sendBackForDiscussion(selectedVersion.id, selectedArticle.id, sendBackReason.trim(), getActor());
                setSendBackReason('');
              })} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 1100, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 580, lineHeight: 21 },
  roleBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[1], paddingHorizontal: Spacing[3], backgroundColor: Colors.green[900], borderRadius: Radius.full },
  roleText: { color: Colors.green[300], fontSize: Typography.size.xs },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], padding: Spacing[4], backgroundColor: Colors.gold[400], borderRadius: Radius.lg, minHeight: 52 },
  newBtnText: { color: '#090e0d', fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  sectionLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing[2] },
  loadingText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', padding: Spacing[4] },
  versionCard: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2] },
  versionCardSelected: { borderColor: Colors.green[400], borderWidth: 2 },
  versionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  versionName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  immutableTag: { fontSize: Typography.size.xs, color: Colors.gold[400], fontStyle: 'italic' },
  statusPill: { paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderRadius: Radius.sm, backgroundColor: Colors.surface.overlay },
  statusPublished: { backgroundColor: Colors.green[900] },
  statusDraft: { backgroundColor: Colors.gold[100] },
  statusArchived: { backgroundColor: Colors.surface.overlay },
  statusPillText: { fontSize: Typography.size.xs, color: Colors.text.secondary, textTransform: 'capitalize' },
  versionStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  statChip: { fontSize: Typography.size.xs, color: Colors.text.muted, backgroundColor: Colors.surface.overlay, paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: Radius.sm },
  metaText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  versionActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2] },
  miniBtn: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, backgroundColor: Colors.green[700], minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  miniBtnArchive: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, backgroundColor: Colors.surface.overlay, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  miniBtnRestore: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, backgroundColor: Colors.blue[700], minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  miniBtnText: { color: '#fff', fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  detailCard: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[3] },
  detailTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  articleTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  articleMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  iconBtn: { padding: Spacing[2], borderRadius: Radius.sm, backgroundColor: Colors.surface.overlay },
  detailLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[2] },
  changeLog: { gap: Spacing[2] },
  changeRow: { flexDirection: 'row', gap: Spacing[2], paddingVertical: Spacing[1] },
  changeDesc: { fontSize: Typography.size.sm, color: Colors.text.primary, lineHeight: 20 },
  changeMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  auditBox: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[3], gap: Spacing[2] },
  auditRow: { paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  auditAction: { fontSize: Typography.size.xs, color: Colors.blue[300], fontWeight: Typography.weight.semibold, textTransform: 'capitalize' },
  auditDesc: { fontSize: Typography.size.sm, color: Colors.text.primary, lineHeight: 20 },
  auditMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  errorText: { color: Colors.red[300], fontSize: Typography.size.sm, paddingVertical: Spacing[2] },
  successText: { color: Colors.green[300], fontSize: Typography.size.sm, paddingVertical: Spacing[2] },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  pill: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay, borderWidth: 1, borderColor: Colors.surface.borderStrong, minHeight: 36 },
  pillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  pillText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  pillTextActive: { color: '#fff' },
  contextText: { fontSize: Typography.size.sm, color: Colors.green[300], fontStyle: 'italic' },
});

export default DraftBuilderScreen;

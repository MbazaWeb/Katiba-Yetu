import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { supabase } from '../lib/supabase';
import { loadSubmissions, moderateSubmission } from '../services/submissionWorkflow';
import { STAKEHOLDER_LABELS } from '../types';
import type { CitizenSubmission, User, StakeholderType } from '../types';

interface AdminUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
  stakeholder_type: string | null;
  region: string | null;
  created_at: string;
}

type AdminTab = 'overview' | 'users' | 'submissions' | 'resources';

interface Props {
  onBack?: () => void;
  currentUser: User | null;
}

export function AdminScreen({ onBack, currentUser }: Props) {
  const { language } = useAppContext();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Load users
      const { data: usersData } = await supabase.from('profiles').select('id, display_name, role, stakeholder_type, region, created_at').order('created_at', { ascending: false }).limit(100);
      if (usersData) setUsers(usersData as AdminUser[]);
      // Load submissions
      const subs = await loadSubmissions();
      setSubmissions(subs);
    } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefreshing(true);
      try {
        const { data: usersData } = await supabase.from('profiles').select('id, display_name, role, stakeholder_type, region, created_at').order('created_at', { ascending: false }).limit(100);
        if (!cancelled && usersData) setUsers(usersData as AdminUser[]);
        if (!cancelled) {
          const subs = await loadSubmissions();
          setSubmissions(subs);
        }
      } finally { if (!cancelled) setRefreshing(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleModerate(id: string, decision: 'approve' | 'reject' | 'flag') {
    try {
      await moderateSubmission(id, currentUser?.id ?? '', currentUser?.display_name ?? 'Admin', decision, copy('Uamuzi wa msimamizi', 'Admin decision'));
      await refresh();
    } catch (e) {
      console.warn('[admin] moderate failed', e);
    }
  }

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: copy('Muhtasari', 'Overview'), icon: 'grid-outline' },
    { key: 'users', label: copy('Watumiaji', 'Users'), icon: 'people-outline' },
    { key: 'submissions', label: copy('Mapendekezo', 'Submissions'), icon: 'megaphone-outline' },
    { key: 'resources', label: copy('Nyenzo', 'Resources'), icon: 'library-outline' },
  ];

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Dashibodi ya Msimamizi', 'Admin Dashboard')} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.green[400]} />}
      >
        {/* Tab bar */}
        <View style={styles.tabBar}>
          {tabs.map(t => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={({ pressed }) => [styles.tabBtn, tab === t.key && styles.tabBtnActive, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === t.key }}
            >
              <Ionicons name={t.icon as React.ComponentProps<typeof Ionicons>['name']} size={18} color={tab === t.key ? Colors.green[300] : Colors.text.muted} />
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Overview */}
        {tab === 'overview' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Takwimu za Mfumo', 'System Statistics')}</Text>
            <View style={styles.statGrid}>
              <StatBox label={copy('Watumiaji', 'Users')} value={users.length} />
              <StatBox label={copy('Mapendekezo', 'Submissions')} value={submissions.length} />
              <StatBox label={copy('Yaliyoidhinishwa', 'Approved')} value={submissions.filter(s => s.status === 'topic_classified' || s.status === 'merged').length} />
              <StatBox label={copy('Yanaungoja', 'Pending')} value={submissions.filter(s => s.status === 'submitted').length} />
            </View>
            {/* Stakeholder breakdown */}
            <Text style={styles.subTitle}>{copy('Mgawanyo wa Wadau', 'Stakeholder Breakdown')}</Text>
            {Object.keys(STAKEHOLDER_LABELS).map(st => {
              const count = users.filter(u => u.stakeholder_type === st).length;
              return (
                <View key={st} style={styles.stakeholderRow}>
                  <Text style={styles.stakeholderLabel}>{language === 'sw' ? STAKEHOLDER_LABELS[st as StakeholderType].sw : STAKEHOLDER_LABELS[st as StakeholderType].en}</Text>
                  <Text style={styles.stakeholderCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Users */}
        {tab === 'users' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Orodha ya Watumiaji', 'User List')} ({users.length})</Text>
            {users.length === 0 ? (
              <Text style={styles.emptyText}>{copy('Hakuna watumiaji waliosajiliwa bado.', 'No users registered yet.')}</Text>
            ) : (
              users.map(u => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.display_name}</Text>
                    <Text style={styles.userMeta}>{u.role} · {u.stakeholder_type ?? 'citizen'} · {u.region ?? '—'}</Text>
                  </View>
                  <Text style={styles.userDate}>{new Date(u.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Submissions */}
        {tab === 'submissions' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Mapendekezo ya Wananchi', 'Citizen Proposals')} ({submissions.length})</Text>
            {submissions.length === 0 ? (
              <Text style={styles.emptyText}>{copy('Hakuna mapendekezo yaliyowasilishwa bado.', 'No proposals submitted yet.')}</Text>
            ) : (
              submissions.map(sub => (
                <View key={sub.id} style={styles.submissionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.submissionTitle}>{sub.title}</Text>
                    <Text style={styles.submissionMeta}>{sub.status} · {sub.topic}</Text>
                  </View>
                  <View style={styles.modBtns}>
                    <Pressable style={styles.modApprove} onPress={() => handleModerate(sub.id, 'approve')} accessibilityRole="button" accessibilityLabel={copy('Idhinisha', 'Approve')}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </Pressable>
                    <Pressable style={styles.modFlag} onPress={() => handleModerate(sub.id, 'flag')} accessibilityRole="button" accessibilityLabel={copy('Alama', 'Flag')}>
                      <Ionicons name="flag" size={16} color="#fff" />
                    </Pressable>
                    <Pressable style={styles.modReject} onPress={() => handleModerate(sub.id, 'reject')} accessibilityRole="button" accessibilityLabel={copy('Kataa', 'Reject')}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Resources — upload docs */}
        {tab === 'resources' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy('Upload Nyenzo', 'Upload Resources')}</Text>
            <Text style={styles.cardHint}>{copy('Ongeza nyaraka rasmi, marekebisho, au rasilimali za elimu.', 'Add official documents, amendments, or educational resources.')}</Text>
            <Pressable style={styles.uploadBtn} onPress={() => setUploadModal(true)} accessibilityRole="button" accessibilityLabel={copy('Ongeza nyaraka', 'Add document')}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>{copy('Ongeza Nyaraka', 'Add Document')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Upload modal */}
      <Modal visible={uploadModal} animationType="slide" transparent onRequestClose={() => setUploadModal(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Ongeza Nyaraka', 'Add Document')}</Text>
              <Pressable onPress={() => setUploadModal(false)} accessibilityRole="button" accessibilityLabel={copy('Funga', 'Close')}>
                <Ionicons name="close" size={24} color={Colors.text.muted} />
              </Pressable>
            </View>
            <View style={{ gap: Spacing[3] }}>
              <Text style={styles.label}>{copy('Jina la nyaraka', 'Document title')}</Text>
              <TextInput style={styles.input} value={docTitle} onChangeText={setDocTitle} placeholder={copy('mfano: Marekebisho ya 2010', 'e.g. 2010 Amendment')} placeholderTextColor={Colors.text.muted} />
              <Text style={styles.label}>{copy('Kiungo cha URL', 'URL link')}</Text>
              <TextInput style={styles.input} value={docUrl} onChangeText={setDocUrl} placeholder="https://..." placeholderTextColor={Colors.text.muted} autoCapitalize="none" />
              <Text style={styles.label}>{copy('Aina ya faili', 'File type')}</Text>
              <Text style={styles.hint}>PDF, DOCX, au nyingine (itachaguliwa kiotomatiki)</Text>
              <Pressable
                style={({ pressed }) => [styles.submitBtn, (!docTitle.trim() || !docUrl.trim()) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
                onPress={async () => {
                  if (!docTitle.trim() || !docUrl.trim()) return;
                  // In production, this would upload to Supabase Storage and insert a resource_library row.
                  // For now, just close the modal.
                  setDocTitle(''); setDocUrl(''); setUploadModal(false);
                }}
                disabled={!docTitle.trim() || !docUrl.trim()}
                accessibilityRole="button"
              >
                <Text style={styles.submitBtnText}>{copy('Hifadhi', 'Save')}</Text>
              </Pressable>
            </View>
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
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 1000, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  tabBar: { flexDirection: 'row', gap: Spacing[2], backgroundColor: Colors.surface.overlay, borderRadius: Radius.lg, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing[3], borderRadius: Radius.md, minHeight: 44 },
  tabBtnActive: { backgroundColor: Colors.green[700] },
  tabLabel: { color: Colors.text.muted, fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  tabLabelActive: { color: '#fff', fontWeight: Typography.weight.semibold },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[3] },
  cardTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  subTitle: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[3], textTransform: 'uppercase', letterSpacing: 0.5 },
  cardHint: { fontSize: Typography.size.sm, color: Colors.text.muted, lineHeight: 20 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  statBox: { flex: 1, minWidth: 120, backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, padding: Spacing[3], alignItems: 'center', gap: 2 },
  statValue: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  statLabel: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center' },
  stakeholderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[1] },
  stakeholderLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  stakeholderCount: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', paddingVertical: Spacing[4] },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  userMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  userDate: { fontSize: Typography.size.xs, color: Colors.text.muted },
  submissionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  submissionTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  submissionMeta: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  modBtns: { flexDirection: 'row', gap: 4 },
  modApprove: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  modFlag: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.gold[600], alignItems: 'center', justifyContent: 'center' },
  modReject: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.red[600], alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], padding: Spacing[3], borderRadius: Radius.md, backgroundColor: Colors.green[600], minHeight: 44 },
  uploadBtnText: { color: '#fff', fontSize: Typography.size.md, fontWeight: Typography.weight.semibold },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  hint: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  submitBtn: { backgroundColor: Colors.green[600], paddingVertical: Spacing[3], borderRadius: Radius.md, alignItems: 'center', minHeight: 44 },
  submitBtnText: { color: '#fff', fontSize: Typography.size.md, fontWeight: Typography.weight.semibold },
});

export default AdminScreen;

import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';

interface Props { onBack?: () => void; }

type AdminTab = 'dashboard' | 'users' | 'content' | 'documents' | 'moderation';

// Mock stats — will come from Supabase queries when wired
const STATS = [
  { icon: 'people-outline', label_sw: 'Watumiaji Wote', label_en: 'Total Users',         value: '—', color: Colors.blue?.[400] ?? '#60a5fa' },
  { icon: 'chatbox-outline', label_sw: 'Michango',       label_en: 'Contributions',       value: '—', color: Colors.green[400] },
  { icon: 'stats-chart',    label_sw: 'Kura Zinazoendelea', label_en: 'Active Polls',     value: '—', color: Colors.gold[400] },
  { icon: 'flag-outline',   label_sw: 'Ripoti za Usalama',  label_en: 'Pending Reports',  value: '—', color: '#f87171' },
];

const ROLE_COLORS: Record<string, string> = {
  citizen: Colors.green[700], institution: '#1d4ed8', court: '#7c3aed',
  lawyer: '#b45309', ngo: '#065f46', ministry: '#991b1b', media: '#374151', other: '#4b5563',
};

export function AdminScreen({ onBack }: Props) {
  const { language, user } = useAppContext();
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [uploadModal, setUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <View style={s.root}>
        <AppHeader showBack={!!onBack} onBack={onBack} title="Admin" />
        <View style={s.denied}>
          <Ionicons name="lock-closed" size={48} color={Colors.text.muted} />
          <Text style={s.deniedTitle}>{copy('Ufikiaji Umekataliwa', 'Access Denied')}</Text>
          <Text style={s.deniedSub}>
            {copy('Ukurasa huu ni kwa wasimamizi tu.', 'This page is for administrators only.')}
          </Text>
        </View>
      </View>
    );
  }

  const TABS: { key: AdminTab; icon: string; sw: string; en: string }[] = [
    { key: 'dashboard',  icon: 'grid-outline',            sw: 'Dashibodi',   en: 'Dashboard'  },
    { key: 'users',      icon: 'people-outline',          sw: 'Watumiaji',   en: 'Users'      },
    { key: 'content',    icon: 'chatbox-outline',         sw: 'Maudhui',     en: 'Content'    },
    { key: 'documents',  icon: 'folder-open-outline',     sw: 'Hati',        en: 'Documents'  },
    { key: 'moderation', icon: 'shield-checkmark-outline',sw: 'Udhibiti',    en: 'Moderation' },
  ];

  return (
    <View style={s.root}>
      <AppHeader showBack={!!onBack} onBack={onBack}
        title={copy('Dashibodi ya Usimamizi', 'Admin Dashboard')} />

      {/* Admin tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabBar}>
        {TABS.map(t => (
          <Pressable key={t.key} onPress={() => setTab(t.key)}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}>
            <Ionicons name={t.icon as any} size={16} color={tab === t.key ? Colors.green[400] : Colors.text.muted} />
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {language === 'sw' ? t.sw : t.en}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.content}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{copy('Muhtasari', 'Overview')}</Text>
            <View style={s.statsGrid}>
              {STATS.map((st, i) => (
                <View key={i} style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: (st.color ?? '#888') + '22' }]}>
                    <Ionicons name={st.icon as any} size={22} color={st.color ?? '#888'} />
                  </View>
                  <Text style={s.statValue}>{st.value}</Text>
                  <Text style={s.statLabel}>{copy(st.label_sw, st.label_en)}</Text>
                </View>
              ))}
            </View>

            <Text style={[s.sectionTitle, { marginTop: Spacing[4] }]}>{copy('Vitendo vya Haraka', 'Quick Actions')}</Text>
            <View style={s.quickActions}>
              <QuickAction icon="cloud-upload-outline" color="#1d4ed8"
                label={copy('Pakia Hati', 'Upload Document')} onPress={() => setUploadModal(true)} />
              <QuickAction icon="megaphone-outline" color={Colors.green[600]}
                label={copy('Tangazo Jipya', 'New Announcement')} onPress={() => setTab('content')} />
              <QuickAction icon="flag-outline" color="#dc2626"
                label={copy('Angalia Ripoti', 'Review Reports')} onPress={() => setTab('moderation')} />
              <QuickAction icon="people-outline" color={Colors.gold[500]}
                label={copy('Simamia Watumiaji', 'Manage Users')} onPress={() => setTab('users')} />
            </View>

            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.blue?.[300] ?? '#93c5fd'} />
              <Text style={s.infoText}>
                {copy(
                  'Takwimu halisi zitatoka Supabase. Unganisha na kanuni zako za hifadhidata kuwasilisha data ya moja kwa moja.',
                  'Live stats come from Supabase. Connect your database queries to stream real data here.',
                )}
              </Text>
            </View>
          </View>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{copy('Simamia Watumiaji', 'Manage Users')}</Text>
            <Text style={s.sectionSub}>
              {copy('Angalia na simamia akaunti za watumiaji wote wa mfumo.', 'View and manage all user accounts in the system.')}
            </Text>

            <View style={s.filterBar}>
              <TextInput style={s.searchInput} placeholder={copy('Tafuta mtumiaji…', 'Search users…')}
                placeholderTextColor={Colors.text.muted} />
              <Pressable style={s.filterBtn}>
                <Ionicons name="filter-outline" size={18} color={Colors.text.muted} />
                <Text style={s.filterBtnText}>{copy('Chuja', 'Filter')}</Text>
              </Pressable>
            </View>

            {/* Role legend */}
            <View style={s.roleLegend}>
              {Object.entries(ROLE_COLORS).map(([role, color]) => (
                <View key={role} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendText}>{role}</Text>
                </View>
              ))}
            </View>

            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={40} color={Colors.text.muted} />
              <Text style={s.emptyTitle}>{copy('Inganisha Supabase', 'Connect Supabase')}</Text>
              <Text style={s.emptySub}>
                {copy('Watumiaji wataonekana hapa baada ya kuunganisha na hifadhidata.', 'Users will appear here after connecting to the database.')}
              </Text>
            </View>
          </View>
        )}

        {/* ── CONTENT ── */}
        {tab === 'content' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{copy('Simamia Maudhui', 'Manage Content')}</Text>
            <Text style={s.sectionSub}>
              {copy('Michango, maoni na mapendekezo yaliyowasilishwa na watumiaji.', 'Contributions, comments and proposals submitted by users.')}
            </Text>

            {['Michango mpya', 'Maoni yanayosubiri', 'Mapendekezo ya ibara'].map((item, i) => (
              <View key={i} style={s.contentRow}>
                <View style={s.contentRowIcon}>
                  <Ionicons name={['chatbox-outline', 'time-outline', 'create-outline'][i] as any} size={18} color={Colors.text.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contentRowLabel}>{copy(item, ['New contributions', 'Pending comments', 'Article proposals'][i])}</Text>
                  <Text style={s.contentRowSub}>{copy('Inahitaji Supabase', 'Requires Supabase connection')}</Text>
                </View>
                <Pressable style={s.viewBtn}>
                  <Text style={s.viewBtnText}>{copy('Angalia', 'View')}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === 'documents' && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>{copy('Simamia Hati', 'Manage Documents')}</Text>
                <Text style={s.sectionSub}>
                  {copy('Pakia na simamia hati rasmi, miongozo na rasimu za Katiba.', 'Upload and manage official documents, guidelines and Constitution drafts.')}
                </Text>
              </View>
              <Pressable style={s.uploadBtn} onPress={() => setUploadModal(true)}>
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={s.uploadBtnText}>{copy('Pakia', 'Upload')}</Text>
              </Pressable>
            </View>

            {/* Doc type cards */}
            {[
              { icon: 'document-text-outline', sw: 'Rasimu za Katiba', en: 'Constitution Drafts', count: 0 },
              { icon: 'book-outline', sw: 'Miongozo ya Kisheria', en: 'Legal Guidelines', count: 0 },
              { icon: 'newspaper-outline', sw: 'Matangazo', en: 'Announcements', count: 0 },
              { icon: 'archive-outline', sw: 'Kumbukumbu', en: 'Archives', count: 0 },
            ].map((doc, i) => (
              <View key={i} style={s.docCard}>
                <Ionicons name={doc.icon as any} size={28} color={Colors.gold[400]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.docCardLabel}>{copy(doc.sw, doc.en)}</Text>
                  <Text style={s.docCardCount}>
                    {doc.count} {copy('hati', 'documents')}
                  </Text>
                </View>
                <Pressable style={s.docManageBtn}>
                  <Text style={s.docManageBtnText}>{copy('Simamia', 'Manage')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.green[400]} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ── MODERATION ── */}
        {tab === 'moderation' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{copy('Udhibiti wa Maudhui', 'Content Moderation')}</Text>
            <Text style={s.sectionSub}>
              {copy('Kagua maudhui yaliyoripotiwa na watumiaji wengine.', 'Review content reported by other users.')}
            </Text>

            {[
              { icon: 'flag-outline', sw: 'Ripoti Mpya', en: 'New Reports', color: '#dc2626' },
              { icon: 'eye-outline', sw: 'Inakaguliwa', en: 'Under Review', color: Colors.gold[400] },
              { icon: 'checkmark-circle-outline', sw: 'Zilizokaguliwa', en: 'Resolved', color: Colors.green[400] },
            ].map((item, i) => (
              <View key={i} style={s.modRow}>
                <View style={[s.modIcon, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.modLabel}>{copy(item.sw, item.en)}</Text>
                  <Text style={s.modCount}>0 {copy('vipengele', 'items')}</Text>
                </View>
                <Pressable style={s.reviewBtn}>
                  <Text style={s.reviewBtnText}>{copy('Kagua', 'Review')}</Text>
                </Pressable>
              </View>
            ))}

            <View style={s.infoBox}>
              <Ionicons name="shield-outline" size={18} color={Colors.green[400]} />
              <Text style={s.infoText}>
                {copy(
                  'Maudhui yote yanayowasilishwa yanakaguliwa ili kulinda heshima na usalama wa mazungumzo.',
                  'All submitted content is reviewed to maintain a respectful and safe discussion environment.',
                )}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Document Modal */}
      <Modal visible={uploadModal} animationType="slide" transparent onRequestClose={() => setUploadModal(false)}>
        <View style={s.scrim}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{copy('Pakia Hati Mpya', 'Upload New Document')}</Text>
              <Pressable onPress={() => setUploadModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.muted} />
              </Pressable>
            </View>
            <View style={s.sheetBody}>
              <View style={s.uploadZone}>
                <Ionicons name="cloud-upload-outline" size={36} color={Colors.text.muted} />
                <Text style={s.uploadZoneText}>{copy('Bonyeza kuchagua faili', 'Tap to select a file')}</Text>
                <Text style={s.uploadZoneSub}>PDF, DOCX {copy('hadi', 'up to')} 50MB</Text>
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>{copy('Kichwa cha Hati', 'Document Title')}</Text>
                <TextInput style={s.input} value={docTitle} onChangeText={setDocTitle}
                  placeholder={copy('Mfano: Rasimu ya Katiba 2026', 'e.g. Constitution Draft 2026')}
                  placeholderTextColor={Colors.text.muted} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>{copy('Maelezo (hiari)', 'Description (optional)')}</Text>
                <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={docDesc} onChangeText={setDocDesc} multiline
                  placeholder={copy('Maelezo mafupi ya hati hii…', 'Brief description of this document…')}
                  placeholderTextColor={Colors.text.muted} />
              </View>
              <Pressable style={s.uploadSubmitBtn}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={s.uploadSubmitText}>{copy('Pakia Hati', 'Upload Document')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function QuickAction({ icon, color, label, onPress }: {
  icon: string; color: string; label: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.qaCard, pressed && { opacity: 0.8 }]}>
      <View style={[s.qaIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={s.qaLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3], padding: Spacing[6] },
  deniedTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  deniedSub: { fontSize: Typography.size.base, color: Colors.text.muted, textAlign: 'center' },
  tabScroll: { maxHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.surface.borderStrong },
  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing[3], gap: Spacing[1] },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2.5], borderRadius: Radius.md },
  tabBtnActive: { backgroundColor: Colors.green[900] },
  tabText: { fontSize: Typography.size.sm, color: Colors.text.muted, fontWeight: Typography.weight.medium },
  tabTextActive: { color: Colors.green[400], fontWeight: Typography.weight.semibold },
  content: { padding: Spacing[4], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%' },
  section: { gap: Spacing[3] },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  sectionTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  sectionSub: { fontSize: Typography.size.sm, color: Colors.text.muted, marginTop: 2 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  statCard: { flex: 1, minWidth: 130, backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2], alignItems: 'flex-start' },
  statIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: Typography.family.serif, fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  statLabel: { fontSize: Typography.size.xs, color: Colors.text.muted },

  // Quick actions
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  qaCard: { flex: 1, minWidth: 130, backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2], alignItems: 'center' },
  qaIcon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary, textAlign: 'center' },

  // Users
  filterBar: { flexDirection: 'row', gap: Spacing[2] },
  searchInput: { flex: 1, color: Colors.text.primary, padding: Spacing[3], minHeight: 44, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 15 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5], paddingHorizontal: Spacing[3], borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surface.borderStrong, backgroundColor: Colors.surface.overlay },
  filterBtnText: { fontSize: Typography.size.sm, color: Colors.text.muted },
  roleLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: Colors.text.muted },

  // Content
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[3] },
  contentRowIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, alignItems: 'center', justifyContent: 'center' },
  contentRowLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  contentRowSub: { fontSize: Typography.size.xs, color: Colors.text.muted },
  viewBtn: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.md, backgroundColor: Colors.surface.overlay },
  viewBtnText: { fontSize: Typography.size.xs, color: Colors.green[400], fontWeight: Typography.weight.semibold },

  // Documents
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5], backgroundColor: Colors.green[700], paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.md },
  uploadBtnText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4] },
  docCardLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  docCardCount: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  docManageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docManageBtnText: { fontSize: Typography.size.sm, color: Colors.green[400], fontWeight: Typography.weight.semibold },

  // Moderation
  modRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4] },
  modIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  modCount: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  reviewBtn: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.md, backgroundColor: Colors.surface.overlay },
  reviewBtnText: { fontSize: Typography.size.xs, color: Colors.green[400], fontWeight: Typography.weight.semibold },

  // Info box
  infoBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[4], backgroundColor: Colors.surface.overlay, borderRadius: Radius.lg, alignItems: 'flex-start', borderLeftWidth: 3, borderLeftColor: Colors.green[600] },
  infoText: { flex: 1, fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 20 },

  // Empty state
  emptyState: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8], backgroundColor: Colors.surface.raised, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surface.borderStrong },
  emptyTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  emptySub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 300 },

  // Upload modal
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  sheetBody: { gap: Spacing[4] },
  uploadZone: { borderWidth: 2, borderColor: Colors.surface.borderStrong, borderStyle: 'dashed', borderRadius: Radius.xl, padding: Spacing[8], alignItems: 'center', gap: Spacing[2], backgroundColor: Colors.surface.overlay },
  uploadZoneText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.secondary },
  uploadZoneSub: { fontSize: Typography.size.xs, color: Colors.text.muted },
  field: { gap: Spacing[2] },
  fieldLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  uploadSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], backgroundColor: Colors.green[700], paddingVertical: Spacing[4], borderRadius: Radius.md, minHeight: 52 },
  uploadSubmitText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
});

export default AdminScreen;

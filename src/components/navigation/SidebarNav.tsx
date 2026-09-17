import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, Typography, Spacing, Radius,
} from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';
import { t } from '../../utils';
import type { TabKey } from './BottomTabBar';

export type SidebarKey = TabKey | 'contributions' | 'history' | 'resources' | 'discussion' | 'proposed_constitution' | 'citizen_submission' | 'multi_stage_polls' | 'draft_builder' | 'approval_workflow' | 'backend_status';

interface SidebarNavProps {
  activeTab: SidebarKey;
  onTabPress: (tab: TabKey) => void;
  onContributionsPress?: () => void;
  onHistoryPress?: () => void;
  onResourcesPress?: () => void;
  onDiscussionPress?: () => void;
  onProposedConstitutionPress?: () => void;
  onCitizenSubmissionPress?: () => void;
  onMultiStagePollsPress?: () => void;
  onDraftBuilderPress?: () => void;
  onApprovalWorkflowPress?: () => void;
  onBackendStatusPress?: () => void;
  notificationCount?: Partial<Record<TabKey, number>>;
}

const ITEMS: {
  key: SidebarKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label_sw: string;
  label_en: string;
}[] = [
  { key: 'home',                  icon: 'home',           label_sw: 'Nyumbani',           label_en: 'Home' },
  { key: 'browser',               icon: 'book-outline',   label_sw: 'Katiba',              label_en: 'Constitution' },
  { key: 'proposed_constitution', icon: 'create-outline',  label_sw: 'Katiba Inayopendekezwa', label_en: 'Proposed Constitution' },
  { key: 'citizen_submission',   icon: 'megaphone-outline', label_sw: 'Wasilisha Pendekezo', label_en: 'Submit Proposal' },
  { key: 'multi_stage_polls',    icon: 'stats-chart-outline', label_sw: 'Kura za Hatua', label_en: 'Multi-stage Polls' },
  { key: 'draft_builder',        icon: 'construct-outline', label_sw: 'Mjenzi wa Rasimu', label_en: 'Draft Builder' },
  { key: 'approval_workflow',    icon: 'git-branch-outline', label_sw: 'Mchakato wa Idhini', label_en: 'Approval Workflow' },
  { key: 'polls',                 icon: 'stats-chart',     label_sw: 'Kura',                label_en: 'Polls' },
  { key: 'search',                icon: 'search',          label_sw: 'Tafuta',              label_en: 'Search' },
  { key: 'contributions',         icon: 'chatbox-outline',  label_sw: 'Michango',            label_en: 'Contributions' },
  { key: 'discussion',            icon: 'people-outline',  label_sw: 'Majadiliano',          label_en: 'Discussions' },
  { key: 'history',               icon: 'time-outline',    label_sw: 'Historia',            label_en: 'History' },
  { key: 'resources',              icon: 'library-outline', label_sw: 'Maktaba',             label_en: 'Library' },
  { key: 'backend_status',        icon: 'server-outline',  label_sw: 'Hadhi ya Nyuma',     label_en: 'Backend Status' },
  { key: 'profile',               icon: 'person-outline',  label_sw: 'Akaunti',             label_en: 'Account' },
];

export function SidebarNav({
  activeTab,
  onTabPress,
  onContributionsPress,
  onHistoryPress,
  onResourcesPress,
  onDiscussionPress,
  onProposedConstitutionPress,
  onCitizenSubmissionPress,
  onMultiStagePollsPress,
  onDraftBuilderPress,
  onApprovalWorkflowPress,
  onBackendStatusPress,
  notificationCount,
}: SidebarNavProps) {
  const { language } = useAppContext();
  const { width } = useWindowDimensions();

  const handlePress = (key: SidebarKey) => {
    if (key === 'contributions') { onContributionsPress?.(); return; }
    if (key === 'history') { onHistoryPress?.(); return; }
    if (key === 'resources') { onResourcesPress?.(); return; }
    if (key === 'discussion') { onDiscussionPress?.(); return; }
    if (key === 'proposed_constitution') { onProposedConstitutionPress?.(); return; }
    if (key === 'citizen_submission') { onCitizenSubmissionPress?.(); return; }
    if (key === 'multi_stage_polls') { onMultiStagePollsPress?.(); return; }
    if (key === 'draft_builder') { onDraftBuilderPress?.(); return; }
    if (key === 'approval_workflow') { onApprovalWorkflowPress?.(); return; }
    if (key === 'backend_status') { onBackendStatusPress?.(); return; }
    onTabPress(key as TabKey);
  };

  return (
    <View style={[styles.sidebar, { width: width >= 1400 ? 304 : 260 }]}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Ionicons name="book-outline" size={48} color="#efc600" />
          <View style={styles.brandLeaf}><Ionicons name="leaf" size={33} color="#00a563" /></View>
        </View>
        <View style={styles.brandText}>
          <Text style={[styles.brandTitle, width < 1400 && { fontSize: 21 }]} numberOfLines={1}>Katiba Yetu</Text>
          <Text style={styles.brandSub} numberOfLines={1}>
            {t('Soma · Jadili · Pendekeza · Piga Kura',
               'Read · Discuss · Propose · Vote', language)}
          </Text>
        </View>
      </View>

      {/* Nav items */}
      <ScrollView style={styles.navScroll} contentContainerStyle={styles.nav}>
        {ITEMS.map(item => {
          const active = activeTab === item.key;
          const label = language === 'sw' ? item.label_sw : item.label_en;
          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item.key)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <Ionicons
                name={item.icon}
                size={26}
                color={active ? '#00d477' : '#b7c1d2'}
              />
              <Text
                style={[styles.itemLabel, active && styles.itemLabelActive]}
                numberOfLines={2}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0c1316',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.surface.border,
    paddingVertical: 28,
    paddingHorizontal: 7,
    height: '100%',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2.5],
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomWidth: 0,
    borderBottomColor: Colors.surface.border,
    marginBottom: Spacing[4],
  },
  brandMark: {
    width: 52,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLeaf: { position: 'absolute', top: -5, left: 11 },
  brandText: { flex: 1, minWidth: 0 },
  brandTitle: {
    fontFamily: Typography.family.sans,
    fontSize: 29,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  brandSub: {
    fontFamily: Typography.family.sans,
    fontSize: 10,
    color: '#e5e9ef',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  navScroll: { flex: 1 },
  nav: { gap: Spacing[1], paddingBottom: Spacing[5] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    minHeight: 56,
  },
  itemActive: {
    backgroundColor: '#003c2c',
    borderLeftWidth: 6,
    borderLeftColor: '#008b56',
  },
  itemPressed: { backgroundColor: Colors.surface.overlay },
  itemLabel: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: 17,
    fontWeight: Typography.weight.medium,
    color: '#b7c1d2',
  },
  itemLabelActive: {
    color: '#f5f6f7',
    fontWeight: Typography.weight.semibold,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.text.onGold,
    fontSize: 11,
    fontWeight: Typography.weight.bold,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[4],
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold[400],
  },
  footerText: {
    fontFamily: Typography.family.sans,
    fontSize: 11,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
});

export default SidebarNav;

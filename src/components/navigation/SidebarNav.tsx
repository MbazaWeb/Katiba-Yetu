import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions,
  ScrollView, Animated, useAnimatedValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
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
  { key: 'home',                  icon: 'home',                  label_sw: 'Nyumbani',               label_en: 'Home' },
  { key: 'browser',               icon: 'book-outline',          label_sw: 'Katiba',                 label_en: 'Constitution' },
  { key: 'proposed_constitution', icon: 'create-outline',        label_sw: 'Katiba Inayopendekezwa', label_en: 'Proposed' },
  { key: 'citizen_submission',    icon: 'megaphone-outline',     label_sw: 'Wasilisha',              label_en: 'Submit' },
  { key: 'multi_stage_polls',     icon: 'stats-chart-outline',   label_sw: 'Kura za Hatua',          label_en: 'Polls' },
  { key: 'draft_builder',         icon: 'construct-outline',     label_sw: 'Rasimu',                 label_en: 'Draft Builder' },
  { key: 'approval_workflow',     icon: 'git-branch-outline',    label_sw: 'Idhini',                 label_en: 'Approval' },
  { key: 'polls',                  icon: 'stats-chart',           label_sw: 'Kura',                   label_en: 'Polls' },
  { key: 'search',                 icon: 'search',                label_sw: 'Tafuta',                 label_en: 'Search' },
  { key: 'contributions',          icon: 'chatbox-outline',       label_sw: 'Michango',               label_en: 'Contributions' },
  { key: 'discussion',             icon: 'people-outline',        label_sw: 'Majadiliano',            label_en: 'Discussions' },
  { key: 'history',                icon: 'time-outline',          label_sw: 'Historia',               label_en: 'History' },
  { key: 'resources',              icon: 'library-outline',       label_sw: 'Maktaba',                label_en: 'Library' },
  { key: 'backend_status',         icon: 'server-outline',        label_sw: 'Seva',                   label_en: 'Backend' },
  { key: 'profile',                icon: 'person-outline',        label_sw: 'Akaunti',                label_en: 'Account' },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH_LG = 280;
const EXPANDED_WIDTH_SM = 240;

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
  const [collapsed, setCollapsed] = useState(false);
  const expandedWidth = width >= 1400 ? EXPANDED_WIDTH_LG : EXPANDED_WIDTH_SM;
  const animWidth = useAnimatedValue(expandedWidth);

  const toggle = () => {
    const toValue = collapsed ? expandedWidth : COLLAPSED_WIDTH;
    Animated.spring(animWidth, {
      toValue,
      useNativeDriver: false,
      stiffness: 260,
      damping: 24,
    }).start();
    setCollapsed(!collapsed);
  };

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
    <Animated.View style={[styles.sidebar, { width: animWidth }]}>
      {/* Toggle button */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.toggleBtn, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <Ionicons name="menu" size={22} color="#b7c1d2" />
      </Pressable>

      {/* Brand — hidden when collapsed */}
      {!collapsed && (
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Ionicons name="book-outline" size={36} color="#efc600" />
            <View style={styles.brandLeaf}>
              <Ionicons name="leaf" size={24} color="#00a563" />
            </View>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle} numberOfLines={1}>Katiba Yetu</Text>
            <Text style={styles.brandSub} numberOfLines={1}>
              {t('Soma · Jadili · Pendekeza', 'Read · Discuss · Propose', language)}
            </Text>
          </View>
        </View>
      )}

      {/* Collapsed: just logo icon */}
      {collapsed && (
        <View style={styles.collapsedLogo}>
          <Ionicons name="book-outline" size={28} color="#efc600" />
        </View>
      )}

      {/* Nav items */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={[styles.nav, collapsed && styles.navCollapsed]}
        showsVerticalScrollIndicator={false}
      >
        {ITEMS.map(item => {
          const active = activeTab === item.key;
          const label = language === 'sw' ? item.label_sw : item.label_en;
          const count = notificationCount?.[item.key as TabKey] ?? 0;

          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item.key)}
              style={({ pressed }) => [
                styles.item,
                collapsed && styles.itemCollapsed,
                active && styles.itemActive,
                active && collapsed && styles.itemActiveCollapsed,
                pressed && styles.itemPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={active ? '#00d477' : '#b7c1d2'}
                />
                {count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                  </View>
                )}
              </View>
              {!collapsed && (
                <Text
                  style={[styles.itemLabel, active && styles.itemLabelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0c1316',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.surface.border,
    height: '100%',
    overflow: 'hidden',
  },
  toggleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginLeft: 14,
    marginBottom: 8,
    borderRadius: Radius.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginBottom: Spacing[2],
  },
  brandMark: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandLeaf: { position: 'absolute', top: -4, left: 8 },
  brandText: { flex: 1, minWidth: 0 },
  brandTitle: {
    fontFamily: Typography.family.sans,
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  brandSub: {
    fontFamily: Typography.family.sans,
    fontSize: 9,
    color: '#8a95a3',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  collapsedLogo: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: Spacing[2],
  },
  navScroll: { flex: 1 },
  nav: { gap: 2, paddingHorizontal: 8, paddingBottom: Spacing[5] },
  navCollapsed: { alignItems: 'center', paddingHorizontal: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    minHeight: 48,
  },
  itemCollapsed: {
    width: 48,
    paddingHorizontal: 0,
    justifyContent: 'center',
    gap: 0,
  },
  itemActive: {
    backgroundColor: '#003c2c',
    borderLeftWidth: 4,
    borderLeftColor: '#008b56',
  },
  itemActiveCollapsed: {
    borderLeftWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#008b56',
  },
  itemPressed: { backgroundColor: Colors.surface.overlay },
  iconWrap: { position: 'relative', flexShrink: 0 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.gold[400],
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.text.onGold,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
  },
  itemLabel: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: 15,
    fontWeight: Typography.weight.medium,
    color: '#b7c1d2',
  },
  itemLabelActive: {
    color: '#f5f6f7',
    fontWeight: Typography.weight.semibold,
  },
});

export default SidebarNav;

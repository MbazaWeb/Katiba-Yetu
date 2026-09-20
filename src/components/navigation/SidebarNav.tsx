import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';
import { STAKEHOLDER_LABELS } from '../../types';
import type { User } from '../../types';

export type SidebarKey =
  | 'home' | 'browser' | 'search' | 'profile' | 'more'
  | 'contributions' | 'history' | 'resources' | 'discussion'
  | 'proposed_constitution' | 'citizen_submission' | 'multi_stage_polls'
  | 'draft_builder' | 'approval_workflow' | 'system_status'
  | 'admin';

interface NavItem {
  key: SidebarKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label_sw: string;
  label_en: string;
}

// Citizen navigation — maximum 5 items
const CITIZEN_NAV: NavItem[] = [
  { key: 'home',    icon: 'home',           label_sw: 'Nyumbani',  label_en: 'Home' },
  { key: 'browser', icon: 'book-outline',   label_sw: 'Katiba',    label_en: 'Constitution' },
  { key: 'search',  icon: 'search',         label_sw: 'Tafuta',     label_en: 'Search' },
  { key: 'more',    icon: 'menu-outline',    label_sw: 'Zaidi',     label_en: 'More' },
  { key: 'profile', icon: 'person-outline', label_sw: 'Akaunti',   label_en: 'Account' },
];

// Admin navigation — replaces citizen nav when role is admin/moderator
const ADMIN_NAV: NavItem[] = [
  { key: 'home',    icon: 'home',            label_sw: 'Nyumbani',   label_en: 'Home' },
  { key: 'admin',   icon: 'shield-checkmark-outline', label_sw: 'Usimamizi', label_en: 'Admin' },
  { key: 'browser', icon: 'book-outline',    label_sw: 'Katiba',     label_en: 'Constitution' },
  { key: 'search',  icon: 'search',          label_sw: 'Tafuta',     label_en: 'Search' },
  { key: 'profile', icon: 'person-outline',  label_sw: 'Akaunti',    label_en: 'Account' },
];

// "More" menu items — shown in a dropdown/sheet on mobile, inline on desktop
const MORE_ITEMS: NavItem[] = [
  { key: 'citizen_submission',    icon: 'megaphone-outline',   label_sw: 'Wasilisha Pendekezo',     label_en: 'Submit Proposal' },
  { key: 'multi_stage_polls',     icon: 'stats-chart-outline', label_sw: 'Kura za Hatua',            label_en: 'Polls' },
  { key: 'proposed_constitution', icon: 'create-outline',      label_sw: 'Katiba Inayopendekezwa',  label_en: 'Proposed' },
  { key: 'discussion',            icon: 'people-outline',      label_sw: 'Majadiliano',             label_en: 'Discussions' },
  { key: 'history',               icon: 'time-outline',        label_sw: 'Historia',               label_en: 'History' },
  { key: 'resources',             icon: 'library-outline',     label_sw: 'Maktaba',                label_en: 'Library' },
  { key: 'contributions',          icon: 'chatbox-outline',     label_sw: 'Michango',               label_en: 'Contributions' },
  { key: 'system_status',         icon: 'information-circle-outline', label_sw: 'Hadhi ya Mfumo', label_en: 'System Status' },
];

// Admin-only items — shown under the Admin section
const ADMIN_ITEMS: NavItem[] = [
  { key: 'admin',   icon: 'shield-checkmark-outline', label_sw: 'Dashibodi ya Msimamizi', label_en: 'Admin Dashboard' },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH_LG = 280;
const EXPANDED_WIDTH_SM = 240;

interface SidebarNavProps {
  activeTab: SidebarKey;
  user: User | null;
  onNavigate: (key: SidebarKey) => void;
  notificationCount?: Partial<Record<string, number>>;
}

export function SidebarNav({ activeTab, user, onNavigate }: SidebarNavProps) {
  const { language } = useAppContext();
  const { width } = useWindowDimensions();
  const [collapsed, setCollapsed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const expandedWidth = width >= 1400 ? EXPANDED_WIDTH_LG : EXPANDED_WIDTH_SM;
  const [animWidth] = useState(() => new Animated.Value(expandedWidth));

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const navItems = isAdmin ? ADMIN_NAV : CITIZEN_NAV;
  const stakeholder = user?.stakeholder_type ?? 'citizen';
  const stakeholderLabel = STAKEHOLDER_LABELS[stakeholder] ?? STAKEHOLDER_LABELS.citizen;

  const toggle = () => {
    const toValue = collapsed ? expandedWidth : COLLAPSED_WIDTH;
    Animated.spring(animWidth, { toValue, useNativeDriver: false, stiffness: 260, damping: 24 }).start();
    setCollapsed(!collapsed);
  };

  const handlePress = (key: SidebarKey) => {
    if (key === 'more') { setShowMore(!showMore); return; }
    setShowMore(false);
    onNavigate(key);
  };

  return (
    <View style={[styles.sidebar, { width: animWidth }]}>
      {/* Brand */}
      <View style={styles.brand}>
        <Pressable onPress={toggle} hitSlop={12} accessibilityRole="button" accessibilityLabel="Toggle sidebar">
          <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-back'} size={20} color={Colors.text.muted} />
        </Pressable>
        {!collapsed && (
          <View style={styles.brandText}>
            <Text style={styles.brandTitle} numberOfLines={1}>Katiba Yetu</Text>
            <Text style={styles.brandSub} numberOfLines={1}>
              {language === 'sw' ? stakeholderLabel.sw : stakeholderLabel.en}
              {isAdmin ? (language === 'sw' ? ' · Msimamizi' : ' · Admin') : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Nav items */}
      <ScrollView style={styles.navScroll} contentContainerStyle={styles.nav}>
        {navItems.map(item => {
          const active = activeTab === item.key;
          const label = language === 'sw' ? item.label_sw : item.label_en;
          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item.key)}
              style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <Ionicons name={item.icon} size={24} color={active ? '#00d477' : '#b7c1d2'} />
              {!collapsed && <Text style={[styles.itemLabel, active && styles.itemLabelActive]} numberOfLines={2}>{label}</Text>}
            </Pressable>
          );
        })}

        {/* "More" dropdown — citizen only */}
        {!isAdmin && showMore && !collapsed && (
          <View style={styles.moreSection}>
            {MORE_ITEMS.map(item => {
              const active = activeTab === item.key;
              const label = language === 'sw' ? item.label_sw : item.label_en;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handlePress(item.key)}
                  style={({ pressed }) => [styles.moreItem, active && styles.moreItemActive, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Ionicons name={item.icon} size={20} color={active ? '#00d477' : '#b7c1d2'} />
                  <Text style={[styles.moreItemLabel, active && styles.itemLabelActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Admin section */}
        {isAdmin && !collapsed && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>{language === 'sw' ? 'USIMAMIZI' : 'ADMINISTRATION'}</Text>
            {ADMIN_ITEMS.map(item => {
              const active = activeTab === item.key;
              const label = language === 'sw' ? item.label_sw : item.label_en;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handlePress(item.key)}
                  style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={item.icon} size={24} color={active ? '#00d477' : '#b7c1d2'} />
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0c1316',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.surface.border,
    height: '100%',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 0,
    marginBottom: Spacing[2],
  },
  brandText: { flex: 1, minWidth: 0 },
  brandTitle: { fontFamily: Typography.family.sans, fontSize: 22, fontWeight: Typography.weight.bold, color: Colors.text.primary, letterSpacing: -0.4 },
  brandSub: { fontFamily: Typography.family.sans, fontSize: 10, color: '#e5e9ef', marginTop: 2 },
  navScroll: { flex: 1 },
  nav: { gap: Spacing[1], paddingHorizontal: 8, paddingBottom: Spacing[5] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    minHeight: 48,
  },
  itemActive: { backgroundColor: '#003c2c', borderLeftWidth: 4, borderLeftColor: '#008b56' },
  itemPressed: { opacity: 0.7 },
  itemLabel: { flex: 1, fontFamily: Typography.family.sans, fontSize: 15, fontWeight: Typography.weight.medium, color: '#b7c1d2' },
  itemLabelActive: { color: '#f5f6f7', fontWeight: Typography.weight.semibold },
  moreSection: { marginLeft: 16, gap: 2, paddingVertical: 4 },
  moreItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: Radius.md, minHeight: 40 },
  moreItemActive: { backgroundColor: '#003c2c' },
  moreItemLabel: { fontSize: 13, color: '#b7c1d2' },
  adminSection: { marginTop: Spacing[4], paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.surface.border },
  sectionTitle: { fontSize: 10, fontWeight: Typography.weight.bold, color: Colors.text.muted, letterSpacing: 1, paddingHorizontal: 20, marginBottom: Spacing[1] },
});

export default SidebarNav;

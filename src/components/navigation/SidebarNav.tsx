import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';
import type { TabKey } from './BottomTabBar';
import type { UserRole } from '../../types';

export type SidebarKey =
  | TabKey
  | 'contributions' | 'history' | 'discussion' | 'resources'
  | 'proposed_constitution' | 'citizen_submission' | 'multi_stage_polls'
  | 'draft_builder' | 'approval_workflow' | 'backend_status' | 'system_status'
  | 'admin';

interface NavItem {
  key: SidebarKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label_sw: string;
  label_en: string;
  roles?: UserRole[]; // undefined = everyone
}

// All nav items — filtered by role below
const ALL_ITEMS: NavItem[] = [
  { key: 'home',                  icon: 'home-outline',                    label_sw: 'Nyumbani',               label_en: 'Home' },
  { key: 'browser',               icon: 'book-outline',                    label_sw: 'Soma Katiba',             label_en: 'Read Constitution' },
  { key: 'search',                icon: 'search-outline',                  label_sw: 'Tafuta',                  label_en: 'Search' },
  { key: 'polls',                  icon: 'stats-chart-outline',             label_sw: 'Kura',                   label_en: 'Polls' },
  { key: 'contributions',         icon: 'chatbox-outline',                 label_sw: 'Michango Yangu',          label_en: 'My Contributions' },
  { key: 'discussion',            icon: 'people-outline',                  label_sw: 'Majadiliano',             label_en: 'Discussions' },
  { key: 'citizen_submission',    icon: 'megaphone-outline',               label_sw: 'Wasilisha Pendekezo',     label_en: 'Submit Proposal',   roles: ['registered','verified_citizen','institution','law_society','academic'] },
  { key: 'proposed_constitution', icon: 'create-outline',                  label_sw: 'Katiba Inayopendekezwa', label_en: 'Proposed Constitution', roles: ['registered','verified_citizen','institution','law_society','academic','moderator','admin'] },
  { key: 'multi_stage_polls',     icon: 'layers-outline',                  label_sw: 'Kura za Hatua',          label_en: 'Multi-stage Polls', roles: ['registered','verified_citizen','institution','law_society','academic','moderator','admin'] },
  { key: 'draft_builder',         icon: 'construct-outline',               label_sw: 'Mjenzi wa Rasimu',        label_en: 'Draft Builder',     roles: ['law_society','academic','moderator','admin'] },
  { key: 'approval_workflow',     icon: 'git-branch-outline',              label_sw: 'Mchakato wa Idhini',     label_en: 'Approval Workflow', roles: ['moderator','admin'] },
  { key: 'history',               icon: 'time-outline',                    label_sw: 'Historia ya Mabadiliko',  label_en: 'Change History' },
  { key: 'profile',               icon: 'person-outline',                  label_sw: 'Akaunti Yangu',           label_en: 'My Account' },
  { key: 'backend_status',        icon: 'pulse-outline',                   label_sw: 'Hali ya Mfumo',          label_en: 'System Status',     roles: ['moderator','admin'] },
  { key: 'admin',                 icon: 'shield-outline',                  label_sw: 'Usimamizi',              label_en: 'Admin Panel',       roles: ['admin','moderator'] },
];

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
  onAdminPress?: () => void;
  notificationCount?: Partial<Record<TabKey, number>>;
}

const COLLAPSED_W = 68;
const EXPANDED_W  = 260;

export function SidebarNav({
  activeTab, onTabPress,
  onContributionsPress, onHistoryPress, onResourcesPress, onDiscussionPress,
  onProposedConstitutionPress, onCitizenSubmissionPress, onMultiStagePollsPress,
  onDraftBuilderPress, onApprovalWorkflowPress, onBackendStatusPress, onAdminPress,
  notificationCount,
}: SidebarNavProps) {
  const { language, user } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [animW] = useState(() => new Animated.Value(EXPANDED_W));

  const toggle = () => {
    Animated.spring(animW, {
      toValue: collapsed ? EXPANDED_W : COLLAPSED_W,
      useNativeDriver: false, stiffness: 280, damping: 26,
    }).start();
    setCollapsed(c => !c);
  };

  const userRole = user?.role ?? 'guest';

  const visibleItems = ALL_ITEMS.filter(item =>
    !item.roles || item.roles.includes(userRole as UserRole),
  );

  const handlePress = (key: SidebarKey) => {
    const handlers: Partial<Record<SidebarKey, () => void>> = {
      contributions:         onContributionsPress,
      history:               onHistoryPress,
      resources:             onResourcesPress,
      discussion:            onDiscussionPress,
      proposed_constitution: onProposedConstitutionPress,
      citizen_submission:    onCitizenSubmissionPress,
      multi_stage_polls:     onMultiStagePollsPress,
      draft_builder:         onDraftBuilderPress,
      approval_workflow:     onApprovalWorkflowPress,
      backend_status:        onBackendStatusPress,
      admin:                 onAdminPress,
    };
    const handler = handlers[key];
    if (handler) { handler(); return; }
    onTabPress(key as TabKey);
  };

  // Role badge shown in sidebar header
  const roleLabel = user ? (language === 'sw' ? {
    guest: 'Mgeni', registered: 'Mwananchi', verified_citizen: 'Raia Aliyethibitishwa',
    institution: 'Taasisi', law_society: 'Wakili', academic: 'Mtafiti',
    moderator: 'Msimamizi', admin: 'Msimamizi Mkuu',
  }[user.role] : {
    guest: 'Guest', registered: 'Citizen', verified_citizen: 'Verified Citizen',
    institution: 'Institution', law_society: 'Legal Expert', academic: 'Academic',
    moderator: 'Moderator', admin: 'Admin',
  }[user.role]) : null;

  const isAdmin = userRole === 'admin' || userRole === 'moderator';

  return (
    <Animated.View style={[styles.sidebar, { width: animW }]}>
      {/* Hamburger */}
      <Pressable onPress={toggle} style={styles.toggleBtn}
        accessibilityRole="button" accessibilityLabel={collapsed ? 'Expand menu' : 'Collapse menu'}>
        <Ionicons name="menu" size={22} color="#b7c1d2" />
      </Pressable>

      {/* Brand */}
      {!collapsed ? (
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="book-outline" size={26} color={Colors.gold[400]} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.brandTitle} numberOfLines={1}>Katiba Yetu</Text>
            {user && roleLabel && (
              <View style={[styles.rolePill, isAdmin && styles.rolePillAdmin]}>
                <Text style={[styles.rolePillText, isAdmin && styles.rolePillTextAdmin]} numberOfLines={1}>
                  {roleLabel}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.collapsedLogo}>
          <Ionicons name="book-outline" size={26} color={Colors.gold[400]} />
        </View>
      )}

      {/* Admin separator */}
      {!collapsed && isAdmin && (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-outline" size={12} color={Colors.gold[400]} />
          <Text style={styles.adminBadgeText}>
            {language === 'sw' ? 'Paneli ya Usimamizi' : 'Admin Panel Active'}
          </Text>
        </View>
      )}

      {/* Nav items */}
      <ScrollView style={styles.scroll}
        contentContainerStyle={[styles.nav, collapsed && styles.navCollapsed]}
        showsVerticalScrollIndicator={false}>
        {visibleItems.map(item => {
          const active = activeTab === item.key;
          const label = language === 'sw' ? item.label_sw : item.label_en;
          const count = notificationCount?.[item.key as TabKey] ?? 0;
          const isAdminItem = item.key === 'admin';

          return (
            <Pressable key={item.key} onPress={() => handlePress(item.key)}
              style={({ pressed }) => [
                styles.item,
                collapsed && styles.itemCollapsed,
                active && styles.itemActive,
                active && collapsed && styles.itemActiveCollapsed,
                isAdminItem && styles.itemAdmin,
                pressed && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={21}
                  color={active ? Colors.green[400] : isAdminItem ? Colors.gold[400] : '#b7c1d2'} />
                {count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                  </View>
                )}
              </View>
              {!collapsed && (
                <Text style={[styles.itemLabel, active && styles.itemLabelActive,
                  isAdminItem && styles.itemLabelAdmin]} numberOfLines={1}>
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
  sidebar: { backgroundColor: '#0c1316', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: Colors.surface.borderStrong, height: '100%', overflow: 'hidden' },
  toggleBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', margin: 14, marginBottom: 8, borderRadius: Radius.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, marginBottom: 4 },
  brandIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.green[900], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandTitle: { fontFamily: Typography.family.serif, fontSize: 17, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  rolePill: { marginTop: 3, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.green[900] },
  rolePillAdmin: { backgroundColor: '#3b2500' },
  rolePillText: { fontSize: 10, fontWeight: Typography.weight.semibold, color: Colors.green[400] },
  rolePillTextAdmin: { color: Colors.gold[400] },
  collapsedLogo: { alignItems: 'center', paddingBottom: 12, marginBottom: 4 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1a1000', borderRadius: Radius.md, borderWidth: 1, borderColor: '#4a3000' },
  adminBadgeText: { fontSize: 10, color: Colors.gold[500], fontWeight: Typography.weight.semibold, flex: 1 },
  scroll: { flex: 1 },
  nav: { gap: 2, paddingHorizontal: 8, paddingBottom: 24 },
  navCollapsed: { alignItems: 'center', paddingHorizontal: 0 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.lg, minHeight: 46 },
  itemCollapsed: { width: 46, paddingHorizontal: 0, justifyContent: 'center', gap: 0 },
  itemActive: { backgroundColor: '#003c2c', borderLeftWidth: 3, borderLeftColor: Colors.green[500] },
  itemActiveCollapsed: { borderLeftWidth: 0, borderBottomWidth: 2, borderBottomColor: Colors.green[500] },
  itemAdmin: { marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.surface.borderStrong, paddingTop: 14 },
  iconWrap: { position: 'relative', flexShrink: 0, width: 24, alignItems: 'center' },
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: Colors.gold[400], borderRadius: 8, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#000', fontSize: 9, fontWeight: Typography.weight.bold },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: Typography.weight.medium, color: '#b7c1d2' },
  itemLabelActive: { color: '#f5f6f7', fontWeight: Typography.weight.semibold },
  itemLabelAdmin: { color: Colors.gold[400] },
});

export default SidebarNav;

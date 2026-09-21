import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';
import type { UserRole } from '../../types';

export type TabKey = 'home' | 'browser' | 'polls' | 'search' | 'profile' | 'more' | 'admin';

interface TabDef {
  key: TabKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  label_sw: string;
  label_en: string;
  roles?: UserRole[];
}

// Per-role primary 4 tabs (5th is always "···" for non-admin, or "Admin" for admins)
const TAB_SETS: Record<string, TabDef[]> = {
  citizen: [
    { key: 'home',    icon: 'home-outline',   iconActive: 'home',   label_sw: 'Nyumbani', label_en: 'Home'   },
    { key: 'browser', icon: 'book-outline',   iconActive: 'book',   label_sw: 'Katiba',   label_en: 'Browse' },
    { key: 'polls',   icon: 'stats-chart-outline', iconActive: 'stats-chart', label_sw: 'Kura', label_en: 'Polls' },
    { key: 'profile', icon: 'person-outline', iconActive: 'person', label_sw: 'Akaunti',  label_en: 'Account'},
  ],
  legal: [
    { key: 'home',    icon: 'home-outline',      iconActive: 'home',           label_sw: 'Nyumbani',  label_en: 'Home'     },
    { key: 'browser', icon: 'book-outline',      iconActive: 'book',           label_sw: 'Katiba',    label_en: 'Browse'   },
    { key: 'search',  icon: 'search-outline',    iconActive: 'search',         label_sw: 'Tafuta',    label_en: 'Search'   },
    { key: 'profile', icon: 'person-outline',    iconActive: 'person',         label_sw: 'Akaunti',   label_en: 'Account'  },
  ],
  admin: [
    { key: 'home',    icon: 'home-outline',          iconActive: 'home',            label_sw: 'Nyumbani',  label_en: 'Home'    },
    { key: 'admin',   icon: 'shield-outline',        iconActive: 'shield',          label_sw: 'Usimamizi', label_en: 'Admin'   },
    { key: 'browser', icon: 'book-outline',          iconActive: 'book',            label_sw: 'Katiba',    label_en: 'Browse'  },
    { key: 'profile', icon: 'person-outline',        iconActive: 'person',          label_sw: 'Akaunti',   label_en: 'Account' },
  ],
};

function getTabSet(role: UserRole): TabDef[] {
  if (role === 'admin' || role === 'moderator') return TAB_SETS.admin;
  if (role === 'law_society' || role === 'academic' || role === 'institution') return TAB_SETS.legal;
  return TAB_SETS.citizen;
}

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  notificationCount?: Partial<Record<TabKey, number>>;
}

export function BottomTabBar({ activeTab, onTabPress, notificationCount = {} }: BottomTabBarProps) {
  const { language, user } = useAppContext();
  const role = (user?.role ?? 'guest') as UserRole;
  const primary = getTabSet(role);

  // 5th tab
  const moreTab: TabDef = {
    key: 'more',
    icon: 'ellipsis-horizontal',
    iconActive: 'ellipsis-horizontal',
    label_sw: 'Zaidi',
    label_en: 'More',
  };
  const tabs: TabDef[] = [...primary, moreTab];

  return (
    <View style={s.wrapper}>
      <SafeAreaView>
        <View style={s.bar}>
          {tabs.map(tab => {
            const isActive = tab.key === activeTab;
            const count = notificationCount[tab.key] ?? 0;
            const label = language === 'sw' ? tab.label_sw : tab.label_en;
            const isMore = tab.key === 'more';
            const isAdminTab = tab.key === 'admin';

            return (
              <Pressable key={tab.key} onPress={() => onTabPress(tab.key)}
                style={({ pressed }) => [s.tabItem, pressed && s.tabPressed]}
                accessibilityRole="tab" accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}>

                {isActive && !isMore && <View style={[s.activePill, isAdminTab && s.activePillAdmin]} />}

                <View style={s.iconWrap}>
                  {isMore ? (
                    <View style={s.dotsWrap}>
                      {[0, 1, 2].map(i => (
                        <View key={i} style={[s.dot, isActive && s.dotActive]} />
                      ))}
                    </View>
                  ) : (
                    <Ionicons
                      name={isActive ? tab.iconActive : tab.icon}
                      size={22}
                      color={isActive
                        ? (isAdminTab ? Colors.gold[400] : Colors.green[600])
                        : Colors.text.muted}
                    />
                  )}
                  {count > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{count > 99 ? '99+' : count}</Text>
                    </View>
                  )}
                </View>

                <Text style={[
                  s.label,
                  isActive && s.labelActive,
                  isActive && isAdminTab && s.labelAdmin,
                ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surface.raised, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.surface.borderStrong },
  bar: { flexDirection: 'row', paddingTop: Spacing[1], paddingBottom: Spacing[1], maxWidth: 600, alignSelf: 'center', width: '100%' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, paddingVertical: Spacing[1.5], position: 'relative' },
  tabPressed: { opacity: 0.7 },
  activePill: { position: 'absolute', top: 6, width: 48, height: 30, backgroundColor: Colors.green[50], borderRadius: 15 },
  activePillAdmin: { backgroundColor: '#2a1800' },
  iconWrap: { position: 'relative', marginBottom: Spacing[1], zIndex: 1, alignItems: 'center', justifyContent: 'center', height: 24 },
  dotsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.text.muted },
  dotActive: { backgroundColor: Colors.green[600] },
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: Colors.gold[400], borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 9, fontWeight: Typography.weight.bold, color: '#000' },
  label: { fontSize: Typography.size.xs, fontWeight: Typography.weight.regular, color: Colors.text.muted },
  labelActive: { color: Colors.green[600], fontWeight: Typography.weight.semibold },
  labelAdmin: { color: Colors.gold[400] },
});

export default BottomTabBar;

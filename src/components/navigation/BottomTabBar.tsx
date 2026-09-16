import React from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadow } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';

export type TabKey = 'home' | 'browser' | 'polls' | 'search' | 'profile';

interface TabItem {
  key: TabKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  label_sw: string;
  label_en: string;
}

const TABS: TabItem[] = [
  { key: 'home',    icon: 'home-outline',   iconActive: 'home',   label_sw: 'Nyumbani', label_en: 'Home'    },
  { key: 'browser', icon: 'book-outline',   iconActive: 'book',   label_sw: 'Katiba',   label_en: 'Browse'  },
  { key: 'polls',   icon: 'stats-chart-outline', iconActive: 'stats-chart', label_sw: 'Kura', label_en: 'Polls' },
  { key: 'search',  icon: 'search-outline', iconActive: 'search', label_sw: 'Tafuta',   label_en: 'Search'  },
  { key: 'profile', icon: 'person-outline', iconActive: 'person', label_sw: 'Akaunti',  label_en: 'Profile' },
];

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  notificationCount?: Partial<Record<TabKey, number>>;
}

export function BottomTabBar({
  activeTab,
  onTabPress,
  notificationCount = {},
}: BottomTabBarProps) {
  const { language } = useAppContext();

  return (
    <View style={styles.wrapper}>
      <SafeAreaView>
        <View style={styles.bar}>
          {TABS.map(tab => {
            const isActive = tab.key === activeTab;
            const count = notificationCount[tab.key] ?? 0;
            const label = language === 'sw' ? tab.label_sw : tab.label_en;

            return (
              <Pressable
                key={tab.key}
                onPress={() => onTabPress(tab.key)}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && styles.tabPressed,
                ]}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
              >
                {/* Active indicator bar */}
                {isActive && <View style={styles.activeIndicator} />}

                {/* Icon area */}
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.icon}
                    size={21}
                    color={isActive ? Colors.green[300] : Colors.text.muted}
                  />
                  {count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.label, isActive && styles.labelActive]}>
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

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface.raised,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surface.borderStrong,
    ...Shadow.sm,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: Spacing[2],
    paddingBottom: Spacing[1],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingVertical: Spacing[1.5],
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.7,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: Colors.green[400],
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: Spacing[1],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.gold[400],
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: Typography.family.sans,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: Colors.text.onGold,
  },
  label: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.regular,
    color: Colors.text.muted,
  },
  labelActive: {
    color: Colors.green[300],
    fontWeight: Typography.weight.semibold,
  },
});

export default BottomTabBar;

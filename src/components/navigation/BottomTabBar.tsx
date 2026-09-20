import React from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadow } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';

export type TabKey = 'home' | 'browser' | 'polls' | 'search' | 'profile' | 'more';

interface TabItem {
  key: TabKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  label_sw: string;
  label_en: string;
}

// Exactly 5 primary tabs — the 5th is always "···" (more)
const PRIMARY_TABS: TabItem[] = [
  { key: 'home',    icon: 'home-outline',        iconActive: 'home',        label_sw: 'Nyumbani', label_en: 'Home'   },
  { key: 'browser', icon: 'book-outline',        iconActive: 'book',        label_sw: 'Katiba',   label_en: 'Browse' },
  { key: 'search',  icon: 'search-outline',      iconActive: 'search',      label_sw: 'Tafuta',   label_en: 'Search' },
  { key: 'profile', icon: 'person-outline',      iconActive: 'person',      label_sw: 'Akaunti',  label_en: 'Account'},
  { key: 'more',    icon: 'ellipsis-horizontal', iconActive: 'ellipsis-horizontal', label_sw: 'Zaidi', label_en: 'More' },
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
          {PRIMARY_TABS.map(tab => {
            const isActive = tab.key === activeTab;
            const count = notificationCount[tab.key] ?? 0;
            const label = language === 'sw' ? tab.label_sw : tab.label_en;
            const isMore = tab.key === 'more';

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
                {/* Active pill */}
                {isActive && !isMore && <View style={styles.activePill} />}

                {/* Icon */}
                <View style={styles.iconWrap}>
                  {isMore ? (
                    // Three-dot icon — always rendered the same, no fill variant
                    <View style={[styles.dotsWrap, isActive && styles.dotsWrapActive]}>
                      {[0, 1, 2].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            isActive && styles.dotActive,
                          ]}
                        />
                      ))}
                    </View>
                  ) : (
                    <Ionicons
                      name={isActive ? tab.iconActive : tab.icon}
                      size={22}
                      color={isActive ? Colors.green[700] : Colors.text.muted}
                    />
                  )}
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
    paddingTop: Spacing[1],
    paddingBottom: Spacing[1],
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingVertical: Spacing[1.5],
    position: 'relative',
  },
  tabPressed: { opacity: 0.7 },
  activePill: {
    position: 'absolute',
    top: 6,
    width: 48,
    height: 30,
    backgroundColor: Colors.green[50],
    borderRadius: 15,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: Spacing[1],
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  // Three-dot "more" button
  dotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 22,
    paddingHorizontal: 4,
  },
  dotsWrapActive: {},
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.text.muted,
  },
  dotActive: {
    backgroundColor: Colors.green[700],
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
    color: Colors.green[700],
    fontWeight: Typography.weight.semibold,
  },
});

export default BottomTabBar;

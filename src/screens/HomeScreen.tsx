import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/tokens';
import { AppHeader } from '../components/sections/AppHeader';
import { FeaturedPollCard } from '../components/sections/FeaturedPollCard';
import { ArticleCard } from '../components/sections/ArticleCard';
import { Avatar } from '../components/ui/Avatar';
import { POLL_ART13, POLL_ART19, TRENDING, MOCK_ORGS } from '../constants/mockData';
import { useAppContext } from '../hooks/useAppContext';
import { t, formatRelativeTime } from '../utils';
import type { Section, Poll } from '../types';

interface HomeScreenProps {
  onSectionPress: (section: Section) => void;
  onPollPress: (poll: Poll) => void;
  onSearchPress: () => void;
  onBrowsePress: () => void;
}

interface RecentContrib {
  id: string;
  org?: typeof MOCK_ORGS[number];
  isAnon?: boolean;
  action_sw: string;
  action_en: string;
  target_sw: string;
  target_en: string;
  time: string;
}

const RECENT_CONTRIBS: RecentContrib[] = [
  {
    id: '1',
    org: MOCK_ORGS[0],
    action_sw: 'Uchambuzi mpya',
    action_en: 'New analysis',
    target_sw: 'Ibara 64â€“71',
    target_en: 'Articles 64â€“71',
    time: '2026-09-16T07:00:00Z',
  },
  {
    id: '2',
    isAnon: true,
    action_sw: 'Pendekezo',
    action_en: 'Suggestion',
    target_sw: 'Ibara 19 Â· Dar es Salaam',
    target_en: 'Article 19 Â· Dar es Salaam',
    time: '2026-09-16T05:30:00Z',
  },
  {
    id: '3',
    org: MOCK_ORGS[2],
    action_sw: 'Kauli ya taasisi',
    action_en: 'Institutional statement',
    target_sw: 'Ibara 26',
    target_en: 'Article 26',
    time: '2026-09-15T20:00:00Z',
  },
];

export function HomeScreen({
  onSectionPress,
  onPollPress,
  onSearchPress,
  onBrowsePress,
}: HomeScreenProps) {
  const { language } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: replace with real data refetch once the API is integrated.
    // The timer is tracked on a ref so it can be cleared on unmount below.
    refreshTimerRef.current = setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const heroSubtitle = t(
    'Karibu kwenye jukwaa la mazungumzo ya kikatiba la Tanzania.',
    "Welcome to Tanzania's constitutional deliberation platform.",
    language,
  );

  return (
    <View style={styles.root}>
      <AppHeader variant="home" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green[400]}
            colors={[Colors.green[400]]}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTagline}>
              {t('Soma Â· Jadili Â· Pendekeza Â· Piga Kura', 'Read Â· Discuss Â· Propose Â· Vote', language)}
            </Text>
            <Text style={styles.heroTitle}>
              {t('Ifahamu katiba. Sauti yako ihesabike.', 'Know the constitution. Make your voice count.', language)}
            </Text>
            <Text style={styles.heroSub}>{heroSubtitle}</Text>
          </View>

          <Pressable
            onPress={onSearchPress}
            style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarFocused]}
            accessibilityRole="button"
          >
            <Ionicons name="search" size={19} color={Colors.green[400]} />
            <Text style={styles.searchPlaceholder}>
              {t('Tafuta ibara, neno, au mada...', 'Search articles, terms, topics...', language)}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.green[400]} />
          </Pressable>
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            icon="book-outline"
            iconBg={Colors.green[900]}
            iconColor={Colors.green[300]}
            title={t('Soma Katiba', 'Read the Constitution', language)}
            subtitle={t('Vinjari sura na ibara', 'Browse chapters and articles', language)}
            onPress={onBrowsePress}
          />
          <View style={styles.quickDivider} />
          <QuickAction
            icon="stats-chart-outline"
            iconBg={Colors.gold[900]}
            iconColor={Colors.gold[300]}
            title={t('Piga kura', 'Vote now', language)}
            subtitle={t('Kura 2 zinaendelea', '2 active polls', language)}
            onPress={() => onPollPress(POLL_ART13)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel
            label={t('Kura inayoendelea sasa', 'Active poll', language)}
            accent={Colors.gold[400]}
          />
          <FeaturedPollCard poll={POLL_ART13} onVotePress={onPollPress} />
        </View>

        <View style={styles.section}>
          <SectionLabel label={t('Ibara zinazojadiliwa sana', 'Most discussed articles', language)} />
          {TRENDING.map(item => (
            <ArticleCard
              key={item.section.id}
              section={item.section}
              onPress={onSectionPress}
              showPollBadge
              style={styles.articleCard}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionLabel
            label={t('Kura nyingine inayoendelea', 'Another active poll', language)}
            accent={Colors.blue[400]}
          />
          <FeaturedPollCard poll={POLL_ART19} onVotePress={onPollPress} />
        </View>

        <View style={styles.section}>
          <SectionLabel label={t('Wachangiaji wa hivi karibuni', 'Recent contributors', language)} />
          <View style={styles.contribList}>
            {RECENT_CONTRIBS.map((item, idx) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.contribRow,
                  idx === RECENT_CONTRIBS.length - 1 && styles.contribRowLast,
                  pressed && styles.contribRowPressed,
                ]}
              >
                <Avatar
                  name={item.org?.name ?? (item.isAnon ? '??' : 'U')}
                  type={item.org ? 'org' : item.isAnon ? 'anon' : 'user'}
                  orgType={item.org?.type}
                  size="sm"
                />
                <View style={styles.contribText}>
                  <Text style={styles.contribName} numberOfLines={1}>
                    {item.org?.name ?? t('Mtumiaji asiyejulikana', 'Anonymous user', language)}
                  </Text>
                  <Text style={styles.contribMeta} numberOfLines={1}>
                    {t(item.action_sw, item.action_en, language)}
                    {' Â· '}
                    {t(item.target_sw, item.target_en, language)}
                  </Text>
                </View>
                <Text style={styles.contribTime}>
                  {formatRelativeTime(item.time, language)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <View style={styles.disclaimerDot} />
          <Text style={styles.disclaimerText}>
            {t(
              'Maelezo haya si ushauri wa kisheria. Kwa ushauri wa kisheria, wasiliana na wakili aliyesajiliwa.',
              'This information is not legal advice. For legal advice, consult a registered lawyer.',
              language,
            )}
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon, iconBg, iconColor, title, subtitle, onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.contribRowPressed]}
    >
      <View style={[styles.quickIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <View style={styles.quickTextBlock}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
    </Pressable>
  );
}

function SectionLabel({ label, accent }: { label: string; accent?: string }) {
  return (
    <View style={sectionLabelStyles.row}>
      <View style={[sectionLabelStyles.bar, { backgroundColor: accent ?? Colors.green[500] }]} />
      <Text style={sectionLabelStyles.text}>{label}</Text>
    </View>
  );
}

const sectionLabelStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  text: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    letterSpacing: Typography.letterSpacing.wider,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[20],
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: Colors.surface.raised,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[8],
    gap: Spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  heroTextBlock: {
    gap: Spacing[2],
  },
  heroTagline: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: Colors.green[400],
    letterSpacing: Typography.letterSpacing.widest,
  },
  heroTitle: {
    maxWidth: 680,
    fontFamily: Typography.family.serif,
    fontSize: Typography.size['4xl'],
    lineHeight: Typography.size['4xl'] * 1.08,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  heroSub: {
    maxWidth: 620,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.6,
    color: Colors.text.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2.5],
    borderWidth: 1,
    borderColor: Colors.green[200],
    gap: Spacing[2],
  },
  searchBarFocused: {
    borderColor: Colors.green[500],
    backgroundColor: '#FFFFFF',
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
  },
  quickActions: {
    marginHorizontal: Spacing[4],
    marginTop: -Spacing[3],
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    overflow: 'hidden',
    ...Shadow.md,
  },
  quickAction: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  quickDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.surface.border,
    marginLeft: Spacing[16],
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextBlock: {
    flex: 1,
  },
  quickTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  quickSub: {
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    marginTop: 3,
  },
  section: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[6],
  },
  articleCard: {
    marginBottom: Spacing[3],
  },
  contribList: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  contribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    gap: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  contribRowLast: {
    borderBottomWidth: 0,
  },
  contribRowPressed: {
    backgroundColor: Colors.surface.overlay,
  },
  contribText: {
    flex: 1,
    gap: 2,
  },
  contribName: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
  },
  contribMeta: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  contribTime: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    flexShrink: 0,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing[2.5],
    alignItems: 'flex-start',
    marginHorizontal: Spacing[4],
    marginTop: Spacing[8],
    padding: Spacing[3],
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
  },
  disclaimerDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.text.muted,
    marginTop: 5,
    flexShrink: 0,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    lineHeight: Typography.size.xs * 1.6,
    color: Colors.text.muted,
  },
  bottomPad: {
    height: Spacing[4],
  },
});

export default HomeScreen;

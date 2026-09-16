import React, { useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/tokens';
import { AppHeader } from '../components/sections/AppHeader';
import { FeaturedPollCard } from '../components/sections/FeaturedPollCard';
import { ArticleCard } from '../components/sections/ArticleCard';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { KatibaText } from '../components/ui/Text';
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

// ─── Recent Contributions (mock) ─────────────────────────────────────────────

const RECENT_CONTRIBS = [
  {
    id: '1',
    org: MOCK_ORGS[0],
    action_sw: 'Uchambuzi mpya',
    action_en: 'New analysis',
    target_sw: 'Ibara 64–71',
    target_en: 'Articles 64–71',
    time: '2026-09-16T07:00:00Z',
  },
  {
    id: '2',
    org: undefined,
    isAnon: true,
    action_sw: 'Pendekezo',
    action_en: 'Suggestion',
    target_sw: 'Ibara 19 · Dar es Salaam',
    target_en: 'Article 19 · Dar es Salaam',
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

export function HomeScreen({ onSectionPress, onPollPress, onSearchPress, onBrowsePress }: HomeScreenProps) {
  const { language } = useAppContext();
  const [refreshing, setRefreshing] = React.useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const heroSubtitle = t(
    'Karibu kwenye jukwaa la mazungumzo ya kikatiba la Tanzania.',
    'Welcome to Tanzania\'s constitutional deliberation platform.',
    language,
  );

  return (
    <View style={styles.root}>
      <AppHeader variant="home" />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green[400]}
            colors={[Colors.green[400]]}
          />
        }
      >
        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTagline}>
              {t('Soma · Jadili · Pendekeza · Piga Kura', 'Read · Discuss · Propose · Vote', language)}
            </Text>
            <Text style={styles.heroSub}>{heroSubtitle}</Text>
          </View>

          <Pressable onPress={onSearchPress} style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarFocused]} accessibilityRole="button">
            <Ionicons name="search" size={19} color={Colors.green[200]} />
            <Text style={styles.searchPlaceholder}>{t('Tafuta ibara, neno, au mada...', 'Search articles, terms, topics...', language)}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.green[300]} />
          </Pressable>
        </View>

        <View style={styles.quickActions}>
          <Pressable onPress={onBrowsePress} style={({pressed}) => [styles.quickAction, pressed && styles.contribRowPressed]}>
            <View style={[styles.quickIcon,{backgroundColor:Colors.green[900]}]}><Ionicons name="book-outline" size={21} color={Colors.green[300]}/></View>
            <View style={{flex:1}}><Text style={styles.quickTitle}>{t('Soma Katiba','Soma Katiba',language)}</Text><Text style={styles.quickSub}>{t('Vinjari sura na ibara','Browse chapters and articles',language)}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted}/>
          </Pressable>
          <View style={styles.quickDivider}/>
          <Pressable onPress={() => onPollPress(POLL_ART13)} style={({pressed}) => [styles.quickAction, pressed && styles.contribRowPressed]}>
            <View style={[styles.quickIcon,{backgroundColor:Colors.gold[900]}]}><Ionicons name="stats-chart-outline" size={21} color={Colors.gold[300]}/></View>
            <View style={{flex:1}}><Text style={styles.quickTitle}>{t('Piga kura','Vote now',language)}</Text><Text style={styles.quickSub}>{t('Kura 2 zinaendelea','2 active polls',language)}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted}/>
          </Pressable>
        </View>

        {/* ── Featured Poll ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel
            label={t('Kura inayoendelea sasa', 'Active poll', language)}
            accent={Colors.gold[400]}
          />
          <FeaturedPollCard
            poll={POLL_ART13}
            onVotePress={onPollPress}
          />
        </View>

        {/* ── Trending Articles ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel
            label={t('Ibara zinazojadiliwa sana', 'Most discussed articles', language)}
          />
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

        {/* ── Second Poll ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel
            label={t('Kura nyingine inayoendelea', 'Another active poll', language)}
            accent={Colors.blue[400]}
          />
          <FeaturedPollCard
            poll={POLL_ART19}
            onVotePress={onPollPress}
          />
        </View>

        {/* ── Recent Contributions ───────────────────────────────────────── */}
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
                    {' · '}
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

        {/* ── Disclaimer ─────────────────────────────────────────────────── */}
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
      </Animated.ScrollView>
    </View>
  );
}

// ─── Sub-component: Section Label ────────────────────────────────────────────

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
    textTransform: 'uppercase',
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  },
  // Hero
  hero: {
    backgroundColor: Colors.green[700],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[6],
    gap: Spacing[4],
    borderBottomWidth: 0,
  },
  heroTextBlock: {
    gap: Spacing[2],
  },
  heroTagline: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: Colors.gold[300],
    letterSpacing: Typography.letterSpacing.widest,
  },
  heroSub: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.lg,
    color: Colors.green[100],
    lineHeight: Typography.size.lg * 1.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2.5],
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: Spacing[2],
  },
  searchBarFocused: {
    borderColor: Colors.gold[400],
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.green[100],
  },
  quickActions:{marginHorizontal:Spacing[4],marginTop:-Spacing[3],backgroundColor:Colors.surface.raised,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.surface.border,overflow:'hidden',...Shadow.md},
  quickAction:{minHeight:68,flexDirection:'row',alignItems:'center',gap:Spacing[3],paddingHorizontal:Spacing[4],paddingVertical:Spacing[3]},
  quickDivider:{height:StyleSheet.hairlineWidth,backgroundColor:Colors.surface.border,marginLeft:Spacing[16]},
  quickIcon:{width:40,height:40,borderRadius:Radius.md,alignItems:'center',justifyContent:'center'},
  quickTitle:{fontSize:Typography.size.base,fontWeight:Typography.weight.semibold,color:Colors.text.primary},
  quickSub:{fontSize:Typography.size.xs,color:Colors.text.muted,marginTop:3},
  // Sections
  section: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[6],
  },
  articleCard: {
    marginBottom: Spacing[3],
  },
  // Contributions
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
  // Disclaimer
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
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    lineHeight: Typography.size.xs * 1.6,
    flex: 1,
  },
  bottomPad: {
    height: Spacing[4],
  },
});

export default HomeScreen;

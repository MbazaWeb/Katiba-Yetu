import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { AppHeader } from '../components/sections/AppHeader';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../utils';
import type { Section, Poll } from '../types';

interface HomeScreenProps {
  onSectionPress: (section: Section) => void;
  onPollPress: (poll: Poll) => void;
  onSearchPress: () => void;
  onBrowsePress: () => void;
}

export function HomeScreen({ onBrowsePress, onSearchPress }: HomeScreenProps) {
  const { language } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshTimerRef.current = setTimeout(() => setRefreshing(false), 1200);
  }, []);

  useEffect(() => {
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []);

  return (
    <View style={styles.root}>
      <AppHeader variant="home" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green[400]} colors={[Colors.green[400]]} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTagline}>
              {t('Soma · Jadili · Pendekeza · Piga Kura', 'Read · Discuss · Propose · Vote', language)}
            </Text>
            <Text style={styles.heroTitle}>
              {t('Ifahamu katiba. Sauti yako ihesabike.', 'Know the constitution. Make your voice count.', language)}
            </Text>
            <Text style={styles.heroSub}>
              {t('Karibu kwenye jukwaa la mazungumzo ya kikatiba la Tanzania.', "Welcome to Tanzania's constitutional deliberation platform.", language)}
            </Text>
          </View>
          <Pressable onPress={onSearchPress} style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarFocused]} accessibilityRole="button">
            <Ionicons name="search" size={19} color={Colors.green[400]} />
            <Text style={styles.searchPlaceholder}>
              {t('Tafuta ibara, neno, au mada...', 'Search articles, terms, topics...', language)}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.green[400]} />
          </Pressable>
        </View>

        <View style={styles.quickActions}>
          <QuickAction icon="book-outline" iconBg={Colors.green[900]} iconColor={Colors.green[300]} title={t('Soma Katiba', 'Read the Constitution', language)} subtitle={t('Vinjari sura na ibara', 'Browse chapters and articles', language)} onPress={onBrowsePress} />
          <View style={styles.quickDivider} />
          <QuickAction icon="megaphone-outline" iconBg={Colors.gold[900]} iconColor={Colors.gold[300]} title={t('Wasilisha Pendekezo', 'Submit Proposal', language)} subtitle={t('Shiriki maoni yako', 'Share your views', language)} onPress={onSearchPress} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('Anza hapa', 'Start here', language)}</Text>
          <View style={styles.emptyCard}>
            <Ionicons name="documents-outline" size={40} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>{t('Karibu Katiba Yetu', 'Welcome to Katiba Yetu', language)}</Text>
            <Text style={styles.emptyBody}>
              {t(
                'Bonyeza "Soma Katiba" ili kuvinja sura na ibara, au "Wasilisha Pendekezo" ili kutoa maoni yako. Kura za hatua nyingi zinapatikana kwenye menyu ya Kura za Hatua Nyingi.',
                'Tap "Read the Constitution" to browse chapters and articles, or "Submit Proposal" to share your views. Multi-stage polls are available in the Multi-stage Polls menu.',
                language
              )}
            </Text>
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

function QuickAction({ icon, iconBg, iconColor, title, subtitle, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; iconBg: string; iconColor: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={onPress} accessibilityRole="button">
      <View style={[styles.quickIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={24} color={iconColor} /></View>
      <View style={styles.quickText}><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickSub}>{subtitle}</Text></View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[8] },
  hero: { gap: Spacing[4], paddingVertical: Spacing[5] },
  heroTextBlock: { gap: Spacing[1] },
  heroTagline: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.green[400], letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, lineHeight: 36 },
  heroSub: { fontSize: Typography.size.md, color: Colors.text.secondary, lineHeight: 22 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3], borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, backgroundColor: Colors.surface.raised },
  searchBarFocused: { borderColor: Colors.green[400] },
  searchPlaceholder: { flex: 1, color: Colors.text.muted, fontSize: Typography.size.md },
  quickActions: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[5] },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3], borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.border, backgroundColor: Colors.surface.raised },
  quickActionPressed: { opacity: 0.7 },
  quickIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  quickText: { flex: 1, gap: 2 },
  quickTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  quickSub: { fontSize: Typography.size.xs, color: Colors.text.muted },
  quickDivider: { width: 1, backgroundColor: Colors.surface.border },
  section: { marginBottom: Spacing[5] },
  sectionLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing[3] },
  emptyCard: { alignItems: 'center', gap: Spacing[3], padding: Spacing[6], borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surface.border, backgroundColor: Colors.surface.raised },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  emptyBody: { fontSize: Typography.size.sm, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  disclaimer: { flexDirection: 'row', gap: Spacing[2], alignItems: 'flex-start', padding: Spacing[3], borderRadius: Radius.md, backgroundColor: Colors.surface.raised },
  disclaimerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold[400], marginTop: 6 },
  disclaimerText: { flex: 1, fontSize: Typography.size.xs, color: Colors.text.muted, lineHeight: 18 },
  bottomPad: { height: Spacing[10] },
});

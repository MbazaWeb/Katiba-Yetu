import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { sortedTimeline } from '../services/history';
import { useAppContext } from '../hooks/useAppContext';
import { Notice } from '../components/library/LibraryUI';
import type { HistoryEntry } from '../types';

const CATEGORY_LABELS: Record<HistoryEntry['category'], { sw: string; en: string }> = {
  independence:        { sw: 'Uhuru',                  en: 'Independence' },
  union:               { sw: 'Muungano',               en: 'Union' },
  zanzibar_revolution: { sw: 'Mapinduzi ya Zanzibar',  en: 'Zanzibar Revolution' },
  amendment:           { sw: 'Marekebisho',            en: 'Amendment' },
  review_process:      { sw: 'Mchakato wa Mapitio',    en: 'Review Process' },
  draft:               { sw: 'Rasimu',                  en: 'Draft' },
  other:               { sw: 'Nyingine',                en: 'Other' },
};

export function HistoryScreen({ onBack }: { onBack?: () => void }) {
  const { language } = useAppContext();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const timeline = sortedTimeline();
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Historia ya Katiba', 'Constitutional History')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="time-outline" size={34} color={Colors.gold[400]} />
          <Text style={styles.heroTitle}>{copy('Historia ya Katiba ya Tanzania', 'History of the Tanzanian Constitution')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Hati ya kuonyesha hatua muhimu katika historia ya Katiba ya Tanzania na Zanzibar. Sehemu nyingi zinahitaji uhakiki wa kisomo.',
              'A timeline of key milestones in the constitutional history of Tanzania and Zanzibar. Many entries require scholarly verification.'
            )}
          </Text>
        </View>

        <Notice>
          {copy(
            'Maelezo ya kihistoria yamewekwa kama sehemu zinazosubiri uhakiki. Tafadhali rejea vyanzo halali vya kisomo kabla ya kutumia.',
            'Historical descriptions are placeholders pending verification. Please consult authoritative scholarly sources before use.'
          )}
        </Notice>

        {selected && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailYear}>{selected.year}</Text>
              <Pressable onPress={() => setSelected(null)} accessibilityRole="button">
                <Ionicons name="close" size={20} color={Colors.text.muted} />
              </Pressable>
            </View>
            <Text style={styles.detailTitle}>{selected.title}</Text>
            <Text style={styles.detailBody}>{selected.description}</Text>
            <View style={styles.detailMeta}>
              <Text style={styles.detailMetaText}>{copy('Kategoria', 'Category')}: {CATEGORY_LABELS[selected.category][language]}</Text>
              <Text style={styles.detailMetaText}>{copy('Chanzo', 'Source')}: {selected.sourceReference}</Text>
              <Text style={styles.detailMetaText}>
                {copy('Hali ya uhakiki', 'Verification')}: {selected.verificationStatus === 'verified' ? copy('Imehakikiwa', 'Verified') : selected.verificationStatus === 'pending' ? copy('Inasubiri', 'Pending') : copy('Haijapatikana', 'Unavailable')}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.timeline}>
          {timeline.map((entry, i) => (
            <View key={entry.id} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.dot} />
                {i < timeline.length - 1 && <View style={styles.line} />}
              </View>
              <Pressable
                style={({ pressed }) => [styles.timelineCard, pressed && { opacity: 0.75 }]}
                onPress={() => setSelected(entry)}
                accessibilityRole="button"
              >
                <View style={styles.timelineCardHeader}>
                  <Text style={styles.timelineYear}>{entry.year}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{CATEGORY_LABELS[entry.category][language]}</Text>
                  </View>
                </View>
                <Text style={styles.timelineTitle}>{entry.title}</Text>
                <Text style={styles.timelineDesc} numberOfLines={3}>{entry.description}</Text>
                <Text style={styles.timelineSource}>{entry.sourceReference}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          {copy(
            'Historia hii inatumia muhtasari wa wazi; usifikiri kuwa ni tafsiri halali ya kisheria. Rejea maandishi rasmi ya kisomo kwa maelezo kamili.',
            'This timeline is a clearly-marked summary; do not treat it as an authoritative legal history. Consult scholarly sources for full details.'
          )}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%', gap: Spacing[5] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[4] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 560 },
  detailCard: { backgroundColor: Colors.surface.raised, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[5], gap: Spacing[3] },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailYear: { fontFamily: Typography.family.serif, fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Colors.gold[400] },
  detailTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  detailBody: { fontSize: Typography.size.md, color: Colors.text.secondary, lineHeight: 24 },
  detailMeta: { gap: Spacing[1], marginTop: Spacing[2], paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.surface.border },
  detailMetaText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: Spacing[4] },
  timelineLeft: { alignItems: 'center', width: 20, paddingTop: Spacing[2] },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.green[400], borderWidth: 2, borderColor: Colors.surface.base },
  line: { width: 2, flex: 1, backgroundColor: Colors.surface.borderStrong, marginTop: Spacing[1] },
  timelineCard: { flex: 1, backgroundColor: Colors.surface.raised, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], gap: Spacing[2] },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineYear: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.green[300] },
  categoryBadge: { paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay },
  categoryText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  timelineTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  timelineDesc: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  timelineSource: { fontSize: Typography.size.xs, color: Colors.text.muted, fontStyle: 'italic' },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
});

export default HistoryScreen;

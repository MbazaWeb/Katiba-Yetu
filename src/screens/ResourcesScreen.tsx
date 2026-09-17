import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { RESOURCE_CATEGORY_LABELS, filterResources } from '../services/resources';
import { useAppContext } from '../hooks/useAppContext';
import { Notice, Highlight, libraryStyles as s } from '../components/library/LibraryUI';
import type { ResourceCategory, ResourceEntry } from '../types';

const FILE_ICONS: Record<string, string> = {
  pdf: 'document-text-outline',
  docx: 'document-text-outline',
  txt: 'document-text-outline',
  html: 'globe-outline',
  image: 'image-outline',
  audio: 'volume-high-outline',
  other: 'document-outline',
};

export function ResourcesScreen({ onBack }: { onBack?: () => void }) {
  const { language } = useAppContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all');
  const [error, setError] = useState('');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  const results = useMemo(() => filterResources({ category, query }), [category, query]);

  function open(resource: ResourceEntry) {
    if (!resource.url) {
      setError(copy('Faili halapatikani kwa sasa. Linasubiri usajili.', 'File is not available yet. Awaiting registration.'));
      return;
    }
    setError('');
    Linking.openURL(resource.url).catch(() => setError(copy('Faili halikufunguka. Jaribu tena.', 'Could not open the file. Please retry.')));
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Maktaba ya Rasilimali', 'Resource Library')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Ionicons name="library-outline" size={34} color={Colors.green[300]} />
          <Text style={styles.heroTitle}>{copy('Maktaba ya Rasilimali za Katiba', 'Constitutional Resource Library')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Hati rasmi za Katiba, marekebisho, rasimu, ripoti, na rasilimali za elimu. Faili mbili za asili zimesajiliwa kama nyenzo halisi zilizothibitishwa.',
              'Official constitutions, amendments, drafts, reports, and educational resources. Two original constitution files are registered as verified primary documents.'
            )}
          </Text>
        </View>

        <TextInput
          accessibilityLabel={copy('Tafuta rasilimali', 'Search resources')}
          value={query}
          onChangeText={setQuery}
          placeholder={copy('Tafuta kwa jina, maelezo…', 'Search by title, description…')}
          placeholderTextColor={Colors.text.muted}
          style={[s.input, styles.searchInput]}
          returnKeyType="search"
        />

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setCategory('all')}
            style={[styles.filterPill, category === 'all' && styles.filterPillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: category === 'all' }}
          >
            <Text style={[styles.filterText, category === 'all' && styles.filterTextActive]}>{copy('Zote', 'All')}</Text>
          </Pressable>
          {(Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[]).map(cat => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.filterPill, category === cat && styles.filterPillActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: category === cat }}
            >
              <Text style={[styles.filterText, category === cat && styles.filterTextActive]}>{RESOURCE_CATEGORY_LABELS[cat][language]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.countText}>{copy('Matokeo', 'Results')}: {results.length}</Text>

        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}

        {results.map(resource => (
          <View key={resource.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.fileIcon}>
                <Ionicons name={(FILE_ICONS[resource.fileType] ?? 'document-outline') as any} size={24} color={Colors.green[300]} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.title}><Highlight query={query} text={resource.title} /></Text>
                <Text style={styles.subtitle}>{resource.fileType.toUpperCase()} · {resource.year} · {resource.language === 'both' ? copy('Kiswahili / Kiingereza', 'Swahili / English') : resource.language === 'sw' ? 'Kiswahili' : 'English'}</Text>
              </View>
              <View style={[styles.statusBadge, resource.verificationStatus === 'verified' ? styles.statusVerified : resource.verificationStatus === 'pending' ? styles.statusPending : styles.statusUnavailable]}>
                <Text style={styles.statusText}>{resource.verificationStatus === 'verified' ? copy('Imehakikiwa', 'Verified') : resource.verificationStatus === 'pending' ? copy('Inasubiri', 'Pending') : copy('Haijapatikana', 'Unavailable')}</Text>
              </View>
            </View>
            <Text style={styles.description}><Highlight query={query} text={resource.description} /></Text>
            <View style={styles.cardFooter}>
              <Text style={styles.categoryLabel}>{RESOURCE_CATEGORY_LABELS[resource.category][language]}</Text>
              <Pressable
                onPress={() => open(resource)}
                disabled={!resource.url}
                style={({ pressed }) => [styles.openBtn, !resource.url && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={copy('Fungua / pakua', 'Open / download')}
              >
                <Text style={styles.openText}>{copy('Fungua / pakua', 'Open / download')}</Text>
                <Ionicons name="download-outline" size={16} color={Colors.text.primary} />
              </Pressable>
            </View>
          </View>
        ))}

        {results.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>{copy('Hakuna rasilimali inayofananishwa. Jaribu kubadilisha vichujio.', 'No matching resources. Try adjusting filters.')}</Text>
          </View>
        )}

        <Notice>
          {copy(
            'Faili za asili za Katiba zimesajiliwa kama nyenzo za msingi zilizothibitishwa. Rasilimali nyingine zinaweza kusubiri uhakiki.',
            'Original constitution files are registered as verified primary documents. Other resources may be awaiting verification.'
          )}
        </Notice>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 960, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 560, lineHeight: 21 },
  searchInput: { fontSize: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  filterPill: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay, borderWidth: 1, borderColor: Colors.surface.borderStrong, minHeight: 36 },
  filterPillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  filterText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  filterTextActive: { color: '#fff', fontWeight: Typography.weight.semibold },
  countText: { fontSize: Typography.size.sm, color: Colors.text.muted },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  fileIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.green[900], alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { flex: 1, gap: 2 },
  title: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  subtitle: { fontSize: Typography.size.xs, color: Colors.text.muted },
  statusBadge: { paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderRadius: Radius.sm },
  statusVerified: { backgroundColor: Colors.green[900] },
  statusPending: { backgroundColor: Colors.gold[100] },
  statusUnavailable: { backgroundColor: Colors.surface.overlay },
  statusText: { fontSize: Typography.size.xs, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  description: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.surface.border },
  categoryLabel: { fontSize: Typography.size.xs, color: Colors.text.muted, fontStyle: 'italic' },
  openBtn: { flexDirection: 'row', gap: Spacing[2], paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], backgroundColor: Colors.green[700], borderRadius: Radius.md, minHeight: 36, alignItems: 'center' },
  openText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
  errorText: { color: Colors.red[300], fontSize: Typography.size.sm },
  emptyState: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', maxWidth: 320 },
});

export default ResourcesScreen;

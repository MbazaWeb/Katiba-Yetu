import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../utils';
import type { Section } from '../types';

export function ContributionsScreen({ onSectionPress }: { onSectionPress: (section: Section) => void }) {
  const { language } = useAppContext();
  return <View style={styles.root}>
    <AppHeader title={t('Michango', 'Contributions', language)} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{t('Shiriki katika mjadala', 'Join the discussion', language)}</Text>
      <Text style={styles.description}>{t('Wasilisha mapendekezo yako kupitia menyu ya "Wasilisha Pendekezo". Mapendekezo yaliyoidhinishwa yataonekana hapa.', 'Submit your proposals via the "Submit Proposal" menu. Approved proposals will appear here.', language)}</Text>
      <View style={styles.emptyState}>
        <Ionicons name="documents-outline" size={48} color={Colors.text.muted} />
        <Text style={styles.emptyText}>{t('Hakuna mapendekezo yaliyoonyeshwa bado.', 'No proposals to display yet.', language)}</Text>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 32, gap: 16 },
  title: { color: Colors.text.primary, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold },
  description: { color: Colors.text.secondary, fontSize: Typography.size.lg, marginBottom: 12 },
  emptyState: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },
});

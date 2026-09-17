import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AppHeader } from '../components/sections/AppHeader';
import { ArticleCard } from '../components/sections/ArticleCard';
import { TRENDING } from '../constants/mockData';
import { useAppContext } from '../hooks/useAppContext';
import { Colors } from '../constants/tokens';
import { t } from '../utils';
import type { Section } from '../types';

export function ContributionsScreen({ onSectionPress }: { onSectionPress: (section: Section) => void }) {
  const { language } = useAppContext();
  return <View style={styles.root}>
    <AppHeader title={t('Michango', 'Contributions', language)} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{t('Shiriki katika mjadala', 'Join the discussion', language)}</Text>
      <Text style={styles.description}>{t('Chagua ibara ili kusoma maoni na kutoa mchango wako.', 'Choose an article to read discussions and add your contribution.', language)}</Text>
      {TRENDING.map(({ section }) => <ArticleCard key={section.id} section={section} onPress={onSectionPress} />)}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 32, gap: 16 },
  title: { color: Colors.text.primary, fontSize: 32, fontWeight: '700' },
  description: { color: Colors.text.secondary, fontSize: 17, marginBottom: 12 },
});

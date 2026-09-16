import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { MOCK_SECTIONS } from '../constants/mockData';
import { Colors, Radius, Spacing, Typography } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../utils';
import type { Section } from '../types';

interface SearchScreenProps {
  onSectionPress: (section: Section) => void;
}

const ALL_ARTICLES = MOCK_SECTIONS.flatMap(chapter => chapter.children ?? []);
const SUGGESTIONS = ['Haki za msingi', 'Uhuru wa maoni', 'Muungano', 'Mali'];

export function SearchScreen({ onSectionPress }: SearchScreenProps) {
  const { language } = useAppContext();
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (normalized.length < 2) return [];
    return ALL_ARTICLES.filter(article =>
      article.article_number.toLowerCase().includes(normalized) ||
      article.title_sw.toLowerCase().includes(normalized) ||
      article.title_en.toLowerCase().includes(normalized) ||
      article.body_sw.toLowerCase().includes(normalized) ||
      article.body_en.toLowerCase().includes(normalized),
    );
  }, [normalized]);

  return (
    <View style={styles.root}>
      <AppHeader title={t('Tafuta', 'Search', language)} variant="browser" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {t('Unatafuta nini?', 'What are you looking for?', language)}
        </Text>
        <Text style={styles.subtitle}>
          {t(
            'Tafuta ibara, haki, mada au neno ndani ya Katiba.',
            'Search articles, rights, topics or words in the Constitution.',
            language,
          )}
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.green[300]} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('Mfano: Ibara 19 au uhuru...', 'Example: Article 19 or freedom...', language)}
            placeholderTextColor={Colors.text.muted}
            style={styles.input}
            returnKeyType="search"
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={Colors.text.muted} />
            </Pressable>
          )}
        </View>

        {!normalized && (
          <>
            <Text style={styles.label}>{t('MADA MAARUFU', 'POPULAR TOPICS', language)}</Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map(item => (
                <Pressable key={item} onPress={() => setQuery(item)} style={styles.chip}>
                  <Ionicons name="trending-up" size={15} color={Colors.gold[300]} />
                  <Text style={styles.chipText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {normalized.length === 1 && (
          <Text style={styles.helper}>
            {t('Andika angalau herufi mbili.', 'Enter at least two characters.', language)}
          </Text>
        )}

        {normalized.length >= 2 && (
          <>
            <Text style={styles.label}>
              {results.length} {t('MATOKEO', 'RESULTS', language)}
            </Text>
            {results.length ? (
              results.map(article => (
                <Pressable
                  key={article.id}
                  onPress={() => onSectionPress(article)}
                  style={({ pressed }) => [styles.result, pressed && styles.pressed]}
                >
                  <View style={styles.number}>
                    <Text style={styles.numberText}>{article.article_number}</Text>
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>
                      {t(article.title_sw, article.title_en, language)}
                    </Text>
                    <Text style={styles.resultBody} numberOfLines={2}>
                      {t(article.body_sw, article.body_en, language)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </Pressable>
              ))
            ) : (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={34} color={Colors.text.muted} />
                <Text style={styles.emptyTitle}>
                  {t('Hakuna matokeo', 'No results found', language)}
                </Text>
                <Text style={styles.helper}>
                  {t('Jaribu neno tofauti au namba ya ibara.', 'Try another term or article number.', language)}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[20],
  },
  title: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginTop: Spacing[3],
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    lineHeight: 21,
    marginTop: Spacing[2],
    marginBottom: Spacing[5],
  },
  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.green[700],
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    paddingVertical: Spacing[3],
  },
  label: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
    color: Colors.text.muted,
    marginTop: Spacing[6],
    marginBottom: Spacing[3],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2.5],
    borderRadius: Radius.full,
    backgroundColor: Colors.surface.raised,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  chipText: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
  },
  result: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface.raised,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  pressed: {
    backgroundColor: Colors.surface.overlay,
  },
  number: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green[900],
    borderWidth: 1,
    borderColor: Colors.green[700],
  },
  numberText: {
    fontFamily: Typography.family.mono,
    color: Colors.green[300],
    fontWeight: Typography.weight.bold,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: Colors.text.primary,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.base,
    marginBottom: 4,
  },
  resultBody: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    lineHeight: 17,
  },
  helper: {
    color: Colors.text.muted,
    textAlign: 'center',
    fontSize: Typography.size.sm,
    marginTop: Spacing[5],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing[12],
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing[3],
  },
});
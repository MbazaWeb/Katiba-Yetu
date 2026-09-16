import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { AppHeader } from '../components/sections/AppHeader';
import { ChapterRow } from '../components/sections/ChapterRow';
import { Badge } from '../components/ui/Badge';
import { MOCK_SECTIONS } from '../constants/mockData';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../utils';
import type { Section } from '../types';

interface BrowserScreenProps {
  onSectionPress: (section: Section) => void;
  onBack: () => void;
}

type DocTab = 'union' | 'zanzibar';

const DOC_TABS: { key: DocTab; label_sw: string; label_en: string; accent: string }[] = [
  { key: 'union',    label_sw: 'Muungano 1977', label_en: 'Union 1977',    accent: Colors.green[500] },
  { key: 'zanzibar', label_sw: 'Zanzibar 1984', label_en: 'Zanzibar 1984', accent: Colors.blue[400]  },
];

const DOC_META: Record<DocTab, { title_sw: string; title_en: string; meta_sw: string; meta_en: string }> = {
  union: {
    title_sw: 'Katiba ya Jamhuri ya Muungano wa Tanzania, 1977',
    title_en: 'Constitution of the United Republic of Tanzania, 1977',
    meta_sw: 'Ibara 152 · Sura 8',
    meta_en: 'Articles 152 · Chapters 8',
  },
  zanzibar: {
    title_sw: 'Katiba ya Zanzibar, 1984',
    title_en: 'Constitution of Zanzibar, 1984',
    meta_sw: 'Ibara 132 · Sura 10',
    meta_en: 'Articles 132 · Chapters 10',
  },
};

export function BrowserScreen({ onSectionPress, onBack }: BrowserScreenProps) {
  const { language } = useAppContext();
  const [activeDoc, setActiveDoc] = useState<DocTab>('union');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return MOCK_SECTIONS;
    const q = query.toLowerCase();
    return MOCK_SECTIONS.filter(ch => {
      if (ch.title_sw.toLowerCase().includes(q) || ch.title_en.toLowerCase().includes(q)) {
        return true;
      }
      return ch.children?.some(c =>
        c.title_sw.toLowerCase().includes(q) ||
        c.title_en.toLowerCase().includes(q) ||
        c.body_sw.toLowerCase().includes(q) ||
        c.body_en.toLowerCase().includes(q),
      );
    });
  }, [query]);

  const activeMeta = DOC_META[activeDoc];
  const docTitle = language === 'sw' ? activeMeta.title_sw : activeMeta.title_en;
  const docMeta = language === 'sw' ? activeMeta.meta_sw : activeMeta.meta_en;
  const activeAccent = DOC_TABS.find(tab => tab.key === activeDoc)?.accent ?? Colors.green[500];

  return (
    <View style={styles.root}>
      <AppHeader
        variant="browser"
        showBack
        onBack={onBack}
        title={t('Kivinjari cha Katiba', 'Constitution Browser', language)}
      />

      <View style={styles.docTabs}>
        {DOC_TABS.map(tab => {
          const active = activeDoc === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveDoc(tab.key)}
              style={({ pressed }) => [
                styles.docTab,
                active && { borderBottomColor: tab.accent, borderBottomWidth: 2 },
                pressed && styles.docTabPressed,
              ]}
            >
              <Text style={[styles.docTabText, active && { color: tab.accent, fontWeight: Typography.weight.semibold }]}>
                {language === 'sw' ? tab.label_sw : tab.label_en}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('Tafuta ibara au neno...', 'Search articles or terms...', language)}
            placeholderTextColor={Colors.text.muted}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View style={styles.docHeader}>
        <View style={[styles.docColorBar, { backgroundColor: activeAccent }]} />
        <View style={styles.docHeaderText}>
          <Text style={styles.docTitle}>{docTitle}</Text>
          <Text style={styles.docMeta}>{docMeta}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeDoc === 'union' ? (
          filtered.length === 0 ? (
            <EmptySearch lang={language} />
          ) : (
            filtered.map((chapter, idx) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                onArticlePress={onSectionPress}
                defaultOpen={idx === 1}
              />
            ))
          )
        ) : (
          <ZanzibarPlaceholder language={language} />
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

function EmptySearch({ lang }: { lang: 'sw' | 'en' }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={36} color={Colors.text.muted} />
      <Text style={styles.emptyTitle}>
        {lang === 'sw' ? 'Hakuna matokeo' : 'No results'}
      </Text>
      <Text style={styles.emptyBody}>
        {lang === 'sw'
          ? 'Jaribu maneno mengine au angalia sura moja kwa moja.'
          : 'Try different words or browse chapters directly.'}
      </Text>
    </View>
  );
}

function ZanzibarPlaceholder({ language }: { language: 'sw' | 'en' }) {
  return (
    <View style={styles.znzPlaceholder}>
      <View style={styles.znzIcon}>
        <Ionicons name="map-outline" size={30} color={Colors.blue[300]} />
      </View>
      <Text style={styles.znzTitle}>
        {language === 'sw' ? 'Katiba ya Zanzibar, 1984' : 'Constitution of Zanzibar, 1984'}
      </Text>
      <Text style={styles.znzBody}>
        {language === 'sw'
          ? 'Hati hii inaandaliwa. Itapatikana hivi karibuni.'
          : 'This document is being prepared. Available soon.'}
      </Text>
      <Badge
        label={language === 'sw' ? 'Inakuja hivi karibuni' : 'Coming soon'}
        variant="blue"
        size="md"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  docTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.raised,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  docTab: {
    flex: 1,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  docTabPressed: {
    opacity: 0.7,
  },
  docTabText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  searchWrap: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface.raised,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.overlay,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    padding: 0,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  docColorBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    flexShrink: 0,
  },
  docHeaderText: {
    flex: 1,
  },
  docTitle: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    lineHeight: Typography.size.sm * 1.4,
    color: Colors.text.primary,
  },
  docMeta: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  bottomPad: {
    height: Spacing[16],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing[16],
    gap: Spacing[3],
  },
  emptyTitle: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
  },
  emptyBody: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  znzPlaceholder: {
    alignItems: 'center',
    paddingVertical: Spacing[16],
    gap: Spacing[4],
  },
  znzIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue[900],
  },
  znzTitle: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size['2xl'],
    color: Colors.text.primary,
    textAlign: 'center',
  },
  znzBody: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 260,
  },
});

export default BrowserScreen;
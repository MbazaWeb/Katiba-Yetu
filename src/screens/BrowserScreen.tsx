import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/tokens';
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

export function BrowserScreen({ onSectionPress, onBack }: BrowserScreenProps) {
  const { language } = useAppContext();
  const [activeDoc, setActiveDoc] = useState<DocTab>('union');
  const [query, setQuery] = useState('');

  const filtered = MOCK_SECTIONS.filter(ch => {
    if (!query) return true;
    const q = query.toLowerCase();
    const matchTitle = ch.title_sw.toLowerCase().includes(q) ||
                       ch.title_en.toLowerCase().includes(q);
    const matchChild = ch.children?.some(c =>
      c.title_sw.toLowerCase().includes(q) ||
      c.title_en.toLowerCase().includes(q) ||
      c.body_sw.toLowerCase().includes(q),
    );
    return matchTitle || matchChild;
  });

  return (
    <View style={styles.root}>
      <AppHeader
        variant="browser"
        showBack
        onBack={onBack}
        title={t('Kivinjari cha Katiba', 'Constitution Browser', language)}
      />

      {/* Doc switcher tabs */}
      <View style={styles.docTabs}>
        <DocTabButton
          label={t('Muungano 1977', 'Union 1977', language)}
          active={activeDoc === 'union'}
          accent={Colors.green[500]}
          onPress={() => setActiveDoc('union')}
        />
        <DocTabButton
          label={t('Zanzibar 1984', 'Zanzibar 1984', language)}
          active={activeDoc === 'zanzibar'}
          accent={Colors.blue[400]}
          onPress={() => setActiveDoc('zanzibar')}
        />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
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

      {/* Doc header */}
      <View style={styles.docHeader}>
        <View style={[styles.docColorBar, { backgroundColor: activeDoc === 'union' ? Colors.green[500] : Colors.blue[400] }]} />
        <View>
          <Text style={styles.docTitle}>
            {activeDoc === 'union'
              ? t('Katiba ya Jamhuri ya Muungano wa Tanzania, 1977', 'Constitution of the United Republic of Tanzania, 1977', language)
              : t('Katiba ya Zanzibar, 1984', 'Constitution of Zanzibar, 1984', language)
            }
          </Text>
          <Text style={styles.docMeta}>
            {activeDoc === 'union'
              ? t('Ibara 152 · Sura 8', 'Articles 152 · Chapters 8', language)
              : t('Ibara 132 · Sura 10', 'Articles 132 · Chapters 10', language)
            }
          </Text>
        </View>
        <Pressable style={styles.downloadBtn}>
          <Text style={styles.downloadIcon}>↓</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeDoc === 'union' ? (
          <>
            {filtered.length === 0 ? (
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
            )}
          </>
        ) : (
          <ZanzibarPlaceholder language={language} />
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocTabButton({
  label, active, accent, onPress,
}: { label: string; active: boolean; accent: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.docTab,
        active && { borderBottomColor: accent, borderBottomWidth: 2 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.docTabText, active && { color: accent, fontWeight: Typography.weight.semibold }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptySearch({ lang }: { lang: 'sw' | 'en' }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>
        {lang === 'sw' ? 'Hakuna matokeo' : 'No results'}
      </Text>
      <Text style={styles.emptyBody}>
        {lang === 'sw'
          ? 'Jaribu maneno mengine au angalia sura moja kwa moja.'
          : 'Try different words or browse chapters directly.'
        }
      </Text>
    </View>
  );
}

function ZanzibarPlaceholder({ language }: { language: 'sw' | 'en' }) {
  return (
    <View style={styles.znzPlaceholder}>
      <View style={[styles.znzIcon, { backgroundColor: Colors.blue[900] }]}>
        <Text style={{ fontSize: 28 }}>🏝</Text>
      </View>
      <Text style={styles.znzTitle}>
        {language === 'sw' ? 'Katiba ya Zanzibar, 1984' : 'Constitution of Zanzibar, 1984'}
      </Text>
      <Text style={styles.znzBody}>
        {language === 'sw'
          ? 'Hati hii inaandaliwa. Itapatikana hivi karibuni.'
          : 'This document is being prepared. Available soon.'
        }
      </Text>
      <Badge label={language === 'sw' ? 'Inakuja hivi karibuni' : 'Coming soon'} variant="blue" size="md" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  // Doc tabs
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
  docTabText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  // Search
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
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    padding: 0,
  },
  // Doc header
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
  docTitle: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: Typography.size.sm * 1.4,
  },
  docMeta: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    flexShrink: 0,
  },
  downloadIcon: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing[4],
  },
  bottomPad: { height: Spacing[16] },
  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing[16],
    gap: Spacing[3],
  },
  emptyIcon: { fontSize: 36 },
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
  // Zanzibar placeholder
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

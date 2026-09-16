import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/tokens';
import { Badge, StatChip } from '../ui/Badge';
import { ArticleCard } from './ArticleCard';
import type { Section } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';
import { t } from '../../utils';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface ChapterRowProps {
  chapter: Section;
  onArticlePress: (section: Section) => void;
  defaultOpen?: boolean;
}

const CHAPTER_ICON_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  default:  { bg: Colors.green[800], text: Colors.green[200], border: Colors.green[600] },
  hot:      { bg: '#2A1A0A',         text: '#F0997B',         border: '#553A20'         },
  muungano: { bg: Colors.gold[800],  text: Colors.gold[200],  border: Colors.gold[600]  },
  rights:   { bg: '#1A0A2A',         text: '#C0A0E8',         border: '#3A2040'         },
};

function getIconColor(chapter: Section) {
  if (chapter.is_muungano) return CHAPTER_ICON_COLORS.muungano;
  if (chapter.meta?.is_hot) return CHAPTER_ICON_COLORS.hot;
  if (chapter.article_number === 'Sura 3') return CHAPTER_ICON_COLORS.rights;
  return CHAPTER_ICON_COLORS.default;
}

export function ChapterRow({ chapter, onArticlePress, defaultOpen = false }: ChapterRowProps) {
  const { language } = useAppContext();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const title   = t(chapter.title_sw,   chapter.title_en,   language);
  const iconColors = getIconColor(chapter);
  const meta = chapter.meta;
  const hasChildren = (chapter.children?.length ?? 0) > 0;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(prev => !prev);
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.wrapper, chapter.is_muungano && styles.wrapperMuungano]}>
      {/* Chapter header row */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${title} — ${isOpen ? 'Funga' : 'Fungua'}`}
      >
        {/* Chapter icon / number */}
        <View style={[styles.iconBadge, { backgroundColor: iconColors.bg, borderColor: iconColors.border }]}>
          <Text style={[styles.iconText, { color: iconColors.text }]}>
            {chapter.is_muungano ? 'MUU' : chapter.article_number.split(' ').slice(-1)[0]}
          </Text>
        </View>

        {/* Title + subtitle */}
        <View style={styles.titleBlock}>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            {meta?.is_hot && (
              <Badge label={t('Moto sana', 'Trending', language)} variant="hot" size="sm" />
            )}
            {chapter.is_muungano && (
              <Badge label="Moderated" variant="muungano" size="sm" />
            )}
            {(meta?.discussion_count ?? 0) > 0 && (
              <StatChip icon="💬" count={meta!.discussion_count} />
            )}
            {meta?.has_active_poll && (
              <StatChip icon="🗳" count={t('Kura', 'Poll', language)} />
            )}
          </View>
        </View>

        {/* Chevron */}
        {hasChildren && (
          <Animated.Text style={[styles.chevron, { transform: [{ rotate }] }]}>
            ⌄
          </Animated.Text>
        )}
      </Pressable>

      {/* Children — articles */}
      {isOpen && hasChildren && (
        <View style={styles.children}>
          {chapter.children!.map((article, idx) => (
            <ArticleCard
              key={article.id}
              section={article}
              onPress={onArticlePress}
              showPollBadge
              style={[
                styles.childCard,
                idx === chapter.children!.length - 1 && styles.lastChild,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    marginBottom: Spacing[3],
    overflow: 'hidden',
    ...Shadow.sm,
  },
  wrapperMuungano: {
    borderColor: Colors.gold[700],
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  headerPressed: {
    backgroundColor: Colors.surface.overlay,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    flexShrink: 0,
  },
  iconText: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.tight,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing[1.5],
  },
  chapterTitle: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chevron: {
    fontSize: 20,
    color: Colors.text.muted,
    flexShrink: 0,
  },
  children: {
    paddingHorizontal: Spacing[3],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surface.border,
    paddingTop: Spacing[3],
  },
  childCard: {
    borderRadius: Radius.lg,
  },
  lastChild: {},
});

export default ChapterRow;

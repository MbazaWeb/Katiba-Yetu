import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/tokens';
import { Badge, StatChip } from '../ui/Badge';
import type { Section } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';
import { truncate, t } from '../../utils';

interface ArticleCardProps {
  section: Section;
  onPress: (section: Section) => void;
  showPollBadge?: boolean;
  style?: object;
}

export function ArticleCard({ section, onPress, showPollBadge = false, style }: ArticleCardProps) {
  const { language } = useAppContext();
  const meta = section.meta;

  const title   = t(section.title_sw,   section.title_en,   language);
  const body    = t(section.body_sw,    section.body_en,    language);
  const artNum  = section.article_number;
  const isHot   = meta?.is_hot ?? false;
  const hasActivePoll = meta?.has_active_poll ?? false;
  const isMuungano = section.is_muungano;

  return (
    <Pressable
      onPress={() => onPress(section)}
      style={({ pressed }) => [
        styles.card,
        isMuungano && styles.cardMuungano,
        pressed && styles.cardPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${language === 'sw' ? 'Ibara' : 'Article'} ${artNum}: ${title}`}
    >
      {/* Left — article number badge */}
      <View style={[styles.numBadge, isMuungano && styles.numBadgeMuungano]}>
        <Text style={styles.numLabel}>{language === 'sw' ? 'Ibara' : 'Art.'}</Text>
        <Text style={styles.numValue}>{artNum}</Text>
      </View>

      {/* Right — content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.excerpt} numberOfLines={2}>
            {truncate(body, 100)}
          </Text>
        ) : null}

        {/* Chips row */}
        <View style={styles.chips}>
          {isHot && (
            <Badge label={language === 'sw' ? 'Moto sana' : 'Trending'} variant="hot" size="sm" />
          )}
          {isMuungano && (
            <Badge label="Muungano" variant="muungano" size="sm" />
          )}
          {hasActivePoll && showPollBadge && (
            <Badge label={language === 'sw' ? 'Kura' : 'Poll'} variant="poll" size="sm" />
          )}
          {(meta?.discussion_count ?? 0) > 0 && (
            <StatChip
              icon="💬"
              count={meta!.discussion_count}
              color={Colors.text.muted}
            />
          )}
          {(meta?.suggestion_count ?? 0) > 0 && (
            <StatChip
              icon="✏️"
              count={meta!.suggestion_count}
              color={Colors.text.muted}
            />
          )}
        </View>
      </View>

      {/* Arrow */}
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  cardMuungano: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold[400],
    backgroundColor: Colors.surface.raised,
  },
  cardPressed: {
    opacity: 0.80,
    transform: [{ scale: 0.99 }],
  },
  numBadge: {
    backgroundColor: Colors.green[700],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    alignItems: 'center',
    minWidth: 52,
    flexShrink: 0,
    borderWidth: 0.5,
    borderColor: Colors.green[500],
  },
  numBadgeMuungano: {
    backgroundColor: Colors.gold[800],
    borderColor: Colors.gold[500],
  },
  numLabel: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs - 1,
    color: Colors.green[300],
    fontWeight: Typography.weight.medium,
    marginBottom: 2,
  },
  numValue: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    lineHeight: Typography.size.lg * 1.1,
  },
  content: {
    flex: 1,
    gap: Spacing[1.5],
  },
  title: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
    lineHeight: Typography.size.md * 1.35,
  },
  excerpt: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * 1.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1.5],
    marginTop: Spacing[1],
  },
  arrow: {
    fontSize: 22,
    color: Colors.text.muted,
    marginTop: 2,
    flexShrink: 0,
  },
});

export default ArticleCard;

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/tokens';
import { PollBar } from '../ui/PollBar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Poll } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';
import { formatCount, formatPollDeadline, t } from '../../utils';

interface FeaturedPollCardProps {
  poll: Poll;
  onVotePress: (poll: Poll) => void;
  onViewResults?: (poll: Poll) => void;
}

export function FeaturedPollCard({ poll, onVotePress, onViewResults }: FeaturedPollCardProps) {
  const { language } = useAppContext();

  const title = t(poll.title_sw, poll.title_en, language);
  const deadline = formatPollDeadline(poll.closes_at, language);
  const voteLabel = t('Wapiga kura', 'voters', language);
  const totalLabel = formatCount(poll.total_votes, language);

  const isOpen = poll.status === 'open';
  const hasVoted = !!poll.user_voted;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Badge
          label={t('Kura inayoendelea', 'Active poll', language)}
          variant="green"
          size="sm"
        />
        {poll.class === 'official' && (
          <Badge label={t('Rasmi', 'Official', language)} variant="gold" size="sm" />
        )}
      </View>

      {/* Question */}
      <Text style={styles.question}>{title}</Text>

      {/* Gold divider */}
      <View style={styles.divider} />

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map(option => (
          <PollBar
            key={option.id}
            option={option}
            showResults={hasVoted}
            isSelected={poll.user_voted === option.id}
            onSelect={() => !hasVoted && onVotePress(poll)}
            lang={language}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {totalLabel} {voteLabel}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{deadline}</Text>
        </View>

        {!hasVoted && isOpen ? (
          <Button
            variant="primary"
            size="sm"
            label={t('Piga kura', 'Vote now', language)}
            onPress={() => onVotePress(poll)}
          />
        ) : (
          <Pressable onPress={() => onViewResults?.(poll)}>
            <Text style={styles.resultsLink}>
              {t('Ona matokeo →', 'See results →', language)}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.surface.border,
    padding: Spacing[5],
    gap: Spacing[3],
    ...Shadow.md,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  question: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.regular,
    color: Colors.text.primary,
    lineHeight: Typography.size.lg * 1.4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gold[800],
  },
  options: {
    gap: Spacing[1],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[1],
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing[1.5],
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  metaDot: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
  },
  resultsLink: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.green[400],
    fontWeight: Typography.weight.medium,
  },
});

export default FeaturedPollCard;

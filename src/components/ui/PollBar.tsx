import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import type { PollOption } from '../../types';

interface PollBarProps {
  option: PollOption;
  isSelected?: boolean;
  showResults?: boolean;
  onSelect?: (id: string) => void;
  barColor?: string;
  lang?: 'sw' | 'en';
}

export function PollBar({
  option,
  isSelected = false,
  showResults = false,
  onSelect,
  barColor = Colors.green[500],
  lang = 'sw',
}: PollBarProps) {
  const [fillAnim] = useState(() => new Animated.Value(0));
  const pct = option.percentage ?? 0;
  const label = lang === 'sw' ? option.label_sw : option.label_en;

  useEffect(() => {
    if (showResults) {
      Animated.timing(fillAnim, {
        toValue: pct / 100,
        duration: 600,
        delay: option.order_index * 80,
        useNativeDriver: false,
      }).start();
    }
  }, [showResults, pct, fillAnim, option.order_index]);

  return (
    <Pressable
      onPress={() => onSelect?.(option.id)}
      style={({ pressed }) => [
        styles.row,
        isSelected && styles.rowSelected,
        pressed && !showResults && styles.rowPressed,
      ]}
      disabled={showResults}
    >
      {/* Selection indicator */}
      <View style={[styles.dot, isSelected && styles.dotSelected]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.label,
              isSelected && { color: Colors.green[300] },
              showResults && pct >= 40 && { color: Colors.text.primary },
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
          {showResults && (
            <Text style={[styles.pct, isSelected && { color: Colors.green[300] }]}>
              {Math.round(pct)}%
            </Text>
          )}
        </View>

        {showResults && (
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: isSelected ? Colors.green[400] : barColor,
                  width: fillAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}

        {showResults && option.vote_count !== undefined && (
          <Text style={styles.voteCount}>
            {option.vote_count.toLocaleString()} {lang === 'sw' ? 'kura' : 'votes'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing[2.5],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
    marginBottom: Spacing[2],
    backgroundColor: Colors.surface.raised,
  },
  rowSelected: {
    borderColor: Colors.green[500],
    backgroundColor: Colors.green[900] + '66',
  },
  rowPressed: {
    opacity: 0.75,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.surface.borderStrong,
    marginRight: Spacing[2.5],
    marginTop: 2,
    flexShrink: 0,
  },
  dotSelected: {
    borderColor: Colors.green[500],
    backgroundColor: Colors.green[500],
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[1.5],
  },
  label: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.regular,
    color: Colors.text.secondary,
    flex: 1,
    marginRight: Spacing[2],
    lineHeight: Typography.size.base * 1.4,
  },
  pct: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  track: {
    height: 4,
    backgroundColor: Colors.surface.overlay,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing[1],
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  voteCount: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
});

export default PollBar;

import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/tokens';

type CardVariant = 'default' | 'green' | 'gold' | 'blue' | 'muungano' | 'flat';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  padded?: boolean;
  noBorder?: boolean;
}

const accentColors: Record<CardVariant, string | undefined> = {
  default:  undefined,
  green:    Colors.green[500],
  gold:     Colors.gold[400],
  blue:     Colors.blue[400],
  muungano: Colors.gold[400],
  flat:     undefined,
};

export function Card({
  variant = 'default',
  children,
  onPress,
  style,
  innerStyle,
  padded = true,
  noBorder = false,
}: CardProps) {
  const accent = accentColors[variant];
  const isFlat = variant === 'flat';

  const containerStyle: ViewStyle = {
    backgroundColor: isFlat ? 'transparent' : Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: noBorder ? 0 : 1,
    borderColor: accent ?? Colors.surface.border,
    ...(accent && !isFlat ? { borderLeftWidth: 3, borderLeftColor: accent } : {}),
    ...(!isFlat ? Shadow.sm : {}),
    overflow: 'hidden',
  };

  const inner: ViewStyle = {
    padding: padded ? Spacing[4] : 0,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && { opacity: 0.85 },
          style,
        ]}
      >
        <View style={[inner, innerStyle]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View style={[inner, innerStyle]}>{children}</View>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

interface DividerProps {
  color?: string;
  style?: ViewStyle;
}

export function Divider({ color, style }: DividerProps) {
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: color ?? Colors.surface.border,
        },
        style,
      ]}
    />
  );
}

// ─── Section Row (for lists inside cards) ────────────────────────────────────

interface RowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showBorder?: boolean;
}

export function CardRow({ children, style, showBorder = true }: RowProps) {
  return (
    <View
      style={[
        {
          paddingVertical: Spacing[3],
          borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: Colors.surface.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Card;

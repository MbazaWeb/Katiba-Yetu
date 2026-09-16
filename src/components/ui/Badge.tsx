import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';

type BadgeVariant =
  | 'green'
  | 'gold'
  | 'blue'
  | 'red'
  | 'gray'
  | 'hot'
  | 'muungano'
  | 'tls'
  | 'verified'
  | 'nida'
  | 'poll'
  | 'locked';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  green:    { bg: Colors.green[900],  text: Colors.green[300] },
  gold:     { bg: Colors.gold[900],   text: Colors.gold[300]  },
  blue:     { bg: Colors.blue[900],   text: Colors.blue[300]  },
  red:      { bg: '#3A1111',          text: '#F09595'         },
  gray:     { bg: Colors.surface.overlay, text: Colors.text.secondary },
  hot:      { bg: '#3A1A0A',          text: '#F0997B'         },
  muungano: { bg: Colors.gold[900],   text: Colors.gold[200], border: Colors.gold[700] },
  tls:      { bg: Colors.blue[900],   text: Colors.blue[200], border: Colors.blue[700] },
  verified: { bg: Colors.green[900],  text: Colors.green[200], border: Colors.green[700] },
  nida:     { bg: Colors.green[800],  text: Colors.green[100], border: Colors.green[500] },
  poll:     { bg: Colors.blue[900],   text: Colors.blue[300]  },
  locked:   { bg: Colors.surface.overlay, text: Colors.text.muted, border: Colors.surface.borderStrong },
};

const sizeConfig: Record<BadgeSize, { px: number; py: number; fontSize: number; radius: number }> = {
  sm: { px: Spacing[1.5], py: Spacing[0.5], fontSize: Typography.size.xs, radius: Radius.sm },
  md: { px: Spacing[2],   py: Spacing[1],   fontSize: Typography.size.sm, radius: Radius.md },
};

export function Badge({ label, variant = 'green', size = 'sm', icon, style }: BadgeProps) {
  const vc = variantColors[variant];
  const sc = sizeConfig[size];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: vc.bg,
          paddingHorizontal: sc.px,
          paddingVertical: sc.py,
          borderRadius: sc.radius,
          borderWidth: vc.border ? 0.5 : 0,
          borderColor: vc.border ?? 'transparent',
        },
        style,
      ]}
    >
      {icon && (
        <Text style={{ fontSize: sc.fontSize, marginRight: 3, color: vc.text }}>
          {icon}
        </Text>
      )}
      <Text
        style={{
          fontFamily: Typography.family.sans,
          fontSize: sc.fontSize,
          fontWeight: Typography.weight.medium,
          color: vc.text,
          letterSpacing: Typography.letterSpacing.normal,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Stat Chip — icon + number ────────────────────────────────────────────────

interface StatChipProps {
  icon: React.ReactNode;
  count: number | string;
  color?: string;
  style?: ViewStyle;
}

export function StatChip({ icon, count, color = Colors.text.muted, style }: StatChipProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}>
      {icon}
      <Text
        style={{
          fontFamily: Typography.family.sans,
          fontSize: Typography.size.sm,
          color,
          fontWeight: Typography.weight.medium,
        }}
      >
        {count}
      </Text>
    </View>
  );
}

// ─── Verification Dot ──────────────────────────────────────────────────────────

interface VerifDotProps {
  tier: 'none' | 'email' | 'phone' | 'nida';
}

const dotColors: Record<string, string> = {
  none:  Colors.text.muted,
  email: Colors.blue[400],
  phone: Colors.gold[400],
  nida:  Colors.green[400],
};

export function VerifDot({ tier }: VerifDotProps) {
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderRadius: Radius.full,
        backgroundColor: dotColors[tier] ?? Colors.text.muted,
        marginLeft: 4,
      }}
    />
  );
}

export default Badge;

import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';
import { scaledSize } from '../../utils';

type TextVariant =
  | 'display'      // 34px serif — article titles
  | 'heading1'     // 28px sans medium
  | 'heading2'     // 22px sans medium
  | 'heading3'     // 18px sans medium
  | 'heading4'     // 16px sans medium
  | 'body'         // 15px serif — article body
  | 'bodySerif'    // 15px serif relaxed
  | 'ui'           // 14px sans — UI labels
  | 'caption'      // 12px sans — metadata
  | 'micro'        // 11px sans — badges, chips
  | 'label'        // 13px sans medium — form labels
  | 'articleNum'   // 20px mono — article numbers
  ;

interface KatibaTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  selectable?: boolean;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.regular,
    lineHeight: Typography.size['4xl'] * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tight,
    color: Colors.text.primary,
  },
  heading1: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.semibold,
    lineHeight: Typography.size['3xl'] * Typography.lineHeight.snug,
    color: Colors.text.primary,
  },
  heading2: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.semibold,
    lineHeight: Typography.size['2xl'] * Typography.lineHeight.snug,
    color: Colors.text.primary,
  },
  heading3: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.medium,
    lineHeight: Typography.size.xl * Typography.lineHeight.snug,
    color: Colors.text.primary,
  },
  heading4: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium,
    lineHeight: Typography.size.lg * Typography.lineHeight.normal,
    color: Colors.text.primary,
  },
  body: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.regular,
    lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
    color: Colors.text.primary,
  },
  bodySerif: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.regular,
    lineHeight: Typography.size.md * Typography.lineHeight.loose,
    color: Colors.text.primary,
  },
  ui: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.regular,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
    color: Colors.text.primary,
  },
  caption: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.regular,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
    color: Colors.text.secondary,
  },
  micro: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    lineHeight: Typography.size.xs * Typography.lineHeight.normal,
    color: Colors.text.secondary,
  },
  label: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base - 1,
    fontWeight: Typography.weight.medium,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
    color: Colors.text.primary,
  },
  articleNum: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.tight,
    color: Colors.green[400],
  },
};

export function KatibaText({
  variant = 'body',
  color,
  align = 'left',
  numberOfLines,
  style,
  children,
  selectable = false,
}: KatibaTextProps) {
  const { fontSize } = useAppContext();

  const base = variantStyles[variant];
  const scaledFontSize = base.fontSize ? scaledSize(base.fontSize as number, fontSize) : undefined;

  return (
    <RNText
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        base,
        scaledFontSize ? { fontSize: scaledFontSize } : undefined,
        color ? { color } : undefined,
        align !== 'left' ? { textAlign: align } : undefined,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export default KatibaText;

import React from 'react';
import {
  Pressable, View, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, PressableProps,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'blue' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantConfig: Record<ButtonVariant, { bg: string; text: string; border?: string; pressedBg: string }> = {
  primary: {
    bg: Colors.green[500],
    text: Colors.text.onGreen,
    pressedBg: Colors.green[600],
  },
  secondary: {
    bg: Colors.surface.raised,
    text: Colors.text.primary,
    border: Colors.surface.borderStrong,
    pressedBg: Colors.surface.overlay,
  },
  ghost: {
    bg: 'transparent',
    text: Colors.text.secondary,
    pressedBg: Colors.surface.raised,
  },
  gold: {
    bg: Colors.gold[400],
    text: Colors.text.onGold,
    pressedBg: Colors.gold[500],
  },
  blue: {
    bg: Colors.blue[400],
    text: Colors.text.onBlue,
    pressedBg: Colors.blue[500],
  },
  danger: {
    bg: Colors.status.danger,
    text: '#FFFFFF',
    pressedBg: '#B03030',
  },
  outline: {
    bg: 'transparent',
    text: Colors.green[400],
    border: Colors.green[500],
    pressedBg: Colors.green[900],
  },
};

const sizeConfig: Record<ButtonSize, { px: number; py: number; fontSize: number; radius: number }> = {
  sm: { px: Spacing[3], py: Spacing[1.5], fontSize: Typography.size.sm,  radius: Radius.md },
  md: { px: Spacing[4], py: Spacing[2.5], fontSize: Typography.size.base, radius: Radius.lg },
  lg: { px: Spacing[6], py: Spacing[3],   fontSize: Typography.size.md,  radius: Radius.xl },
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...rest
}: ButtonProps) {
  const vc = variantConfig[variant];
  const sc = sizeConfig[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? vc.pressedBg : vc.bg,
          paddingHorizontal: sc.px,
          paddingVertical: sc.py,
          borderRadius: sc.radius,
          borderWidth: vc.border ? 0.5 : 0,
          borderColor: vc.border ?? 'transparent',
          opacity: isDisabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          ...(variant === 'primary' ? Shadow.glow : {}),
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vc.text} />
      ) : (
        <View style={styles.inner}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            style={[
              styles.label,
              { color: vc.text, fontSize: sc.fontSize },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Typography.family.sans,
    fontWeight: Typography.weight.medium,
    letterSpacing: Typography.letterSpacing.wide,
  },
  iconLeft: {
    marginRight: Spacing[1.5],
  },
  iconRight: {
    marginLeft: Spacing[1.5],
  },
});

export default Button;

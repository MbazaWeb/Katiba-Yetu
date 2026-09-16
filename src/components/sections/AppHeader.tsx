import React from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar,
  Platform, SafeAreaView,
} from 'react-native';
import { Colors, Typography, Spacing, Shadow } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';

interface AppHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  variant?: 'home' | 'section' | 'browser';
}

export function AppHeader({
  showBack = false,
  onBack,
  title,
  subtitle,
  rightActions,
  variant = 'home',
}: AppHeaderProps) {
  const { language, setLanguage } = useAppContext();

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.green[600]} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          {/* Left: back button or logo */}
          <View style={styles.left}>
            {showBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="Rudi nyuma"
              >
                <Text style={styles.backIcon}>←</Text>
              </Pressable>
            ) : title ? (
              <Text style={styles.standaloneTitle}>{title}</Text>
            ) : (
              <View>
                <Text style={styles.logoMark}>Katiba Yetu</Text>
                <Text style={styles.logoSub}>Soma · Jadili · Pendekeza · Piga Kura</Text>
              </View>
            )}
          </View>

          {/* Center: title (when back is shown) */}
          {showBack && (title || subtitle) && (
            <View style={styles.center}>
              {title && (
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          {/* Right: language toggle + actions */}
          <View style={styles.right}>
            {/* Language pill */}
            <Pressable
              style={styles.langPill}
              onPress={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${language === 'sw' ? 'English' : 'Kiswahili'}`}
            >
              <Text style={[styles.langText, language === 'sw' && styles.langActive]}>SW</Text>
              <View style={styles.langDivider} />
              <Text style={[styles.langText, language === 'en' && styles.langActive]}>EN</Text>
            </Pressable>

            {rightActions}
          </View>
        </View>
      </SafeAreaView>

      {/* Gold accent line at bottom */}
      <View style={styles.accentLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.green[600],
    ...Shadow.md,
  },
  safe: {
    backgroundColor: Colors.green[600],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 56,
    gap: Spacing[3],
  },
  left: {
    flexShrink: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flexShrink: 0,
  },
  backBtn: {
    padding: Spacing[1],
  },
  backIcon: {
    fontSize: 22,
    color: Colors.text.onGreen,
    fontWeight: Typography.weight.medium,
  },
  logoMark: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    letterSpacing: Typography.letterSpacing.tight,
  },
  logoSub: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.green[200],
    letterSpacing: Typography.letterSpacing.wide,
    marginTop: 1,
  },
  titleText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
  standaloneTitle: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  subtitleText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.green[200],
    marginTop: 1,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
    gap: Spacing[1.5],
  },
  langText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: 'rgba(255,255,255,0.55)',
  },
  langActive: {
    color: '#FFFFFF',
  },
  langDivider: {
    width: 0.5,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  accentLine: {
    height: 2,
    backgroundColor: Colors.gold[400],
  },
});

export default AppHeader;

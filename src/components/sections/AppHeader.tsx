import React from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/tokens';
import { useAppContext } from '../../hooks/useAppContext';

interface AppHeaderProps {
  showBack?: boolean; onBack?: () => void; title?: string; subtitle?: string;
  rightActions?: React.ReactNode; variant?: 'home' | 'section' | 'browser';
}

export function AppHeader({ showBack = false, onBack, title, subtitle, rightActions }: AppHeaderProps) {
  const { language, setLanguage } = useAppContext();
  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface.raised} />
      <SafeAreaView>
        <View style={styles.container}>
          <View style={styles.left}>
            {showBack ? (
              <Pressable onPress={onBack} hitSlop={12} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Rudi nyuma">
                <Ionicons name="arrow-back" size={20} color={Colors.green[700]} />
              </Pressable>
            ) : title ? <Text style={styles.standaloneTitle}>{title}</Text> : (
              <View style={styles.brandLockup}>
                <View style={styles.brandMark}><Text style={styles.brandMarkText}>KY</Text></View>
                <View>
                  <Text style={styles.logoMark}>Katiba Yetu</Text>
                  <Text style={styles.logoSub}>{language === 'sw' ? 'Katiba ni yetu sote' : 'The constitution belongs to us all'}</Text>
                </View>
              </View>
            )}
          </View>
          {showBack && (title || subtitle) ? (
            <View style={styles.center}>
              {title ? <Text style={styles.titleText} numberOfLines={1}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
          ) : <View style={styles.center} />}
          <View style={styles.right}>
            <Pressable style={styles.langPill} onPress={() => setLanguage(language === 'sw' ? 'en' : 'sw')} accessibilityRole="button">
              <Text style={[styles.langText, language === 'sw' && styles.langActive]}>SW</Text>
              <View style={styles.langDivider} />
              <Text style={[styles.langText, language === 'en' && styles.langActive]}>EN</Text>
            </Pressable>
            {rightActions}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surface.raised, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.surface.border },
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[2.5], minHeight: 62, gap: Spacing[3], width: '100%', maxWidth: 960, alignSelf: 'center' },
  left: { flexShrink: 0 }, center: { flex: 1, alignItems: 'center' }, right: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flexShrink: 0 }, pressed: { opacity: 0.65 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.green[50] },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2.5] },
  brandMark: { width: 35, height: 35, borderRadius: 18, backgroundColor: Colors.green[600], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.gold[300] },
  brandMarkText: { color: '#FFFFFF', fontFamily: Typography.family.serif, fontSize: 11, fontWeight: Typography.weight.bold },
  logoMark: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.green[800], letterSpacing: Typography.letterSpacing.tight },
  logoSub: { fontFamily: Typography.family.sans, fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 1 },
  titleText: { fontFamily: Typography.family.sans, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  standaloneTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  subtitleText: { fontFamily: Typography.family.sans, fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 1 },
  langPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.green[50], borderRadius: 20, paddingHorizontal: Spacing[2], paddingVertical: Spacing[1], borderWidth: 1, borderColor: Colors.green[100], gap: Spacing[1.5] },
  langText: { fontFamily: Typography.family.sans, fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: Colors.text.muted }, langActive: { color: Colors.green[700] },
  langDivider: { width: StyleSheet.hairlineWidth, height: 12, backgroundColor: Colors.green[200] },
});

export default AppHeader;

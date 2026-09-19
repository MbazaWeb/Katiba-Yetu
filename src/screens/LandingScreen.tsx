import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import type { Language } from '../types';

interface LandingScreenProps {
  language: Language;
  hasSession: boolean;
  onContinue: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

export function LandingScreen({ language, hasSession, onContinue, onSignIn, onRegister }: LandingScreenProps) {
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  return (
    <View style={styles.root}>
      <View style={styles.mark}>
        <Ionicons name="book-outline" size={48} color={Colors.gold[400]} />
      </View>
      <Text style={styles.title}>Katiba Yetu</Text>
      <Text style={styles.tagline}>
        {copy('Soma · Jadili · Pendekeza · Piga Kura', 'Read · Discuss · Propose · Vote')}
      </Text>
      <Text style={styles.description}>
        {copy(
          'Jukwaa salama la kusoma Katiba na kushiriki katika mijadala ya kikatiba. Akaunti inahitajika kabla ya kushiriki.',
          'A secure platform for reading the Constitution and participating in constitutional discussions. An account is required to participate.',
        )}
      </Text>

      <View style={styles.actions}>
        {hasSession ? (
          <Pressable style={styles.primary} onPress={onContinue} accessibilityRole="button">
            <Text style={styles.primaryText}>{copy('Endelea kwenye programu', 'Continue to the app')}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.primary} onPress={onSignIn} accessibilityRole="button">
              <Text style={styles.primaryText}>{copy('Ingia', 'Sign in')}</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={onRegister} accessibilityRole="button">
              <Text style={styles.secondaryText}>{copy('Fungua akaunti', 'Create account')}</Text>
            </Pressable>
          </>
        )}
      </View>
      <Text style={styles.notice}>
        {copy('Huwezi kutoa maoni, kupiga kura au kuhifadhi mchango bila kuingia.', 'You cannot comment, vote, or save contributions without signing in.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6], backgroundColor: Colors.surface.base },
  mark: { width: 96, height: 96, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.green[900], borderWidth: 2, borderColor: Colors.gold[500], marginBottom: Spacing[5] },
  title: { fontFamily: Typography.family.serif, fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  tagline: { marginTop: Spacing[2], color: Colors.gold[400], fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, textAlign: 'center' },
  description: { marginTop: Spacing[5], maxWidth: 560, color: Colors.text.secondary, fontSize: Typography.size.base, lineHeight: 24, textAlign: 'center' },
  actions: { width: '100%', maxWidth: 420, marginTop: Spacing[7], gap: Spacing[3] },
  primary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.green[600], paddingHorizontal: Spacing[5] },
  primaryText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  secondary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.green[400], paddingHorizontal: Spacing[5] },
  secondaryText: { color: Colors.green[300], fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  notice: { marginTop: Spacing[5], maxWidth: 520, color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center' },
});


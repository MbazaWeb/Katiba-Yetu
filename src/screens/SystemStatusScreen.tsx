import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Citizen-friendly "System Status" page.
 *
 * Replaces the technical BackendStatusScreen. Shows simple, non-technical
 * status indicators that any citizen can understand.
 */
export function SystemStatusScreen({ onBack }: { onBack?: () => void }) {
  const { language } = useAppContext();
  const connected = isSupabaseConfigured;
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  const checks = [
    {
      icon: 'cloud-done-outline' as const,
      label: copy('Hifadhi ya taifa', 'National database'),
      ok: connected,
      okText: copy('Imeunganishwa', 'Connected'),
      badText: copy('Haijaunganishwa', 'Not connected'),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: copy('Usalama wa akaunti', 'Account security'),
      ok: connected,
      okText: copy('Salama', 'Secure'),
      badText: copy('Haijawashwa', 'Not enabled'),
    },
    {
      icon: 'mail-outline' as const,
      label: copy('Uthibitisho wa barua pepe', 'Email verification'),
      ok: connected,
      okText: copy('Imewashwa', 'Enabled'),
      badText: copy('Haijawashwa', 'Not enabled'),
    },
    {
      icon: 'people-outline' as const,
      label: copy('Ushiriki wa wananchi', 'Citizen participation'),
      ok: connected,
      okText: copy('Wazi', 'Open'),
      badText: copy('Hauwezi', 'Unavailable'),
    },
  ];

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Hadhi ya Mfumo', 'System Status')} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, connected ? styles.heroIconOk : styles.heroIconBad]}>
            <Ionicons name={connected ? 'checkmark-circle' : 'alert-circle'} size={40} color={connected ? Colors.green[400] : Colors.gold[400]} />
          </View>
          <Text style={styles.heroTitle}>
            {connected
              ? copy('Mfumo unafanya kazi', 'System is running')
              : copy('Mfumo haujaunganishwa kabisa', 'System is not fully connected')}
          </Text>
          <Text style={styles.heroSub}>
            {connected
              ? copy('Unaweza kusoma Katiba, kutoa maoni, na kushiriki kwenye kura bila matatizo.', 'You can read the Constitution, submit proposals, and participate in polls without issues.')
              : copy('Baadhi ya huduma hazipatikani kwa sasa. Tafadhali wasiliana na msimamizi.', 'Some services are currently unavailable. Please contact the administrator.')}
          </Text>
        </View>

        {/* Status checks */}
        <View style={styles.card}>
          {checks.map((check, i) => (
            <View key={i} style={[styles.checkRow, i < checks.length - 1 && styles.checkRowBorder]}>
              <Ionicons name={check.icon} size={24} color={check.ok ? Colors.green[400] : Colors.text.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>{check.label}</Text>
                <Text style={[styles.checkStatus, { color: check.ok ? Colors.green[400] : Colors.text.muted }]}>
                  {check.ok ? check.okText : check.badText}
                </Text>
              </View>
              <View style={[styles.dot, check.ok ? styles.dotOk : styles.dotBad]} />
            </View>
          ))}
        </View>

        {/* What this means for you */}
        <Text style={styles.sectionLabel}>{copy('Hii inamaanisha nani kwako?', 'What does this mean for you?')}</Text>
        <View style={styles.card}>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.green[400]} />
            <Text style={styles.bulletText}>
              {copy(
                'Akaunti yako inalindwa. Hakuna mtu anayeweza kujisajili kwa jina lako.',
                'Your account is protected. No one can register using your name.'
              )}
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.green[400]} />
            <Text style={styles.bulletText}>
              {copy(
                'Mapendekezo na kura zako zinahifadhiwa salama kwenye seva ya kitaifa.',
                'Your proposals and votes are stored safely on a national server.'
              )}
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.green[400]} />
            <Text style={styles.bulletText}>
              {copy(
                'Unaweza kuondoka wakati wowote — akaunti yako itasalia salama.',
                'You can sign out at any time — your account stays safe.'
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {copy('Katiba Yetu · toleo 0.3.1', 'Katiba Yetu · version 0.3.1')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 600, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[4] },
  heroIcon: { width: 80, height: 80, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  heroIconOk: { backgroundColor: Colors.green[900] },
  heroIconBad: { backgroundColor: Colors.gold[100] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 420, lineHeight: 21 },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[1] },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[3] },
  checkRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  checkLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.medium, color: Colors.text.primary },
  checkStatus: { fontSize: Typography.size.sm, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotOk: { backgroundColor: Colors.green[400] },
  dotBad: { backgroundColor: Colors.text.muted },
  sectionLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2], paddingVertical: Spacing[2] },
  bulletText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.sm, lineHeight: 21 },
  footer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4] },
});

export default SystemStatusScreen;

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { authService, AUTH_DISCLAIMER } from '../services/auth';
import { useAppContext } from '../hooks/useAppContext';
import type { AuthSession, RegistrationInput, TanzaniaRegion, LibraryLanguage } from '../types';

type Mode = 'signin' | 'register';

const REGIONS: { value: TanzaniaRegion; sw: string; en: string }[] = [
  { value: 'dar_es_salaam', sw: 'Dar es Salaam', en: 'Dar es Salaam' },
  { value: 'dodoma', sw: 'Dodoma', en: 'Dodoma' },
  { value: 'mwanza', sw: 'Mwanza', en: 'Mwanza' },
  { value: 'arusha', sw: 'Arusha', en: 'Arusha' },
  { value: 'mbeya', sw: 'Mbeya', en: 'Mbeya' },
  { value: 'zanzibar_west', sw: 'Zanzibar Magharibi', en: 'Zanzibar West' },
  { value: 'pemba_north', sw: 'Pemba Kaskazini', en: 'Pemba North' },
];

interface AuthScreenProps {
  onAuthenticated?: (session: AuthSession) => void;
  onBack?: () => void;
}

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const { language, setLanguage, setUser } = useAppContext();
  const [mode, setMode] = useState<Mode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState<TanzaniaRegion | ''>('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  async function handleSubmit() {
    setError(''); setBusy(true);
    try {
      let session: AuthSession;
      if (mode === 'signin') {
        session = await authService.signInWithCredentials({ identifier, password });
      } else {
        if (!displayName.trim()) throw new Error('Tafadhali jaza jina lako. / Please enter your name.');
        const input: RegistrationInput = {
          displayName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          region: region || undefined,
          languagePref: language as LibraryLanguage,
          anonymous,
        };
        session = await authService.register(input);
      }
      setUser({
        id: session.userId,
        display_name: session.displayName,
        email: session.email,
        phone: session.phone,
        nida_verified: false,
        verification_tier: session.verificationTier,
        role: 'registered',
        anonymity_default: anonymous,
        region: session.region,
        language_pref: session.languagePref,
        created_at: session.signedInAt,
      });
      if (session.languagePref !== language) setLanguage(session.languagePref);
      onAuthenticated?.(session);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Hitilafu isiyotarajiwa. / Unexpected error.';
      setError(msg);
      if (Platform.OS === 'web') { /* keep inline error */ }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Akaunti', 'Account')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.brandMark}>
            <Ionicons name="book-outline" size={36} color={Colors.gold[400]} />
          </View>
          <Text style={styles.heroTitle}>{copy('Karibu Katiba Yetu', 'Welcome to Katiba Yetu')}</Text>
          <Text style={styles.heroSub}>
            {copy('Ingia au jiunge ili kuhifadhi michango, kura na alama zako.', 'Sign in or register to save your contributions, votes and bookmarks.')}
          </Text>
        </View>

        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setMode('signin')}
            style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'signin' }}
          >
            <Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>{copy('Ingia', 'Sign in')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('register')}
            style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'register' }}
          >
            <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>{copy('Jisajili', 'Register')}</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {mode === 'register' && (
            <Field label={copy('Jina la kuonyeshwa', 'Display name')}>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={copy('Andika jina lako…', 'Enter your name…')}
                placeholderTextColor={Colors.text.muted}
                accessibilityLabel={copy('Jina', 'Name')}
              />
            </Field>
          )}

          {mode === 'register' ? (
            <>
              <Field label={copy('Barua pepe (hiari)', 'Email (optional)')}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel={copy('Barua pepe', 'Email')}
                />
              </Field>
              <Field label={copy('Namba ya simu (hiari)', 'Phone (optional)')}>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+255 7XX XXX XXX"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="phone-pad"
                  accessibilityLabel={copy('Simu', 'Phone')}
                />
              </Field>
              <Field label={copy('Mkoa', 'Region')}>
                <View style={styles.pillRow}>
                  {REGIONS.map(r => (
                    <Pressable
                      key={r.value}
                      onPress={() => setRegion(region === r.value ? '' : r.value)}
                      style={[styles.pill, region === r.value && styles.pillActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: region === r.value }}
                    >
                      <Text style={[styles.pillText, region === r.value && styles.pillTextActive]}>{language === 'sw' ? r.sw : r.en}</Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
              <Pressable
                onPress={() => setAnonymous(!anonymous)}
                style={styles.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: anonymous }}
              >
                <View style={[styles.checkbox, anonymous && styles.checkboxActive]}>
                  {anonymous && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxText}>
                  {copy('Changia kwa jina la kawaida "Mwananchi"', 'Contribute anonymously as "Mwananchi"')}
                </Text>
              </Pressable>
            </>
          ) : (
            <Field label={copy('Barua pepe au simu', 'Email or phone')}>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={copy('name@example.com au +255…', 'name@example.com or +255…')}
                placeholderTextColor={Colors.text.muted}
                autoCapitalize="none"
                accessibilityLabel={copy('Kitambulisho', 'Identifier')}
              />
            </Field>
          )}

          <Field label={copy('Nywila', 'Password')}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.muted}
              secureTextEntry
              accessibilityLabel={copy('Nywila', 'Password')}
            />
          </Field>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.red[300]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={({ pressed }) => [styles.submit, busy && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={styles.submitText}>
              {busy ? copy('Inasubiri…', 'Please wait…') : mode === 'signin' ? copy('Ingia', 'Sign in') : copy('Jisajili', 'Register')}
            </Text>
          </Pressable>

          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gold[400]} />
            <Text style={styles.disclaimerText}>{AUTH_DISCLAIMER}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 560, alignSelf: 'center', width: '100%' },
  hero: { alignItems: 'center', paddingVertical: Spacing[6], gap: Spacing[2] },
  brandMark: { width: 72, height: 72, borderRadius: Radius.full, backgroundColor: Colors.green[900], borderWidth: 2, borderColor: Colors.gold[500], alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 360 },
  modeToggle: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4], backgroundColor: Colors.surface.overlay, borderRadius: Radius.lg, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', borderRadius: Radius.md, minHeight: 44 },
  modeBtnActive: { backgroundColor: Colors.green[700] },
  modeText: { color: Colors.text.muted, fontWeight: Typography.weight.medium, fontSize: Typography.size.base },
  modeTextActive: { color: '#fff', fontWeight: Typography.weight.semibold },
  form: { gap: Spacing[4] },
  field: { gap: Spacing[2] },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  pill: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay, borderWidth: 1, borderColor: Colors.surface.borderStrong, minHeight: 36 },
  pillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  pillText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  pillTextActive: { color: '#fff' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[2] },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.surface.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  checkboxText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.sm },
  submit: { backgroundColor: Colors.green[600], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', minHeight: 52 },
  submitText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  errorBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.red[50], borderLeftWidth: 3, borderColor: Colors.red[400], borderRadius: Radius.sm, alignItems: 'flex-start' },
  errorText: { flex: 1, color: Colors.red[300], fontSize: Typography.size.sm },
  disclaimerBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.gold[50], borderLeftWidth: 3, borderColor: Colors.gold[400], borderRadius: Radius.sm, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.xs, lineHeight: 18 },
});

export default AuthScreen;

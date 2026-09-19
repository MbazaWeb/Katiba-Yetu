import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { getAuthService } from '../services/authService';
import { useAppContext } from '../hooks/useAppContext';
import { RegionDistrictPicker, type RegionDistrictValue } from '../components/RegionDistrictPicker';
import type { RegistrationInput, LibraryLanguage, User } from '../types';

type Mode = 'signin' | 'register';

interface AuthScreenProps {
  onAuthenticated?: (user: User) => void;
  onBack?: () => void;
  initialMode?: Mode;
}

export function AuthScreen({ onAuthenticated, onBack, initialMode = 'signin' }: AuthScreenProps) {
  const { language, setLanguage, setUser } = useAppContext();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<RegionDistrictValue>({});
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  async function handleSubmit() {
    setError(''); setBusy(true);
    try {
      const service = getAuthService();
      let signedInUser: User;
      if (mode === 'signin') {
        signedInUser = await service.signInWithCredentials({ identifier, password });
      } else {
        if (!displayName.trim()) throw new Error('Tafadhali jaza jina lako. / Please enter your name.');
        const input: RegistrationInput = {
          displayName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          region: location.region,
          district: location.district,
          languagePref: language as LibraryLanguage,
          anonymous,
        };
        signedInUser = await service.register(input);
      }
      setUser(signedInUser);
      if (signedInUser.language_pref !== language) setLanguage(signedInUser.language_pref);
      onAuthenticated?.(signedInUser);
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
              <Field label={copy('Barua pepe', 'Email')}>
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
              <RegionDistrictPicker
                value={location}
                onChange={setLocation}
                disabled={busy}
              />
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
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.gold[400]} />
            <Text style={styles.disclaimerText}>
              {copy('Akaunti na session zinasimamiwa na Supabase Auth.', 'Accounts and sessions are managed by Supabase Auth.')}
            </Text>
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

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { getAuthService } from '../services/authService';
import { useAppContext } from '../hooks/useAppContext';
import { RegionDistrictPicker, type RegionDistrictValue } from '../components/RegionDistrictPicker';
import { STAKEHOLDER_LABELS } from '../types';
import type { RegistrationInput, LibraryLanguage, User, StakeholderType } from '../types';

type Mode = 'signin' | 'register';

const STAKEHOLDER_ICONS: Record<StakeholderType, string> = {
  citizen: 'person-outline',
  institution: 'business-outline',
  court: 'scale-outline',
  lawyer: 'briefcase-outline',
  ngo: 'people-circle-outline',
  ministry: 'shield-outline',
  media: 'newspaper-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

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
  const [location, setLocation] = useState<RegionDistrictValue>({});
  const [stakeholderType, setStakeholderType] = useState<StakeholderType>('citizen');
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
          password,
          region: location.region,
          district: location.district,
          stakeholderType,
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Akaunti', 'Account')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable onPress={() => setMode('signin')} style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]} accessibilityRole="button" accessibilityState={{ selected: mode === 'signin' }}>
            <Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>{copy('Ingia', 'Sign in')}</Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')} style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]} accessibilityRole="button" accessibilityState={{ selected: mode === 'register' }}>
            <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>{copy('Jisajili', 'Register')}</Text>
          </Pressable>
        </View>

        {/* Sign-in fields */}
        {mode === 'signin' ? (
          <View style={styles.form}>
            <Field label={copy('Barua pepe', 'Email')}>
              <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} placeholder="name@example.com" placeholderTextColor={Colors.text.muted} keyboardType="email-address" autoCapitalize="none" accessibilityLabel={copy('Barua pepe', 'Email')} />
            </Field>
            <Field label={copy('Nywila', 'Password')}>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.text.muted} secureTextEntry accessibilityLabel={copy('Nywila', 'Password')} />
            </Field>
          </View>
        ) : (
          /* Registration fields */
          <View style={styles.form}>
            <Field label={copy('Jina la kuonyeshwa', 'Display name')}>
              <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder={copy('Andika jina lako…', 'Enter your name…')} placeholderTextColor={Colors.text.muted} accessibilityLabel={copy('Jina', 'Name')} />
            </Field>
            <Field label={copy('Barua pepe', 'Email')}>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor={Colors.text.muted} keyboardType="email-address" autoCapitalize="none" accessibilityLabel={copy('Barua pepe', 'Email')} />
            </Field>
            <Field label={copy('Nywila', 'Password')}>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.text.muted} secureTextEntry accessibilityLabel={copy('Nywila', 'Password')} />
            </Field>

            {/* Stakeholder role picker */}
            <Text style={styles.sectionLabel}>{copy('Wewe ni nani?', 'Who are you?')}</Text>
            <Text style={styles.sectionHint}>{copy('Chagua hadhi yako. Hii itaamua vitendo unavyoweza kufanya.', 'Select your role. This determines what actions you can take.')}</Text>
            <View style={styles.stakeholderGrid}>
              {(Object.keys(STAKEHOLDER_LABELS) as StakeholderType[]).map(st => {
                const active = stakeholderType === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => setStakeholderType(st)}
                    style={[styles.stakeholderCard, active && styles.stakeholderCardActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={language === 'sw' ? STAKEHOLDER_LABELS[st].sw : STAKEHOLDER_LABELS[st].en}
                  >
                    <Ionicons name={STAKEHOLDER_ICONS[st] as React.ComponentProps<typeof Ionicons>['name']} size={24} color={active ? Colors.green[300] : Colors.text.muted} />
                    <Text style={[styles.stakeholderLabel, active && styles.stakeholderLabelActive]}>{language === 'sw' ? STAKEHOLDER_LABELS[st].sw : STAKEHOLDER_LABELS[st].en}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Location picker */}
            <RegionDistrictPicker value={location} onChange={setLocation} disabled={busy} />

            {/* Anonymous toggle */}
            <Pressable onPress={() => setAnonymous(!anonymous)} style={styles.checkboxRow} accessibilityRole="checkbox" accessibilityState={{ checked: anonymous }}>
              <View style={[styles.checkbox, anonymous && styles.checkboxActive]}>
                {anonymous && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxText}>{copy('Changia kama "Mwananchi" — jina lako halitaonekana', 'Contribute as "Mwananchi" — your name will not be shown')}</Text>
            </Pressable>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.red[300]} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={busy || (mode === 'register' && !email.trim())}
          style={({ pressed }) => [styles.submit, (busy || (mode === 'register' && !email.trim())) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <Text style={styles.submitText}>{busy ? copy('Inasubiri…', 'Please wait…') : mode === 'signin' ? copy('Ingia', 'Sign in') : copy('Jisajili', 'Register')}</Text>
        </Pressable>
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
  modeToggle: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4], backgroundColor: Colors.surface.overlay, borderRadius: Radius.lg, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', borderRadius: Radius.md, minHeight: 44 },
  modeBtnActive: { backgroundColor: Colors.green[700] },
  modeText: { color: Colors.text.muted, fontWeight: Typography.weight.medium, fontSize: Typography.size.base },
  modeTextActive: { color: '#fff', fontWeight: Typography.weight.semibold },
  form: { gap: Spacing[4] },
  field: { gap: Spacing[2] },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 48, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  sectionLabel: { fontSize: Typography.size.md, color: Colors.text.primary, fontWeight: Typography.weight.semibold, marginTop: Spacing[2] },
  sectionHint: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2, marginBottom: Spacing[3] },
  stakeholderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  stakeholderCard: { alignItems: 'center', gap: 6, padding: Spacing[3], borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surface.borderStrong, backgroundColor: Colors.surface.overlay, minWidth: 100, minHeight: 80 },
  stakeholderCardActive: { borderColor: Colors.green[400], backgroundColor: Colors.green[900] },
  stakeholderLabel: { fontSize: Typography.size.xs, color: Colors.text.secondary, textAlign: 'center' },
  stakeholderLabelActive: { color: Colors.green[300], fontWeight: Typography.weight.semibold },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[2] },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.surface.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  checkboxText: { flex: 1, color: Colors.text.secondary, fontSize: Typography.size.sm },
  errorBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.red[50], borderLeftWidth: 3, borderColor: Colors.red[400], borderRadius: Radius.sm, alignItems: 'flex-start', marginTop: Spacing[2] },
  errorText: { flex: 1, color: Colors.red[300], fontSize: Typography.size.sm },
  submit: { backgroundColor: Colors.green[600], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', minHeight: 52, marginTop: Spacing[4] },
  submitText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
});

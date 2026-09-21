import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { getAuthService } from '../services/authService';
import { useAppContext } from '../hooks/useAppContext';
import { RegionDistrictPicker, type RegionDistrictValue } from '../components/RegionDistrictPicker';
import type { RegistrationInput, LibraryLanguage, User, StakeholderType } from '../types';
import { STAKEHOLDER_LABELS } from '../types';

type Mode = 'signin' | 'register';
type Step = 'credentials' | 'role' | 'location';

interface AuthScreenProps {
  onAuthenticated?: (user: User) => void;
  onBack?: () => void;
  initialMode?: Mode;
}

const STAKEHOLDER_ORDER: StakeholderType[] = [
  'citizen', 'institution', 'court', 'lawyer', 'ngo', 'ministry', 'media', 'other',
];

export function AuthScreen({ onAuthenticated, onBack, initialMode = 'signin' }: AuthScreenProps) {
  const { language, setLanguage, setUser } = useAppContext();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('credentials');

  // Credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Role
  const [stakeholder, setStakeholder] = useState<StakeholderType | null>(null);

  // Location & prefs
  const [location, setLocation] = useState<RegionDistrictValue>({});
  const [anonymous, setAnonymous] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  function nextStep() {
    setError('');
    if (step === 'credentials') {
      if (!displayName.trim()) { setError(copy('Tafadhali andika jina lako.', 'Please enter your name.')); return; }
      if (!email.trim()) { setError(copy('Tafadhali andika barua pepe.', 'Please enter your email.')); return; }
      if (password.length < 6) { setError(copy('Nywila iwe na herufi 6 au zaidi.', 'Password must be at least 6 characters.')); return; }
      setStep('role');
    } else if (step === 'role') {
      if (!stakeholder) { setError(copy('Tafadhali chagua aina yako.', 'Please select your stakeholder type.')); return; }
      setStep('location');
    }
  }

  function prevStep() {
    setError('');
    if (step === 'role') setStep('credentials');
    if (step === 'location') setStep('role');
  }

  async function handleSubmit() {
    setError(''); setBusy(true);
    try {
      const service = getAuthService();
      let signedInUser: User;
      if (mode === 'signin') {
        signedInUser = await service.signInWithCredentials({ identifier, password });
      } else {
        const input: RegistrationInput = {
          displayName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          region: location.region,
          district: location.district,
          languagePref: language as LibraryLanguage,
          anonymous,
          stakeholder_type: stakeholder ?? undefined,
        };
        signedInUser = await service.register(input);
      }
      setUser(signedInUser);
      if (signedInUser.language_pref !== language) setLanguage(signedInUser.language_pref);
      onAuthenticated?.(signedInUser);
    } catch (e) {
      const msg = e instanceof Error ? e.message : copy('Hitilafu isiyotarajiwa.', 'Unexpected error.');
      setError(msg);
      if (Platform.OS === 'web') { /* keep inline */ }
    } finally {
      setBusy(false);
    }
  }

  // ── Sign-in form ────────────────────────────────────────────────────────────
  if (mode === 'signin') {
    return (
      <View style={s.root}>
        <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Ingia', 'Sign In')} />
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={s.brandMark}>
              <Ionicons name="book-outline" size={36} color={Colors.gold[400]} />
            </View>
            <Text style={s.heroTitle}>{copy('Karibu Tena', 'Welcome Back')}</Text>
            <Text style={s.heroSub}>{copy('Ingia ili kuendelea na shughuli zako.', 'Sign in to continue where you left off.')}</Text>
          </View>

          <View style={s.form}>
            <Field label={copy('Barua pepe au simu', 'Email or phone')}>
              <TextInput style={s.input} value={identifier} onChangeText={setIdentifier}
                placeholder="name@example.com" placeholderTextColor={Colors.text.muted}
                autoCapitalize="none" keyboardType="email-address" />
            </Field>
            <Field label={copy('Nywila', 'Password')}>
              <View style={s.passwordWrap}>
                <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} value={password}
                  onChangeText={setPassword} placeholder="••••••••"
                  placeholderTextColor={Colors.text.muted} secureTextEntry={!showPassword} />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.text.muted} />
                </Pressable>
              </View>
            </Field>

            {error ? <ErrorBox text={error} /> : null}

            <Pressable onPress={handleSubmit} disabled={busy}
              style={({ pressed }) => [s.primaryBtn, busy && s.btnDisabled, pressed && s.btnPressed]}>
              <Text style={s.primaryBtnText}>{busy ? copy('Inasubiri…', 'Please wait…') : copy('Ingia', 'Sign In')}</Text>
            </Pressable>

            <Pressable onPress={() => { setMode('register'); setStep('credentials'); setError(''); }} style={s.switchLink}>
              <Text style={s.switchLinkText}>{copy('Huna akaunti? Jisajili hapa', "Don't have an account? Register here")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Register: Step indicators ───────────────────────────────────────────────
  const STEPS: Step[] = ['credentials', 'role', 'location'];
  const stepIdx = STEPS.indexOf(step);
  const stepLabels = [copy('Taarifa', 'Details'), copy('Aina yako', 'Your Role'), copy('Mahali', 'Location')];

  return (
    <View style={s.root}>
      <AppHeader showBack onBack={step === 'credentials' ? onBack : prevStep} title={copy('Jisajili', 'Create Account')} />

      {/* Step progress */}
      <View style={s.stepBar}>
        {STEPS.map((st, i) => (
          <React.Fragment key={st}>
            <View style={[s.stepDot, i <= stepIdx && s.stepDotActive]}>
              {i < stepIdx
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[s.stepNum, i <= stepIdx && s.stepNumActive]}>{i + 1}</Text>}
            </View>
            {i < STEPS.length - 1 && <View style={[s.stepLine, i < stepIdx && s.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>
      <Text style={s.stepLabel}>{stepLabels[stepIdx]}</Text>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* ── Step 1: Credentials ── */}
        {step === 'credentials' && (
          <View style={s.form}>
            <Field label={copy('Jina lako kamili', 'Full name')}>
              <TextInput style={s.input} value={displayName} onChangeText={setDisplayName}
                placeholder={copy('Mfano: Amina Hassan', 'e.g. Amina Hassan')}
                placeholderTextColor={Colors.text.muted} />
            </Field>
            <Field label={copy('Barua pepe', 'Email address')}>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                placeholder="name@example.com" placeholderTextColor={Colors.text.muted}
                keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label={copy('Namba ya simu (hiari)', 'Phone number (optional)')}>
              <TextInput style={s.input} value={phone} onChangeText={setPhone}
                placeholder="+255 7XX XXX XXX" placeholderTextColor={Colors.text.muted}
                keyboardType="phone-pad" />
            </Field>
            <Field label={copy('Nywila', 'Password')}>
              <View style={s.passwordWrap}>
                <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} value={password}
                  onChangeText={setPassword} placeholder={copy('Herufi 6 au zaidi', 'At least 6 characters')}
                  placeholderTextColor={Colors.text.muted} secureTextEntry={!showPassword} />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.text.muted} />
                </Pressable>
              </View>
            </Field>

            {error ? <ErrorBox text={error} /> : null}

            <Pressable onPress={nextStep}
              style={({ pressed }) => [s.primaryBtn, pressed && s.btnPressed]}>
              <Text style={s.primaryBtnText}>{copy('Endelea', 'Continue')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>

            <Pressable onPress={() => { setMode('signin'); setError(''); }} style={s.switchLink}>
              <Text style={s.switchLinkText}>{copy('Una akaunti tayari? Ingia', 'Already have an account? Sign in')}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Step 2: Stakeholder role ── */}
        {step === 'role' && (
          <View style={s.form}>
            <Text style={s.roleHeading}>
              {copy('Unashiriki katika mchakato huu kama nani?', 'Who are you in this process?')}
            </Text>
            <Text style={s.roleSubheading}>
              {copy('Hii itasaidia kubinafsisha uzoefu wako.', 'This helps personalise your experience.')}
            </Text>

            <View style={s.roleGrid}>
              {STAKEHOLDER_ORDER.map(key => {
                const info = STAKEHOLDER_LABELS[key];
                const active = stakeholder === key;
                return (
                  <Pressable key={key} onPress={() => setStakeholder(key)}
                    style={[s.roleCard, active && s.roleCardActive]}>
                    <View style={[s.roleIcon, active && s.roleIconActive]}>
                      <Ionicons name={info.icon as any} size={24} color={active ? '#fff' : Colors.text.muted} />
                    </View>
                    <Text style={[s.roleCardLabel, active && s.roleCardLabelActive]}>
                      {language === 'sw' ? info.sw : info.en}
                    </Text>
                    <Text style={s.roleCardDesc} numberOfLines={2}>
                      {language === 'sw' ? info.desc_sw : info.desc_en}
                    </Text>
                    {active && (
                      <View style={s.roleCheck}>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.green[400]} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {error ? <ErrorBox text={error} /> : null}

            <Pressable onPress={nextStep}
              style={({ pressed }) => [s.primaryBtn, pressed && s.btnPressed]}>
              <Text style={s.primaryBtnText}>{copy('Endelea', 'Continue')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── Step 3: Location & prefs ── */}
        {step === 'location' && (
          <View style={s.form}>
            <Text style={s.roleHeading}>{copy('Uko wapi?', 'Where are you based?')}</Text>
            <Text style={s.roleSubheading}>
              {copy('Husaidia kuoanisha michango yako na mkoa wako.', 'Helps match your contributions to your region.')}
            </Text>

            <RegionDistrictPicker value={location} onChange={setLocation} disabled={busy} />

            <Pressable onPress={() => setAnonymous(!anonymous)}
              style={s.checkboxRow} accessibilityRole="checkbox"
              accessibilityState={{ checked: anonymous }}>
              <View style={[s.checkbox, anonymous && s.checkboxActive]}>
                {anonymous && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.checkboxLabel}>{copy('Changia bila kutaja jina', 'Contribute anonymously')}</Text>
                <Text style={s.checkboxSub}>
                  {copy('Michango yako itaonekana kama "Mwananchi"', 'Your contributions appear as "Mwananchi"')}
                </Text>
              </View>
            </Pressable>

            {error ? <ErrorBox text={error} /> : null}

            <Pressable onPress={handleSubmit} disabled={busy}
              style={({ pressed }) => [s.primaryBtn, busy && s.btnDisabled, pressed && s.btnPressed]}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>
                {busy ? copy('Inasajili…', 'Creating account…') : copy('Maliza Usajili', 'Create Account')}
              </Text>
            </Pressable>

            <View style={s.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.gold[400]} />
              <Text style={s.trustText}>
                {copy('Akaunti yako inalindwa na Supabase Auth.', 'Your account is secured by Supabase Auth.')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <View style={s.errorBox}>
      <Ionicons name="alert-circle-outline" size={18} color={Colors.red[300]} />
      <Text style={s.errorText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 600, alignSelf: 'center', width: '100%' },

  // Step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[6], paddingTop: Spacing[4], gap: 0 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface.overlay, borderWidth: 2, borderColor: Colors.surface.borderStrong, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[500] },
  stepNum: { fontSize: 12, fontWeight: Typography.weight.bold, color: Colors.text.muted },
  stepNumActive: { color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.surface.borderStrong },
  stepLineActive: { backgroundColor: Colors.green[600] },
  stepLabel: { textAlign: 'center', fontSize: Typography.size.sm, color: Colors.text.muted, marginTop: Spacing[2], marginBottom: Spacing[1] },

  // Hero
  hero: { alignItems: 'center', paddingVertical: Spacing[6], gap: Spacing[2] },
  brandMark: { width: 72, height: 72, borderRadius: Radius.full, backgroundColor: Colors.green[900], borderWidth: 2, borderColor: Colors.gold[500], alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 360 },

  // Form
  form: { gap: Spacing[4] },
  field: { gap: Spacing[2] },
  fieldLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  input: { color: Colors.text.primary, padding: Spacing[3], minHeight: 50, borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, fontSize: 16 },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.surface.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, overflow: 'hidden' },
  eyeBtn: { paddingHorizontal: Spacing[3], justifyContent: 'center', alignItems: 'center' },

  // Role picker
  roleHeading: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  roleSubheading: { fontSize: Typography.size.sm, color: Colors.text.muted, marginTop: -Spacing[2] },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  roleCard: { width: '47%', backgroundColor: Colors.surface.overlay, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.surface.borderStrong, padding: Spacing[3], gap: Spacing[1.5], position: 'relative', minHeight: 110 },
  roleCardActive: { borderColor: Colors.green[500], backgroundColor: Colors.green[900] },
  roleIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surface.base, alignItems: 'center', justifyContent: 'center' },
  roleIconActive: { backgroundColor: Colors.green[700] },
  roleCardLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  roleCardLabelActive: { color: Colors.green[300] },
  roleCardDesc: { fontSize: 11, color: Colors.text.muted, lineHeight: 15 },
  roleCheck: { position: 'absolute', top: Spacing[2], right: Spacing[2] },

  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], paddingVertical: Spacing[2] },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.surface.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkboxActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  checkboxLabel: { fontSize: Typography.size.sm, color: Colors.text.primary, fontWeight: Typography.weight.medium },
  checkboxSub: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },

  // Buttons
  primaryBtn: { backgroundColor: Colors.green[600], paddingVertical: Spacing[4], borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, flexDirection: 'row', gap: Spacing[2] },
  primaryBtnText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { opacity: 0.85 },
  switchLink: { alignItems: 'center', paddingVertical: Spacing[3] },
  switchLinkText: { color: Colors.green[400], fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },

  // Error / trust
  errorBox: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], backgroundColor: Colors.red[50], borderLeftWidth: 3, borderColor: Colors.red[400], borderRadius: Radius.sm, alignItems: 'flex-start' },
  errorText: { flex: 1, color: Colors.red[300], fontSize: Typography.size.sm },
  trustRow: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center', justifyContent: 'center', paddingTop: Spacing[2] },
  trustText: { fontSize: Typography.size.xs, color: Colors.text.muted },
});

export default AuthScreen;

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { getBackendStatus } from '../services/backend';

interface Props { onBack?: () => void; }

export function BackendStatusScreen({ onBack }: Props) {
  const { language } = useAppContext();
  const status = getBackendStatus();
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  // Translate technical services into citizen-friendly features
  const features = [
    {
      icon: 'cloud-done-outline' as const,
      label_sw: 'Hifadhi ya Maoni',
      label_en: 'Saving Contributions',
      desc_sw: 'Maoni na mapendekezo yako yanahifadhiwa salama.',
      desc_en: 'Your comments and proposals are saved safely.',
      ok: status.api.configured,
    },
    {
      icon: 'chatbubble-ellipses-outline' as const,
      label_sw: 'Msaada wa Kuelewa Katiba',
      label_en: 'Constitution Helper',
      desc_sw: 'Msaidizi wa kueleza ibara za Katiba kwa lugha rahisi.',
      desc_en: 'AI assistant that explains constitutional articles simply.',
      ok: status.ai.configured,
    },
    {
      icon: 'finger-print-outline' as const,
      label_sw: 'Uthibitisho wa Kitambulisho',
      label_en: 'Identity Verification',
      desc_sw: 'Thibitisha utambulisho wako kupitia mfumo wa NIDA.',
      desc_en: 'Verify your identity through the NIDA system.',
      ok: status.identity.configured,
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label_sw: 'Usalama wa Maudhui',
      label_en: 'Content Safety',
      desc_sw: 'Kuhakikisha mazingira ya heshima na salama kwa wote.',
      desc_en: 'Ensuring a respectful and safe environment for all.',
      ok: status.moderation.configured,
    },
    {
      icon: 'document-text-outline' as const,
      label_sw: 'Pakua Hati (PDF)',
      label_en: 'Download Documents (PDF)',
      desc_sw: 'Pakua nakala ya Katiba na mapendekezo kwa PDF.',
      desc_en: 'Download the Constitution and proposals as PDF.',
      ok: status.pdf.configured,
    },
  ];

  const allOk = features.every(f => f.ok);
  const okCount = features.filter(f => f.ok).length;

  return (
    <View style={s.root}>
      <AppHeader showBack={!!onBack} onBack={onBack}
        title={copy('Hali ya Mfumo', 'System Status')} />
      <ScrollView contentContainerStyle={s.content}>

        {/* Overall status banner */}
        <View style={[s.banner, allOk ? s.bannerGreen : s.bannerAmber]}>
          <Ionicons
            name={allOk ? 'checkmark-circle' : 'information-circle'}
            size={32}
            color={allOk ? Colors.green[400] : Colors.gold[400]}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>
              {allOk
                ? copy('Mfumo unafanya kazi vizuri', 'All systems are running')
                : copy(`Huduma ${okCount} kati ya ${features.length} zinafanya kazi`, `${okCount} of ${features.length} features available`)}
            </Text>
            <Text style={s.bannerSub}>
              {allOk
                ? copy('Huduma zote zinapatikana.', 'All features are available to you.')
                : copy('Baadhi ya huduma bado zinaendelea kuunganishwa.', 'Some features are still being connected.')}
            </Text>
          </View>
        </View>

        {/* Feature cards */}
        <Text style={s.sectionTitle}>{copy('Huduma Zinazopatikana', 'Available Features')}</Text>
        {features.map((f, i) => (
          <View key={i} style={[s.card, !f.ok && s.cardDim]}>
            <View style={[s.cardIcon, f.ok ? s.cardIconGreen : s.cardIconGray]}>
              <Ionicons name={f.icon} size={22} color={f.ok ? Colors.green[400] : Colors.text.muted} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={s.cardRow}>
                <Text style={[s.cardLabel, !f.ok && s.cardLabelDim]}>
                  {copy(f.label_sw, f.label_en)}
                </Text>
                <View style={[s.pill, f.ok ? s.pillGreen : s.pillGray]}>
                  <Text style={[s.pillText, f.ok ? s.pillTextGreen : s.pillTextGray]}>
                    {f.ok ? copy('Inapatikana', 'Available') : copy('Haijaungwa', 'Coming soon')}
                  </Text>
                </View>
              </View>
              <Text style={s.cardDesc}>{copy(f.desc_sw, f.desc_en)}</Text>
            </View>
          </View>
        ))}

        {/* Reassurance note */}
        <View style={s.note}>
          <Ionicons name="lock-closed-outline" size={16} color={Colors.gold[400]} />
          <Text style={s.noteText}>
            {copy(
              'Hata bila huduma zote, unaweza kusoma Katiba, kutoa maoni, na kupiga kura. Taarifa zako ziko salama.',
              'Even without all features, you can read the Constitution, add comments, and vote. Your data is safe.',
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 720, alignSelf: 'center', width: '100%', gap: Spacing[3] },
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4], borderRadius: Radius.xl, marginBottom: Spacing[2] },
  bannerGreen: { backgroundColor: Colors.green[900] },
  bannerAmber: { backgroundColor: '#2a2200' },
  bannerTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  bannerSub: { fontSize: Typography.size.sm, color: Colors.text.muted, marginTop: 3 },
  sectionTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginTop: Spacing[2] },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4] },
  cardDim: { opacity: 0.6 },
  cardIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardIconGreen: { backgroundColor: Colors.green[900] },
  cardIconGray: { backgroundColor: Colors.surface.overlay },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap' },
  cardLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary, flex: 1 },
  cardLabelDim: { color: Colors.text.muted },
  cardDesc: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 20 },
  pill: { paddingHorizontal: Spacing[2], paddingVertical: 3, borderRadius: Radius.full },
  pillGreen: { backgroundColor: Colors.green[900] },
  pillGray: { backgroundColor: Colors.surface.overlay },
  pillText: { fontSize: 11, fontWeight: Typography.weight.semibold },
  pillTextGreen: { color: Colors.green[400] },
  pillTextGray: { color: Colors.text.muted },
  note: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[4], backgroundColor: '#1a1500', borderRadius: Radius.lg, alignItems: 'flex-start', marginTop: Spacing[2] },
  noteText: { flex: 1, fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 20 },
});

export default BackendStatusScreen;

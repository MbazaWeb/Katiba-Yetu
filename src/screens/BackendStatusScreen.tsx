import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Notice } from '../components/library/LibraryUI';
import {
  getBackendStatus, BACKEND_DISCLAIMER,
} from '../services/backend';

interface Props {
  onBack?: () => void;
}

export function BackendStatusScreen({ onBack }: Props) {
  const { language } = useAppContext();
  const status = getBackendStatus();
  const [exportModal, setExportModal] = useState(false);
  const copy = (sw: string, en?: string) => en === undefined ? sw : (language === 'sw' ? sw : en);

  const statusRows: { label: string; key: keyof typeof status; icon: string }[] = [
    { label: copy('Hifadhi kuu ya API', 'API Repository'), key: 'api', icon: 'server-outline' },
    { label: copy('Uundaji wa AI', 'AI Generation'), key: 'ai', icon: 'bulb-outline' },
    { label: copy('Uthibitisho wa NIDA', 'NIDA Identity'), key: 'identity', icon: 'finger-print-outline' },
    { label: copy('Huduma ya Udhibiti', 'Moderation Service'), key: 'moderation', icon: 'shield-checkmark-outline' },
    { label: copy('Uundaji wa PDF', 'PDF Generation'), key: 'pdf', icon: 'document-text-outline' },
  ];

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Hadhi ya Nyuma', 'Backend Status')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="server-outline" size={34} color={Colors.blue[300]} />
          <Text style={styles.heroTitle}>{copy('Hadhi ya Nyuma', 'Backend Status')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Sehemu ya mfumo wa kisasa. Inaonyesha ni huduma zipi zimeunganishwa na ni zipi zinatumia mfano wa ndani (mock).',
              'Subsystem status panel. Shows which services are connected and which use mock implementations.'
            )}
          </Text>
        </View>

        <Notice>{BACKEND_DISCLAIMER}</Notice>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy('Huduma Zilizosanidiwa', 'Configured Services')}</Text>
          {statusRows.map(row => {
            const s = status[row.key];
            return (
              <View key={row.key} style={styles.statusRow}>
                <Ionicons name={row.icon as any} size={20} color={s.configured ? Colors.green[400] : Colors.text.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusLabel}>{row.label}</Text>
                  <Text style={styles.statusValue}>
                    {s.configured
                      ? (copy('Imeunganishwa', 'Connected') + ` · ${s.kind} · ${s.baseUrl}`)
                      : (copy('Inatumia mfano (mock)', 'Using mock') + ` · ${s.kind}`)}
                  </Text>
                </View>
                <View style={[styles.dot, s.configured ? styles.dotGreen : styles.dotGray]} />
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy('Maelezo ya Awali', 'Initial Notes')}</Text>
          <Text style={styles.bodyText}>
            {copy(
              'Kwa sasa, seva yote huria ni mfano. Seva halisi ya API, AI, NIDA, Udhibiti, na PDF itaunganishwa katika awamu ya tatu. Mfumo huu unaeleza kwa wazi ni sehemu gani inatumia mfano na ni zipi zimeunganishwa.',
              'Currently, all backend services are mock. The real API, AI, NIDA, moderation, and PDF servers will be integrated in Phase 3. This panel clearly shows which subsystems use mock implementations and which are connected.'
            )}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy('Hatua za Uundaji wa PDF', 'PDF Generation Steps')}</Text>
          <Text style={styles.bodyText}>
            {copy(
              'Ili kuhamasisha rasimu iliyochapishwa kama PDF: fungua Rasimu, chagua toleo lililochapishwa, na ubonyeze "Pakua PDF". Kwa sasa, kipengele hiki kinajenga HTML inayoweza kuchapishwa; seva halisi ya PDF itaunganishwa baadaye.',
              'To export a published draft as PDF: open the Proposed Constitution, select a published version, and tap "Download PDF". Currently this builds a printable HTML view; a real server-side PDF generator will be integrated later.'
            )}
          </Text>
          <Pressable style={styles.openBtn} onPress={() => setExportModal(true)}>
            <Text style={styles.openBtnText}>{copy('Maelezo zaidi', 'Learn more')}</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>{BACKEND_DISCLAIMER}</Text>
      </ScrollView>

      <Modal visible={exportModal} animationType="slide" transparent onRequestClose={() => setExportModal(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Maelezo ya Uundaji wa PDF', 'PDF Generation Details')}</Text>
              <Pressable onPress={() => setExportModal(false)}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing[3] }}>
              <Text style={styles.bodyText}>
                {copy(
                  'Rasimu iliyochapishwa inaweza kuhamishiwa kama PDF. Kwa sasa mfumo huu unaunda HTML inayoweza kuchapishwa; seva ya kisheria ya PDF itaunganishwa katika awamu ya tatu.',
                  'A published draft can be exported as a PDF. Currently the system builds a printable HTML view; a server-side PDF generator will be integrated in Phase 3.'
                )}
              </Text>
              <Text style={styles.label}>{copy('Maudhui yanayoingizwa', 'Exported content includes')}:</Text>
              {['Jina na toleo la rasimu', 'Tarehe ya kuchapishwa', 'Sura na ibara', 'Maelezo ya kisheria ya awali', 'Muhtasari wa mbinu', 'Onyo la uwakilishi', 'Ufafanuzi wa lugha rahisi'].map(item => (
                <View key={item} style={styles.listRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.green[400]} />
                  <Text style={styles.bodyText}>{copy(item, item)}</Text>
                </View>
              ))}
              <Text style={styles.label}>{copy('Maudhui yasiyoingizwa', 'Exported content excludes')}:</Text>
              {['Taarifa za kibinafsi za washiriki', 'Michango iliyokataliwa', 'Taarifa za udhibiti zilizolindwa'].map(item => (
                <View key={item} style={styles.listRow}>
                  <Ionicons name="close-circle" size={16} color={Colors.red[400]} />
                  <Text style={styles.bodyText}>{copy(item, item)}</Text>
                </View>
              ))}
              <Pressable style={styles.closeBtn} onPress={() => setExportModal(false)}>
                <Text style={styles.closeBtnText}>{copy('Sawa', 'OK')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 580, lineHeight: 21 },
  card: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2] },
  cardTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  statusLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  statusValue: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotGreen: { backgroundColor: Colors.green[400] },
  dotGray: { backgroundColor: Colors.text.muted },
  bodyText: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.semibold, marginTop: Spacing[2] },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  openBtn: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.sm, backgroundColor: Colors.blue[700], minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  openBtnText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.text.muted, textAlign: 'center', paddingTop: Spacing[4], lineHeight: 18 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  closeBtn: { paddingVertical: Spacing[3], borderRadius: Radius.md, backgroundColor: Colors.green[700], alignItems: 'center', minHeight: 44 },
  closeBtnText: { color: '#fff', fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
});

export default BackendStatusScreen;

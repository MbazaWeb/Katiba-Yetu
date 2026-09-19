import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../hooks/useAppContext';
import type { Poll, Section } from '../types';

interface Props {
  onSectionPress: (section: Section) => void;
  onPollPress: (poll: Poll) => void;
  onSearchPress: () => void;
  onBrowsePress: () => void;
  onProfilePress: () => void;
}

export function DesktopHomeScreen({ onSearchPress, onBrowsePress, onProfilePress }: Props) {
  const { language, setLanguage } = useAppContext();
  const { width } = useWindowDimensions();
  const compact = width < 1200;
  const [notifications, setNotifications] = useState(false);
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  return <View style={s.root}>
    <View style={s.toolbar}>
      {(['sw', 'en'] as const).map((lang, index) => <React.Fragment key={lang}>
        {index > 0 && <View style={s.separator} />}
        <Pressable accessibilityRole="button" accessibilityLabel={lang === 'sw' ? 'Kiswahili' : 'English'} accessibilityState={{ selected: language === lang }} onPress={() => setLanguage(lang)} style={s.languageButton}>
          <Text style={[s.language, language === lang && { color: '#00d477' }]}>{lang.toUpperCase()}</Text>
        </Pressable>
      </React.Fragment>)}
      <Pressable accessibilityRole="button" accessibilityLabel={copy('Arifa', 'Notifications')} accessibilityState={{ expanded: notifications }} onPress={() => setNotifications(!notifications)} style={s.toolbarButton}><Ionicons name="notifications-outline" size={29} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={copy('Akaunti', 'Account')} onPress={onProfilePress} style={s.avatar}><Ionicons name="person" size={30} /></Pressable>
    </View>
    {notifications && <View style={s.notification}><Text style={s.body}>{copy('Hakuna arifa mpya.', 'No new notifications.')}</Text></View>}
    <ScrollView contentContainerStyle={[s.content, compact && { paddingHorizontal: 24 }]}>
      <View style={s.hero}>
        <View style={s.heroCopy}>
          <Text accessibilityRole="header" style={[s.title, compact && { fontSize: 38 }]}>{copy('Katiba ni yetu sote.', 'The constitution is ours.')}</Text>
          <Text style={s.subtitle}>{copy('Soma, elewa na shiriki kujenga Tanzania.', 'Read, understand and help build Tanzania.')}</Text>
          <Pressable accessibilityRole="button" onPress={onSearchPress} style={({ pressed }) => [s.search, pressed && s.pressed]}>
            <Ionicons name="search-outline" size={29} color="#b7c1d2" /><Text style={s.searchText}>{copy('Tafuta ibara, neno au mada...', 'Search articles, words or topics...')}</Text>
          </Pressable>
        </View>
      </View>
      <View style={[s.mainGrid, compact && { flexDirection: 'column' }]}>
        <View style={s.leftColumn}>
          <View style={s.actions}>
            {[{ icon: 'book-outline' as const, title: copy('Soma Katiba', 'Read the Constitution'), sub: copy('Vinjari sura na ibara', 'Browse chapters and articles'), action: onBrowsePress }, { icon: 'megaphone-outline' as const, title: copy('Wasilisha Pendekezo', 'Submit Proposal'), sub: copy('Shiriki maoni yako', 'Share your views'), action: onSearchPress }].map((item, i) => <Pressable key={item.icon} accessibilityRole="button" onPress={item.action} style={({ pressed }) => [s.action, i === 1 && s.goldAction, pressed && s.pressed]}>
              <View style={[s.actionIcon, i === 1 && { backgroundColor: '#695000' }]}><Ionicons name={item.icon} size={34} /></View><View style={s.flex}><Text style={s.actionTitle}>{item.title}</Text><Text style={s.actionSub}>{item.sub}</Text></View><Ionicons name="chevron-forward" size={24} />
            </Pressable>)}
          </View>
          <View style={[s.panel, s.welcome]}>
            <View style={s.panelHeader}><Ionicons name="information-circle-outline" /><Text accessibilityRole="header" style={s.heading}>{copy('KARIBU KATIBA YETU', 'WELCOME TO KATIBA YETU')}</Text></View>
            <Text style={s.description}>{copy('Hii ni jukwaa la kikatiba la Tanzania. Soma Katiba, wasilisha mapendekezo, na shiriki kwenye kura za hatua nyingi. Hakuna data ya mfano — yote ni ya kweli.', 'This is a constitutional deliberation platform for Tanzania. Read the Constitution, submit proposals, and participate in multi-stage polls. No demo data — everything is real.')}</Text>
          </View>
        </View>
      </View>
      <View style={[s.panel, s.trending]}>
        <View style={s.panelHeader}><Ionicons name="document-text-outline" /><Text accessibilityRole="header" style={s.heading}>{copy('IBARA ZINAZOJADILIWA', 'ARTICLES IN DISCUSSION')}</Text></View>
        <View style={s.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#7a8a85" />
          <Text style={s.emptyText}>{copy('Hakuna mijadala inayoendelea kwa sasa. Wasilisha pendekezo ili kuanzisha mjadala.', 'No active discussions at the moment. Submit a proposal to start a discussion.')}</Text>
        </View>
      </View>
    </ScrollView>
  </View>;
}

const ink = '#f5f6f7', muted = '#b7c1d2';
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090f10' }, flex: { flex: 1, minWidth: 0 },
  toolbar: { height: 61, borderBottomWidth: 1, borderColor: '#243038', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 36, gap: 10 },
  languageButton: { padding: 8 }, language: { fontSize: 16, color: muted, fontWeight: '600' }, separator: { width: 1, height: 19, backgroundColor: '#384650' }, toolbarButton: { padding: 10, marginHorizontal: 14 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#707c89', alignItems: 'center', justifyContent: 'center' },
  notification: { position: 'absolute', zIndex: 5, right: 35, top: 62, padding: 24, backgroundColor: '#18242a', borderRadius: 8 }, body: { color: ink, fontSize: 16 },
  content: { paddingHorizontal: 46, paddingTop: 20, paddingBottom: 24, width: '100%', maxWidth: 1600, alignSelf: 'center' },
  hero: { flexDirection: 'row', marginBottom: 16, gap: 24 }, heroCopy: { flex: 1.8, minWidth: 0 }, title: { color: ink, fontSize: 54, fontWeight: '800', letterSpacing: -1.4 }, subtitle: { fontSize: 25, color: muted, marginTop: 2, marginBottom: 18 },
  search: { height: 55, borderWidth: 1, borderColor: '#495b6b', backgroundColor: '#151e24', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, gap: 22 }, searchText: { color: muted, fontSize: 19 },
  mainGrid: { flexDirection: 'row', gap: 18, alignItems: 'stretch' }, leftColumn: { flex: 1.53, minWidth: 0, gap: 15 }, actions: { flexDirection: 'row', gap: 15 }, action: { flex: 1.15, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 20, padding: 17, backgroundColor: '#005236', borderWidth: 1, borderColor: '#00cc73', borderRadius: 10 }, goldAction: { flex: 1, backgroundColor: '#886900', borderColor: '#edc100' }, actionIcon: { width: 65, height: 65, borderRadius: 34, backgroundColor: '#003c2c', alignItems: 'center', justifyContent: 'center' }, actionTitle: { fontSize: 22, fontWeight: '700', color: ink }, actionSub: { fontSize: 16, color: ink, marginTop: 3 },
  panel: { borderWidth: 1, borderColor: '#2b3e49', borderRadius: 11, backgroundColor: '#0e171b' },
  welcome: { padding: 22 }, description: { color: muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  trending: { marginTop: 18, paddingHorizontal: 19, paddingBottom: 14 }, panelHeader: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 16 }, heading: { flex: 1, fontSize: 15, fontWeight: '600', color: ink },
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 40 }, emptyText: { color: muted, fontSize: 14, textAlign: 'center', maxWidth: 400, lineHeight: 20 },
  pressed: { opacity: 0.75 },
});

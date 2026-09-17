import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../hooks/useAppContext';
import { POLL_ART13, TRENDING } from '../constants/mockData';
import { t } from '../utils';
import type { Poll, Section } from '../types';

interface Props {
  onSectionPress: (section: Section) => void;
  onPollPress: (poll: Poll) => void;
  onSearchPress: () => void;
  onBrowsePress: () => void;
  onProfilePress: () => void;
}
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const ink = '#f5f6f7', muted = '#b7c1d2', green = '#00d477';
function Icon({ name, size = 24, color = ink }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}
function DocumentIcon() {
  return <View style={s.documentIcon}><Icon name="document-text-outline" size={34} /></View>;
}

/** Desktop-only composition; mobile continues to use HomeScreen. */
export function DesktopHomeScreen({ onSectionPress, onPollPress, onSearchPress, onBrowsePress, onProfilePress }: Props) {
  const { language, setLanguage } = useAppContext();
  const { width } = useWindowDimensions();
  const compact = width < 1200;
  const [notifications, setNotifications] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const copy = (sw: string, en: string) => t(sw, en, language);
  const days = Math.max(0, Math.ceil((Date.parse(POLL_ART13.closes_at) - openedAt) / 86400000));
  return <View style={s.root}>
    <View style={s.toolbar}>
      {(['sw', 'en'] as const).map((lang, index) => <React.Fragment key={lang}>
        {index > 0 && <View style={s.separator} />}
        <Pressable accessibilityRole="button" accessibilityLabel={lang === 'sw' ? 'Kiswahili' : 'English'} accessibilityState={{ selected: language === lang }} onPress={() => setLanguage(lang)} style={s.languageButton}>
          <Text style={[s.language, language === lang && { color: green }]}>{lang.toUpperCase()}</Text>
        </Pressable>
      </React.Fragment>)}
      <Pressable accessibilityRole="button" accessibilityLabel={copy('Arifa', 'Notifications')} accessibilityState={{ expanded: notifications }} onPress={() => setNotifications(!notifications)} style={s.toolbarButton}><Icon name="notifications-outline" size={29} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={copy('Akaunti', 'Account')} onPress={onProfilePress} style={s.avatar}><Icon name="person" size={30} /></Pressable>
    </View>
    {notifications && <View style={s.notification}><Text style={s.body}>{copy('Hakuna arifa mpya.', 'No new notifications.')}</Text></View>}
    <ScrollView contentContainerStyle={[s.content, compact && { paddingHorizontal: 24 }]}>
      <View style={s.hero}>
        <View style={s.heroCopy}>
          <Text accessibilityRole="header" style={[s.title, compact && { fontSize: 38 }]}>{copy('Katiba ni yetu sote.', 'The constitution is ours.')}</Text>
          <Text style={s.subtitle}>{copy('Soma, elewa na shiriki kujenga Tanzania.', 'Read, understand and help build Tanzania.')}</Text>
          <Pressable accessibilityRole="button" onPress={onSearchPress} style={({ pressed }) => [s.search, pressed && s.pressed]}>
            <Icon name="search-outline" size={29} color={muted} /><Text style={s.searchText}>{copy('Tafuta ibara, neno au mada...', 'Search articles, words or topics...')}</Text>
          </Pressable>
        </View>
        {!compact && <View style={s.illustration} accessible={false}>
          <View style={s.building}><View style={s.spire} /><View style={s.dome} /><View style={s.roof} /><View style={s.columns}>{[0,1,2,3,4,5,6].map(i => <View key={i} style={s.column} />)}</View></View>
          <View style={s.hill} /><Text style={s.motto}>{copy('SAUTI\nZETU\nKESHO\nBORA', 'OUR\nVOICES\nBETTER\nTOMORROW')}</Text><View style={s.goldLine} />
        </View>}
      </View>
      <View style={[s.mainGrid, compact && { flexDirection: 'column' }]}>
        <View style={s.leftColumn}>
          <View style={s.actions}>
            {[{ icon: 'book-outline' as const, title: copy('Soma Katiba', 'Read the Constitution'), sub: copy('Vinjari sura na ibara', 'Browse chapters and articles'), action: onBrowsePress }, { icon: 'stats-chart' as const, title: copy('Piga Kura', 'Vote now'), sub: copy('Kura 2 zinaendelea', '2 active polls'), action: () => onPollPress(POLL_ART13) }].map((item, i) => <Pressable key={item.icon} accessibilityRole="button" onPress={item.action} style={({ pressed }) => [s.action, i === 1 && s.goldAction, pressed && s.pressed]}>
              <View style={[s.actionIcon, i === 1 && { backgroundColor: '#695000' }]}><Icon name={item.icon} size={34} /></View><View style={s.flex}><Text style={s.actionTitle}>{item.title}</Text><Text style={s.actionSub}>{item.sub}</Text></View><Icon name="chevron-forward" size={24} />
            </Pressable>)}
          </View>
          <View style={[s.panel, s.poll]}>
            <View style={s.row}><Icon name="stats-chart" color={green} /><Text style={s.eyebrow}>{copy('KURA INAYOENDELEA', 'ACTIVE POLL')}</Text><View style={s.deadline}><Icon name="time-outline" size={18} /><Text style={s.small}>{copy(`Siku ${days} zimebaki`, `${days} days left`)}</Text></View></View>
            <Text accessibilityRole="header" style={s.pollTitle}>{copy(POLL_ART13.title_sw, POLL_ART13.title_en)}</Text>
            {POLL_ART13.options.map((option, index) => <View key={option.id} style={s.result} accessibilityLabel={`${copy(option.label_sw, option.label_en)} ${option.percentage ?? 0}%`}>
              <View style={[s.resultTint, { width: `${option.percentage ?? 0}%`, backgroundColor: ['#00663d', '#0058a9', '#48535d'][index] }]} />
              <Text style={s.option}>{copy(option.label_sw, option.label_en)}</Text><View style={s.track}><View style={[s.fill, { width: `${option.percentage ?? 0}%`, backgroundColor: ['#4fe590', '#269afa', '#a3aab3'][index] }]} /></View><Text style={s.percent}>{option.percentage ?? 0}%</Text>
            </View>)}
            <Text style={s.total}>{copy('Jumla ya kura', 'Total votes')}: {POLL_ART13.total_votes.toLocaleString('en-US')}</Text>
            <Pressable accessibilityRole="button" onPress={() => onPollPress(POLL_ART13)} style={({ pressed }) => [s.vote, pressed && s.pressed]}><Text style={s.voteLabel}>{copy('Piga kura', 'Vote now')}</Text><Icon name="chevron-forward" color="#090e0d" /></Pressable>
          </View>
        </View>
        <View style={[s.panel, s.discussions]}>
          <View style={s.panelHeader}><Icon name="chatbox-outline" /><Text accessibilityRole="header" style={s.heading}>{copy('MJADALA WA HIVI KARIBUNI', 'RECENT DISCUSSIONS')}</Text><Pressable accessibilityRole="button" onPress={onBrowsePress}><Text style={s.link}>{copy('Tazama zote', 'View all')} ›</Text></Pressable></View>
          {TRENDING.map(({ section }, i) => <Pressable key={section.id} accessibilityRole="button" onPress={() => onSectionPress(section)} style={({ pressed }) => [s.discussion, i === 2 && { borderBottomWidth: 0 }, pressed && s.pressed]}>
            <DocumentIcon /><View style={s.flex}><Text style={s.itemTitle}>{copy(section.title_sw, section.title_en)}</Text><Text style={s.description}>{copy(['Je, tunahitaji mipaka ipi katika uhuru wa kutoa maoni?', 'Je, Katiba inahakikisha usawa kwa wote kwa vitendo?', 'Je, muundo wa sasa wa Muungano unapaswa kubadilishwa?'][i], ['What limits should freedom of expression have?', 'Does the Constitution ensure equality for all in practice?', 'Should the current structure of the Union change?'][i])}</Text><View style={s.meta}><Icon name="chatbox-outline" size={20} color={muted} /><Text style={s.metaText}>{copy('Maoni', 'Comments')} {section.meta?.discussion_count ?? 0}</Text></View></View><Icon name="chevron-forward" size={21} color={muted} />
          </Pressable>)}
        </View>
      </View>
      <View style={[s.panel, s.trending]}>
        <View style={s.panelHeader}><Icon name="document-text-outline" /><Text accessibilityRole="header" style={s.heading}>{copy('IBARA ZINAZOJADILIWA', 'ARTICLES IN DISCUSSION')}</Text><Pressable accessibilityRole="button" onPress={onBrowsePress}><Text style={s.link}>{copy('Tazama zote', 'View all')} ›</Text></Pressable></View>
        <View style={[s.articleGrid, compact && { flexDirection: 'column' }]}>{TRENDING.map(({ section }) => <Pressable key={section.id} accessibilityRole="button" onPress={() => onSectionPress(section)} style={({ pressed }) => [s.article, pressed && s.pressed]}><DocumentIcon /><View style={s.flex}><Text style={s.itemTitle}>{copy('Ibara', 'Article')} {section.article_number}</Text><Text style={s.description}>{copy(section.title_sw, section.title_en)}</Text><View style={s.meta}><Icon name="chatbox-outline" size={20} color={muted} /><Text style={s.metaText}>{copy('Maoni', 'Comments')} {section.meta?.discussion_count ?? 0}</Text></View></View><Icon name="chevron-forward" size={22} color={muted} /></Pressable>)}</View>
      </View>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090f10' }, flex: { flex: 1, minWidth: 0 },
  toolbar: { height: 61, borderBottomWidth: 1, borderColor: '#243038', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 36, gap: 10 },
  languageButton: { padding: 8 }, language: { fontSize: 16, color: muted, fontWeight: '600' }, separator: { width: 1, height: 19, backgroundColor: '#384650' }, toolbarButton: { padding: 10, marginHorizontal: 14 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#707c89', alignItems: 'center', justifyContent: 'center' },
  notification: { position: 'absolute', zIndex: 5, right: 35, top: 62, padding: 24, backgroundColor: '#18242a', borderRadius: 8 }, body: { color: ink, fontSize: 16 },
  content: { paddingHorizontal: 46, paddingTop: 20, paddingBottom: 24, width: '100%', maxWidth: 1600, alignSelf: 'center' },
  hero: { flexDirection: 'row', marginBottom: 16, gap: 24 }, heroCopy: { flex: 1.8, minWidth: 0 }, title: { color: ink, fontSize: 54, fontWeight: '800', letterSpacing: -1.4 }, subtitle: { fontSize: 25, color: muted, marginTop: 2, marginBottom: 18 },
  search: { height: 55, borderWidth: 1, borderColor: '#495b6b', backgroundColor: '#151e24', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, gap: 22 }, searchText: { color: muted, fontSize: 19 },
  illustration: { flex: 1, height: 170, overflow: 'hidden' }, building: { position: 'absolute', left: '30%', top: 36, width: 86, alignItems: 'center' }, spire: { width: 1, height: 39, backgroundColor: green, position: 'absolute', top: -39 }, dome: { width: 75, height: 27, borderWidth: 1.5, borderColor: '#00a563', borderTopLeftRadius: 44, borderTopRightRadius: 44 }, roof: { height: 6, width: 87, borderWidth: 1, borderColor: '#00a563' }, columns: { flexDirection: 'row', gap: 10, height: 55 }, column: { width: 1, height: 55, backgroundColor: '#00a563' }, hill: { width: '140%', height: 130, borderTopWidth: 2, borderColor: '#00b56c', borderRadius: '50%', position: 'absolute', left: '-10%', top: 119, transform: [{ rotate: '8deg' }] }, motto: { position: 'absolute', right: 20, top: 24, color: ink, fontSize: 15, lineHeight: 22, letterSpacing: 1.5 }, goldLine: { position: 'absolute', width: 60, height: 3, backgroundColor: '#e7bc00', right: 20, top: 119 },
  mainGrid: { flexDirection: 'row', gap: 18, alignItems: 'stretch' }, leftColumn: { flex: 1.53, minWidth: 0, gap: 15 }, actions: { flexDirection: 'row', gap: 15 }, action: { flex: 1.15, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 20, padding: 17, backgroundColor: '#005236', borderWidth: 1, borderColor: '#00cc73', borderRadius: 10 }, goldAction: { flex: 1, backgroundColor: '#886900', borderColor: '#edc100' }, actionIcon: { width: 65, height: 65, borderRadius: 34, backgroundColor: '#003c2c', alignItems: 'center', justifyContent: 'center' }, actionTitle: { fontSize: 22, fontWeight: '700', color: ink }, actionSub: { fontSize: 16, color: ink, marginTop: 3 },
  panel: { borderWidth: 1, borderColor: '#2b3e49', borderRadius: 11, backgroundColor: '#0e171b' }, poll: { padding: 22 }, row: { flexDirection: 'row', alignItems: 'center', gap: 18 }, eyebrow: { flex: 1, color: green, fontSize: 16, fontWeight: '600' }, deadline: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2b3e49', borderRadius: 24, backgroundColor: '#172127' }, small: { fontSize: 14, color: ink }, pollTitle: { fontSize: 27, fontWeight: '700', color: ink, marginVertical: 12 }, result: { height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1b252d', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, marginBottom: 7, gap: 12 }, resultTint: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 7 }, option: { width: '23%', color: ink, fontSize: 17, fontWeight: '600' }, track: { flex: 1, height: 14, backgroundColor: '#2b3741', borderRadius: 10 }, fill: { height: 14, borderRadius: 10 }, percent: { color: ink, fontSize: 17, fontWeight: '600', width: 39, textAlign: 'right' }, total: { color: muted, fontSize: 16, marginTop: 4, marginBottom: 10 }, vote: { height: 53, backgroundColor: '#eabd08', borderWidth: 1, borderColor: '#ffd227', borderRadius: 8, flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center' }, voteLabel: { color: '#090e0d', fontSize: 22, fontWeight: '700' },
  discussions: { flex: 1, minWidth: 0, paddingHorizontal: 19 }, panelHeader: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 16 }, heading: { flex: 1, fontSize: 15, fontWeight: '600', color: ink }, link: { color: '#00baff', fontSize: 14, paddingVertical: 10 }, discussion: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 17, borderBottomWidth: 1, borderColor: '#273943' }, documentIcon: { width: 64, height: 64, borderRadius: 36, backgroundColor: '#004b35', alignItems: 'center', justifyContent: 'center' }, itemTitle: { color: ink, fontSize: 18, fontWeight: '600' }, description: { color: muted, fontSize: 15, lineHeight: 22, marginTop: 4 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 }, metaText: { color: muted, fontSize: 14 },
  trending: { marginTop: 18, paddingHorizontal: 14, paddingBottom: 14 }, articleGrid: { flexDirection: 'row', gap: 12 }, article: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 24, backgroundColor: '#0b211e', borderWidth: 1, borderColor: '#194539', borderRadius: 9, padding: 20 }, pressed: { opacity: 0.75 },
});

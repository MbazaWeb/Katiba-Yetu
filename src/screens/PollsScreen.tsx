import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { FeaturedPollCard } from '../components/sections/FeaturedPollCard';
import { POLL_ART13, POLL_ART19 } from '../constants/mockData';
import { Colors, Radius, Spacing, Typography } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { t, formatCount } from '../utils';
import type { Poll } from '../types';

export function PollsScreen({
  onPollPress,
  initialPoll,
}: {
  onPollPress: (poll: Poll) => void;
  initialPoll?: Poll;
}) {
  const { language } = useAppContext();
  const allPolls = useMemo(() => [POLL_ART13, POLL_ART19], []);

  // If navigated here for a specific poll (e.g. "Vote now" from Home),
  // surface that poll first so it's immediately actionable.
  const orderedPolls = useMemo(() => {
    if (!initialPoll) return allPolls;
    const rest = allPolls.filter(p => p.id !== initialPoll.id);
    return [initialPoll, ...rest];
  }, [allPolls, initialPoll]);

  const activeCount = allPolls.length;
  const totalVotes = allPolls.reduce((sum, p) => sum + p.total_votes, 0);
  const sectionCount = new Set(allPolls.map(p => p.section_id)).size;

  return <View style={styles.root}>
    <AppHeader title={t('Kura za wananchi', 'Public polls', language)} variant="browser" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="stats-chart" size={24} color={Colors.gold[300]} /></View>
        <View style={{flex:1}}><Text style={styles.heroTitle}>{t('Sauti yako ina umuhimu', 'Your voice matters', language)}</Text><Text style={styles.heroBody}>{t('Shiriki kwenye kura za ushauri kuhusu ibara za Katiba.', 'Take part in advisory polls about constitutional articles.', language)}</Text></View>
      </View>
      <View style={styles.stats}>
        <Stat value={String(activeCount)} label={t('Zinaendelea', 'Active', language)} />
        <View style={styles.divider}/><Stat value={formatCount(totalVotes)} label={t('Kura zote', 'Total votes', language)} />
        <View style={styles.divider}/><Stat value={String(sectionCount)} label={t('Ibara', 'Articles', language)} />
      </View>
      <Text style={styles.label}>{t('KURA ZINAZOENDELEA', 'ACTIVE POLLS', language)}</Text>
      {orderedPolls.map(poll => <View key={poll.id} style={styles.cardGap}><FeaturedPollCard poll={poll} onVotePress={onPollPress} /></View>)}
      <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={20} color={Colors.green[300]} /><Text style={styles.noticeText}>{t('Kura ni za ushauri. Majibu yako yanawekwa kwa usalama na faragha.', 'Polls are advisory. Your responses are stored securely and privately.', language)}</Text></View>
    </ScrollView>
  </View>;
}

function Stat({value,label}:{value:string;label:string}) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View> }
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:Colors.surface.base},content:{padding:Spacing[4],paddingBottom:Spacing[20]},hero:{flexDirection:'row',gap:Spacing[3],alignItems:'center',padding:Spacing[4],borderRadius:Radius.xl,backgroundColor:Colors.green[900],borderWidth:1,borderColor:Colors.green[700]},heroIcon:{width:48,height:48,borderRadius:Radius.full,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(212,168,10,.12)'},heroTitle:{fontFamily:Typography.family.serif,fontSize:Typography.size.lg,fontWeight:Typography.weight.bold,color:Colors.text.primary},heroBody:{fontSize:Typography.size.sm,color:Colors.green[100],lineHeight:19,marginTop:4},stats:{flexDirection:'row',alignItems:'center',paddingVertical:Spacing[5]},stat:{flex:1,alignItems:'center'},statValue:{fontSize:Typography.size.xl,fontWeight:Typography.weight.bold,color:Colors.text.primary},statLabel:{fontSize:Typography.size.xs,color:Colors.text.muted,marginTop:3},divider:{width:1,height:28,backgroundColor:Colors.surface.border},label:{fontSize:Typography.size.xs,fontWeight:Typography.weight.bold,letterSpacing:1,color:Colors.text.muted,marginBottom:Spacing[3]},cardGap:{marginBottom:Spacing[4]},notice:{flexDirection:'row',gap:Spacing[3],padding:Spacing[4],borderRadius:Radius.lg,backgroundColor:Colors.surface.raised,borderWidth:1,borderColor:Colors.surface.border},noticeText:{flex:1,color:Colors.text.secondary,fontSize:Typography.size.xs,lineHeight:18}
});

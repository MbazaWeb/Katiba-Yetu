import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Animated, Alert, Share,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/tokens';
import { AppHeader } from '../components/sections/AppHeader';
import { Card, Divider } from '../components/ui/Card';
import { Badge, StatChip, VerifDot } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PollBar } from '../components/ui/PollBar';
import { Avatar } from '../components/ui/Avatar';
import {
  POLL_ART19, DISCUSSIONS_ART19, SUGGESTIONS_ART19,
  ANALYSIS_ART19, HISTORY_ART19, MOCK_ORGS,
} from '../constants/mockData';
import { useAppContext } from '../hooks/useAppContext';
import {
  t, formatDate, formatRelativeTime, getSuggestionStatusLabel,
  formatCount, truncate,
} from '../utils';
import type { Section, WorkspaceTab, Comment } from '../types';

// ─── Tab definitions ──────────────────────────────────────────────────────────

interface TabDef {
  key: WorkspaceTab;
  label_sw: string;
  label_en: string;
}

const TABS: TabDef[] = [
  { key: 'text',        label_sw: 'Maandishi',     label_en: 'Text'        },
  { key: 'plain',       label_sw: 'Lugha rahisi',  label_en: 'Plain lang.' },
  { key: 'discussion',  label_sw: 'Majadiliano',   label_en: 'Discussion'  },
  { key: 'suggestions', label_sw: 'Mapendekezo',   label_en: 'Suggestions' },
  { key: 'polls',       label_sw: 'Kura',          label_en: 'Polls'       },
  { key: 'analysis',    label_sw: 'Uchambuzi',     label_en: 'Analysis'    },
  { key: 'history',     label_sw: 'Historia',      label_en: 'History'     },
  { key: 'related',     label_sw: 'Zinazohusiana', label_en: 'Related'     },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface SectionWorkspaceProps {
  section: Section;
  onBack: () => void;
}

export function SectionWorkspace({ section, onBack }: SectionWorkspaceProps) {
  const { language } = useAppContext();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('text');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const tabScrollRef = useRef<ScrollView>(null);

  const title = t(section.title_sw, section.title_en, language);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: `Ibara ${section.article_number} — ${title}`,
        message: `Katiba Yetu | Ibara ${section.article_number}: ${title}\nhttps://katibayetu.tz/ibara/${section.id}`,
      });
    } catch {}
  }, [section, title]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <AppHeader
        showBack
        onBack={onBack}
        title={`${language === 'sw' ? 'Ibara' : 'Article'} ${section.article_number}`}
        subtitle={title}
        rightActions={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setIsBookmarked(b => !b)}
              hitSlop={10}
              accessibilityLabel={isBookmarked ? 'Ondoa alama' : 'Weka alama'}
            >
              <Text style={[styles.headerIcon, isBookmarked && styles.headerIconActive]}>
                {isBookmarked ? '★' : '☆'}
              </Text>
            </Pressable>
            <Pressable onPress={handleShare} hitSlop={10} accessibilityLabel="Shiriki">
              <Text style={styles.headerIcon}>⬆</Text>
            </Pressable>
          </View>
        }
      />

      {/* Muungano warning banner */}
      {section.is_muungano && (
        <View style={styles.muunganoBanner}>
          <Text style={styles.muunganoIcon}>⚠</Text>
          <Text style={styles.muunganoText}>
            {t(
              'Mada hii inashughulikiwa kwa makini maalum na bodi ya usimamizi.',
              'This topic is handled with special care by the oversight board.',
              language,
            )}
          </Text>
        </View>
      )}

      {/* Tab rail */}
      <View style={styles.tabRailWrapper}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRail}
          style={styles.tabRailScroll}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const label = language === 'sw' ? tab.label_sw : tab.label_en;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {label}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'text' && <TabText section={section} />}
        {activeTab === 'plain' && <TabPlain section={section} />}
        {activeTab === 'discussion' && <TabDiscussion section={section} />}
        {activeTab === 'suggestions' && <TabSuggestions section={section} />}
        {activeTab === 'polls' && <TabPolls section={section} />}
        {activeTab === 'analysis' && <TabAnalysis section={section} />}
        {activeTab === 'history' && <TabHistory section={section} />}
        {activeTab === 'related' && <TabRelated section={section} />}

        {/* Global disclaimer */}
        <View style={styles.disclaimerRow}>
          <Text style={styles.disclaimerText}>
            {t(
              'Maelezo haya si ushauri wa kisheria.',
              'This information is not legal advice.',
              language,
            )}
          </Text>
        </View>
        <View style={{ height: Spacing[20] }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ORIGINAL TEXT
// ═══════════════════════════════════════════════════════════════════════════════

function TabText({ section }: { section: Section }) {
  const { language, setLanguage } = useAppContext();
  const body = language === 'sw' ? section.body_sw : section.body_en;
  const title = language === 'sw' ? section.title_sw : section.title_en;

  return (
    <View style={tabStyles.wrapper}>
      {/* Locked badge */}
      <View style={tabStyles.lockedRow}>
        <Badge label={t('Maandishi rasmi · Hayabadiliki', 'Official text · Immutable', language)} variant="locked" size="md" />
      </View>

      {/* Language toggle */}
      <View style={tabStyles.langToggle}>
        <Pressable
          style={[tabStyles.langBtn, language === 'sw' && tabStyles.langBtnActive]}
          onPress={() => setLanguage('sw')}
        >
          <Text style={[tabStyles.langBtnText, language === 'sw' && tabStyles.langBtnTextActive]}>
            Kiswahili
          </Text>
        </Pressable>
        <Pressable
          style={[tabStyles.langBtn, language === 'en' && tabStyles.langBtnActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[tabStyles.langBtnText, language === 'en' && tabStyles.langBtnTextActive]}>
            English
          </Text>
        </Pressable>
      </View>

      {/* Article number */}
      <Text style={tabStyles.articleNum}>
        {language === 'sw' ? 'Ibara' : 'Article'} {section.article_number}
      </Text>

      {/* Title */}
      <Text style={tabStyles.articleTitle}>{title}</Text>

      {/* Gold rule */}
      <View style={tabStyles.goldRule} />

      {/* Body text */}
      <Text style={tabStyles.articleBody} selectable>
        {body}
      </Text>

      {/* Action buttons */}
      <View style={tabStyles.textActions}>
        <Pressable style={tabStyles.textActionBtn}>
          <Text style={tabStyles.textActionIcon}>🔊</Text>
          <Text style={tabStyles.textActionLabel}>{t('Sikiliza', 'Listen', language)}</Text>
        </Pressable>
        <Pressable style={tabStyles.textActionBtn}>
          <Text style={tabStyles.textActionIcon}>Aa</Text>
          <Text style={tabStyles.textActionLabel}>{t('Fonti', 'Font', language)}</Text>
        </Pressable>
        <Pressable style={tabStyles.textActionBtn}>
          <Text style={tabStyles.textActionIcon}>🔗</Text>
          <Text style={tabStyles.textActionLabel}>{t('Kiungo', 'Share link', language)}</Text>
        </Pressable>
        <Pressable style={tabStyles.textActionBtn}>
          <Text style={tabStyles.textActionIcon}>⬇</Text>
          <Text style={tabStyles.textActionLabel}>{t('Pakua', 'Download', language)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PLAIN LANGUAGE
// ═══════════════════════════════════════════════════════════════════════════════

function TabPlain({ section }: { section: Section }) {
  const { language } = useAppContext();
  const org = MOCK_ORGS[0];

  const summary_sw = 'Ibara hii inakuambia kwamba una haki ya kusema unachofikiria, na pia kusikiliza watu wengine, bila mtu kukuzuia. Serikali haiwezi kukizuia kwa urahisi mada unayotaka kujua au kuzungumza.';
  const summary_en = 'This article tells you that you have the right to say what you think, and also to listen to other people, without anyone stopping you. The government cannot easily stop you from knowing or discussing topics you want.';

  return (
    <View style={tabStyles.wrapper}>
      <View style={tabStyles.plainCard}>
        <View style={tabStyles.plainHeader}>
          <View style={tabStyles.plainHeaderBar} />
          <Text style={tabStyles.plainHeaderLabel}>
            {t('Maelezo ya lugha rahisi', 'Plain language summary', language)}
          </Text>
        </View>
        <Text style={tabStyles.plainBody}>
          {language === 'sw' ? summary_sw : summary_en}
        </Text>
      </View>

      <View style={tabStyles.plainMeta}>
        <Avatar name={org.name} type="org" orgType={org.type} size="xs" />
        <Text style={tabStyles.plainMetaText}>
          {org.name} · {t('Imekaguliwa', 'Reviewed', language)} {language === 'sw' ? 'Agosti 2026' : 'August 2026'}
        </Text>
      </View>

      <Button
        variant="outline"
        size="md"
        label={t('Niambie zaidi kwa mifano', 'Explain more with examples', language)}
        fullWidth
      />

      {/* Key concepts */}
      <View style={{ gap: Spacing[2], marginTop: Spacing[2] }}>
        <Text style={tabStyles.sectionHeading}>
          {t('Dhana muhimu', 'Key concepts', language)}
        </Text>
        {[
          { sw: 'Uhuru wa maoni', en: 'Freedom of expression', desc_sw: 'Haki ya kusema unachofikiria hadharani', desc_en: 'Right to say what you think publicly' },
          { sw: 'Kupata habari', en: 'Access to information', desc_sw: 'Haki ya kujua mambo yanayokukaribia', desc_en: 'Right to know things that affect you' },
          { sw: 'Vikwazo vya kisheria', en: 'Legal limits', desc_sw: 'Serikali inaweza kuweka mipaka kwa sheria tu', desc_en: 'Government can only restrict through law' },
        ].map((concept, i) => (
          <View key={i} style={tabStyles.conceptRow}>
            <View style={tabStyles.conceptDot} />
            <View style={styles.flex1}>
              <Text style={tabStyles.conceptTitle}>
                {language === 'sw' ? concept.sw : concept.en}
              </Text>
              <Text style={tabStyles.conceptDesc}>
                {language === 'sw' ? concept.desc_sw : concept.desc_en}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — DISCUSSION
// ═══════════════════════════════════════════════════════════════════════════════

function TabDiscussion({ section }: { section: Section }) {
  const { language } = useAppContext();
  const [replyText, setReplyText] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'new' | 'verified'>('top');
  const meta = section.meta;

  const sortLabel = sortBy === 'top'
    ? t('Bora', 'Top', language)
    : sortBy === 'new'
    ? t('Mapya', 'New', language)
    : t('Wataalamu', 'Verified', language);

  return (
    <View style={tabStyles.wrapper}>
      {/* Header row */}
      <View style={tabStyles.discHeader}>
        <Text style={tabStyles.discCount}>
          {t('Maoni', 'Comments', language)} {meta?.discussion_count ?? 0}
        </Text>
        <Pressable
          style={tabStyles.sortBtn}
          onPress={() => setSortBy(s => s === 'top' ? 'new' : s === 'new' ? 'verified' : 'top')}
        >
          <Text style={tabStyles.sortBtnText}>{sortLabel} ⌄</Text>
        </Pressable>
      </View>

      {/* Comments */}
      {DISCUSSIONS_ART19.map((disc) => (
        <CommentCard
          key={disc.id}
          authorName={disc.is_anonymous ? t('Mtumiaji asiyejulikana', 'Anonymous', language) : (disc.org?.name ?? disc.user?.display_name ?? '??')}
          authorType={disc.org ? 'org' : disc.is_anonymous ? 'anon' : 'user'}
          orgType={disc.org?.type}
          badge={disc.org ? 'tls' : disc.is_verified_author ? 'verified' : undefined}
          body={disc.body}
          upvotes={disc.upvotes}
          replyCount={disc.reply_count}
          time={disc.created_at}
        />
      ))}

      {/* Reply composer */}
      <View style={tabStyles.replyComposer}>
        <TextInput
          style={tabStyles.replyInput}
          value={replyText}
          onChangeText={setReplyText}
          placeholder={t('Andika maoni yako...', 'Write your comment...', language)}
          placeholderTextColor={Colors.text.muted}
          multiline
          maxLength={1000}
        />
        <View style={tabStyles.replyFooter}>
          <Text style={tabStyles.replyAnonHint}>
            {t('Unaweza kuchangia kwa jina au bila jina', 'You can contribute anonymously or with your name', language)}
          </Text>
          <Button
            variant="primary"
            size="sm"
            label={t('Tuma', 'Post', language)}
            disabled={!replyText.trim()}
          />
        </View>
      </View>
    </View>
  );
}

function CommentCard({
  authorName, authorType, orgType, badge,
  body, upvotes, replyCount, time,
}: {
  authorName: string;
  authorType: 'user' | 'org' | 'anon';
  orgType?: any;
  badge?: 'tls' | 'verified' | 'nida';
  body: string;
  upvotes: number;
  replyCount: number;
  time: string;
}) {
  const { language } = useAppContext();
  const [liked, setLiked] = useState(false);
  const initials = authorName.split(' ').slice(0, 2).map(w => w[0]).join('');

  return (
    <View style={commentStyles.card}>
      <View style={commentStyles.header}>
        <Avatar
          name={authorName}
          type={authorType}
          orgType={orgType}
          size="sm"
          verified={badge === 'verified' || badge === 'nida'}
        />
        <View style={commentStyles.meta}>
          <View style={commentStyles.nameRow}>
            <Text style={commentStyles.name} numberOfLines={1}>{authorName}</Text>
            {badge && <Badge label={badge === 'tls' ? 'Taasisi' : badge === 'nida' ? 'NIDA' : '✓'} variant={badge} size="sm" />}
          </View>
          <Text style={commentStyles.time}>{formatRelativeTime(time, language)}</Text>
        </View>
      </View>
      <Text style={commentStyles.body}>{body}</Text>
      <View style={commentStyles.actions}>
        <Pressable style={commentStyles.actionBtn} onPress={() => setLiked(l => !l)}>
          <Text style={[commentStyles.actionIcon, liked && { color: Colors.green[400] }]}>↑</Text>
          <Text style={[commentStyles.actionText, liked && { color: Colors.green[400] }]}>
            {liked ? upvotes + 1 : upvotes}
          </Text>
        </Pressable>
        <Pressable style={commentStyles.actionBtn}>
          <Text style={commentStyles.actionIcon}>↩</Text>
          <Text style={commentStyles.actionText}>
            {t('Jibu', 'Reply', language)} {replyCount > 0 ? `(${replyCount})` : ''}
          </Text>
        </Pressable>
        <Pressable style={commentStyles.actionBtn}>
          <Text style={commentStyles.actionIcon}>⚑</Text>
          <Text style={commentStyles.actionText}>{t('Ripoti', 'Report', language)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function TabSuggestions({ section }: { section: Section }) {
  const { language } = useAppContext();

  const statusColors: Record<string, 'gold' | 'green' | 'red' | 'gray'> = {
    submitted: 'gray',
    under_review: 'gold',
    accepted: 'green',
    rejected: 'red',
    merged: 'blue' as any,
    polled: 'blue' as any,
  };

  return (
    <View style={tabStyles.wrapper}>
      <Button
        variant="primary"
        size="md"
        fullWidth
        label={t('Pendekeza mabadiliko', 'Propose a change', language)}
        leftIcon={<Text style={{ color: '#fff', fontSize: 18 }}>＋</Text>}
      />

      <Text style={tabStyles.sectionHeading}>
        {t('Mapendekezo yaliyowasilishwa', 'Submitted proposals', language)} ({SUGGESTIONS_ART19.length})
      </Text>

      {SUGGESTIONS_ART19.map(sugg => {
        const title = language === 'sw' ? sugg.title : sugg.title;
        const rationale = sugg.rationale;
        const proposed = language === 'sw' ? sugg.proposed_text_sw : sugg.proposed_text_en;
        const orgName = sugg.org?.name ?? t('Mtumiaji asiyejulikana', 'Anonymous', language);
        const statusLabel = getSuggestionStatusLabel(sugg.status, language);
        const statusVar = statusColors[sugg.status] ?? 'gray';

        return (
          <View key={sugg.id} style={suggStyles.card}>
            {/* Header */}
            <View style={suggStyles.header}>
              <Avatar
                name={orgName}
                type={sugg.org ? 'org' : 'anon'}
                orgType={sugg.org?.type}
                size="xs"
              />
              <View style={styles.flex1}>
                <Text style={suggStyles.orgName} numberOfLines={1}>{orgName}</Text>
                <Text style={suggStyles.dateMeta}>{formatDate(sugg.created_at, language)}</Text>
              </View>
              <Badge label={statusLabel} variant={statusVar} size="sm" />
            </View>

            {/* Title */}
            <Text style={suggStyles.title}>{title}</Text>

            {/* Proposed text */}
            <View style={suggStyles.proposedBox}>
              <Text style={suggStyles.proposedLabel}>
                {t('Pendekezo la maandishi:', 'Proposed text:', language)}
              </Text>
              <Text style={suggStyles.proposedText}>{proposed}</Text>
            </View>

            {/* Rationale */}
            <Text style={suggStyles.rationale} numberOfLines={3}>{rationale}</Text>

            {/* Footer */}
            <View style={suggStyles.footer}>
              <StatChip icon="👍" count={sugg.endorse_count} color={Colors.green[400]} />
              <StatChip icon="👎" count={sugg.oppose_count} color={Colors.text.muted} />
              <View style={styles.flex1} />
              <Button
                variant="ghost"
                size="sm"
                label={t('Unga mkono', 'Endorse', language)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — POLLS
// ═══════════════════════════════════════════════════════════════════════════════

function TabPolls({ section }: { section: Section }) {
  const { language } = useAppContext();
  const [voted, setVoted] = useState<string | null>(POLL_ART19.user_voted ?? null);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const poll = POLL_ART19;
  const pollTitle = language === 'sw' ? poll.title_sw : poll.title_en;

  const handleVote = () => {
    if (selectedOpt) setVoted(selectedOpt);
  };

  return (
    <View style={tabStyles.wrapper}>
      {/* Poll class badge */}
      <View style={pollStyles.pollHeader}>
        <Badge
          label={t('Kura ya ushauri', 'Advisory poll', language)}
          variant="blue"
          size="md"
        />
        <Badge
          label={poll.status === 'open' ? t('Wazi', 'Open', language) : t('Imefungwa', 'Closed', language)}
          variant={poll.status === 'open' ? 'green' : 'gray'}
          size="sm"
        />
      </View>

      {/* Question */}
      <Text style={pollStyles.question}>{pollTitle}</Text>

      {/* Options */}
      <View style={pollStyles.options}>
        {poll.options.map(opt => (
          <PollBar
            key={opt.id}
            option={opt}
            showResults={!!voted}
            isSelected={voted ? voted === opt.id : selectedOpt === opt.id}
            onSelect={(id) => !voted && setSelectedOpt(id)}
            lang={language}
          />
        ))}
      </View>

      {/* Vote button */}
      {!voted ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          label={t('Piga kura', 'Cast vote', language)}
          disabled={!selectedOpt}
          onPress={handleVote}
        />
      ) : (
        <View style={pollStyles.votedBanner}>
          <Text style={pollStyles.votedIcon}>✓</Text>
          <Text style={pollStyles.votedText}>
            {t('Kura yako imehifadhiwa', 'Your vote has been recorded', language)}
          </Text>
        </View>
      )}

      {/* Stats */}
      <View style={pollStyles.stats}>
        <StatChip icon="👥" count={`${formatCount(poll.total_votes, language)} ${t('wapiga kura', 'voters', language)}`} color={Colors.text.muted} />
        <Text style={pollStyles.statsDot}>·</Text>
        <Text style={pollStyles.statsText}>
          {t('Inafungwa', 'Closes', language)} {formatDate(poll.closes_at, language)}
        </Text>
      </View>

      {/* Audit note */}
      <View style={pollStyles.auditNote}>
        <Text style={pollStyles.auditText}>
          {t(
            'Kura hizi ni za ushauri tu. Matokeo yatashirikiwa hadharani na yanaweza kutumika na Tume ya Katiba.',
            'These are advisory polls. Results are publicly visible and may be used by the Constitutional Commission.',
            language,
          )}
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

function TabAnalysis({ section }: { section: Section }) {
  const { language } = useAppContext();

  return (
    <View style={tabStyles.wrapper}>
      <Text style={tabStyles.sectionHeading}>
        {t('Machapisho ya wataalamu', 'Expert publications', language)} ({ANALYSIS_ART19.length})
      </Text>

      {ANALYSIS_ART19.map(paper => (
        <View key={paper.id} style={analysisStyles.card}>
          <View style={analysisStyles.orgRow}>
            <Avatar
              name={paper.org.name ?? ''}
              type="org"
              orgType={paper.org.type}
              size="sm"
            />
            <View style={styles.flex1}>
              <Text style={analysisStyles.orgName}>{paper.org.name}</Text>
              <Text style={analysisStyles.date}>{formatDate(paper.published_at, language)}</Text>
            </View>
            <Badge label={t('Rasmi', 'Official', language)} variant="tls" size="sm" />
          </View>

          <Text style={analysisStyles.title}>{paper.title}</Text>
          <Text style={analysisStyles.abstract} numberOfLines={4}>{paper.abstract}</Text>

          <View style={analysisStyles.tags}>
            {paper.tags.map(tag => (
              <View key={tag} style={analysisStyles.tag}>
                <Text style={analysisStyles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Button
            variant="outline"
            size="sm"
            label={t('Soma uchambuzi kamili', 'Read full analysis', language)}
            rightIcon={<Text style={{ color: Colors.green[400], fontSize: 14 }}>→</Text>}
          />
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7 — HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

function TabHistory({ section }: { section: Section }) {
  const { language } = useAppContext();

  return (
    <View style={tabStyles.wrapper}>
      <Text style={tabStyles.sectionHeading}>
        {t('Mabadiliko ya ibara', 'Article amendments', language)}
      </Text>

      <View style={histStyles.timeline}>
        {HISTORY_ART19.map((item, idx) => {
          const isLast = idx === HISTORY_ART19.length - 1;
          const isCurrent = item.is_current;
          return (
            <View key={item.year} style={histStyles.timelineItem}>
              {/* Line */}
              <View style={histStyles.lineCol}>
                <View style={[histStyles.dot, isCurrent && histStyles.dotCurrent, !isCurrent && histStyles.dotPast]} />
                {!isLast && <View style={[histStyles.line, isCurrent && histStyles.lineCurrent]} />}
              </View>
              {/* Content */}
              <View style={histStyles.content}>
                <Text style={[histStyles.year, isCurrent && histStyles.yearCurrent]}>
                  {item.year}
                </Text>
                <Text style={histStyles.histTitle}>
                  {language === 'sw' ? item.title_sw : item.title_en}
                </Text>
                <Text style={histStyles.histDesc}>
                  {language === 'sw' ? item.description_sw : item.description_en}
                </Text>
                {isCurrent && (
                  <Badge label={t('Inaendelea', 'Ongoing', language)} variant="green" size="sm" style={{ marginTop: Spacing[1] }} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={histStyles.sourceNote}>
        <Text style={histStyles.sourceNoteText}>
          {t(
            'Chanzo: Gazeti Rasmi la Serikali. Marekebisho yamepitiwa na TLS.',
            'Source: Official Government Gazette. Amendments reviewed by TLS.',
            language,
          )}
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 8 — RELATED
// ═══════════════════════════════════════════════════════════════════════════════

function TabRelated({ section }: { section: Section }) {
  const { language } = useAppContext();

  const related = [
    { artNum: '18', title_sw: 'Uhuru wa dhamiri', title_en: 'Freedom of conscience', rel_sw: 'Ibara zinazohusiana', rel_en: 'Related article' },
    { artNum: '20', title_sw: 'Uhuru wa kukusanyika', title_en: 'Freedom of assembly', rel_sw: 'Ibara zinazohusiana', rel_en: 'Related article' },
    { artNum: '33', title_sw: 'Haki ya elimu', title_en: 'Right to education', rel_sw: 'Habari na elimu', rel_en: 'Information and education' },
    { artNum: 'ICCPR 19', title_sw: 'Mkataba wa Kimataifa', title_en: 'ICCPR Article 19', rel_sw: 'Kiwango cha kimataifa', rel_en: 'International standard' },
  ];

  return (
    <View style={tabStyles.wrapper}>
      <Text style={tabStyles.sectionHeading}>
        {t('Ibara zinazohusiana', 'Related articles', language)}
      </Text>
      {related.map((item, i) => (
        <Pressable
          key={item.artNum}
          style={({ pressed }) => [relStyles.row, pressed && relStyles.rowPressed]}
        >
          <View style={relStyles.num}>
            <Text style={relStyles.numText}>{item.artNum}</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={relStyles.title}>
              {language === 'sw' ? item.title_sw : item.title_en}
            </Text>
            <Text style={relStyles.rel}>
              {language === 'sw' ? item.rel_sw : item.rel_en}
            </Text>
          </View>
          <Text style={relStyles.arrow}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  headerIconActive: {
    color: Colors.gold[300],
  },
  muunganoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.gold[900],
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gold[700],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
  },
  muunganoIcon: {
    fontSize: 14,
    color: Colors.gold[400],
  },
  muunganoText: {
    flex: 1,
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.gold[300],
    lineHeight: Typography.size.xs * 1.5,
  },
  tabRailWrapper: {
    backgroundColor: Colors.surface.raised,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  tabRailScroll: {},
  tabRail: {
    paddingHorizontal: Spacing[2],
    gap: 0,
  },
  tab: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.muted,
    fontWeight: Typography.weight.regular,
  },
  tabTextActive: {
    color: Colors.green[400],
    fontWeight: Typography.weight.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: Spacing[3],
    right: Spacing[3],
    height: 2,
    backgroundColor: Colors.green[500],
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing[4],
  },
  disclaimerRow: {
    marginTop: Spacing[8],
    paddingTop: Spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surface.border,
  },
  disclaimerText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: Typography.size.xs * 1.6,
  },
  flex1: { flex: 1 },
});

const tabStyles = StyleSheet.create({
  wrapper: {
    gap: Spacing[4],
  },
  // Text tab
  lockedRow: {
    flexDirection: 'row',
  },
  langToggle: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  langBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: 'transparent',
  },
  langBtnActive: {
    backgroundColor: Colors.green[700],
  },
  langBtnText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.muted,
    fontWeight: Typography.weight.medium,
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  articleNum: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.sm,
    color: Colors.gold[400],
    letterSpacing: Typography.letterSpacing.wider,
    fontWeight: Typography.weight.medium,
  },
  articleTitle: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size['2xl'],
    color: Colors.text.primary,
    lineHeight: Typography.size['2xl'] * 1.3,
    fontWeight: Typography.weight.regular,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.gold[700],
    marginVertical: Spacing[1],
  },
  articleBody: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.md,
    color: Colors.text.primary,
    lineHeight: Typography.size.md * Typography.lineHeight.loose,
  },
  textActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    flexWrap: 'wrap',
  },
  textActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
  },
  textActionIcon: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  textActionLabel: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  // Plain tab
  plainCard: {
    backgroundColor: Colors.green[900] + '80',
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.green[700],
    padding: Spacing[4],
    gap: Spacing[3],
  },
  plainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  plainHeaderBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.green[500],
  },
  plainHeaderLabel: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.green[300],
  },
  plainBody: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.md,
    color: Colors.text.primary,
    lineHeight: Typography.size.md * 1.7,
  },
  plainMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  plainMetaText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  sectionHeading: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing[1],
  },
  conceptRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'flex-start',
    paddingVertical: Spacing[2.5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  conceptDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold[400],
    marginTop: 5,
    flexShrink: 0,
  },
  conceptTitle: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
  },
  conceptDesc: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: Typography.size.sm * 1.5,
  },
  // Discussion tab
  discHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discCount: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.text.secondary,
  },
  sortBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
  },
  sortBtnText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  replyComposer: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
    overflow: 'hidden',
  },
  replyInput: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    padding: Spacing[3],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surface.border,
    gap: Spacing[2],
  },
  replyAnonHint: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    flex: 1,
  },
});

const commentStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    padding: Spacing[3],
    gap: Spacing[2.5],
  },
  header: {
    flexDirection: 'row',
    gap: Spacing[2.5],
    alignItems: 'flex-start',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  time: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  body: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * 1.6,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  actionIcon: {
    fontSize: 14,
    color: Colors.text.muted,
  },
  actionText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
});

const suggStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2.5],
  },
  orgName: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
  },
  dateMeta: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  title: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    lineHeight: Typography.size.base * 1.4,
  },
  proposedBox: {
    backgroundColor: Colors.surface.overlay,
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold[500],
    padding: Spacing[3],
    gap: Spacing[1],
  },
  proposedLabel: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.gold[400],
    fontWeight: Typography.weight.medium,
  },
  proposedText: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    lineHeight: Typography.size.base * 1.6,
    fontStyle: 'italic',
  },
  rationale: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * 1.6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surface.border,
  },
});

const pollStyles = StyleSheet.create({
  pollHeader: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  question: {
    fontFamily: Typography.family.serif,
    fontSize: Typography.size.xl,
    color: Colors.text.primary,
    lineHeight: Typography.size.xl * 1.4,
    fontWeight: Typography.weight.regular,
  },
  options: {
    gap: Spacing[1],
  },
  votedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    backgroundColor: Colors.green[900] + '80',
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.green[700],
  },
  votedIcon: {
    fontSize: 16,
    color: Colors.green[400],
  },
  votedText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.green[300],
    fontWeight: Typography.weight.medium,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statsDot: {
    color: Colors.text.muted,
  },
  statsText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  auditNote: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
  },
  auditText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    lineHeight: Typography.size.xs * 1.6,
  },
});

const analysisStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2.5],
  },
  orgName: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  date: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
  title: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    lineHeight: Typography.size.base * 1.4,
  },
  abstract: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * 1.6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1.5],
  },
  tag: {
    backgroundColor: Colors.surface.overlay,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[0.5],
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
  },
  tagText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
});

const histStyles = StyleSheet.create({
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  lineCol: {
    alignItems: 'center',
    width: 20,
    flexShrink: 0,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    borderWidth: 2,
    marginTop: Spacing[1],
    flexShrink: 0,
  },
  dotCurrent: {
    backgroundColor: Colors.green[500],
    borderColor: Colors.green[400],
  },
  dotPast: {
    backgroundColor: Colors.surface.overlay,
    borderColor: Colors.surface.borderStrong,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.surface.border,
    marginVertical: Spacing[1],
  },
  lineCurrent: {
    backgroundColor: Colors.green[800],
  },
  content: {
    flex: 1,
    paddingBottom: Spacing[6],
    gap: Spacing[1],
  },
  year: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.sm,
    color: Colors.text.muted,
    fontWeight: Typography.weight.bold,
  },
  yearCurrent: {
    color: Colors.green[400],
  },
  histTitle: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  histDesc: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * 1.5,
  },
  sourceNote: {
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 0.5,
    borderColor: Colors.surface.border,
  },
  sourceNoteText: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
  },
});

const relStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surface.border,
  },
  rowPressed: {
    backgroundColor: Colors.surface.raised,
    marginHorizontal: -Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.md,
  },
  num: {
    width: 52,
    backgroundColor: Colors.surface.raised,
    borderRadius: Radius.md,
    paddingVertical: Spacing[1.5],
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.surface.borderStrong,
    flexShrink: 0,
  },
  numText: {
    fontFamily: Typography.family.mono,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.green[400],
  },
  title: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.text.primary,
  },
  rel: {
    fontFamily: Typography.family.sans,
    fontSize: Typography.size.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: Colors.text.muted,
  },
});

export default SectionWorkspace;

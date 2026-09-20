import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform, Modal, SafeAreaView, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesktopHomeScreen } from './screens/DesktopHomeScreen';
import { ContributionsScreen } from './screens/ContributionsScreen';
import { AppContext } from './hooks/useAppContext';
import { SidebarNav, type SidebarKey } from './components/navigation/SidebarNav';
import { BottomTabBar, type TabKey } from './components/navigation/BottomTabBar';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { HomeScreen } from './screens/HomeScreen';
import { BrowserScreen } from './screens/BrowserScreen';
import { SectionWorkspace } from './screens/SectionWorkspace';
import { PollsScreen } from './screens/PollsScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AuthScreen } from './screens/AuthScreen';
import { LandingScreen } from './screens/LandingScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ResourcesScreen } from './screens/ResourcesScreen';
import { DiscussionScreen } from './screens/DiscussionScreen';
import { ProposedConstitutionScreen } from './screens/ProposedConstitutionScreen';
import { ProposalWorkspaceScreen } from './screens/ProposalWorkspaceScreen';
import { CitizenSubmissionScreen } from './screens/CitizenSubmissionScreen';
import { MultiStagePollScreen } from './screens/MultiStagePollScreen';
import { DraftBuilderScreen } from './screens/DraftBuilderScreen';
import { ApprovalWorkflowScreen } from './screens/ApprovalWorkflowScreen';
import { SystemStatusScreen } from './screens/SystemStatusScreen';
import { AdminScreen } from './screens/AdminScreen';
import { Colors, Layout, Spacing, Typography, Radius } from './constants/tokens';
import { StorageKeys, storageGet, storageSet } from './lib/storage';
import { getAuthService } from './services/authService';
import type { Language, FontSize, User, Section, Poll, ProposedArticle } from './types';

type ScreenName =
  | 'home' | 'browser' | 'polls' | 'search' | 'profile' | 'section_workspace' | 'contributions'
  | 'history' | 'resources' | 'discussion' | 'proposed_constitution' | 'proposal_workspace' | 'auth'
  | 'citizen_submission' | 'multi_stage_polls' | 'draft_builder' | 'approval_workflow' | 'system_status'
  | 'admin';

interface NavState {
  screen: ScreenName;
  params?: { section?: Section; poll?: Poll; proposedArticle?: ProposedArticle };
  previousTab?: TabKey;
}

const TAB_TO_SCREEN: Record<TabKey, ScreenName> = {
  home: 'home', browser: 'browser', search: 'search', more: 'home', profile: 'profile',
};

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= Layout.breakpointDesktop;

  const [language, setLanguage] = useState<Language>('sw');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [landingComplete, setLandingComplete] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [nav, setNav] = useState<NavState>({ screen: 'home' });
  const [libraryDocumentId, setLibraryDocumentId] = useState('doc-union-1977');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const [storedLang, storedFont] = await Promise.all([
        storageGet(StorageKeys.language),
        storageGet(StorageKeys.fontSize),
      ]);
      if (cancelled) return;
      if (storedLang === 'sw' || storedLang === 'en') setLanguage(storedLang);
      if (['sm','md','lg','xl'].includes(storedFont as string)) setFontSize(storedFont as FontSize);
      const service = getAuthService();
      try {
        const current = await service.getCurrentUser();
        if (cancelled) return;
        if (current) setUser(current);
      } catch (e) { console.warn('[auth] getCurrentUser failed', e); }
      unsubscribe = service.onAuthStateChange(u => { if (!cancelled) setUser(u); });
      if (!cancelled) setAuthReady(true);
    })();
    return () => { cancelled = true; if (unsubscribe) unsubscribe(); };
  }, []);

  const handleSignOut = useCallback(async () => {
    try { await getAuthService().signOut(); }
    catch (e) { console.warn('[auth] signOut failed', e); }
    finally { setUser(null); setNav({ screen: 'home' }); setActiveTab('home'); setLandingComplete(false); }
  }, []);

  const changeLanguage = useCallback((l: Language) => { setLanguage(l); storageSet(StorageKeys.language, l); }, []);
  const changeFontSize = useCallback((f: FontSize) => { setFontSize(f); storageSet(StorageKeys.fontSize, f); }, []);

  const navigateToSection = useCallback((section: Section) => {
    if (section.document_id === 'doc-union-1977' || section.document_id === 'doc-zanzibar-1984') setLibraryDocumentId(section.document_id);
    setNav({ screen: 'section_workspace', params: { section }, previousTab: activeTab });
  }, [activeTab]);

  const navigateToPoll = useCallback((poll: Poll) => {
    setNav({ screen: 'polls', params: { poll } });
  }, []);

  const navigateToProposedArticle = useCallback((article: ProposedArticle) => {
    setNav({ screen: 'proposal_workspace', params: { proposedArticle: article }, previousTab: activeTab });
  }, [activeTab]);

  const handleBack = useCallback(() => {
    const prev = nav.previousTab ?? 'home';
    setActiveTab(prev);
    setNav({ screen: TAB_TO_SCREEN[prev] ?? 'home' });
  }, [nav.previousTab]);

  const handleTabPress = useCallback((tab: TabKey) => {
    setMoreOpen(false);
    if (tab === 'more') { setMoreOpen(true); return; }
    setActiveTab(tab);
    setNav({ screen: TAB_TO_SCREEN[tab] });
  }, []);

  // Unified navigation handler for SidebarNav
  const handleSidebarNavigate = useCallback((key: SidebarKey) => {
    setMoreOpen(false);
    // Map sidebar keys to screen names
    const screenMap: Partial<Record<SidebarKey, ScreenName>> = {
      home: 'home', browser: 'browser', search: 'search', profile: 'profile',
      contributions: 'contributions', history: 'history', resources: 'resources',
      discussion: 'discussion', proposed_constitution: 'proposed_constitution',
      citizen_submission: 'citizen_submission', multi_stage_polls: 'multi_stage_polls',
      draft_builder: 'draft_builder', approval_workflow: 'approval_workflow',
      system_status: 'system_status', admin: 'admin', more: 'home',
    };
    const screen = screenMap[key];
    if (screen) {
      setActiveTab(key === 'home' || key === 'browser' || key === 'search' || key === 'profile' ? key as TabKey : activeTab);
      setNav({ screen, previousTab: activeTab });
    }
  }, [activeTab]);

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const renderScreen = () => {
    switch (nav.screen) {
      case 'contributions': return <ContributionsScreen onSectionPress={navigateToSection} />;
      case 'section_workspace': return nav.params?.section ? <SectionWorkspace section={nav.params.section} onBack={handleBack} onSectionPress={navigateToSection} /> : null;
      case 'browser': return <BrowserScreen onSectionPress={navigateToSection} onBack={handleBack} initialDocumentId={libraryDocumentId} onDocumentChange={setLibraryDocumentId} />;
      case 'polls': return <PollsScreen onPollPress={navigateToPoll} initialPoll={nav.params?.poll} />;
      case 'search': return <SearchScreen onSectionPress={navigateToSection} />;
      case 'profile': return <ProfileScreen onAuthPress={() => {}} onSignOut={handleSignOut} />;
      case 'history': return <HistoryScreen onBack={handleBack} />;
      case 'resources': return <ResourcesScreen onBack={handleBack} />;
      case 'discussion': return <DiscussionScreen onBack={handleBack} />;
      case 'proposed_constitution': return <ProposedConstitutionScreen onOpenArticle={navigateToProposedArticle} onBack={handleBack} />;
      case 'proposal_workspace': return nav.params?.proposedArticle ? <ProposalWorkspaceScreen article={nav.params.proposedArticle} onBack={() => setNav({ screen: 'proposed_constitution' })} /> : null;
      case 'citizen_submission': return <CitizenSubmissionScreen onBack={handleBack} />;
      case 'multi_stage_polls': return <MultiStagePollScreen onBack={handleBack} />;
      case 'draft_builder': return <DraftBuilderScreen onBack={handleBack} />;
      case 'approval_workflow': return <ApprovalWorkflowScreen onBack={handleBack} />;
      case 'system_status': return <SystemStatusScreen onBack={handleBack} />;
      case 'admin': return isAdmin ? <AdminScreen onBack={handleBack} currentUser={user} /> : <SystemStatusScreen onBack={handleBack} />;
      case 'home':
      default:
        if (isDesktop) return <DesktopHomeScreen onSectionPress={navigateToSection} onPollPress={navigateToPoll} onSearchPress={() => handleTabPress('search')} onBrowsePress={() => handleTabPress('browser')} onProfilePress={() => handleTabPress('profile')} />;
        return <HomeScreen onSectionPress={navigateToSection} onPollPress={navigateToPoll} onSearchPress={() => handleTabPress('search')} onBrowsePress={() => handleTabPress('browser')} />;
    }
  };

  // Auth gate
  if (!authReady) {
    return <AppErrorBoundary><View style={styles.splash}><Text style={styles.splashTitle}>Katiba Yetu</Text><Text style={styles.splashSub}>{language === 'sw' ? 'Inapakia…' : 'Loading…'}</Text></View></AppErrorBoundary>;
  }

  if (!landingComplete) {
    return <AppErrorBoundary><LandingScreen language={language} hasSession={Boolean(user)} onContinue={() => setLandingComplete(true)} onSignIn={() => { setAuthMode('signin'); setLandingComplete(true); }} onRegister={() => { setAuthMode('register'); setLandingComplete(true); }} /></AppErrorBoundary>;
  }

  if (!user) {
    return <AppErrorBoundary><AppContext.Provider value={{ language, setLanguage: changeLanguage, fontSize, setFontSize: changeFontSize, user, setUser, isOffline: false }}><AuthScreen initialMode={authMode} onBack={() => setLandingComplete(false)} onAuthenticated={() => {}} /></AppContext.Provider></AppErrorBoundary>;
  }

  const isInWorkspace = ['section_workspace', 'proposal_workspace', 'citizen_submission', 'multi_stage_polls', 'draft_builder', 'approval_workflow', 'admin', 'system_status'].includes(nav.screen);

  // Determine active sidebar key
  const sidebarActive: SidebarKey = (() => {
    if (nav.screen === 'admin') return 'admin';
    if (nav.screen === 'system_status') return 'system_status';
    if (nav.screen === 'contributions') return 'contributions';
    if (nav.screen === 'history') return 'history';
    if (nav.screen === 'resources') return 'resources';
    if (nav.screen === 'discussion') return 'discussion';
    if (nav.screen === 'proposed_constitution' || nav.screen === 'proposal_workspace') return 'proposed_constitution';
    if (nav.screen === 'citizen_submission') return 'citizen_submission';
    if (nav.screen === 'multi_stage_polls') return 'multi_stage_polls';
    if (nav.screen === 'draft_builder') return 'draft_builder';
    if (nav.screen === 'approval_workflow') return 'approval_workflow';
    if (nav.screen === 'section_workspace') return 'browser';
    if (nav.screen === 'search') return 'search';
    if (nav.screen === 'profile') return 'profile';
    if (nav.screen === 'browser') return 'browser';
    return 'home';
  })();

  return (
    <AppErrorBoundary>
      <AppContext.Provider value={{ language, setLanguage: changeLanguage, fontSize, setFontSize: changeFontSize, user, setUser, isOffline: false }}>
        <View style={styles.root}>
          {isDesktop && <SidebarNav activeTab={sidebarActive} user={user} onNavigate={handleSidebarNavigate} />}
          <View style={styles.main}>
            <View style={styles.screenArea}>{renderScreen()}</View>
            {!isDesktop && !isInWorkspace && <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} user={user} />}
          </View>
        </View>

        {/* Mobile "More" sheet */}
        <Modal visible={moreOpen} animationType="slide" transparent onRequestClose={() => setMoreOpen(false)}>
          <SafeAreaView style={styles.moreSheet}>
            <View style={styles.moreHeader}>
              <Text style={styles.moreTitle}>{language === 'sw' ? 'Zaidi' : 'More'}</Text>
              <Pressable onPress={() => setMoreOpen(false)} accessibilityRole="button" accessibilityLabel={language === 'sw' ? 'Funga' : 'Close'}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <View style={styles.moreList}>
              <MoreItem icon="megaphone-outline" label={language === 'sw' ? 'Wasilisha Pendekezo' : 'Submit Proposal'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('citizen_submission'); }} />
              <MoreItem icon="stats-chart-outline" label={language === 'sw' ? 'Kura za Hatua' : 'Polls'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('multi_stage_polls'); }} />
              <MoreItem icon="create-outline" label={language === 'sw' ? 'Katiba Inayopendekezwa' : 'Proposed Constitution'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('proposed_constitution'); }} />
              <MoreItem icon="people-outline" label={language === 'sw' ? 'Majadiliano' : 'Discussions'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('discussion'); }} />
              <MoreItem icon="time-outline" label={language === 'sw' ? 'Historia' : 'History'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('history'); }} />
              <MoreItem icon="library-outline" label={language === 'sw' ? 'Maktaba' : 'Library'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('resources'); }} />
              <MoreItem icon="information-circle-outline" label={language === 'sw' ? 'Hadhi ya Mfumo' : 'System Status'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('system_status'); }} />
              {isAdmin && <MoreItem icon="shield-checkmark-outline" label={language === 'sw' ? 'Usimamizi' : 'Admin'} onPress={() => { setMoreOpen(false); handleSidebarNavigate('admin'); }} />}
            </View>
          </SafeAreaView>
        </Modal>
      </AppContext.Provider>
    </AppErrorBoundary>
  );
}

function MoreItem({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.moreItem, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={24} color={Colors.green[300]} />
      <Text style={styles.moreItemText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.surface.base },
  main: { flex: 1 },
  screenArea: { flex: 1, width: '100%', backgroundColor: Colors.surface.base },
  moreSheet: { flex: 1, backgroundColor: Colors.surface.base, paddingTop: Spacing[4] },
  moreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[5], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  moreTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  moreList: { padding: Spacing[4], gap: Spacing[2] },
  moreItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[4], paddingHorizontal: Spacing[3], borderRadius: Radius.lg, backgroundColor: Colors.surface.raised, borderWidth: 1, borderColor: Colors.surface.border },
  moreItemText: { flex: 1, color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.medium },
  splash: { flex: 1, backgroundColor: Colors.surface.base, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  splashTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Colors.green[300] },
  splashSub: { fontSize: Typography.size.base, color: Colors.text.muted },
});

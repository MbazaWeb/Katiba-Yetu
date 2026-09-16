import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppContext } from './hooks/useAppContext';
import { BottomTabBar, TabKey } from './components/navigation/BottomTabBar';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { HomeScreen } from './screens/HomeScreen';
import { BrowserScreen } from './screens/BrowserScreen';
import { SectionWorkspace } from './screens/SectionWorkspace';
import { PollsScreen } from './screens/PollsScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Colors } from './constants/tokens';
import { StorageKeys, storageGet, storageSet } from './lib/storage';
import type { Language, FontSize, User, Section, Poll } from './types';

// ─── Navigation State ─────────────────────────────────────────────────────────

type ScreenName =
  | 'home'
  | 'browser'
  | 'polls'
  | 'search'
  | 'profile'
  | 'section_workspace';

interface NavState {
  screen: ScreenName;
  params?: {
    section?: Section;
    poll?: Poll;
  };
  previousTab?: TabKey;
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── App context state (language + font size persist across launches) ──
  const [language, setLanguage] = useState<Language>('sw');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [user, setUser] = useState<User | null>(null);

  // ── Navigation state ──
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [nav, setNav] = useState<NavState>({ screen: 'home' });

  // ── Hydrate persisted preferences on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedLang, storedFont] = await Promise.all([
        storageGet(StorageKeys.language),
        storageGet(StorageKeys.fontSize),
      ]);
      if (cancelled) return;
      if (storedLang === 'sw' || storedLang === 'en') setLanguage(storedLang);
      if (storedFont === 'sm' || storedFont === 'md' || storedFont === 'lg' || storedFont === 'xl') {
        setFontSize(storedFont);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const changeLanguage = useCallback((l: Language) => {
    setLanguage(l);
    storageSet(StorageKeys.language, l);
  }, []);

  const changeFontSize = useCallback((f: FontSize) => {
    setFontSize(f);
    storageSet(StorageKeys.fontSize, f);
  }, []);

  // ── Handlers ──
  const navigateToSection = useCallback((section: Section) => {
    setNav({
      screen: 'section_workspace',
      params: { section },
      previousTab: activeTab,
    });
  }, [activeTab]);

  const navigateToPoll = useCallback((poll: Poll) => {
    setActiveTab('polls');
    setNav({ screen: 'polls', params: { poll } });
  }, []);

  const handleBack = useCallback(() => {
    const prevTab = nav.previousTab ?? 'home';
    setActiveTab(prevTab);
    setNav({ screen: prevTab === 'home' ? 'home' : prevTab });
  }, [nav.previousTab]);

  const handleTabPress = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    const screenMap: Record<TabKey, ScreenName> = {
      home:    'home',
      browser: 'browser',
      polls:   'polls',
      search:  'search',
      profile: 'profile',
    };
    setNav({ screen: screenMap[tab] });
  }, []);

  // ── Render active screen ──
  const renderScreen = () => {
    switch (nav.screen) {
      case 'section_workspace':
        return nav.params?.section ? (
          <SectionWorkspace
            section={nav.params.section}
            onBack={handleBack}
          />
        ) : null;

      case 'browser':
        return (
          <BrowserScreen
            onSectionPress={navigateToSection}
            onBack={handleBack}
          />
        );

      case 'polls':
        return (
          <PollsScreen
            onPollPress={navigateToPoll}
            initialPoll={nav.params?.poll}
          />
        );

      case 'search':
        return <SearchScreen onSectionPress={navigateToSection} />;

      case 'profile':
        return <ProfileScreen />;

      case 'home':
      default:
        return (
          <HomeScreen
            onSectionPress={navigateToSection}
            onPollPress={navigateToPoll}
            onSearchPress={() => handleTabPress('search')}
            onBrowsePress={() => handleTabPress('browser')}
          />
        );
    }
  };

  const isInWorkspace = nav.screen === 'section_workspace';

  return (
    <AppErrorBoundary>
      <AppContext.Provider
        value={{
          language,
          setLanguage: changeLanguage,
          fontSize,
          setFontSize: changeFontSize,
          user,
          setUser,
          isOffline: false,
        }}
      >
        <View style={styles.root}>
          {/* Screen content */}
          <View style={styles.screenArea}>
            {renderScreen()}
          </View>

          {/* Bottom nav — hidden when in workspace */}
          {!isInWorkspace && (
            <BottomTabBar
              activeTab={activeTab}
              onTabPress={handleTabPress}
              notificationCount={{ polls: 2 }}
            />
          )}
        </View>
      </AppContext.Provider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  screenArea: {
    flex: 1,
  },
});

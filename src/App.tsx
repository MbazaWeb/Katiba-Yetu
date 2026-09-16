import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppContext } from './hooks/useAppContext';
import { BottomTabBar, TabKey } from './components/navigation/BottomTabBar';
import { HomeScreen } from './screens/HomeScreen';
import { BrowserScreen } from './screens/BrowserScreen';
import { SectionWorkspace } from './screens/SectionWorkspace';
import { Colors } from './constants/tokens';
import type { Language, FontSize, User, Section, Poll } from './types';

// ─── Placeholder screens ──────────────────────────────────────────────────────

import {
  View as RNView, Text, StyleSheet as RNStyleSheet,
} from 'react-native';

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <RNView style={pStyles.root}>
      <Text style={pStyles.text}>{title}</Text>
      <Text style={pStyles.sub}>Inakuja hivi karibuni · Coming soon</Text>
    </RNView>
  );
}

const pStyles = RNStyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.base,
    gap: 12,
  },
  text: {
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    color: Colors.text.primary,
  },
  sub: {
    fontSize: 14,
    color: Colors.text.muted,
  },
});

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
  // ── App context state ──
  const [language, setLanguage] = useState<Language>('sw');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [user, setUser] = useState<User | null>(null);

  // ── Navigation state ──
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [nav, setNav] = useState<NavState>({ screen: 'home' });

  // ── Handlers ──
  const navigateToSection = useCallback((section: Section) => {
    setNav({
      screen: 'section_workspace',
      params: { section },
      previousTab: activeTab,
    });
  }, [activeTab]);

  const navigateToPoll = useCallback((poll: Poll) => {
    // In a real app this would navigate to polls tab with the poll open
    setActiveTab('polls');
    setNav({ screen: 'polls' });
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
        return <PlaceholderScreen title="Kura zote" />;

      case 'search':
        return <PlaceholderScreen title="Tafuta" />;

      case 'profile':
        return <PlaceholderScreen title="Akaunti yangu" />;

      case 'home':
      default:
        return (
          <HomeScreen
            onSectionPress={navigateToSection}
            onPollPress={navigateToPoll}
          />
        );
    }
  };

  const isInWorkspace = nav.screen === 'section_workspace';

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
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

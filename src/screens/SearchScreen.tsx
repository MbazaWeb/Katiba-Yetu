import React from 'react';
import { View, ScrollView } from 'react-native';
import { AppHeader } from '../components/sections/AppHeader';
import { LibrarySearch } from '../components/library/LibrarySearch';
import { libraryStyles as s } from '../components/library/LibraryUI';
import { asSection } from '../services/constitution';
import { useAppContext } from '../hooks/useAppContext';
import type { Section } from '../types';

export function SearchScreen({ onSectionPress }: { onSectionPress: (section: Section) => void }) {
  const { language } = useAppContext();
  return <View style={s.root}><AppHeader title={language === 'sw' ? 'Tafuta' : 'Search'} /><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><LibrarySearch onSelect={article => onSectionPress(asSection(article))} /></ScrollView></View>;
}

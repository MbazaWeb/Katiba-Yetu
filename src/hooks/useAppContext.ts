import { createContext, useContext } from 'react';
import type { Language, FontSize, User } from '../types';

interface AppContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  isOffline: boolean;
}

export const AppContext = createContext<AppContextValue>({
  language: 'sw',
  setLanguage: () => {},
  fontSize: 'md',
  setFontSize: () => {},
  user: null,
  setUser: () => {},
  isOffline: false,
});

export function useAppContext() {
  return useContext(AppContext);
}

export function useLanguage() {
  const { language, setLanguage } = useAppContext();
  return { language, setLanguage };
}

export function useFontSize() {
  const { fontSize, setFontSize } = useAppContext();
  return { fontSize, setFontSize };
}

export function useUser() {
  const { user, setUser } = useAppContext();
  return { user, setUser };
}

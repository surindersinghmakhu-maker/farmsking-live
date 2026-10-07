import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as AppStorage from '@/src/lib/storage';

export type ExecutiveTheme = 'EMERALD' | 'DARK' | 'GOLD' | 'SAPPHIRE' | 'AMETHYST' | 'RUBY' | 'OCEAN' | 'PLATINUM';

export interface ThemeConfig {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  headerBg: string;
  headerGradient: [string, string, string];
  shadowColor: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  btnBg: string;
  btnText: string;
  btnIconColor: string;
  titleColor: string;
  subColor: string;
  accentColor: string;
  borderColor: string;
  isDark: boolean;
  statusBarStyle: 'light' | 'dark';
}

export const EXECUTIVE_THEME_CONFIG: Record<ExecutiveTheme, ThemeConfig> = {
  EMERALD: {
    name: 'Royal Emerald',
    icon: 'leaf',
    bg: '#f0fdf4',
    cardBg: '#ffffff',
    cardBorder: '#bbf7d0',
    text: '#0f172a',
    textMuted: '#475569',
    primary: '#16a34a',
    primaryLight: '#dcfce7',
    accent: '#22c55e',
    headerBg: '#15803d',
    headerGradient: ['#15803d', '#16a34a', '#22c55e'],
    shadowColor: '#16a34a',
    tabBarBg: '#ffffff',
    tabBarBorder: '#dcfce7',
    tabBarActive: '#16a34a',
    tabBarInactive: '#94a3b8',
    btnBg: '#ffffff',
    btnText: '#15803d',
    btnIconColor: '#16a34a',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#22c55e',
    borderColor: '#86efac',
    isDark: false,
    statusBarStyle: 'dark',
  },
  DARK: {
    name: 'Midnight Dark',
    icon: 'moon',
    bg: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    primary: '#38bdf8',
    primaryLight: '#0f2942',
    accent: '#22c55e',
    headerBg: '#0f172a',
    headerGradient: ['#0f172a', '#1e293b', '#334155'],
    shadowColor: '#000000',
    tabBarBg: '#1e293b',
    tabBarBorder: '#334155',
    tabBarActive: '#38bdf8',
    tabBarInactive: '#94a3b8',
    btnBg: '#38bdf8',
    btnText: '#0f172a',
    btnIconColor: '#0f172a',
    titleColor: '#ffffff',
    subColor: 'rgba(248, 250, 252, 0.9)',
    accentColor: '#38bdf8',
    borderColor: '#475569',
    isDark: true,
    statusBarStyle: 'light',
  },
  GOLD: {
    name: 'Golden Royal',
    icon: 'sparkles',
    bg: '#fffbeb',
    cardBg: '#ffffff',
    cardBorder: '#fde68a',
    text: '#1c1917',
    textMuted: '#78350f',
    primary: '#d97706',
    primaryLight: '#fef3c7',
    accent: '#f59e0b',
    headerBg: '#b45309',
    headerGradient: ['#b45309', '#d97706', '#f59e0b'],
    shadowColor: '#d97706',
    tabBarBg: '#ffffff',
    tabBarBorder: '#fde68a',
    tabBarActive: '#d97706',
    tabBarInactive: '#a16207',
    btnBg: '#ffffff',
    btnText: '#78350f',
    btnIconColor: '#d97706',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#f59e0b',
    borderColor: '#fcd34d',
    isDark: false,
    statusBarStyle: 'dark',
  },
  SAPPHIRE: {
    name: 'Executive Sapphire',
    icon: 'briefcase',
    bg: '#f0f9ff',
    cardBg: '#ffffff',
    cardBorder: '#bae6fd',
    text: '#0f172a',
    textMuted: '#334155',
    primary: '#2563eb',
    primaryLight: '#e0f2fe',
    accent: '#3b82f6',
    headerBg: '#1e40af',
    headerGradient: ['#1e40af', '#2563eb', '#3b82f6'],
    shadowColor: '#2563eb',
    tabBarBg: '#ffffff',
    tabBarBorder: '#bae6fd',
    tabBarActive: '#2563eb',
    tabBarInactive: '#64748b',
    btnBg: '#ffffff',
    btnText: '#1e40af',
    btnIconColor: '#2563eb',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#3b82f6',
    borderColor: '#7dd3fc',
    isDark: false,
    statusBarStyle: 'dark',
  },
  AMETHYST: {
    name: 'Velvet Amethyst',
    icon: 'diamond',
    bg: '#faf5ff',
    cardBg: '#ffffff',
    cardBorder: '#e9d5ff',
    text: '#1e1b4b',
    textMuted: '#581c87',
    primary: '#9333ea',
    primaryLight: '#f3e8ff',
    accent: '#a855f7',
    headerBg: '#6b21a8',
    headerGradient: ['#6b21a8', '#7e22ce', '#9333ea'],
    shadowColor: '#7e22ce',
    tabBarBg: '#ffffff',
    tabBarBorder: '#e9d5ff',
    tabBarActive: '#9333ea',
    tabBarInactive: '#a855f7',
    btnBg: '#ffffff',
    btnText: '#581c87',
    btnIconColor: '#9333ea',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#a855f7',
    borderColor: '#c084fc',
    isDark: false,
    statusBarStyle: 'dark',
  },
  RUBY: {
    name: 'Imperial Ruby',
    icon: 'flame',
    bg: '#fff1f2',
    cardBg: '#ffffff',
    cardBorder: '#fecdd3',
    text: '#0f172a',
    textMuted: '#881337',
    primary: '#e11d48',
    primaryLight: '#ffe4e6',
    accent: '#f43f5e',
    headerBg: '#be123c',
    headerGradient: ['#be123c', '#e11d48', '#f43f5e'],
    shadowColor: '#e11d48',
    tabBarBg: '#ffffff',
    tabBarBorder: '#fecdd3',
    tabBarActive: '#e11d48',
    tabBarInactive: '#9f1239',
    btnBg: '#ffffff',
    btnText: '#881337',
    btnIconColor: '#e11d48',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#f43f5e',
    borderColor: '#fda4af',
    isDark: false,
    statusBarStyle: 'dark',
  },
  OCEAN: {
    name: 'Deep Ocean Teal',
    icon: 'water',
    bg: '#f0fdfa',
    cardBg: '#ffffff',
    cardBorder: '#99f6e4',
    text: '#0f172a',
    textMuted: '#115e59',
    primary: '#0d9488',
    primaryLight: '#ccfbf1',
    accent: '#14b8a6',
    headerBg: '#0f766e',
    headerGradient: ['#0f766e', '#0d9488', '#14b8a6'],
    shadowColor: '#0d9488',
    tabBarBg: '#ffffff',
    tabBarBorder: '#99f6e4',
    tabBarActive: '#0d9488',
    tabBarInactive: '#0f766e',
    btnBg: '#ffffff',
    btnText: '#115e59',
    btnIconColor: '#0d9488',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#14b8a6',
    borderColor: '#5eead4',
    isDark: false,
    statusBarStyle: 'dark',
  },
  PLATINUM: {
    name: 'Executive Platinum',
    icon: 'shield',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#334155',
    primary: '#475569',
    primaryLight: '#f1f5f9',
    accent: '#64748b',
    headerBg: '#334155',
    headerGradient: ['#334155', '#475569', '#64748b'],
    shadowColor: '#475569',
    tabBarBg: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActive: '#334155',
    tabBarInactive: '#94a3b8',
    btnBg: '#ffffff',
    btnText: '#0f172a',
    btnIconColor: '#475569',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#64748b',
    borderColor: '#cbd5e1',
    isDark: false,
    statusBarStyle: 'dark',
  },
};

const THEME_STORAGE_KEY = 'farmsking_executive_theme_setting';

interface ExecutiveThemeContextValue {
  executiveTheme: ExecutiveTheme;
  setExecutiveTheme: (theme: ExecutiveTheme) => void;
  colors: ThemeConfig;
}

const ExecutiveThemeContext = createContext<ExecutiveThemeContextValue | undefined>(undefined);

export function ExecutiveThemeProvider({ children }: { children: ReactNode }) {
  const [executiveTheme, setExecutiveThemeState] = useState<ExecutiveTheme>('EMERALD');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const saved = await AppStorage.getItemAsync(THEME_STORAGE_KEY);
      if (isMounted && saved && saved in EXECUTIVE_THEME_CONFIG) {
        setExecutiveThemeState(saved as ExecutiveTheme);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setExecutiveTheme = (next: ExecutiveTheme) => {
    setExecutiveThemeState(next);
    AppStorage.setItemAsync(THEME_STORAGE_KEY, next);
  };

  const colors = useMemo(() => EXECUTIVE_THEME_CONFIG[executiveTheme], [executiveTheme]);

  const value = useMemo(
    () => ({
      executiveTheme,
      setExecutiveTheme,
      colors,
    }),
    [executiveTheme, colors]
  );

  return <ExecutiveThemeContext.Provider value={value}>{children}</ExecutiveThemeContext.Provider>;
}

export function useExecutiveTheme(): ExecutiveThemeContextValue {
  const context = useContext(ExecutiveThemeContext);
  if (!context) {
    throw new Error('useExecutiveTheme must be used within an ExecutiveThemeProvider');
  }
  return context;
}

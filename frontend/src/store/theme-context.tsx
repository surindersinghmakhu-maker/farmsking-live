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
    name: 'Cyber Emerald (4D)',
    icon: 'leaf',
    bg: '#020d06',
    cardBg: '#04160c',
    cardBorder: 'rgba(0, 255, 135, 0.22)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    primary: '#00ff87',
    primaryLight: 'rgba(0, 255, 135, 0.15)',
    accent: '#10b981',
    headerBg: '#020b06',
    headerGradient: ['#020b06', '#041d0f', '#072e18'],
    shadowColor: '#00ff87',
    tabBarBg: '#020d06',
    tabBarBorder: 'rgba(0, 255, 135, 0.20)',
    tabBarActive: '#00ff87',
    tabBarInactive: '#94a3b8',
    btnBg: '#00ff87',
    btnText: '#020d06',
    btnIconColor: '#020d06',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#00ff87',
    borderColor: 'rgba(0, 255, 135, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  DARK: {
    name: 'Midnight Dark (4D)',
    icon: 'moon',
    bg: '#020617',
    cardBg: '#0a1024',
    cardBorder: 'rgba(56, 189, 248, 0.22)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    accent: '#00ff87',
    headerBg: '#020617',
    headerGradient: ['#020617', '#081433', '#0e2354'],
    shadowColor: '#38bdf8',
    tabBarBg: '#020617',
    tabBarBorder: 'rgba(56, 189, 248, 0.22)',
    tabBarActive: '#38bdf8',
    tabBarInactive: '#94a3b8',
    btnBg: '#38bdf8',
    btnText: '#020617',
    btnIconColor: '#020617',
    titleColor: '#ffffff',
    subColor: 'rgba(248, 250, 252, 0.9)',
    accentColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  GOLD: {
    name: 'Golden Royal (4D)',
    icon: 'sparkles',
    bg: '#0c0802',
    cardBg: '#1c1305',
    cardBorder: 'rgba(245, 158, 11, 0.25)',
    text: '#ffffff',
    textMuted: '#cbd5e1',
    primary: '#fbbf24',
    primaryLight: 'rgba(251, 191, 36, 0.15)',
    accent: '#00ff87',
    headerBg: '#0c0802',
    headerGradient: ['#0c0802', '#241706', '#3b250a'],
    shadowColor: '#fbbf24',
    tabBarBg: '#0c0802',
    tabBarBorder: 'rgba(245, 158, 11, 0.25)',
    tabBarActive: '#fbbf24',
    tabBarInactive: '#94a3b8',
    btnBg: '#fbbf24',
    btnText: '#0c0802',
    btnIconColor: '#0c0802',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#fbbf24',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  SAPPHIRE: {
    name: 'Executive Sapphire (4D)',
    icon: 'briefcase',
    bg: '#020817',
    cardBg: '#071330',
    cardBorder: 'rgba(59, 130, 246, 0.25)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    primary: '#3b82f6',
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    accent: '#00ff87',
    headerBg: '#020817',
    headerGradient: ['#020817', '#081d4a', '#0d2d70'],
    shadowColor: '#3b82f6',
    tabBarBg: '#020817',
    tabBarBorder: 'rgba(59, 130, 246, 0.25)',
    tabBarActive: '#3b82f6',
    tabBarInactive: '#94a3b8',
    btnBg: '#3b82f6',
    btnText: '#020817',
    btnIconColor: '#020817',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  AMETHYST: {
    name: 'Velvet Amethyst (4D)',
    icon: 'diamond',
    bg: '#070210',
    cardBg: '#130626',
    cardBorder: 'rgba(168, 85, 247, 0.25)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    primary: '#a855f7',
    primaryLight: 'rgba(168, 85, 247, 0.15)',
    accent: '#00ff87',
    headerBg: '#070210',
    headerGradient: ['#070210', '#1c0838', '#2e0e5c'],
    shadowColor: '#a855f7',
    tabBarBg: '#070210',
    tabBarBorder: 'rgba(168, 85, 247, 0.25)',
    tabBarActive: '#a855f7',
    tabBarInactive: '#94a3b8',
    btnBg: '#a855f7',
    btnText: '#070210',
    btnIconColor: '#070210',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  RUBY: {
    name: 'Imperial Ruby (4D)',
    icon: 'flame',
    bg: '#100206',
    cardBg: '#21060e',
    cardBorder: 'rgba(244, 63, 94, 0.25)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    primary: '#f43f5e',
    primaryLight: 'rgba(244, 63, 94, 0.15)',
    accent: '#00ff87',
    headerBg: '#100206',
    headerGradient: ['#100206', '#2b0713', '#450b1e'],
    shadowColor: '#f43f5e',
    tabBarBg: '#100206',
    tabBarBorder: 'rgba(244, 63, 94, 0.25)',
    tabBarActive: '#f43f5e',
    tabBarInactive: '#94a3b8',
    btnBg: '#f43f5e',
    btnText: '#100206',
    btnIconColor: '#100206',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#f43f5e',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  OCEAN: {
    name: 'Deep Ocean Teal (4D)',
    icon: 'water',
    bg: '#010d0c',
    cardBg: '#041c19',
    cardBorder: 'rgba(20, 184, 166, 0.25)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    primary: '#14b8a6',
    primaryLight: 'rgba(20, 184, 166, 0.15)',
    accent: '#00ff87',
    headerBg: '#010d0c',
    headerGradient: ['#010d0c', '#062924', '#0a3d36'],
    shadowColor: '#14b8a6',
    tabBarBg: '#010d0c',
    tabBarBorder: 'rgba(20, 184, 166, 0.25)',
    tabBarActive: '#14b8a6',
    tabBarInactive: '#94a3b8',
    btnBg: '#14b8a6',
    btnText: '#010d0c',
    btnIconColor: '#010d0c',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#14b8a6',
    borderColor: 'rgba(20, 184, 166, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
  },
  PLATINUM: {
    name: 'Executive Platinum (4D)',
    icon: 'shield',
    bg: '#070a0f',
    cardBg: '#111722',
    cardBorder: 'rgba(148, 163, 184, 0.25)',
    text: '#ffffff',
    textMuted: '#94a3b8',
    primary: '#94a3b8',
    primaryLight: 'rgba(148, 163, 184, 0.15)',
    accent: '#00ff87',
    headerBg: '#070a0f',
    headerGradient: ['#070a0f', '#151d2b', '#202b3d'],
    shadowColor: '#94a3b8',
    tabBarBg: '#070a0f',
    tabBarBorder: 'rgba(148, 163, 184, 0.25)',
    tabBarActive: '#94a3b8',
    tabBarInactive: '#64748b',
    btnBg: '#94a3b8',
    btnText: '#070a0f',
    btnIconColor: '#070a0f',
    titleColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.90)',
    accentColor: '#94a3b8',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    isDark: true,
    statusBarStyle: 'light',
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

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as AppStorage from '@/src/lib/storage';

export type AdminThemeMode = 'LIGHT' | 'DARK';

export type ExecutiveTheme =
  | 'LIGHT'
  | 'DARK'
  | 'MEDIUM'
  | 'EMERALD'
  | 'GOLD'
  | 'SAPPHIRE'
  | 'AMETHYST'
  | 'RUBY'
  | 'OCEAN'
  | 'PLATINUM';

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

/** Flagship 4D Dark Theme: Vivid Parrot Green (#22c55e) & Radiant Shaded Gold (#fbbf24) on deep cyber obsidian (#030f14) */
const DARK_PARROT_GOLD_THEME: ThemeConfig = {
  name: '4D Parrot & Shaded Gold Dark (ਸ਼ਾਹੀ ਪੈਰਟ ਤੇ ਸੁਨਹਿਰੀ)',
  icon: 'leaf',
  bg: '#030f14', // Deep obsidian emerald-forest cyber backdrop
  cardBg: 'rgba(6, 26, 30, 0.82)', // Shaded Parrot glassmorphism card
  cardBorder: 'rgba(34, 197, 94, 0.30)', // Parrot Green edge
  text: '#ffffff',
  textMuted: '#94a3b8',
  primary: '#22c55e', // Vibrant Parrot Green
  primaryLight: 'rgba(34, 197, 94, 0.18)',
  accent: '#fbbf24', // Shimmering Radiant Gold
  headerBg: '#030f14',
  headerGradient: ['#031018', '#052622', '#083828'], // Shaded cyber duo-tone parrot emerald
  shadowColor: '#22c55e', // Parrot Green luminous shadow
  tabBarBg: '#030f14',
  tabBarBorder: 'rgba(34, 197, 94, 0.25)',
  tabBarActive: '#22c55e', // Parrot Green active
  tabBarInactive: '#94a3b8',
  btnBg: '#22c55e', // Parrot Green primary button
  btnText: '#020d06', // Contrast text on parrot green
  btnIconColor: '#ffffff',
  titleColor: '#ffffff',
  subColor: '#cbd5e1',
  accentColor: '#fbbf24', // Radiant Gold highlight
  borderColor: 'rgba(251, 191, 36, 0.38)', // Shaded Gold rim border
  isDark: true,
  statusBarStyle: 'light',
};

/** Flagship 4D Light Theme: Pristine Porcelain White (#fbfdfa) with Green & Gold Accents - DEFAULT */
const LIGHT_GOLDEN_GREEN_THEME: ThemeConfig = {
  name: '4D Futuristic Light (ਲਾਈਟ ਗੋਲਡਨ ਗ੍ਰੀਨ)',
  icon: 'sunny',
  bg: '#fbfdfa',
  cardBg: '#ffffff',
  cardBorder: 'rgba(22, 163, 74, 0.20)',
  text: '#0f172a',
  textMuted: '#475569',
  primary: '#16a34a',
  primaryLight: '#f0fdf4',
  accent: '#f59e0b',
  headerBg: '#ffffff',
  headerGradient: ['#ffffff', '#f0fdf4', '#fefce8'],
  shadowColor: '#16a34a',
  tabBarBg: '#ffffff',
  tabBarBorder: 'rgba(22, 163, 74, 0.18)',
  tabBarActive: '#16a34a',
  tabBarInactive: '#64748b',
  btnBg: '#16a34a',
  btnText: '#ffffff',
  btnIconColor: '#ffffff',
  titleColor: '#0f172a',
  subColor: '#475569',
  accentColor: '#f59e0b',
  borderColor: 'rgba(234, 179, 8, 0.35)',
  isDark: false,
  statusBarStyle: 'dark',
};

export const EXECUTIVE_THEME_CONFIG: Record<ExecutiveTheme, ThemeConfig> = {
  LIGHT: LIGHT_GOLDEN_GREEN_THEME,
  DARK: DARK_PARROT_GOLD_THEME,
  MEDIUM: DARK_PARROT_GOLD_THEME,
  EMERALD: DARK_PARROT_GOLD_THEME,
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

export interface ExecutiveThemeContextValue {
  themeMode: AdminThemeMode;
  setThemeMode: (mode: AdminThemeMode) => void;
  executiveTheme: ExecutiveTheme;
  setExecutiveTheme: (theme: ExecutiveTheme) => void;
  colors: ThemeConfig;
  isDark: boolean;
  isLight: boolean;
  isMedium: boolean;
  isDarkTheme: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  innerBg: string;
}

const ExecutiveThemeContext = createContext<ExecutiveThemeContextValue | undefined>(undefined);

export function ExecutiveThemeProvider({ children }: { children: ReactNode }) {
  const [executiveTheme, setExecutiveThemeState] = useState<ExecutiveTheme>('LIGHT');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const saved = await AppStorage.getItemAsync(THEME_STORAGE_KEY);
      if (isMounted && saved) {
        if (saved in EXECUTIVE_THEME_CONFIG) {
          setExecutiveThemeState(saved as ExecutiveTheme);
        } else if (saved === 'dark' || saved === 'DARK' || saved === 'medium' || saved === 'MEDIUM') {
          setExecutiveThemeState('DARK');
        } else {
          setExecutiveThemeState('LIGHT');
        }
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

  const themeMode: AdminThemeMode = useMemo(() => {
    if (executiveTheme === 'DARK' || executiveTheme === 'MEDIUM') return 'DARK';
    return 'LIGHT';
  }, [executiveTheme]);

  const setThemeMode = (mode: AdminThemeMode) => {
    setExecutiveTheme(mode);
  };

  const colors = useMemo(() => EXECUTIVE_THEME_CONFIG[executiveTheme] || EXECUTIVE_THEME_CONFIG.LIGHT, [executiveTheme]);
  const isDark = colors.isDark;
  const isLight = themeMode === 'LIGHT';
  const isMedium = themeMode === 'DARK'; // Alias: Parrot & Gold Dark theme
  const isDarkTheme = themeMode === 'DARK';

  const cardBg = useMemo(() => {
    if (isLight) return 'rgba(255, 255, 255, 0.95)';
    return 'rgba(6, 26, 30, 0.82)'; // Shaded Parrot & Gold Cyber Glass
  }, [isLight]);

  const cardBorder = useMemo(() => {
    if (isLight) return 'rgba(22, 163, 74, 0.20)';
    return 'rgba(34, 197, 94, 0.30)'; // Parrot Green rim
  }, [isLight]);

  const textColor = useMemo(() => {
    if (isLight) return '#0f172a';
    return '#ffffff';
  }, [isLight]);

  const subTextColor = useMemo(() => {
    if (isLight) return '#475569';
    return '#94a3b8';
  }, [isLight]);

  const innerBg = useMemo(() => {
    if (isLight) return '#f8fafc';
    return 'rgba(3, 16, 20, 0.65)'; // Shaded Parrot Cyber inner
  }, [isLight]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      executiveTheme,
      setExecutiveTheme,
      colors,
      isDark,
      isLight,
      isMedium,
      isDarkTheme,
      cardBg,
      cardBorder,
      textColor,
      subTextColor,
      innerBg,
    }),
    [themeMode, executiveTheme, colors, isDark, isLight, isMedium, isDarkTheme, cardBg, cardBorder, textColor, subTextColor, innerBg]
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Language, TranslationKey, translations, LANGUAGE_OPTIONS } from '@/src/constants/translations';

const LANGUAGE_STORAGE_KEY = 'farmsking_user_language';
const VALID_LANGUAGES = new Set<string>(LANGUAGE_OPTIONS.map((opt) => opt.code));

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default language is English ('en') as requested
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language on startup
    const loadSavedLanguage = async () => {
      try {
        let savedLang: string | null = null;
        if (Platform.OS === 'web') {
          savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        } else {
          savedLang = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
        }
        if (savedLang && VALID_LANGUAGES.has(savedLang)) {
          setLanguageState(savedLang as Language);
        }
      } catch (err) {
        console.warn('Failed to load language preference:', err);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } else {
        await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, newLang);
      }
    } catch (err) {
      console.warn('Failed to save language preference:', err);
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    if (key in langDict) {
      return langDict[key];
    }
    if (key in translations.en) {
      return translations.en[key];
    }
    return fallback || String(key);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

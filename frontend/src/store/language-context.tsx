import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Language, TranslationKey, translations, LANGUAGE_OPTIONS } from '@/src/constants/translations';

const LANGUAGE_STORAGE_KEY = 'farmsking_user_language';
const VALID_LANGUAGES = new Set<string>(LANGUAGE_OPTIONS.map((opt) => opt.code));

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default language is English ('en') strictly
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language on startup — English is default unless explicitly chosen
    const loadSavedLanguage = async () => {
      try {
        let savedLang: string | null = null;
        let isExplicit: string | null = null;
        if (Platform.OS === 'web') {
          savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          isExplicit = localStorage.getItem('farmsking_user_language_explicit');
        } else {
          savedLang = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
          isExplicit = await SecureStore.getItemAsync('farmsking_user_language_explicit');
        }

        // Only switch to non-English if the user has explicitly selected it
        if (savedLang && VALID_LANGUAGES.has(savedLang.toLowerCase()) && isExplicit === 'true') {
          setLanguageState(savedLang.toLowerCase() as Language);
        } else {
          setLanguageState('en');
        }
      } catch (err) {
        console.warn('Failed to load language preference:', err);
        setLanguageState('en');
      }
    };
    loadSavedLanguage();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorageChange = () => {
        try {
          const isExplicit = localStorage.getItem('farmsking_user_language_explicit');
          const l = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (l && VALID_LANGUAGES.has(l.toLowerCase()) && isExplicit === 'true') {
            setLanguageState(l.toLowerCase() as Language);
          } else {
            setLanguageState('en');
          }
        } catch {}
      };
      const handleCustomLang = (e: any) => {
        const raw = e?.detail || localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (raw) {
          const lower = String(raw).toLowerCase();
          if (VALID_LANGUAGES.has(lower)) {
            setLanguageState(lower as Language);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('farmsking_language_change', handleCustomLang);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('farmsking_language_change', handleCustomLang);
      };
    }
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
        localStorage.setItem('farmsking_user_language_explicit', 'true');
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('farmsking_language_change', { detail: newLang.toUpperCase() }));
      } else {
        await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, newLang);
        await SecureStore.setItemAsync('farmsking_user_language_explicit', 'true');
      }
    } catch (err) {
      console.warn('Failed to save language preference:', err);
    }
  };

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const langDict = (translations as Record<string, Record<string, string>>)[language] || translations.en;
    if (key in langDict) {
      return langDict[key];
    }
    if (key in translations.en) {
      return (translations.en as Record<string, string>)[key];
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

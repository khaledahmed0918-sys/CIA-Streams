import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';

type Translations = { [key: string]: string };
type Language = 'en' | 'ar';

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });
  const [translations, setTranslations] = useState<{ [key in Language]?: Translations }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    const fetchTranslations = async () => {
        try {
            const [enResponse, arResponse] = await Promise.all([
                fetch('/locales/en.json'),
                fetch('/locales/ar.json')
            ]);
            if (!enResponse.ok || !arResponse.ok) {
                throw new Error('Failed to load translation files');
            }
            const enData = await enResponse.json();
            const arData = await arResponse.json();
            setTranslations({ en: enData, ar: arData });
        } catch (error) {
            console.error("Failed to fetch translations:", error);
            // Set empty translations to avoid breaking the app
            setTranslations({ en: {}, ar: {} });
        } finally {
            setIsLoading(false);
        }
    };
    fetchTranslations();
  }, []);


  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    const langTranslations = translations[language];
    // This check is still useful for keys that might not exist in the files.
    if (!langTranslations || Object.keys(langTranslations).length === 0) {
        return key;
    }
    
    let translation = langTranslations[key as keyof typeof langTranslations] || key;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
      });
    }
    return translation;
  }, [language, translations]);

  // Prevent rendering the app until translations are loaded to avoid showing keys.
  if (isLoading) {
    return null;
  }

  return React.createElement(
    LocalizationContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
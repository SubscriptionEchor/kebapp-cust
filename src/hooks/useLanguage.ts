import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback((lang: 'en' | 'de' | 'tr') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isEnglish: i18n.language === 'en',
    isGerman: i18n.language === 'de',
    isTurkish: i18n.language === 'tr'
  };
};
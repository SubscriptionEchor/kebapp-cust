import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as 'en' | 'de' | 'tr')}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        <option value="en">{t('language.english')}</option>
        <option value="de">{t('language.german')}</option>
        <option value="tr">{t('language.turkish')}</option>
      </select>
    </div>
  );
};

export default LanguageSelector
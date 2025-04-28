import React, { useEffect } from 'react';
import { useTelegram } from '../context/TelegramContext';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const { webApp, colorScheme } = useTelegram();
  const { t } = useTranslation();
  const [notifications, setNotifications] = React.useState(true);
  const [theme, setTheme] = React.useState(colorScheme || 'light');

  useEffect(() => {
    if (webApp && webApp.BackButton) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        window.history.back();
      });
    }

    return () => {
      if (webApp && webApp.BackButton) {
        webApp.BackButton.hide();
        webApp.BackButton.offClick(() => {});
      }
    };
  }, [webApp]);

  const handleSaveSettings = () => {
    if (webApp && webApp.showAlert) {
      webApp.showAlert(t('common.successMessage'));
    }
  };

  return (
    <Layout title={t('screenTitle.profile')}>
      <div className="space-y-6">
        <Card title={t('profile.accountSettings')}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>{t('profile.notifications')}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-secondary"></div>
              </label>
            </div>

            <div className="flex flex-col">
              <span className="mb-2">{t('language.english')}</span>
              <LanguageSelector />
            </div>

            <div className="flex flex-col">
              <span className="mb-2">Theme</span>
              <div className="flex gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    theme === 'light'
                      ? 'bg-secondary text-primary'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    theme === 'dark'
                      ? 'bg-secondary text-primary'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    theme === 'system'
                      ? 'bg-secondary text-primary'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  System
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card title={t('profile.others')}>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Telegram Mini App v1.0.0
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.screenInfo')}
            </p>
          </div>
        </Card>

        <div className="flex justify-center mt-6">
          <Button onClick={handleSaveSettings}>{t('profile.update')}</Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings
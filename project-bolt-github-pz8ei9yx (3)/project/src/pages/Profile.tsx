import React, { useEffect } from 'react';
import { useTelegram } from '../context/TelegramContext';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTranslation } from 'react-i18next';
import { Globe2, Bell, Mail, Phone } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, webApp } = useTelegram();
  const { profile, loading } = useUser();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = React.useState(true);

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'de', name: t('language.german') },
    { code: 'tr', name: t('language.turkish') }
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('selectedLanguage', langCode);
    if (webApp?.showAlert) {
      webApp.showAlert(t('toasts.updated successfully'));
    }
  };

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

  if (loading) {
    return (
      <Layout title={t('screenTitle.profile')}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('screenTitle.profile')}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-secondary text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.first_name.charAt(0)}
          </div>
          <h2 className="text-xl font-semibold font-proxima">
            {profile?.name || `${user?.first_name} ${user?.last_name || ''}`}
          </h2>
          {user?.username && (
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
          )}
        </div>

        <Card title={t('profile.details')}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">{t('profile.email')}</p>
                <p className="font-medium">{profile?.email || 'Not verified'}</p>
                {profile?.emailIsVerified && (
                  <span className="text-xs text-green-600">✓ Verified</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">{t('profile.mobile')}</p>
                <p className="font-medium">{profile?.phone || 'Not verified'}</p>
                {profile?.phoneIsVerified && (
                  <span className="text-xs text-green-600">✓ Verified</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card title={t('profile.accountSettings')}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-600" />
                <span>{t('profile.notifications')}</span>
              </div>
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

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe2 size={20} className="text-gray-600" />
                <span className="font-medium">{t('language.english')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      i18n.language === lang.code
                        ? 'bg-secondary text-primary'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title={t('profile.others')}>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.screenInfo')}
            </p>
          </div>
        </Card>

        <div className="flex justify-center mt-6">
          <Button 
            variant="outline"
            onClick={() => {
              if (webApp && webApp.showAlert) {
                webApp.showAlert(t('common.successMessage'));
              }
            }}
          >
            {t('profile.update')}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, ChevronRight, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext'; 
import { useMutation } from '@apollo/client';
import { TOGGLE_USER_NOTIFICATIONS } from '../graphql/queries';
import { useLanguage } from '../hooks/useLanguage';
import CustomDropdown from '../components/CustomDropdown';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, refetchProfile } = useUser();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [toggleNotifications, { loading: isTogglingNotifications }] = useMutation(TOGGLE_USER_NOTIFICATIONS);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'de', name: t('language.german') },
    { code: 'tr', name: t('language.turkish') }
  ];
  
  const handleToggleNotifications = async () => {
    try {
      await toggleNotifications();
      await refetchProfile();
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
      console.error('Toggle notifications error:', error);
    }
  };

  return (
     <Layout>
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white flex items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-[15px] font-medium text-gray-900">
            {profile?.name || 'Phanindha Kondru'}
          </h1>
          <p className="text-[13px] text-gray-500">
            {profile?.email || 'phani@echortech.com'}
          </p>
        </div>
      </div>

      {/* Account Settings */}
      <div className="mt-4">
        <h2 className="px-4 text-[13px] font-medium text-gray-500 mb-2">
          Account Settings
        </h2>
        
        <div className="bg-white">
          <button 
            onClick={() => navigate('/profile/details')}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
          >
            <span className="text-[15px] text-gray-900">Your Details</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <button 
            onClick={() => navigate('/profile/addresses')}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
          >
            <span className="text-[15px] text-gray-900">Saved Addresses</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <button 
            onClick={() => navigate('/profile/support')}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
          >
            <span className="text-[15px] text-gray-900">Support Center</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[15px] text-gray-900">Notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.notificationEnabled || false}
                onChange={handleToggleNotifications}
                disabled={isTogglingNotifications}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary relative`}>
                {isTogglingNotifications && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="mt-4">
        <h2 className="px-4 text-[13px] font-medium text-gray-500 mb-2">
          Language
        </h2>
        
        <div className="bg-white">
          <div className="">
            <CustomDropdown
              value={currentLanguage}
              options={languages.map(lang => ({
                value: lang.code,
                label: lang.name
              }))}
              onChange={(value) => changeLanguage(value as 'en' | 'de' | 'tr')}
            />
          </div>
        </div>
      </div>

      {/* Other */}
      <div className="mt-4">
        <h2 className="px-4 text-[13px] font-medium text-gray-500 mb-2">
          Other
        </h2>
        
        <div className="bg-white">
          <button 
            onClick={() => navigate('/agreement')}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
          >
            <span className="text-[15px] text-gray-900">User Agreement</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <button 
            onClick={() => navigate('/privacy')}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
          >
            <span className="text-[15px] text-gray-900">Data Protection Policy</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <span className="text-[15px] text-red-500">Request Data Deletion</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 mx-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account Data</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to request deletion of your account data? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  navigate('/delete-data');
                }}
                className="flex-1 py-2.5 bg-secondary text-white rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
     </Layout>
  );
};

export default Profile;
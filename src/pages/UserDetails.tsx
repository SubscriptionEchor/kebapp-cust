import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

const UserDetails: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useUser();
  const [name, setName] = useState(profile?.name || 'Phanindha Kondru');

  const handleSubmit = () => {
    // Handle update logic here
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-[15px] font-semibold text-gray-900 ml-2">
          {t('profile.details')}
        </h1>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={profile?.email || 'phani@echortech.com'}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mobile</label>
          <div className="flex">
            <div className="flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50">
              <span className="text-sm text-gray-500">🇧🇪 +49</span>
            </div>
            <input
              type="tel"
              value="030 12345678"
              disabled
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        {/* Update Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-secondary text-black rounded-lg font-medium mt-6"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default UserDetails;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useBootstrap } from '../context/BootstrapContext';
import { UseLocationDetails } from '../context/LocationContext';
import { Search, MapPin, UserCircle2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TelegramBackButton from './TelegramBackButton';
import Profile from "../assets/svg/profile.svg"
import { AppRoutes } from '../routeenums';

interface HomeHeaderProps {
  onSearch?: (query: string) => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { colorScheme } = useTelegram();
  const { temporaryLocation } = UseLocationDetails();
  const { bootstrapData } = useBootstrap();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const { t } = useTranslation();

  const placeholders = bootstrapData?.homeSearchPlaceholder || [];

  useEffect(() => {
    if (placeholders.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) =>
        (prevIndex + 1) % placeholders.length
      );
    }, 3000); // Change placeholder every 3 seconds

    return () => clearInterval(interval);
  }, [placeholders.length]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const getCurrentPlaceholder = () => {
    if (placeholders.length === 0) return t('home.searchPlaceholder');
    return placeholders[currentPlaceholderIndex];
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-teal-800 to-blue-900">
      {/* Address Selection */}
      <TelegramBackButton />
      <div className="px-4 py-3 flex items-center bg-red justify-between">
        <div
          onClick={() => navigate(AppRoutes.LOCATION_SEARCH)}
          className="flex items-center  gap-2 flex-1 cursor-pointer"
        >

          <div className="flex items-center flex-1">
            <MapPin size={20} className="text-white" />
            <div className="flex flex-col flex-1 mx-2">
              <span className="flex items-center font-sans font-semibold truncate text-white">
                {temporaryLocation?.label ? temporaryLocation?.label : (temporaryLocation?.area || 'Your Location')}
                <ChevronDown size={20} className="text-white" />
              </span>
              <span className="text-xs  text-gray-300 truncate font-sans">
                {(temporaryLocation?.details ? temporaryLocation.details + ', ' : '') + (temporaryLocation?.address?.slice(0, 30) + "..." || 'your Location')}
              </span>
            </div>

          </div>
        </div>
        <img onClick={() => navigate(AppRoutes.PROFILE)} src={Profile} alt="Profile" className="w-8 h-8 rounded-full border-2 border-white" />
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <div
          className="relative cursor-pointer"
          onClick={() => navigate(AppRoutes.SEARCH)}
        >
          <input
            type="text"
            placeholder={`search for "${getCurrentPlaceholder()}"`}
            readOnly
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-gray-900 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 font-sans"
          />
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
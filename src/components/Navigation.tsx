import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Heart, ShoppingBag } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useTranslation } from 'react-i18next';

const Navigation: React.FC = () => {
  const { colorScheme } = useTelegram();
  const { t } = useTranslation();
  const isDarkMode = colorScheme === 'dark';
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) => `
    flex flex-col items-center justify-center px-5 py-2
    ${isActive 
      ? 'text-secondary' 
      : isDarkMode ? 'text-gray-400' : 'text-gray-600'}
    transition-colors duration-200
  `;
  
  return (
    <nav className={`w-full py-2 px-4 ${isDarkMode ? 'bg-primary border-t border-gray-800' : 'bg-white border-t border-gray-200'} shadow-lg`}>
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink to="/home" className={navLinkClass} end>
          {({ isActive }) => (
            <>
              <Home size={20} className={isActive ? 'text-secondary' : ''} />
              <span className="text-xs mt-1">{t('footer.home')}</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/following" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <Heart size={20} className={isActive ? 'text-secondary' : ''} />
              <span className="text-xs mt-1">{t('footer.following')}</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/orders" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <ShoppingBag size={20} className={isActive ? 'text-secondary' : ''} />
              <span className="text-xs mt-1">{t('footer.orders')}</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/profile" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <User size={20} className={isActive ? 'text-secondary' : ''} />
              <span className="text-xs mt-1">{t('footer.profile')}</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
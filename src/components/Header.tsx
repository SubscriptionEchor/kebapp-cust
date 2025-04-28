import React from 'react';
import { useTelegram } from '../context/TelegramContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
  rightComponent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showMenu = false, 
  onMenuClick,
  rightComponent 
}) => {
  const { colorScheme } = useTelegram();
  
  const isDarkMode = colorScheme === 'dark';
  
  return (
    <header className={`sticky top-0 z-10 w-full py-4 px-4 ${isDarkMode ? 'bg-primary text-white' : 'bg-white text-primary'} shadow-sm`}>
      <div className="container flex items-center justify-between max-w-none">
        <div className="flex items-center gap-3">
          {showMenu && (
            <button 
              onClick={onMenuClick}
              className="p-1 rounded-full hover:bg-secondary hover:bg-opacity-10 transition-colors"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
          )}
          <h1 className="text-lg font-bold font-proxima">{title}</h1>
        </div>
        
        {rightComponent && (
          <div>
            {rightComponent}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
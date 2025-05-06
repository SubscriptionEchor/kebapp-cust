import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { ChevronLeft } from 'lucide-react';

const TelegramBackButton: React.FC = () => {
  const { webApp } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  const isEntryPage = ['/', '/splash', '/home'].includes(location.pathname);

  useEffect(() => {
    console.log(webApp, "webapp")
    if (!webApp) return;

    if (isEntryPage) {
      // Show Telegram's native close button
      webApp.BackButton.hide();
    } else {
      // Show custom back button
      webApp.BackButton.show();
    }
  }, [webApp, location.pathname, isEntryPage]);

  if (isEntryPage) {
    return null;
  }

  return (
    <button
      onClick={() => navigate(-1)}
      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
    >
      <ChevronLeft size={20} className="text-gray-600" />
    </button>
  );
};

export default TelegramBackButton;
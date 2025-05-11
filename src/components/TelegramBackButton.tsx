import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { ChevronLeft } from 'lucide-react';

const TelegramBackButton: React.FC = () => {
  const { webApp } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  // Updated logic to check if we're on an entry page
  const isEntryPage = () => {
    const entryPaths = ['/', '/splash', '/home'];
    // Check if current path exactly matches any entry path
    return entryPaths.some(path => path === location.pathname);
  };

  useEffect(() => {
    console.log(webApp, "webapp");
    if (!webApp) return;

    const onEntryPage = isEntryPage();

    if (onEntryPage) {
      // Show Telegram's native close button on entry pages
      webApp.BackButton.hide();
      console.log("Hiding back button on entry page:", location.pathname);
    } else {
      // Show back button on all other pages, including dynamic routes
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        navigate(-1);
      });
      console.log("Showing back button on non-entry page:", location.pathname);
    }

    // Clean up event listener when component unmounts
    return () => {
      if (webApp) {
        webApp.BackButton.offClick();
      }
    };
  }, [webApp, location.pathname, navigate]);

  return null;
};

export default TelegramBackButton;
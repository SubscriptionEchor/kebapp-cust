import React, { Children, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';

const TelegramBackButton: React.FC = ({ Children }) => {
  const { webApp } = useTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('navigationHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  useEffect(() => {
    localStorage.setItem('navigationHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const entryPaths = ['/', '/splash', '/home'];

    if (entryPaths.includes(location.pathname)) {
      setHistory([location.pathname]);
      if (webApp) {
        webApp.BackButton.hide();
      }
      return;
    }

    if (history[history.length - 1] !== location.pathname) {
      setHistory((prev) => [...prev, location.pathname]);
    }
  }, [location.pathname, webApp, history]);

  const handleCustomBack = () => {
    if (history.length <= 1) {
      return;
    }

    const newHistory = [...history];
    const currentPath = newHistory.pop();
    const previousPath = newHistory[newHistory.length - 1];

    if (previousPath === '/' || previousPath === '/splash' || previousPath === '/home') {
      setHistory([previousPath]);
      if (webApp) {
        webApp.BackButton.hide();
      }
    } else {
      setHistory(newHistory);
      if (newHistory.length <= 1 && webApp) {
        webApp.BackButton.hide();
      }
    }
    navigate(previousPath);
  };

  useEffect(() => {
    if (!webApp) return;

    const handleBackNavigation = () => {
      handleCustomBack();
    };

    const entryPaths = ['/', '/splash', '/home'];
    if (entryPaths.includes(location.pathname)) {
      webApp.BackButton.hide();
    } else if (history.length > 1) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBackNavigation);
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.offClick(handleBackNavigation);
    };
  }, [webApp, history, location.pathname]);

  useEffect(() => {
    window.handleCustomBack = handleCustomBack;

    window.clearNavigationHistory = (targetPath = null) => {
      if (targetPath) {
        setHistory([targetPath]);
      } else {
        setHistory([]);
      }

      if (webApp) {
        webApp.BackButton.hide();
      }
    };

    return () => {
      delete window.handleCustomBack;
      delete window.clearNavigationHistory;
    };
  }, [history, webApp]);

  return (
    <div>
      {Children}
    </div>
  );
};

export default TelegramBackButton;
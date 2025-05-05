import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getTelegramWebApp, 
  getUser, 
  getInitData, 
  getInitDataUnsafe, 
  notifyReadyState,
  getColorScheme,
  getThemeParams
} from '../utils/telegram';

interface TelegramContextType {
  webApp: any;
  user: any;
  initData: string | null;
  initDataUnsafe: any;
  colorScheme: 'light' | 'dark' | null;
  themeParams: any;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  initData: null,
  initDataUnsafe: null,
  colorScheme: null,
  themeParams: null,
  isReady: false,
  isLoading: true,
  error: null,
});

interface TelegramProviderProps {
  children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [initDataUnsafe, setInitDataUnsafe] = useState<any>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(null);
  const [themeParams, setThemeParams] = useState<any>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTelegram = async () => {
      try {
        const webAppInstance = getTelegramWebApp();
        if (!webAppInstance) {
          console.warn('Telegram WebApp is not available. Running in development mode.');
          setIsLoading(false);
          return;
        }

        setWebApp(webAppInstance);
        setUser(getUser());
        setInitData(getInitData());
        setInitDataUnsafe(getInitDataUnsafe());
        setColorScheme(getColorScheme());
        setThemeParams(getThemeParams());
        
        notifyReadyState();
        setIsReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Telegram WebApp:', err);
        setError('Failed to initialize Telegram WebApp');
        setIsLoading(false);
      }
    };

    initializeTelegram();
  }, []);

  const value = {
    webApp,
    user,
    initData,
    initDataUnsafe,
    colorScheme,
    themeParams,
    isReady,
    isLoading,
    error,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);

export default TelegramContext;
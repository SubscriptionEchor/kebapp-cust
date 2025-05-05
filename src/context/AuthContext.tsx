import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_VIA_TELEGRAM } from '../graphql/queries';
import { useTelegram } from './TelegramContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  loginData: any;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  initializeAuth: async () => {},
  loginData: null
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initData } = useTelegram();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<any>(null);
  const initializingRef = useRef(false);
  const loginAttemptRef = useRef(false);

  const [loginViaTelegram] = useMutation(LOGIN_VIA_TELEGRAM);

  const initializeAuth = async () => {
    // Prevent multiple simultaneous initialization attempts
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
console.log(initData)
      if (token) {
        setIsAuthenticated(true);
        // If we're on the splash page, navigate to home
        if (location.pathname === '/splash') {
          navigate('/home', { replace: true });
        }
      } else if (initData) {
        await handleLogin();
      } else {
        setError('No initialization data available');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  };

  const handleLogin = async () => {
    // Prevent multiple login attempts
    if (loginAttemptRef.current) return;
    loginAttemptRef.current = true;

    try {
      // Step 1: Login via Telegram
      const { data } = await loginViaTelegram({
        variables: { initData }
      });

      if (!data?.loginViaTelegram?.token) {
        throw new Error('Authentication failed');
      }

      const { token, isNewUser, ...profileData } = data.loginViaTelegram;
      
      // Store token and update authentication state
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      setLoginData(profileData);

      // Navigate to appropriate page
      navigate(!isNewUser ? '/onboarding' : '/home', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed');
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      loginAttemptRef.current = false;
    }
  };

  // Initialize auth on mount and token changes
  useEffect(() => {
    if(!initData){
      return
    }
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setIsLoading(false);
      let redirectLocations=['/','/splash']
      let redirectLocation=redirectLocations.includes(location.pathname)?'/home':location.pathname
       navigate(redirectLocation, { replace: true });
    } else if ((location.pathname=='/'||location.pathname === '/splash') && !initializingRef.current) {
      initializeAuth();
    } else {
      setIsLoading(false);
    }
  }, [initData]);

  // Handle route protection
  useEffect(() => {
    const protectedRoutes = ['/home', '/profile', '/following'];
    if (protectedRoutes.includes(location.pathname)) {
      if (!isAuthenticated && !isLoading) {
        navigate('/splash', { replace: true });
      }
    }
  }, [location.pathname, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      error,
      initializeAuth,
      loginData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
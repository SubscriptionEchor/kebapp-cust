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
  locationCheckComplete: boolean; // New state
  setLocationCheckComplete: (value: boolean) => void; // New setter
  isNewUser: boolean | null; // Track if the user is new
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  initializeAuth: async () => { },
  loginData: null,
  locationCheckComplete: false, // Default value
  setLocationCheckComplete: () => { }, // Default no-op
  isNewUser: null, // Default value
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
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null); // Track if the user is new
  const [locationCheckComplete, setLocationCheckComplete] = useState(false);
  const [couponCodeId, setCouponCodeId] = useState("")
  const initializingRef = useRef(false);
  const loginAttemptRef = useRef(false);

  const [loginViaTelegram] = useMutation(LOGIN_VIA_TELEGRAM);

  const initializeAuth = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (token) {
        // Token is already present, skip login
        setIsAuthenticated(true);
        const isNewUserStored = localStorage.getItem('isNewUser') === 'true';
        setIsNewUser(isNewUserStored);
      } else if (initData) {
        // Token is not present, proceed with login
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
    if (loginAttemptRef.current) return;
    loginAttemptRef.current = true;

    try {
      const { data } = await loginViaTelegram({
        variables: { initData },
      });

      if (!data?.loginViaTelegram?.token) {
        throw new Error('Authentication failed');
      }

      const { token, isNewUser, ...profileData } = data.loginViaTelegram;

      localStorage.setItem('token', token);
      localStorage.setItem('isNewUser', isNewUser.toString());
      setIsAuthenticated(true);
      setIsNewUser(isNewUser);
      setLoginData(profileData);
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed');
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      loginAttemptRef.current = false;
    }
  };

  useEffect(() => {
    if (!initData) return;

    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setIsLoading(false);
      const isNewUserStored = localStorage.getItem('isNewUser') === 'true';
      setIsNewUser(isNewUserStored);
    } else if ((location.pathname === '/' || location.pathname === '/splash') && !initializingRef.current) {
      initializeAuth();
    } else {
      setIsLoading(false);
    }
  }, [initData]);

  // Handle route protection
  useEffect(() => {
    const protectedRoutes = ['/home', '/profile', '/following', '/onboarding', '/splash'];
    if (protectedRoutes.includes(location.pathname)) {

      if (!isAuthenticated && !isLoading) {
        navigate('/splash', { replace: true });
        return
      }
      let isNewUserStored = localStorage.getItem('isNewUser') === 'true';

      if (isAuthenticated && location.pathname === '/onboarding' && !isNewUserStored) {
        navigate('/home', { replace: true });
        return;
      }
    }
  }, [location.pathname, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        initializeAuth,
        loginData,
        isNewUser,
        locationCheckComplete,
        setLocationCheckComplete,
        couponCodeId,
        setCouponCodeId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
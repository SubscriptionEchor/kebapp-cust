import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { PROFILE } from '../graphql/queries';
import { useAuth } from './AuthContext';

interface UserContextType {
  profile: any;
  loading: boolean;
  error: any;
  refetchProfile: () => Promise<any>;
  setProfile: (profile: any) => void;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: true,
  error: null,
  refetchProfile: async () => {},
  setProfile: () => {},
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<any>(null);
  const { isAuthenticated, loginData } = useAuth();

  const { loading, error, refetch } = useQuery(PROFILE, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    onCompleted: (data) => {
      if (data?.profile) {
        setProfile(data.profile);
      }
    },
  });

  const refetchProfile = async () => {
    try {
      const { data } = await refetch();
      if (data?.profile) {
        setProfile(data.profile);
      }
      return data;
    } catch (error) {
      console.error('Error refetching profile:', error);
      throw error;
    }
  };

  // Set initial profile data from login response
  useEffect(() => {
    if (loginData && !profile) {
      setProfile(loginData);
    }
  }, [loginData]);

  // Fetch profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !profile && !loading) {
      refetchProfile();
    }
  }, [isAuthenticated]);

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        error,
        refetchProfile,
        setProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
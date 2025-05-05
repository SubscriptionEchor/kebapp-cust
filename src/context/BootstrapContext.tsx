import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { CUSTOMER_BOOTSTRAP } from '../graphql/queries';
import { useAuth } from './AuthContext';

interface BootstrapContextType {
  bootstrapData: any;
  loading: boolean;
  error: any;
  refetchBootstrap: () => Promise<any>;
}

const BootstrapContext = createContext<BootstrapContextType>({
  bootstrapData: null,
  loading: true,
  error: null,
  refetchBootstrap: async () => {},
});

export const useBootstrap = () => useContext(BootstrapContext);

interface BootstrapProviderProps {
  children: ReactNode;
}

export const BootstrapProvider: React.FC<BootstrapProviderProps> = ({ children }) => {
  const [bootstrapData, setBootstrapData] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  
  const { data, loading, error, refetch } = useQuery(CUSTOMER_BOOTSTRAP, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    onCompleted: (data) => {
      if (data?.customerBootstrap) {
        setBootstrapData(data.customerBootstrap);
      }
    },
  });

  const refetchBootstrap = async () => {
    try {
      const { data } = await refetch();
      if (data?.customerBootstrap) {
        setBootstrapData(data.customerBootstrap);
      }
      return data;
    } catch (error) {
      console.error('Error refetching bootstrap:', error);
      throw error;
    }
  };

  // Fetch bootstrap data when authenticated
  useEffect(() => {
    if (isAuthenticated && !bootstrapData && !loading) {
      refetchBootstrap();
    }
  }, [isAuthenticated]);

  return (
    <BootstrapContext.Provider
      value={{
        bootstrapData,
        loading,
        error,
        refetchBootstrap
      }}
    >
      {children}
    </BootstrapContext.Provider>
  );
};
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LocationContextType {
  temporaryLocation: {
    latitude: number;
    longitude: number;
    area?: string;
    address?: string;
  } | null;
  setTemporaryLocation: (location: { 
    latitude: number; 
    longitude: number; 
    area?: string;
    address?: string; 
  } | null) => void;
}

const LocationContext = createContext<LocationContextType>({
  temporaryLocation: null,
  setTemporaryLocation: () => {},
});

export const useLocation = () => useContext(LocationContext);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [temporaryLocation, setTemporaryLocation] = useState<{
    latitude: number;
    longitude: number;
    area?: string;
    address?: string;
  } | null>(null);

  return (
    <LocationContext.Provider value={{ temporaryLocation, setTemporaryLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
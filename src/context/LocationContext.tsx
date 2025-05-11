import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface LocationContextType {
  storeTemporaryLocation: (location: any) => void;
  clearTemporaryLocation: () => void;
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
  storeTemporaryLocation: () => { },
  setTemporaryLocation: () => { },
  clearTemporaryLocation: () => { },
});

export const UseLocationDetails = () => useContext(LocationContext);

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

  const storeTemporaryLocation = (location: any) => {
    localStorage.setItem('temporaryLocation', JSON.stringify(location));
    setTemporaryLocation(location)
  }

  useEffect(() => {
    let storedLocation = localStorage.getItem('temporaryLocation');
    storedLocation = storedLocation ? JSON.parse(storedLocation) : null;
    if (storedLocation) {
      setTemporaryLocation(storedLocation)
    }
  }, []);

  const clearTemporaryLocation = () => {
    localStorage.removeItem('temporaryLocation');
    setTemporaryLocation(null);
  };


  return (
    <LocationContext.Provider value={{ temporaryLocation, clearTemporaryLocation, storeTemporaryLocation, setTemporaryLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
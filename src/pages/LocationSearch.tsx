import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Plus, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next'; 
import { useDebounce } from '../hooks/useDebounce';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import { useZoneCheck } from '../hooks/useZoneCheck'; 
import { useLocation } from '../context/LocationContext';

const LocationSearch: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useUser();
  const { setTemporaryLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 1000);
  const searchResultsRef = React.useRef<HTMLDivElement>(null);
  const { checkLocationZone, loading: zoneCheckLoading, showFallbackModal, handleFallbackConfirm, handleFallbackCancel } = useZoneCheck();

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error(t('toasts.geolocationisnotsupportedbythisbrowser'));
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        checkLocationZone(latitude, longitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(t('toasts.userdenied'));
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error(t('toasts.Positionunavailable'));
            break;
          case error.TIMEOUT:
            toast.error(t('toasts.locationtimeout'));
            break;
          default:
            toast.error(t('toasts.unknownerror'));
        }
      },
      { timeout: 10000 }
    );
  };

  // Handle click outside search results
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setLocations([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Search for locations when debounced search value changes
  React.useEffect(() => {
    const searchLocations = async () => {
      if (!searchQuery?.trim()) {
        setLocations([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://maps.kebapp-chefs.com:444/api?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        const data = await response.json();
        // Transform the features array into location objects
        const transformedLocations = data.features.map((feature: any) => ({
          id: feature.properties.osm_id,
          name: feature.properties.name,
          address: [
            feature.properties.street,
            feature.properties.city,
            feature.properties.postcode,
            feature.properties.country
          ].filter(Boolean).join(', '),
          coordinates: feature.geometry.coordinates
        }));
        setLocations(transformedLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to fetch locations');
      } finally {
        setIsLoading(false);
      }
    };

    searchLocations();
  }, [searchQuery]);

  const handleLocationSelect = (location: any) => {
    // Handle location selection
    console.log('Selected location:', location);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[15px] font-semibold text-gray-900">
          {t('selectLocation.title')}
        </h1>
      </div>

      {/* Search Box */}
      <div className="p-4 relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('selectLocation.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <Search 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>

        {/* Search Results */}
        <div ref={searchResultsRef} className="absolute right-3 left-3 bg-white top-16 rounded-lg shadow-lg">
          {isLoading ? (
            <div className="mt-4 py-4 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : locations.length > 0 ? (
            <div className="mt-4 max-h-[300px] overflow-y-auto rounded-lg shadow-sm">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <MapPin size={20} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-medium text-gray-900">{location.name}</h3>
                    <p className="text-xs text-gray-500">{location.address}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery && !isLoading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              No locations found
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLoadingLocation || zoneCheckLoading}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-xl hover:from-secondary/10 hover:to-secondary/20 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              {(isLoadingLocation || zoneCheckLoading) ? (
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation size={20} className="text-secondary" />
              )}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[15px] font-medium text-gray-900">
                {t('selectLocation.currentLocation')}
              </h3>
             
            </div>
          </button>

          <button
            onClick={() => {/* Handle add new address */}}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-xl hover:from-secondary/10 hover:to-secondary/20 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Plus size={20} className="text-secondary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[15px] font-medium text-gray-900 ">
                {t('selectLocation.addNewAddress')}
              </h3>
            
            </div>
          </button>
        </div>

        {/* Saved Addresses */}
        {profile?.addresses && profile.addresses.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[15px] font-medium text-gray-900 mb-3">
              {t('selectLocation.savedAddresses')}
            </h2>
            {profile.addresses.map((address: any) => (
              <button
                key={address._id}
                onClick={() => handleLocationSelect(address)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <MapPin size={20} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-medium text-gray-900">{address.label}</h3>
                  <p className="text-xs text-gray-500">{address.deliveryAddress}</p>
                  {address.selected && (
                    <span className="text-xs text-secondary font-medium mt-1">
                      {t('selectLocation.selected')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Fallback Zone Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('common.setAsDefault')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('common.unavailableInfo')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleFallbackCancel}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleFallbackConfirm}
                className="flex-1 py-2.5 bg-secondary text-black rounded-lg font-medium"
              >
                {t('common.setAsDefault')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
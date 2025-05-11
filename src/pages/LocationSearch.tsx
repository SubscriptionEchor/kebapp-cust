import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Plus, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../hooks/useDebounce';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import { useZoneCheck } from '../hooks/useZoneCheck';
import { UseLocationDetails } from '../context/LocationContext';
import Layout from '../components/Layout';
import { ApolloClient, NormalizedCacheObject, useApolloClient, useLazyQuery } from '@apollo/client';
import { CHECK_ZONE_RESTRICTIONS } from '../graphql/queries';
import { getLocationFromCoordinates } from '../utils/locationUtils';
import { handleNavigationWithZoneCheck } from '../utils/navigation';

const LocationSearch: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useUser();
  const { storeTemporaryLocation } = UseLocationDetails();
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const searchResultsRef = React.useRef<HTMLDivElement>(null);
  // const { checkLocationZone, loading: zoneCheckLoading,, handleFallbackConfirm, handleFallbackCancel } = useZoneCheck();
  const [checkZone, { loading }] = useLazyQuery(CHECK_ZONE_RESTRICTIONS)
  const [fallbackLocation, setFallbackLocation] = useState<any>(null);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [addressType, setAddressType] = useState('')

  const apolloClient = useApolloClient();

  // Search for locations when debounced search value changes
  React.useEffect(() => {
    const searchLocations = async () => {
      console.log("yayaya")
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


  useEffect(() => {
    (async () => {
      if (fallbackLocation && !showFallbackModal && addressType && addressType !== "newaddress") {
        const { coordinates } = fallbackLocation.defaultLocation
        const locationDetails = await getLocationFromCoordinates(coordinates[1], coordinates[0]);
        let currentLocationType = addressType == "currentLocation"
        setAddressType('')
        if (currentLocationType) {
          storeTemporaryLocation({
            latitude: coordinates[1],
            longitude: coordinates[0],
            area: locationDetails.area,
            address: locationDetails.address
          })
          return navigate('/home', { replace: true });
        }
        navigate('/saveAddress', {
          state: {
            location: {
              latitude: coordinates[1],
              longitude: coordinates[0],
              area: locationDetails.area,
              address: locationDetails.address
            }
          }
        });
      }
    })
  }, [showFallbackModal, fallbackLocation])

  const handleLocationSelect = async (location: any) => {
    let { data, loading, error } = await checkZone({
      variables: {
        inputValues: {
          latitude: location?.coordinates[1],
          longitude: location?.coordinates[0]
        }
      }
    })
    if (error) {
      toast.error(t('toasts.locationerror'));
    }
    if (data?.checkZoneRestrictions?.selectedZoneDetails) {
      navigate('/saveAddress', {
        state: {
          location: {
            latitude: location?.coordinates[1],
            longitude: location?.coordinates[0],
            area: location.name,
            address: location.address
          }
        }
      });

    }
    else if (data?.checkZoneRestrictions?.fallbackZoneDetails) {
      setFallbackLocation(data?.checkZoneRestrictions?.fallbackZoneDetails);
      setShowFallbackModal(true);
    }
    else {
      toast.error(t('toasts.locationerror'));
    }

  };

  const handleFallbackConfirm = async () => {
    if (fallbackLocation && addressType) {
      const { coordinates } = fallbackLocation.defaultLocation
      try {
        const locationDetails = await getLocationFromCoordinates(coordinates[1], coordinates[0]);
        let currentLocationType = addressType == "currentLocation"
        setAddressType('')
        if (currentLocationType) {
          storeTemporaryLocation({
            latitude: coordinates[1],
            longitude: coordinates[0],
            area: locationDetails.area,
            address: locationDetails.address
          })
          return navigate('/home', { replace: true });
        }
        navigate('/saveAddress', {
          state: {
            location: {
              latitude: coordinates[1],
              longitude: coordinates[0],
              area: locationDetails.area,
              address: locationDetails.address
            }
          }
        });
      } catch (error) {
        console.error('Error fetching location details:', error);
        toast.error(t('toasts.locationerror'));
      }
    }
    setFallbackLocation(null);
    setShowFallbackModal(false);
  };


  const handleGetCurrentLocation = async () => {
    await handleNavigationWithZoneCheck(
      navigate,
      apolloClient as ApolloClient<NormalizedCacheObject>,
      setFallbackLocation,
      setShowFallbackModal
    );
  };

  return (
    <Layout
      showNavigation={false}
    >

      {/* Search Box */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('selectLocation.searchPlaceholder')}
            className="w-full border pl-10 pr-4 py-3 bg-gray-50 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>

        {/* Search Results */}
        <div ref={searchResultsRef} className="absolute right-0 left-0 bg-white top-15 rounded-lg shadow-md">
          {isLoading ? (
            <div className="mt-4 py-4 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : locations.length > 0 ? (
            <div className="mt-2 max-h-[300px] overflow-y-auto rounded-lg shadow-sm">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    handleLocationSelect(location)
                    setAddressType('newaddress')
                  }}
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
            onClick={() => {
              handleGetCurrentLocation()
              setAddressType('currentLocation')
            }}
            disabled={isLoadingLocation}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-xl hover:from-secondary/10 hover:to-secondary/20 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              {(isLoadingLocation) ? (
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
            onClick={() => {
              handleGetCurrentLocation()
              setAddressType('newaddress')
            }}
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
            {[...profile.addresses]?.reverse()?.slice(0, 3).map((address: any) => (
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
                onClick={() => {
                  setShowFallbackModal(false); setFallbackLocation(null)
                  setAddressType('')
                }}
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
    </Layout>
  );
};

export default LocationSearch;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useBootstrap } from '../context/BootstrapContext';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import HomeHeader from '../components/HomeHeader';
import HorizontalCard from '../components/RestaurantCard/HorizontalCard';
import VerticalCard from '../components/RestaurantCard/VerticalCard';
import Banner from '../components/Banner';
import Filters from '../components/Filters';
import FilterBottomSheet from '../components/Filters/FilterBottomSheet';
import ConsentPopup from '../components/ConsentPopup';
import LoadingAnimation from '../components/LoadingAnimation';
import { Map, Home as HomeIcon, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { COMBINED_RESTAURANTS_QUERY } from '../graphql/queries';
import { useTranslation } from 'react-i18next';
import CartSummary from '../components/Restaurant/CartSummary';
import { UseLocationDetails } from '../context/LocationContext';
import { HomeMap } from '../components/Map/OpenStreetMap';
import MapRestaurantCard from '../components/MapRestaurantCard';

const HOME_API_PARAMETERS = {
  DISTANCE: 50,
  LIMIT: 20
};

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { temporaryLocation } = UseLocationDetails();
  const { bootstrapData, loading: bootstrapLoading } = useBootstrap();
  const { profile, loading: profileLoading } = useUser();
  const [showConsentPopup, setShowConsentPopup] = useState(false);
  const [showMap, setShowMap] = useState(true); // Default to map view
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Active filters for map - add filter state for offers and events
  const [activeMapFilters, setActiveMapFilters] = useState({
    radius: selectedRadius,
    offers: false,
    events: true
  });

  const selectedLocation = temporaryLocation || {
    latitude: 52.516267, // Default fallback coordinates
    longitude: 13.322455
  };

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const processRestaurants = (restaurants: any[], campaigns: any[]) => {
    return restaurants.map(restaurant => {
      const restaurantCampaigns = campaigns?.filter(
        campaign => campaign.restaurant === restaurant._id
      ).map(campaign => {
        if (campaign.promotion) {
          const promotion = bootstrapData?.promotions?.find(
            (p: any) => p._id === campaign.promotion
          );
          if (promotion) {
            return {
              ...campaign,
              displayName: promotion.displayName,
              baseCode: promotion.baseCode,
              promotionType: promotion.promotionType,
              minPercentageDiscount: promotion.minPercentageDiscount,
              maxPercentageDiscount: promotion.maxPercentageDiscount,
              minFlatDiscount: promotion.minFlatDiscount,
              maxFlatDiscount: promotion.maxFlatDiscount
            };
          }
        }
        return campaign;
      }) || [];

      return {
        ...restaurant,
        campaigns: restaurantCampaigns
      };
    });
  };

  const { loading, error, client } = useQuery(COMBINED_RESTAURANTS_QUERY, {
    variables: {
      distance: HOME_API_PARAMETERS.DISTANCE,
      limit: HOME_API_PARAMETERS.LIMIT,
      location: [Number(selectedLocation.longitude), Number(selectedLocation.latitude)],
      showEvents: true
    },
    skip: !bootstrapData,
    onCompleted: (data) => {
      if (data?.allRestaurants) {
        // Process restaurants
        if (data.allRestaurants.restaurants) {
          const processedRestaurants = processRestaurants(
            data.allRestaurants.restaurants,
            data.allRestaurants.campaigns
          );

          const sectionData = data.allRestaurants.sections.map((section: any) => ({
            ...section,
            restaurants: section.restaurants
              .map((id: string) => processedRestaurants.find(r => r._id === id))
              .filter(Boolean)
          })).filter(section => section.restaurants.length > 0);

          setSections(sectionData);
          setAllRestaurants(processedRestaurants);
        }

        // Set pagination data
        if (data.allRestaurants.pagination) {
          setPagination(data.allRestaurants.pagination);
        }

        // Process events
        if (data.allRestaurants.events && Array.isArray(data.allRestaurants.events)) {
          console.log('Events data received:', data.allRestaurants.events);
          setEvents(data.allRestaurants.events);
        }
      }
    }
  });

  const loadMoreRestaurants = useCallback(async () => {
    if (!pagination?.hasNextPage || isLoadingMore || !selectedLocation) return;

    try {
      setIsLoadingMore(true);
      const lastRestaurantData = pagination?.lastRestaurant || {};

      const result = await client.query({
        query: COMBINED_RESTAURANTS_QUERY,
        variables: {
          distance: HOME_API_PARAMETERS.DISTANCE,
          limit: HOME_API_PARAMETERS.LIMIT,
          location: [Number(selectedLocation.longitude), Number(selectedLocation.latitude)],
          lastRestaurant: {
            _id: lastRestaurantData?._id,
            distanceInMeters: lastRestaurantData?.distanceInMeters?.toString()
          },
          showEvents: true
        },
        fetchPolicy: "network-only"
      });

      if (result?.data?.allRestaurants) {
        // Process restaurants
        if (result.data.allRestaurants.restaurants) {
          const processedRestaurants = processRestaurants(
            result.data.allRestaurants.restaurants,
            result.data.allRestaurants.campaigns
          );
          setAllRestaurants(prevRestaurants => [...prevRestaurants, ...processedRestaurants]);
        }

        // Set pagination data
        if (result.data.allRestaurants.pagination) {
          setPagination(result.data.allRestaurants.pagination);
        }

        // Process new events if any
        if (result.data.allRestaurants.events && Array.isArray(result.data.allRestaurants.events)) {
          const newEvents = result.data.allRestaurants.events;
          setEvents(prevEvents => {
            const eventIds = new Set(prevEvents.map(e => e._id));
            const uniqueNewEvents = newEvents.filter(e => !eventIds.has(e._id));
            return [...prevEvents, ...uniqueNewEvents];
          });
        }
      }
    } catch (error) {
      console.error('Error loading more restaurants:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination, isLoadingMore, selectedLocation, client, bootstrapData]);

  useEffect(() => {
    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const target = entries[0];
          if (target.isIntersecting && !isLoadingMore && pagination?.hasNextPage) {
            loadMoreRestaurants();
          }
        },
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.1
        }
      );

      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreRestaurants, isLoadingMore, pagination]);

  const handleFilterUpdate = (radius: number) => {
    setSelectedRadius(radius);

    // Update map filters when radius changes
    setActiveMapFilters(prev => ({
      ...prev,
      radius
    }));
  };

  // New handler for toggling offer filter
  const handleToggleOffers = (showOffers: boolean) => {
    setActiveMapFilters(prev => ({
      ...prev,
      offers: showOffers
    }));
  };

  // New handler for toggling events filter
  const handleToggleEvents = (showEvents: boolean) => {
    setActiveMapFilters(prev => ({
      ...prev,
      events: showEvents
    }));
  };

  const formatDistance = (meters: number): string => {
    return `${(meters / 1000)?.toFixed(1)} Km`;
  };

  if (showMap) {
    return (
      <div className="fixed inset-0 bg-white">
        <HomeMap
          radius={selectedRadius}
          userLocation={{
            lat: selectedLocation.latitude,
            lng: selectedLocation.longitude
          }}
          handleRestaurant={(res) => {
            setShowDetails(res);
          }}
          events={events}
          debug={true}
          activeFilters={activeMapFilters}
          onMapMove={(center, radius) => {
            // Update radius when it changes from map
            if (Math.abs(radius - selectedRadius) > 0.1) {
              setSelectedRadius(radius);
            }
          }}
        />
        <button
          style={{ zIndex: 10000 }}
          onClick={() => setShowFilters(true)}
          className="fixed top-10 right-4 bg-white text-black p-4 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200"
        >
          <SlidersHorizontal size={24} />
        </button>
        <button
          style={{ zIndex: 10000 }}
          onClick={() => setShowMap(false)}
          className="fixed right-4 bg-secondary text-black p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all bottom-20 duration-200"
        >
          <HomeIcon size={24} />
        </button>
        <FilterBottomSheet
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFilterUpdate={handleFilterUpdate}
          onToggleOffers={handleToggleOffers}
          onToggleEvents={handleToggleEvents}
          activeFilters={activeMapFilters}
        />
        {showDetails &&
          <MapRestaurantCard
            data={showDetails}
            onClose={() => setShowDetails(null)}
          />
        }
      </div>
    );
  }

  return (
    <Layout title="" showHeader={false}>
      <HomeHeader />
      <div className="pt-[120px] pb-20">
        <ConsentPopup
          isOpen={showConsentPopup}
          onClose={() => setShowConsentPopup(false)}
          docVersionId={bootstrapData?.activeConsentDocData?.docVersionId}
          privacyPolicyUrl={bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink}
          termsUrl={bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink}
        />
        {(loading || profileLoading) && !allRestaurants.length && (
          <div className="flex justify-center py-8">
            <LoadingAnimation />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">
            {t('common.loadError')}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="px-1">
              {!bootstrapLoading && bootstrapData?.banners && (
                <Banner banners={bootstrapData.banners} />
              )}
            </div>

            {allRestaurants.length > 0 && (
              <>
                <div className="px-1 ">
                  {sections.map((section) => (
                    <div key={section._id} className="">
                      <h2 className="text-[16px] font-bold text-[#02060C] mb-2 mt-6">
                        {section.name}
                      </h2>
                      <div className="overflow-x-auto no-scrollbar">
                        <div className="flex gap-4 pb-4 w-max">
                          {section.restaurants.map((restaurant: any) => (
                            <HorizontalCard
                              key={restaurant._id}
                              id={restaurant._id}
                              name={restaurant.name}
                              image={restaurant.image}
                              rating={restaurant.reviewAverage || 0}
                              distance={formatDistance(restaurant.distanceInMeters)}
                              description={restaurant.cuisines?.join(', ') || ''}
                              likes={restaurant.favoriteCount || 0}
                              reviews={restaurant.reviewCount || 0}
                              onboarded={restaurant?.onboarded}
                              campaigns={restaurant.campaigns}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Filters />
                </div>
                <div className="px-1 mt-2">
                  <h2 className="text-[16px] font-bold text-[#02060C] mb-2">
                    {t('home.restaurantsNearYou')} ({allRestaurants.length})
                  </h2>

                  <div className="">
                    {allRestaurants.map(restaurant => (
                      <VerticalCard
                        key={restaurant._id}
                        id={restaurant._id}
                        name={restaurant.name}
                        image={restaurant.image}
                        rating={restaurant.reviewAverage || 0}
                        distance={formatDistance(restaurant.distanceInMeters)}
                        description={restaurant.cuisines?.join(', ') || ''}
                        likes={restaurant.favoriteCount || 0}
                        reviews={restaurant.reviewCount || 0}
                        openingTimes={restaurant.openingTimes}
                        isAvailable={restaurant.isAvailable}
                        onboarded={restaurant?.onboarded}
                        campaigns={restaurant.campaigns}
                      />
                    ))}
                  </div>

                  {pagination?.hasNextPage && (
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {isLoadingMore && (
                        <LoadingAnimation className="scale-75" />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <button
          style={{ bottom: 170, zIndex: 60 }}
          onClick={() => setShowMap(true)}
          className="fixed right-4 bg-secondary text-black p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200"
        >
          <Map size={24} />
        </button>
      </div>

      <div className="h-24" /> {/* Spacer for cart summary */}
      <CartSummary />
    </Layout>
  );
};

export default Home;
// // components/Home/MapView.jsx
import React, { lazy, Suspense, memo, useState, useCallback, useRef } from 'react';
import { useLazyQuery } from "@apollo/client";
import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API } from './queries';
import LoaderAnimation from "../../assets/Lottie/mapLoader.json";
import { useRestaurantData } from './hooks/useRestaurantData';

const OpenStreetMap = lazy(() => import('../../Components/OpenStreetMap/OpenStreetMap'));
const LottieAnimation = lazy(() => import('../../Components/LottieAnimation/LottieAnimation'));

const MapView = ({
  isMapActive,
  loading,
  isMapLoader,
  selectedLocation,
  mapFilterLoading,
  promotionsData,
  isMapFilterBounds,
  mapBounds,
  setMapBounds,
  handleMapModal,
  fetchMapData,
  t,
  currentMapDistance,
}) => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false);
  
  const matchCampaignsWithRestaurants = useCallback((restaurants, campaigns) => {
    if (!restaurants || !campaigns) return restaurants || [];

    const campaignsByRestaurant = campaigns.reduce((acc, campaign) => {
        const restaurantId = campaign.restaurant;
        if (!acc[restaurantId]) {
            acc[restaurantId] = [];
        }
        acc[restaurantId].push(campaign);
        return acc;
    }, {});

    return restaurants.map(restaurant => ({
        ...restaurant,
        campaigns: campaignsByRestaurant[restaurant._id] || []
    }));
}, []);

  const [fetchClustersQuery] = useLazyQuery(GET_RESTAURANT_CLUSTERS, {
    onCompleted: (data) => {
      setMapBounds(data.restaurantClusters.clusters);
    },
    onError: (error) => {
      console.error('Error fetching clusters:', error);
    },
    fetchPolicy: "network-only"
  });


  const restaurantsCache = useRef(new Map());
  const [fetchRestaurantsQuery] = useLazyQuery(GET_RESTAURANTS_MAP_API, {
    onCompleted: (data) => {
      // setMapBounds(data.restaurantsMapApi.restaurants);
      let restaurants = matchCampaignsWithRestaurants(data.restaurantsMapApi.restaurants, data.restaurantsMapApi.campaigns);

      // Apply favorite status
      // const modifiedRestaurants = updateRestaurantFavoriteStatus(restaurants);

      // Update restaurant cache for future lookups
      restaurants.forEach(restaurant => {
        restaurantsCache.current.set(restaurant._id, restaurant);
      });

      // Process map bounds for display
      const getBounds = (restaurants) => {
        if (!restaurants || restaurants.length === 0) return [];
        return restaurants.map(restaurant => ({
          coords: {
            lat: Number(restaurant?.location?.coordinates[1]),
            lng: Number(restaurant?.location?.coordinates[0])
          },
          isUser: false,
          restaurantInfo: {
            _id: restaurant._id,
            name: restaurant.name,
            slug: restaurant.slug,
            address: restaurant.address,
            distanceInMeters: restaurant?.distanceInMeters,
            onboarded: restaurant?.onboarded,
            isAvailable: restaurant?.isAvailable,
            campaigns: restaurant?.campaigns
          }
        }));
      };

      // Set map bounds with processed data
      setMapBounds(getBounds(restaurants));
    },
    onError: (error) => {
      console.error('Error fetching restaurants:', error);
    },
    fetchPolicy: "network-only"
  });

  const fetchClusters = useCallback(async (location, radius) => {
    setIsLoadingData(true);
    try {
      await fetchClustersQuery({
        variables: {
          input: {
            maxDistance: radius,
            location:location
          }
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  }, [fetchClustersQuery]);

  const fetchRestaurants = useCallback(async (location, radius) => {
    setIsLoadingData(true);
    try {
      await fetchRestaurantsQuery({
        variables: {
          location: location,
          distance: radius,
          limit: 200,
          userLocation: [Number(selectedLocation.longitude), Number(selectedLocation.latitude)]
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  }, [fetchRestaurantsQuery, selectedLocation]);

  // const fetchRestaurants = useCallback(async (lat, lng, radius) => {
  //   setIsLoadingData(true);
  //   try {
  //     // Placeholder: Implement fetchRestaurantsQuery similarly to fetchClustersQuery
  //     console.log(`Fetching restaurants at lat: ${lat}, lng: ${lng}, radius: ${radius}km`);
  //     // await fetchRestaurantsQuery({
  //     //   variables: {
  //     //     input: {
  //     //       maxDistance: radius,
  //     //       location: [lng, lat]
  //     //     }
  //     //   }
  //     // });
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setIsLoadingData(false);
  //   }
  // }, []);

  const handleApiCallNeeded = useCallback(async (rangeInfo, center) => {
    if (isApiCallInProgress) return;
    setIsApiCallInProgress(true);

    try {
      const lat = center.lat;
      const lng = center.lng;
      const radius = rangeInfo.max;

      if (rangeInfo.type === 'clusters') {
        await fetchClusters(lat, lng, radius);
      } else {
        await fetchRestaurants(lat, lng, radius);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsApiCallInProgress(false);
    }
  }, [fetchClusters, fetchRestaurants, isApiCallInProgress]);

  if (!isMapActive) return null;

  if (loading || isMapLoader || !selectedLocation) {
    return (
      <div className="home-page-loader">
        <Suspense fallback={<div className="home-loader"></div>}>
          <LottieAnimation
            animationData={LoaderAnimation}
            width={250}
            height={250}
            autoplay
            loop
          />
        </Suspense>
        <p className='xl-fs bold-fw text-black mt-2'>{t("mapfilters.Loading")}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="home-page-loader">
        <div className="home-loader"></div>
        <p className='xl-fs bold-fw text-black mt-2'>{t("mapfilters.Loading")}</p>
      </div>
    }>
      <OpenStreetMap
        // key={mapFilterLoading || isLoadingData ? 'loading' : 'loaded'}
        isloading={mapFilterLoading || isLoadingData}
        type={"home"}
        height={window?.innerHeight - 80}
        handleMapModal={handleMapModal}
        promotionsData={promotionsData}
        isCampaignApplied={isMapFilterBounds}
        currentMapDistance={currentMapDistance}
        bounds={mapBounds}
        handleApiCallNeeded={handleApiCallNeeded}
        fetchClusters={fetchClusters}
        fetchRestaurants={fetchRestaurants}
        setMapBounds={setMapBounds}
        userDetails={[
          {
            coords: {
              lat: Number(selectedLocation?.latitude),
              lng: Number(selectedLocation?.longitude)
            },
            isUser: true,
            restaurantInfo: null
          }
        ]}
      />
    </Suspense>
  );
};

export default memo(MapView);
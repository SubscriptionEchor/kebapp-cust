// components/Home/hooks/useRestaurantData.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { gql, useLazyQuery, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { HOME_API_PARAMETERS, LOCALSTORAGE_NAME, MAP_CAMPAIGN_TYPE } from '../../../constants/enums';
import { enhancedImageCache, prefetchImages } from '../../../Utils';
import { getBounds, formatTimeTo12Hour } from '../utils/helpers';
import { COMBINED_RESTAURANTS_QUERY, GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API } from '../queries';
import { set } from 'lodash';

// Constants for chunking
const INITIAL_CHUNK_SIZE = 10;
const SUBSEQUENT_CHUNK_SIZE = 25;

export const useRestaurantData = ({
    selectedLocation,
    identifier,
    userDetails,
    promotionsData,
    client,
    setFilterLoading,
    setMapFilterLoading
}) => {
    const { t } = useTranslation();

    // State management
    const [isMapLoader, setIsMapLoader] = useState(false);
    const [allRestaurants, setAllRestaurants] = useState([]);
    const [visibleRestaurants, setVisibleRestaurants] = useState([]);
    const [organizedSections, setOrganizedSections] = useState([]);
    const [mapBounds, setMapBounds] = useState([]);
    const [checkAllApiStatusFailed, setCheckAllApiStatusFailed] = useState({ all: false });
    const [isMapFilterBounds, setIsMapFilterBounds] = useState(false);
    const [pagination, setPagination] = useState({})
    const [currentMapDistance, setCurrentMapDistance] = useState(HOME_API_PARAMETERS.DISTANCE);

    // Cache reference for restaurant data
    const restaurantsCache = useRef(new Map());

    // Match campaigns with restaurants
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

    // Update restaurant favorite status
    const updateRestaurantFavoriteStatus = useCallback((restaurants) => {
        if (!restaurants || !Array.isArray(restaurants)) return [];
        return restaurants.map(restaurant => ({
            ...restaurant,
            isFavorite: userDetails?.favourite?.includes(restaurant._id)
        }));
    }, [userDetails?.favourite]);


    // Main restaurants data query - replaced with clusters query
    const [fetchMainRestaurantsClusterQuery] = useLazyQuery(GET_RESTAURANT_CLUSTERS, {
        onCompleted: (data) => {
            setIsMapLoader(true);
        
            // Set map bounds from clusters data
            setMapBounds(data.restaurantClusters.clusters);
        
            // NOTE: The original query did extensive processing of restaurant data
            // that isn't handled by this implementation since the data structure is different
            
            // Set failed API status if no clusters
            setCheckAllApiStatusFailed({
                all: !data?.restaurantClusters?.clusters?.length
            });
        
            setIsMapLoader(false);
        },
        onError: (error) => {
            console.error('Error fetching clusters:', error);
            setIsMapLoader(false);
            setCheckAllApiStatusFailed({ all: true });
        },
        fetchPolicy: "network-only"
    });

    // Execute the query when dependencies change (to mimic useQuery's automatic execution)
    useEffect(() => {
        console.log("ininininin");
        
        if (selectedLocation?.longitude && selectedLocation?.latitude) {
            console.log("outtttttttt");
            fetchMainRestaurantsClusterQuery({
                variables: {
                    input: {
                        maxDistance: HOME_API_PARAMETERS.DISTANCE,
                        location: [Number(selectedLocation?.longitude), Number(selectedLocation?.latitude)]
                    }
                }
            });
        }
    }, [selectedLocation?.longitude, selectedLocation?.latitude, fetchMainRestaurantsClusterQuery]);

        // Main restaurants data query
        const { loading } = useQuery(COMBINED_RESTAURANTS_QUERY, {
            variables: {
                distance: HOME_API_PARAMETERS.DISTANCE,
                limit: HOME_API_PARAMETERS.LIMIT,
                location: [Number(selectedLocation?.longitude), Number(selectedLocation?.latitude)],
                // zoneIdentifier: identifier
            },
            skip: !selectedLocation?.longitude || !selectedLocation?.latitude ,
            fetchPolicy: "cache-and-network",
            nextFetchPolicy: 'cache-first',
            onCompleted: (data) => {
                // setIsMapLoader(true);
    
                // Process all restaurants
                if (data?.allRestaurants?.restaurants) {
                    const restaurants = data.allRestaurants.restaurants;
    
                    // Prefetch images for initial chunk
                    const initialChunk = restaurants.slice(0, INITIAL_CHUNK_SIZE);
                    enhancedImageCache.prefetchImages(
                        initialChunk.map(restaurant => restaurant.image).filter(Boolean)
                    ).catch(error => {
                        console.error('Error prefetching images:', error);
                    });
    
                    // Match campaigns with restaurants and update favorite status
                    const matchedRestaurants = matchCampaignsWithRestaurants(
                        restaurants,
                        data.allRestaurants.campaigns
                    );
                    const modifiedRestaurants = updateRestaurantFavoriteStatus(matchedRestaurants);
    
                    // Update restaurantsCache ref for future use
                    modifiedRestaurants.forEach(restaurant => {
                        restaurantsCache.current.set(restaurant._id, restaurant);
                    });
    
                    // Set state
                    setAllRestaurants(modifiedRestaurants);
                    setVisibleRestaurants(modifiedRestaurants.slice(0, INITIAL_CHUNK_SIZE));
    
                    // Progressive loading of restaurant chunks
                    const loadChunks = async () => {
                        for (let i = INITIAL_CHUNK_SIZE; i < modifiedRestaurants.length; i += SUBSEQUENT_CHUNK_SIZE) {
                            const chunk = modifiedRestaurants.slice(i, i + SUBSEQUENT_CHUNK_SIZE);
                            const imageUrls = chunk.map(r => r.image).filter(Boolean);
    
                            // Use requestIdleCallback if available for non-blocking operations
                            if (window.requestIdleCallback) {
                                window.requestIdleCallback(async () => {
                                    try {
                                        await enhancedImageCache.prefetchImages(imageUrls);
                                    } catch (error) {
                                        console.error("Error prefetching chunk images:", error);
                                    }
                                    setVisibleRestaurants(prev => [...prev, ...chunk]);
                                });
                            } else {
                                try {
                                    await enhancedImageCache.prefetchImages(imageUrls);
                                    setVisibleRestaurants(prev => [...prev, ...chunk]);
                                } catch (error) {
                                    console.error("Error prefetching chunk images:", error);
                                    setVisibleRestaurants(prev => [...prev, ...chunk]);
                                }
                            }
                        }
                    };
                    loadChunks();
    
                    // Set map bounds
                    const bounds = getBounds(modifiedRestaurants);
                    // setMapBounds(bounds);
    
                    // Process sections
                    if (data.allRestaurants.sections) {
                        const organized = data.allRestaurants.sections.reduce((acc, section) => {
                            const sectionRestaurants = modifiedRestaurants.filter(restaurant =>
                                section.restaurants.includes(restaurant._id)
                            );
                            if (sectionRestaurants.length > 0) {
                                acc.push({
                                    sectionName: section.name,
                                    restaurants: sectionRestaurants
                                });
                            }
                            return acc;
                        }, []);
                        setOrganizedSections(organized);
                    }
                }
                setPagination(data.allRestaurants?.pagination || {});
    
                setCheckAllApiStatusFailed({
                    all: !data?.allRestaurants?.restaurants?.length
                });
    
                // setIsMapLoader(false);
            }
        });

    // Update favorite status when userDetails changes
    useEffect(() => {
        if (userDetails?.favourite) {
            setAllRestaurants(prev => updateRestaurantFavoriteStatus(prev));
            setOrganizedSections(prev => prev.map(section => ({
                ...section,
                restaurants: updateRestaurantFavoriteStatus(section.restaurants)
            })));
        }
    }, [userDetails?.favourite, updateRestaurantFavoriteStatus]);

    // State for tracking loading restaurant IDs during favorite toggle
    const [loadingFavorites, setLoadingFavorites] = useState(new Set());

    // Toggle favorite status with loading state
    const handleToggleFavorite = useCallback(async (restaurantId) => {
        try {
            // Add this restaurant ID to loading set
            setLoadingFavorites(prevState => {
                const newSet = new Set(prevState);
                newSet.add(restaurantId);
                return newSet;
            });

            const toggleFavoriteMutation = gql`
        mutation ToggleFavorite($toggleFavoriteId: String!) {
          toggleFavorite(id: $toggleFavoriteId) {
            _id
            favourite
          }
        }
      `;

            const { data } = await client.mutate({
                mutation: toggleFavoriteMutation,
                variables: { toggleFavoriteId: restaurantId }
            });

            if (!data || !data?.toggleFavorite?.favourite) {
                return;
            }

            const updateRestaurantList = (restaurants) => {
                if (!restaurants) return [];
                return restaurants.map(restaurant => {
                    if (restaurant._id === restaurantId) {
                        return {
                            ...restaurant,
                            isFavorite: !restaurant.isFavorite,
                            favoriteCount: restaurant.isFavorite
                                ? restaurant.favoriteCount - 1
                                : restaurant.favoriteCount + 1
                        };
                    }
                    return restaurant;
                });
            };

            // Update restaurant cache reference
            const updatedRestaurant = updateRestaurantList([restaurantsCache.current.get(restaurantId)])[0];
            if (updatedRestaurant) {
                restaurantsCache.current.set(restaurantId, updatedRestaurant);
            }

            setAllRestaurants(prev => updateRestaurantList(prev));
            setVisibleRestaurants(prev => updateRestaurantList(prev));
            setOrganizedSections(prev => prev.map(section => ({
                ...section,
                restaurants: updateRestaurantList(section.restaurants)
            })));

            return true;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return false;
        } finally {
            // Remove this restaurant ID from loading set regardless of success/failure
            setLoadingFavorites(prevState => {
                const newSet = new Set(prevState);
                newSet.delete(restaurantId);
                return newSet;
            });
        }
    }, [client, updateRestaurantFavoriteStatus]);

    // Handle map modal - returns the restaurant data to be used in the modal
    const handleMapModal = useCallback((restaurantId) => {
        // First check cache
        let restaurantData = restaurantsCache.current.get(restaurantId);

        // If not in cache, find in allRestaurants
        if (!restaurantData) {
            console.log('Fetching restaurant data from allRestaurants',allRestaurants,restaurantData,restaurantId);
            restaurantData = allRestaurants?.find(restaurant => restaurant?._id === restaurantId);

            // If found, update cache for future use
            if (restaurantData) {
                restaurantsCache.current.set(restaurantId, restaurantData);
            }
        }

        return restaurantData;
    }, [allRestaurants]);

    // Apply filter
    const onHandleApplyFilter = useCallback(async (filters) => {
        let payload = {
            "distance": HOME_API_PARAMETERS.DISTANCE,
            "limit": HOME_API_PARAMETERS.LIMIT,
            "longitude": Number(selectedLocation?.longitude),
            "latitude": Number(selectedLocation?.latitude),
            "zoneIdentifier": identifier
        };

        // Build payload from filters
        for (const key in filters) {
            if (filters[key]) {
                if (typeof filters[key] === 'object' && key !== 'cuisines') {
                    let new_key = filters[key];
                    for (const subKey in new_key) {
                        if (new_key[subKey] === "reviewAverage") {
                            payload['sortOrder'] = "desc";
                        }
                        payload[subKey] = new_key[subKey];
                    }
                } else {
                    payload[key] = filters[key];
                }
            }
        }

        setFilterLoading(true);

        try {
            let query = await client.query({
                query: gql`${RESTAURANTS}`,
                variables: {
                    ...payload
                },
                fetchPolicy: 'network-only'
            });

            if (!query?.data?.nearByRestaurantsNewV2?.restaurants?.length) {
                setAllRestaurants([]);
                setVisibleRestaurants([]);
                setFilterLoading(false);
                return;
            }

            let restaurantData = matchCampaignsWithRestaurants(
                query?.data?.nearByRestaurantsNewV2?.restaurants,
                query?.data?.nearByRestaurantsNewV2?.campaigns
            );

            restaurantData = await updateRestaurantFavoriteStatus(restaurantData);

            // Apply campaign filter if needed
            if (filters?.filter?.campaign) {
                const processedRestaurants = restaurantData
                    .map(restaurant => {
                        if (!restaurant?.campaigns?.length) return restaurant;

                        const processedRestaurant = { ...restaurant };
                        restaurant.campaigns.forEach(campaign => {
                            if (campaign?.promotion) {
                                const matchingPromotion = promotionsData?.find(
                                    promo => promo._id === campaign.promotion
                                );
                                if (matchingPromotion?.baseCode) {
                                    processedRestaurant.baseCode = matchingPromotion.baseCode;
                                }
                            }
                        });
                        return processedRestaurant;
                    }).filter(restaurant => restaurant.baseCode);

                if (!processedRestaurants?.length) {
                    setAllRestaurants([]);
                    setVisibleRestaurants([]);
                    setFilterLoading(false);
                    return;
                }

                restaurantData = processedRestaurants?.filter(
                    item => item?.baseCode === filters?.filter?.campaign
                );

                if (!restaurantData?.length) {
                    setAllRestaurants(restaurantData);
                    setVisibleRestaurants(restaurantData);
                    setFilterLoading(false);
                    return;
                }
            }

            // Update cache
            restaurantData.forEach(restaurant => {
                restaurantsCache.current.set(restaurant._id, restaurant);
            });

            setAllRestaurants(restaurantData);
            setVisibleRestaurants(restaurantData);
        } catch (error) {
            console.error('Error applying filter:', error);
        } finally {
            setFilterLoading(false);
        }
    }, [
        selectedLocation,
        identifier,
        client,
        matchCampaignsWithRestaurants,
        updateRestaurantFavoriteStatus,
        promotionsData,
        setFilterLoading
    ]);



    // Handle map filter change


    // Process and get map bounds
    const processAndGetBounds = useCallback((restaurants) => {
        if (!restaurants || !promotionsData) return [];

        const processedRestaurants = restaurants.map(restaurant => {
            if (!restaurant?.campaigns?.length) return restaurant;

            const processedRestaurant = { ...restaurant };
            restaurant.campaigns.forEach(campaign => {
                if (campaign?.promotion) {
                    const matchingPromotion = promotionsData?.find(
                        promo => promo._id === campaign.promotion
                    );
                    if (matchingPromotion?.baseCode) {
                        processedRestaurant.baseCode = matchingPromotion.baseCode;
                    }
                }
            });
            return processedRestaurant;
        });

        return processedRestaurants.map(restaurant => ({
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
                campaigns: restaurant?.campaigns,
                ...(restaurant.baseCode && { baseCode: restaurant.baseCode })
            }
        }));
    }, [promotionsData]);

    const onHandleMapFilterChange = useCallback(async (filters, restaurants) => {
        setIsMapFilterBounds(false);

        let filteredRestaurants = [...restaurants];

        // Filter by following status
        if (filters?.options === "following") {
            filteredRestaurants = filteredRestaurants.filter(restaurant => restaurant?.isFavorite);
            if (!filteredRestaurants?.length) {
                setMapBounds([]);
                return;
            }
        }

        // Filter by closed status
        if (filters?.options === "closed") {
            filteredRestaurants = filteredRestaurants.filter(
                restaurant => (restaurant?.onboarded && !restaurant?.isAvailable)
            );
            if (!filteredRestaurants?.length) {
                setMapBounds([]);
                return;
            }
        }

        // Filter by offers
        if (filters?.offers) {
            const processedRestaurants = await processAndGetBounds(filteredRestaurants);
            if (!processedRestaurants?.length) {
                setMapBounds([]);
                return;
            }

            const filteredByOffer = processedRestaurants.filter(
                item => item?.restaurantInfo?.baseCode === filters?.offers
            );

            if (!filteredByOffer?.length) {
                setMapBounds([]);
                return;
            }

            setIsMapFilterBounds(true);
            setMapBounds(filteredByOffer);
            return;
        }

        // If no special filters, just set bounds from restaurants
        const bounds = getBounds(filteredRestaurants);
        setMapBounds(bounds);
    }, [getBounds, processAndGetBounds]);


    const [fetchClustersQuery] = useLazyQuery(GET_RESTAURANT_CLUSTERS, {
        onCompleted: (data) => {
          setMapBounds(data.restaurantClusters.clusters);
        },
        onError: (error) => {
          console.error('Error fetching clusters:', error);
        },
        fetchPolicy: "network-only"
      });
    
      const [fetchRestaurantsQuery] = useLazyQuery(GET_RESTAURANTS_MAP_API, {
        onCompleted: (data) => {
          // setMapBounds(data.restaurantsMapApi.restaurants);
          let restaurants = matchCampaignsWithRestaurants(data.restaurantsMapApi.restaurants, data.restaurantsMapApi.campaigns);
          const getBounds = (restaurants) => {
            if (!data.restaurantsMapApi.restaurants || data.restaurantsMapApi.restaurants === 0) return [];
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
          setMapBounds(getBounds(restaurants));
        },
        onError: (error) => {
          console.error('Error fetching restaurants:', error);
        },
        fetchPolicy: "network-only"
      });
    
      const fetchClusters = useCallback(async (location, radius) => {
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
         
        }
      }, [fetchClustersQuery]);
    
      const fetchRestaurants = useCallback(async (location, radius) => {

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
          
        }
      }, [fetchRestaurantsQuery, selectedLocation]);

    // Apply map filter
    const onHandleApplyMapFilter = useCallback(async (filters) => {
        setMapFilterLoading(true);

        try {
            console.log('filters', filters);
            if (filters?.mapFilter?.distance) {
                setCurrentMapDistance(filters.mapFilter.distance);
                let payload = {
                    "distance": filters?.mapFilter?.distance,
                    "limit": HOME_API_PARAMETERS.LIMIT,
                    "location": [Number(selectedLocation?.longitude), Number(selectedLocation?.latitude)],
                    // "longitude": Number(selectedLocation?.longitude),
                    // "latitude": Number(selectedLocation?.latitude),
                    // "zoneIdentifier": identifier
                };

                if (payload.distance >3) {
                    await fetchClusters(payload.location, payload?.distance);
                  } else {
                    await fetchRestaurants(payload.location, payload?.distance);
                  }

                // if (!query?.data?.nearByRestaurantsNewV2?.restaurants?.length) {
                //     setMapBounds([]);
                //     setMapFilterLoading(false);
                //     return;
                // }

                // const matchCampaignsResult = matchCampaignsWithRestaurants(
                //     query?.data?.nearByRestaurantsNewV2?.restaurants,
                //     query?.data?.nearByRestaurantsNewV2?.campaigns
                // );

               
            } else {
                setCurrentMapDistance(HOME_API_PARAMETERS.DISTANCE);
                if (!allRestaurants?.length) {
                    setMapBounds([]);
                    setMapFilterLoading(false);
                    return;
                }

                await onHandleMapFilterChange(filters?.mapFilter, allRestaurants);
            }
        } catch (error) {
            console.error('Error applying map filter:', error);
        } finally {
            setMapFilterLoading(false);
        }
    }, [
        selectedLocation,
        // identifier,
        client,
        matchCampaignsWithRestaurants,
        updateRestaurantFavoriteStatus,
        allRestaurants,
        onHandleMapFilterChange,
        // setMapFilterLoading
    ]);

    // Get restaurant opening status
    const getOpeningStatus = useCallback((data) => {
        // Early returns for invalid data
        if (!data) return { message: "" };
        if (!data?.isAvailable) {
            return { message: t('home.closed') };
        }
        if (!data?.openingTimes || !Array.isArray(data.openingTimes) || data.openingTimes.length === 0) {
            return { message: t('home.closed') };
        }

        const currentDate = new Date();
        const currentDay = currentDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
        const currentTimeInMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

        // Find current day's opening times
        const currentDayOpening = data.openingTimes.find(day => day.day === currentDay);

        let isOpenNow = false;
        let nextOpenTimeMessage = '';

        // Check if open today
        if (currentDayOpening && currentDayOpening.isOpen && currentDayOpening.times?.length) {
            let todayNextOpening = null;

            for (const time of currentDayOpening.times) {
                if (!time?.startTime || !time?.endTime) continue;

                const startTimeInMinutes = parseInt(time.startTime[0]) * 60 + parseInt(time.startTime[1]);
                const endTimeInMinutes = parseInt(time.endTime[0]) * 60 + parseInt(time.endTime[1]);

                // Check if currently open
                if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
                    isOpenNow = true;
                    break;
                }

                // Find next opening time today
                if (currentTimeInMinutes < startTimeInMinutes && !todayNextOpening) {
                    todayNextOpening = startTimeInMinutes;
                    nextOpenTimeMessage = `${t('timings.openstoday')} ${formatTimeTo12Hour(time.startTime)}`;
                }
            }

            if (!isOpenNow && todayNextOpening) {
                return { message: nextOpenTimeMessage };
            }
        }

        // If not open today, find next opening day
        if (!isOpenNow) {
            for (let i = 1; i <= 7; i++) {
                const futureDate = new Date(currentDate);
                futureDate.setDate(currentDate.getDate() + i);
                const futureDay = futureDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();

                const futureDayOpening = data.openingTimes.find(day => day.day === futureDay);

                if (futureDayOpening && futureDayOpening.isOpen && futureDayOpening.times?.length > 0) {
                    const firstOpeningTime = futureDayOpening.times[0];
                    const formattedOpenTime = formatTimeTo12Hour(firstOpeningTime?.startTime);

                    nextOpenTimeMessage = `${t('timings.openson', { day: futureDay })} ${t('timings.at')} ${formattedOpenTime}`;
                    break;
                }
            }

            if (nextOpenTimeMessage) {
                return { message: nextOpenTimeMessage };
            } else {
                return { message: t('timings.closedforthisweek') };
            }
        }

        return { message: t('home.open') };
    }, [t]);

    return {
        loading,
        allRestaurants,
        setAllRestaurants,
        visibleRestaurants,
        organizedSections,
        mapBounds,
        checkAllApiStatusFailed,
        isMapLoader,
        handleMapModal,
        handleToggleFavorite,
        onHandleApplyFilter,
        onHandleApplyMapFilter,
        getOpeningStatus,
        processAndGetBounds,
        updateRestaurantFavoriteStatus,
        matchCampaignsWithRestaurants,
        restaurantsCache: restaurantsCache.current,
        setIsMapFilterBounds,
        isMapFilterBounds,
        loadingFavorites,// Add the loadingFavorites state
        setPagination,
        pagination,
        setMapBounds,
        currentMapDistance
    };
};
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents, Marker } from 'react-leaflet';
import { useQuery } from '@apollo/client';
import L from 'leaflet';
import { debounce } from 'lodash';
import 'leaflet/dist/leaflet.css';
import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API, GET_STALLS_BY_EVENT_ID } from '../../graphql/queries';
import { config } from '../../config';
import MarketSvg from '../../assets/svg/KebappLogo.svg';
import Kebab from "../../assets/svg/kebabBlack.svg";
import MapEventCard from '../MapEventCard';
import "./style.css"

// Debug helper function
const debugEvent = (message, data = null) => {
  console.log(`%c EVENT DEBUG: ${message}`, 'background: #FF4081; color: white; padding: 2px 6px; border-radius: 4px;', data || '');
};

// Constants
const RADIUS_THRESHOLDS = [5.02, 6.97, 9.67, 13.44, 18.66, 25.92, 36.0, 50.0];
const MAX_ZOOM_LEVEL = 18;

// Tile Error Handler Component
const TileErrorHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const handleTileError = (e: any) => {
      console.error("Tile loading error:", e);
      if (map.getZoom() > MAX_ZOOM_LEVEL) {
        map.setZoom(MAX_ZOOM_LEVEL);
      }
    };

    map.on('tileerror', handleTileError);
    return () => {
      map.off('tileerror', handleTileError);
    };
  }, [map]);

  return null;
};

// Types for HOME map
interface MarkerInfo {
  marker: L.Marker;
  id: string;
}

// Controller for HOME map
const HomeMapController: React.FC<{
  userLocation: {
    lat: number;
    lng: number;
  };
  radius: number;
  maxCurrentRadius: number;
  onMapMove: (center: L.LatLng, radius: number) => void;
  handleRestaurant?: (restaurant: any) => void;
  handleEvent?: (event: any) => void;
  activeFilters?: any;
  debug?: boolean;
  events?: any[];
  initialFocusOnEvent?: boolean;
}> = ({
  maxCurrentRadius,
  userLocation,
  radius,
  onMapMove,
  handleRestaurant = () => { },
  handleEvent = () => { },
  activeFilters = {},
  debug = true,
  events = [],
  initialFocusOnEvent = true
}) => {
    const map = useMap();
    const eventsRef = useRef(events);
    const markersRef = useRef<{
      clusters: MarkerInfo[],
      restaurants: MarkerInfo[],
      events: MarkerInfo[],
      user: L.Marker | null,
      eventMarkers: { [id: string]: L.Marker }
    }>({
      clusters: [],
      restaurants: [],
      events: [],
      user: null,
      eventMarkers: {}
    });

    const [currentRadius, setCurrentRadius] = useState(radius);
    const [currentCenter, setCurrentCenter] = useState<L.LatLng | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [prevRadiusAbove3km, setPrevRadiusAbove3km] = useState(currentRadius > 3);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [showStallsModal, setShowStallsModal] = useState(false);
    const [hasInitiallyFocused, setHasInitiallyFocused] = useState(false);
    const [haveEventsBeenRendered, setHaveEventsBeenRendered] = useState(false);
    const [eventDataMap, setEventDataMap] = useState({});

    // Keep events ref updated and build event data map
    useEffect(() => {
      eventsRef.current = events;

      // Build a map of event ID to event data for quick lookup
      const newEventDataMap = {};
      if (events && events.length > 0) {
        events.forEach(event => {
          if (event && event._id) {
            newEventDataMap[event._id] = event;
          }
        });
      }
      setEventDataMap(newEventDataMap);
    }, [events]);

    // Handle events - THIS SHOULD ONLY RUN ONCE
    useEffect(() => {
      if (haveEventsBeenRendered || !events || events.length === 0) {
        return;
      }

      debugEvent(`INITIAL RENDERING OF ${events.length} EVENTS`, events);

      // Create markers for each event
      events.forEach((event, index) => {
        if (!event.location || !event.location.coordinates) {
          debugEvent(`Event ${index} missing coordinates`);
          return;
        }

        // Convert [lng, lat] to [lat, lng]
        const [lng, lat] = event.location.coordinates;
        const eventLng = parseFloat(lng);
        const eventLat = parseFloat(lat);

        if (isNaN(eventLat) || isNaN(eventLng)) {
          debugEvent(`Invalid coordinates for event ${index}`);
          return;
        }

        // Create permanent marker that won't be removed with cleanupAllMarkers
        const marker = L.marker([eventLat, eventLng], {
          icon: L.divIcon({
            html: `
              <div class="super-debug-marker">
                <div class="super-debug-pulse"></div>
                <div class="super-debug-inner">EVENT</div>
              </div>
            `,
            className: '',
            iconSize: [100, 100],
            iconAnchor: [50, 50]
          }),
          zIndexOffset: 9999
        }).addTo(map);

        // Add popup

        // Add click handler to show event card
        marker.on('click', () => {
          handleEvent(event);
        });

        // Store the marker by ID in the permanent collection
        markersRef.current.eventMarkers[event._id] = marker;
      });

      // Focus on first event once
      if (events.length > 0 && initialFocusOnEvent && !hasInitiallyFocused) {
        const firstEvent = events[0];
        if (firstEvent.location && firstEvent.location.coordinates) {
          const [firstLng, firstLat] = firstEvent.location.coordinates;
          if (!isNaN(parseFloat(firstLng)) && !isNaN(parseFloat(firstLat))) {
            // Only focus on initial render
            setTimeout(() => {
              map.setView([parseFloat(firstLat), parseFloat(firstLng)], 15);
              setHasInitiallyFocused(true);
            }, 1000);
          }
        }
      }

      // Mark events as rendered to prevent re-rendering
      setHaveEventsBeenRendered(true);

    }, [map, initialFocusOnEvent, hasInitiallyFocused, haveEventsBeenRendered, handleEvent]);

    // ADD EVENTS WHEN NEW ONES ARRIVE (works with existing ones too)
    useEffect(() => {
      // Skip if we haven't initialized the map yet
      if (!map) return;

      const existingEventIds = Object.keys(markersRef.current.eventMarkers);
      const newEvents = events.filter(event => !existingEventIds.includes(event._id));

      if (newEvents.length > 0) {
        debugEvent(`Adding ${newEvents.length} NEW EVENTS to map`, newEvents);

        newEvents.forEach((event, index) => {
          if (!event.location || !event.location.coordinates) return;

          const [lng, lat] = event.location.coordinates;
          const eventLng = parseFloat(lng);
          const eventLat = parseFloat(lat);

          if (isNaN(eventLat) || isNaN(eventLng)) return;

          // Skip if we already have this marker
          if (markersRef.current.eventMarkers[event._id]) return;

          // Create a new marker
          const marker = L.marker([eventLat, eventLng], {
            icon: L.divIcon({
              html: `
                <div class="super-debug-marker">
                  <div class="super-debug-pulse"></div>
                  <div class="super-debug-inner"></div>
                </div>
              `,
              className: '',
              iconSize: [100, 100],
              iconAnchor: [50, 50]
            }),
            zIndexOffset: 9999
          }).addTo(map);


          // Add click handler to show event card
          marker.on('click', () => {
            handleEvent(event);
          });

          // Store the marker
          markersRef.current.eventMarkers[event._id] = marker;
        });
      }
    }, [map, events, handleEvent]);

    // GraphQL queries
    const { data: clustersData, refetch: refetchClusters, loading: clustersLoading } = useQuery(GET_RESTAURANT_CLUSTERS, {
      variables: {
        input: {
          location: currentCenter
            ? [currentCenter.lng, currentCenter.lat]
            : userLocation
              ? [userLocation.lng, userLocation.lat]
              : [0, 0],
          maxDistance: currentRadius,
        }
      },
      skip: !isInitialized || !currentCenter || currentRadius <= 3,
      fetchPolicy: 'network-only',
      onCompleted: () => setIsLoading(false),
    });

    const { data: restaurantsData, refetch: refetchRestaurants, loading: restaurantsLoading } = useQuery(GET_RESTAURANTS_MAP_API, {
      variables: {
        userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
        location: currentCenter
          ? [currentCenter.lng, currentCenter.lat]
          : userLocation
            ? [userLocation.lng, userLocation.lat]
            : [0, 0],
        distance: currentRadius,
        limit: 200,
        showEvents: activeFilters?.events || true
      },
      skip: !isInitialized || !currentCenter || currentRadius > 3,
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        setIsLoading(false);
      },
    });

    // Add query for stalls data
    const { data: stallsData, loading: stallsLoading } = useQuery(GET_STALLS_BY_EVENT_ID, {
      variables: {
        eventId: selectedEventId
      },
      skip: !selectedEventId,
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        if (data && data.getStallsByEventId) {
          setShowStallsModal(true);
          debugEvent("Stalls data received:", data.getStallsByEventId);
        } else {
          debugEvent("No stalls data returned for event ID:", selectedEventId);
        }
      },
      onError: (error) => {
        console.error("Error fetching stalls:", error);
        debugEvent("Failed to fetch stalls for event ID:", selectedEventId);
      }
    });

    // Helper functions
    const calculateDistance = (point1: L.LatLng, point2: L.LatLng): number => {
      return point1.distanceTo(point2) / 1000;
    };

    const calculateEffectiveRadius = () => {
      if (!map) return 50;
      try {
        const center = map.getCenter();
        const size = map.getSize();
        const eastPoint = map.containerPointToLatLng([size.x, size.y / 2]);
        const radiusInMeters = center.distanceTo(eastPoint);
        const radiusInKm = radiusInMeters / 1000;

        if (radiusInKm > maxCurrentRadius) {
          return maxCurrentRadius
        }
        if (radiusInKm > 50) {
          return 50
        }
        if (radiusInKm < 2) {
          return 2
        }
        return Math.max(Math.round(radiusInKm * 10) / 10, 0.5);
      } catch (error) {
        console.error("Error calculating radius:", error);
        return 50;
      }
    };

    // Reliable cleanup function that removes only regular markers, NOT event markers
    const cleanupAllMarkers = useCallback(() => {
      // Remove all normal markers from the map first (not event markers)
      [...markersRef.current.clusters, ...markersRef.current.restaurants, ...markersRef.current.events].forEach(({ marker }) => {
        if (marker) {
          try {
            map.removeLayer(marker);
          } catch (e) {
            console.error("Error removing marker:", e);
          }
        }
      });

      // Clear the arrays
      markersRef.current.clusters = [];
      markersRef.current.restaurants = [];
      markersRef.current.events = [];

      // NOTE: We DO NOT clear eventMarkers here - they are permanent!
    }, [map]);

    // Setup user location marker
    const setupUserMarker = useCallback(() => {
      if (markersRef.current.user) {
        map.removeLayer(markersRef.current.user);
        markersRef.current.user = null;
      }

      if (userLocation) {
        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-4 h-4 bg-white rounded-full"></div>
          </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map);

        markersRef.current.user = marker;
      }
    }, [map, userLocation]);

    // Debounced fetch function
    const debouncedFetch = useCallback(
      debounce((center: L.LatLng, effectiveRadius: number) => {
        // Clean up only regular markers before making new API calls
        cleanupAllMarkers();

        // Set loading state
        setIsLoading(true);

        if (effectiveRadius > 3) {
          refetchClusters();
        } else {
          refetchRestaurants();
        }
      }, 500),
      [refetchClusters, refetchRestaurants, cleanupAllMarkers]
    );

    // Initialize map
    useEffect(() => {
      const center = map.getCenter();
      const effectiveRadius = calculateEffectiveRadius();
      setCurrentCenter(center);
      setIsInitialized(true);
      setupUserMarker();

      if (map.getZoom() > MAX_ZOOM_LEVEL) {
        map.setZoom(MAX_ZOOM_LEVEL);
      }

      // Initial cleanup to clear any stale markers
      cleanupAllMarkers();

      // Cleanup on unmount - KEEP EVENT MARKERS!
      return () => {
        cleanupAllMarkers();
        if (markersRef.current.user) {
          map.removeLayer(markersRef.current.user);
        }
      };
    }, [map, userLocation, radius, setupUserMarker, cleanupAllMarkers]);

    // Handle radius changes from props
    useEffect(() => {
      if (radius !== currentRadius) {
        setCurrentRadius(radius);
        cleanupAllMarkers();
        if (currentCenter) {
          debouncedFetch(currentCenter, radius);
        }
      }
    }, [radius, currentCenter, cleanupAllMarkers, debouncedFetch, currentRadius]);

    // Map events handler - only clean up regular markers, not event markers
    const handleMapEvent = useCallback((eventType: string) => {
      // Clear regular markers immediately for responsive UI
      cleanupAllMarkers();

      const center = map.getCenter();
      const effectiveRadius = calculateEffectiveRadius();
      setCurrentCenter(center);
      onMapMove(center, effectiveRadius);

      const shouldUpdateRadius = RADIUS_THRESHOLDS.some((threshold, index) => {
        const prevThreshold = index > 0 ? RADIUS_THRESHOLDS[index - 1] : 3;
        return (currentRadius >= prevThreshold && currentRadius < threshold) !==
          (effectiveRadius >= prevThreshold && effectiveRadius < threshold);
      });

      if (shouldUpdateRadius || (currentRadius <= 3 && effectiveRadius > 3) || (currentRadius > 3 && effectiveRadius <= 3)) {
        setCurrentRadius(effectiveRadius);
      }

      // Only trigger API calls if we're not already loading
      if (!isLoading && !clustersLoading && !restaurantsLoading) {
        debouncedFetch(center, effectiveRadius);
      }
    }, [map, currentRadius, debouncedFetch, onMapMove, cleanupAllMarkers, isLoading, clustersLoading, restaurantsLoading]);

    // Map events binding
    useMapEvents({
      moveend: () => handleMapEvent('moveend'),
      zoomend: () => handleMapEvent('zoomend')
    });

    // Handle radius threshold changes
    useEffect(() => {
      const isAbove3km = currentRadius > 3;
      if (isAbove3km !== prevRadiusAbove3km && currentCenter) {
        cleanupAllMarkers();
        debouncedFetch(currentCenter, currentRadius);
        setPrevRadiusAbove3km(isAbove3km);
      }
    }, [currentRadius, prevRadiusAbove3km, currentCenter, cleanupAllMarkers, debouncedFetch]);

    const createCustomIcon = (mapType, isAvailable, onboarded, gif, count, __typename) => {
      if (__typename === "RestaurantCluster") {
        return L.divIcon({
          html: `
            <div class="restaurant" >
              <div class="restaurant-indicator-dull">
                <div>${count}</div>
              </div>
            </div>
          `,
          className: 'custom-distance-marker',
          iconSize: L.point(40, 24)
        });
      } else if (__typename === "Event") {
        return L.divIcon({
          html: `
            <div class="event-marker">
              <div class="event-marker-inner">
                <span>Event</span>
              </div>
            </div>
          `,
          className: 'custom-event-marker',
          iconSize: L.point(60, 60),
          iconAnchor: [30, 30]
        });
      } else {
        return L.divIcon({
          html: `
             <div class="restaurant" style="opacity: ${isAvailable ? 1 : 0.5}">
               <div class="${onboarded ? "restaurant-indicator" : "restaurant-indicator-dull"}">
                <img src="${Kebab}" style="height:20px" alt="cluster"/>
              </div>
               <div class="filter-icon-style" style="display: ${mapType === "HOME" && gif ? "flex" : "none"}">
                <img src="${gif}" style="height:20px" alt="cluster"/>
              </div>
            </div>
          `,
          className: 'custom-distance-marker',
          iconSize: L.point(40, 24)
        });
      }
    };

    // Handle clusters rendering
    useEffect(() => {
      if (currentRadius > 3 && clustersData?.restaurantClusters?.clusters && currentCenter) {
        setIsLoading(false);
        // Clean existing markers
        markersRef.current.clusters.forEach(({ marker }) => {
          if (marker) map.removeLayer(marker);
        });
        markersRef.current.clusters = [];

        // Create new markers
        const newMarkers: MarkerInfo[] = [];

        clustersData.restaurantClusters.clusters.forEach(cluster => {
          const [lng, lat] = cluster.location.coordinates;
          const clusterPosition = L.latLng(lat, lng);

          if (calculateDistance(currentCenter, clusterPosition) <= currentRadius) {
            const position: L.LatLngExpression = [lat, lng];

            const customIcon = createCustomIcon(
              "HOME",
              false,
              false,
              null,
              cluster.count,
              "RestaurantCluster"
            );

            // Create and add marker
            const marker = L.marker(position, { icon: customIcon })
              .addTo(map)
              .bindPopup(`${cluster.count} restaurants in this area`)

            newMarkers.push({ marker, id: cluster._id });
          }
        });

        // Update ref
        markersRef.current.clusters = newMarkers;
      }
    }, [clustersData, map, currentRadius, currentCenter]);

    // Handle restaurants rendering
    useEffect(() => {
      if (currentRadius <= 3 && restaurantsData?.allRestaurants && currentCenter) {
        setIsLoading(false);

        // Clean existing restaurant markers
        markersRef.current.restaurants.forEach(({ marker }) => {
          if (marker) map.removeLayer(marker);
        });
        markersRef.current.restaurants = [];

        // Clean existing event markers
        markersRef.current.events.forEach(({ marker }) => {
          if (marker) map.removeLayer(marker);
        });
        markersRef.current.events = [];

        // Create new restaurant markers if restaurants exist
        if (restaurantsData?.allRestaurants?.restaurants) {
          const matchCampaignsWithRestaurants = (restaurants, campaigns) => {
            const campaignsByRestaurant = campaigns?.reduce((acc, campaign) => {
              const restaurantId = campaign.restaurant;
              if (!acc[restaurantId]) {
                acc[restaurantId] = [];
              }
              acc[restaurantId].push(campaign);
              return acc;
            }, {}) || {};

            return restaurants.map(restaurant => ({
              ...restaurant,
              campaigns: campaignsByRestaurant[restaurant._id] || []
            }));
          };

          const restaurantMarkers: MarkerInfo[] = [];

          matchCampaignsWithRestaurants(
            restaurantsData.allRestaurants.restaurants,
            restaurantsData.allRestaurants.campaigns
          ).forEach(restaurant => {
            if (!restaurant.location || !restaurant.location.coordinates) return;

            const [lng, lat] = restaurant.location.coordinates;
            const restaurantPosition = L.latLng(parseFloat(lat), parseFloat(lng));

            if (calculateDistance(currentCenter, restaurantPosition) <= currentRadius) {
              const position: L.LatLngExpression = [parseFloat(lat), parseFloat(lng)];

              const customIcon = createCustomIcon(
                "HOME",
                restaurant.isAvailable,
                restaurant.onboarded,
                restaurant.gif,
                null,
                "Restaurant"
              );

              // Create and add marker
              const marker = L.marker(position, { icon: customIcon })
                .addTo(map)
                .bindPopup(`Restaurant ID: ${restaurant._id}`)
                .on('click', () => {
                  handleRestaurant(restaurant);
                });

              restaurantMarkers.push({ marker, id: restaurant._id });
            }
          });

          // Update ref
          markersRef.current.restaurants = restaurantMarkers;
        }
      }
    }, [restaurantsData, map, currentRadius, currentCenter, handleRestaurant]);

    // Modal for displaying stalls data
    const StallsModal = () => {
      if (!stallsData || !showStallsModal) return null;

      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Event Stalls</h3>
              <button
                onClick={() => {
                  setShowStallsModal(false);
                  setSelectedEventId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-[50vh]">
                {JSON.stringify(stallsData.getStallsByEventId, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowStallsModal(false);
                  setSelectedEventId(null);
                }}
                className="w-full py-2 bg-secondary text-black rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        {(isLoading || clustersLoading || restaurantsLoading) && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-600">Loading</span>
            </div>
          </div>
        )}

        {/* Debug info for events */}
        {debug && Object.keys(markersRef.current.eventMarkers).length > 0 && (
          <div className="absolute top-24 left-4 z-[1000] bg-white p-2 rounded shadow-lg text-xs">
            <div className="font-bold text-green-600">✓ {Object.keys(markersRef.current.eventMarkers).length} events on map</div>
          </div>
        )}

        {/* Event Stalls Data Modal */}
        {showStallsModal && stallsData && <StallsModal />}
      </>
    );
  };

// FitMapToBounds Component
const FitMapToBounds = ({ userLocation, radius }) => {
  const map = useMap();

  function fitBounds() {
    const radiusInMeters = radius * 1000;
    const earthCircumference = 40075016.686;
    const latChange = (radiusInMeters / earthCircumference) * 360;
    const lngChange = latChange / Math.cos((Math.PI / 180) * userLocation.lat);

    const southWest = L.latLng(userLocation.lat - latChange, userLocation.lng - lngChange);
    const northEast = L.latLng(userLocation.lat + latChange, userLocation.lng + lngChange);
    const bounds = L.latLngBounds(southWest, northEast);

    map.fitBounds(bounds, {
      padding: [50, 50]
    });
  }

  useEffect(() => {
    fitBounds();
  }, [userLocation, radius]);

  return null;
};

// HOME Map Component
interface HomeMapProps {
  height?: string;
  userLocation: {
    lat: number;
    lng: number;
  };
  radius?: number;
  onMapMove?: (center: L.LatLng, radius: number) => void;
  handleRestaurant?: (restaurant: any) => void;
  activeFilters?: any;
  debug?: boolean;
  events?: any[];
}

export const HomeMap: React.FC<HomeMapProps> = ({
  height = '100%',
  userLocation,
  radius = 50,
  onMapMove = () => { },
  handleRestaurant,
  activeFilters,
  debug = true,
  events = []
}) => {
  const [mapCenter, setMapCenter] = useState<L.LatLng>(
    L.latLng(userLocation?.lat || 52.516267, userLocation?.lng || 13.322455)
  );
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [updateRadius, setUpdateRadius] = useState(radius);
  const eventsRef = useRef(events);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Keep events ref updated
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    setCurrentRadius(radius);
    setUpdateRadius(radius);
  }, [radius]);

  const handleMapMove = useCallback((center: L.LatLng, newRadius: number) => {
    if (updateRadius > currentRadius) return;
    setMapCenter(center);
    setUpdateRadius(newRadius);
    onMapMove(center, newRadius);
  }, [updateRadius, currentRadius, onMapMove]);

  // Handle event click
  const handleEvent = useCallback((event) => {
    console.log('Event clicked:', event);
    setSelectedEvent(event);
  }, []);

  // Handle close event card
  const handleCloseEventCard = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Handle visit stalls
  const handleVisitStalls = useCallback((eventId) => {
    console.log('Visit stalls clicked for event:', eventId);
    // Will implement actual routing later
    //alert(`Redirecting to stalls for event ${eventId}. This will be implemented later.`);
  }, []);

  // Create controller with stable memoization
  const controller = useMemo(() => (
    <HomeMapController
      maxCurrentRadius={radius}
      userLocation={userLocation}
      radius={updateRadius}
      onMapMove={handleMapMove}
      handleRestaurant={handleRestaurant}
      handleEvent={handleEvent}
      activeFilters={activeFilters}
      debug={debug}
      events={eventsRef.current}
      initialFocusOnEvent={true}
    />
  ), [radius, userLocation, updateRadius, handleMapMove, handleRestaurant, handleEvent, activeFilters, debug]);

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        minZoom={3}
        maxZoom={MAX_ZOOM_LEVEL}
        zoomControl={true}
        key="map-container"
      >
        <TileLayer url={config.api.maps.tiles} />
        <TileErrorHandler />

        <FitMapToBounds userLocation={userLocation} radius={radius} />

        {controller}

        <Circle
          center={mapCenter}
          radius={currentRadius * 1000}
          pathOptions={{
            color: '#93c5fd',
            fillColor: '#93c5fd',
            fillOpacity: 0.1,
            weight: 3,
          }}
        />

        <div className="absolute bottom-4 right-4 bg-white px-4 py-3 rounded-lg shadow-md z-[1000]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#93c5fd]"></div>
            <p className="text-sm">Radius: {currentRadius.toFixed(1)}km</p>
          </div>
        </div>
      </MapContainer>

      {/* Event Card */}
      {selectedEvent && (
        <MapEventCard
          data={selectedEvent}
          onClose={handleCloseEventCard}
          onVisitStalls={handleVisitStalls}
        />
      )}
    </div>
  );
};

/**************************************
 * 2. LOCATION SELECTOR MAP COMPONENT
 **************************************/

// Custom pin component for location selection
const CenterLocationPin: React.FC = () => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
      <div className="w-8 h-8 flex items-center justify-center">
        <div className="w-6 h-6 bg-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div className="absolute bottom-0 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-secondary transform translate-y-1"></div>
      </div>
    </div>
  );
};

// Controller for LOCATION SELECTOR map
const LocationSelectorController: React.FC<{
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}> = ({
  initialLocation,
  onLocationSelect
}) => {
    const map = useMap();

    // Map events binding
    useMapEvents({
      moveend: () => {
        const center = map.getCenter();
        onLocationSelect({ lat: center.lat, lng: center.lng });
      }
    });

    // Initialize map
    useEffect(() => {
      const center = map.getCenter();
      onLocationSelect({ lat: center.lat, lng: center.lng });

      // Ensure zoom level doesn't exceed max supported
      if (map.getZoom() > MAX_ZOOM_LEVEL) {
        map.setZoom(MAX_ZOOM_LEVEL);
      }
    }, [map]);

    return null;
  };

// LOCATION SELECTOR Map Component
interface LocationSelectorMapProps {
  height?: string;
  initialLocation?: { lat: number; lng: number };
  onLocationSelected: (location: { lat: number; lng: number }) => void;
}

export const LocationSelectorMap: React.FC<LocationSelectorMapProps> = ({
  height = '55vh',
  initialLocation,
  onLocationSelected
}) => {
  const center = initialLocation
    ? [initialLocation.lat, initialLocation.lng]
    : [52.516267, 13.322455]; // Default center if no initial location

  const handleLocationSelect = useCallback((location: { lat: number; lng: number }) => {
    onLocationSelected(location);
  }, [onLocationSelected]);

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center as L.LatLngExpression}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        minZoom={3}
        maxZoom={MAX_ZOOM_LEVEL}
        zoomControl={true}
      >
        <TileLayer url={config.api.maps.tiles} />
        <TileErrorHandler />

        <LocationSelectorController
          initialLocation={initialLocation}
          onLocationSelect={handleLocationSelect}
        />

        <CenterLocationPin />

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className="bg-white px-4 py-2 rounded-lg shadow-md text-center">
            <p className="text-sm font-medium">Move the map to position the pin at your desired location</p>
          </div>
        </div>
      </MapContainer>
    </div>
  );
};

/**************************************
 * 3. RESTAURANT DETAIL MAP COMPONENT
 **************************************/

// Controller for RESTAURANT DETAIL map
const RestaurantDetailController: React.FC<{
  userLocation: { lat: number; lng: number };
  restaurantLocation: { lat: number; lng: number };
}> = ({
  userLocation,
  restaurantLocation
}) => {
    const map = useMap();
    const [routeElements, setRouteElements] = useState<{
      polyline?: L.Polyline;
      userMarker?: L.Marker;
      restaurantMarker?: L.Marker;
    }>({});

    const createCurvedPolyline = (startPoint: L.LatLng, endPoint: L.LatLng, map: L.Map): L.Polyline => {
      // Midpoint for basic quadratic curve
      const midLat = (startPoint.lat + endPoint.lat) / 2;
      const midLng = (startPoint.lng + endPoint.lng) / 2;

      // Create a control point for the curve
      const controlPoint = L.latLng(
        midLat + Math.abs(startPoint.lat - endPoint.lat) * 0.5,
        midLng + Math.abs(startPoint.lng - endPoint.lng) * 0.2
      );

      // Generate curve points
      const curvePoints = [];
      for (let t = 0; t <= 1; t += 0.01) {
        const lat = Math.pow(1 - t, 2) * startPoint.lat + 2 * (1 - t) * t * controlPoint.lat + Math.pow(t, 2) * endPoint.lat;
        const lng = Math.pow(1 - t, 2) * startPoint.lng + 2 * (1 - t) * t * controlPoint.lng + Math.pow(t, 2) * endPoint.lng;
        curvePoints.push([lat, lng]);
      }

      // Create and return the polyline
      return L.polyline(curvePoints, {
        color: 'black',
        weight: 3,
        dashArray: '15, 10',
        opacity: 0.8,
        lineCap: 'round'
      }).addTo(map);
    };

    // Create route and markers
    useEffect(() => {
      // Clean up previous elements
      if (routeElements.polyline) routeElements.polyline.remove();
      if (routeElements.userMarker) routeElements.userMarker.remove();
      if (routeElements.restaurantMarker) routeElements.restaurantMarker.remove();

      if (userLocation && restaurantLocation) {
        const startPoint = L.latLng(userLocation.lat, userLocation.lng);
        const endPoint = L.latLng(restaurantLocation.lat, restaurantLocation.lng);
        const polyline = createCurvedPolyline(startPoint, endPoint, map);

        // Add user marker
        const userMarker = L.marker([userLocation.lat, userLocation.lng]).addTo(map);

        // Add restaurant marker
        const restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng], {
          icon: L.icon({
            iconUrl: MarketSvg,
            iconSize: [25, 41],
            iconAnchor: [12, 30],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map);

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [restaurantLocation.lat, restaurantLocation.lng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Store elements for cleanup
        setRouteElements({ polyline, userMarker, restaurantMarker });

        // Ensure zoom level doesn't exceed max supported
        if (map.getZoom() > MAX_ZOOM_LEVEL) {
          map.setZoom(MAX_ZOOM_LEVEL);
        }
      }

      return () => {
        if (routeElements.polyline) routeElements.polyline.remove();
        if (routeElements.userMarker) routeElements.userMarker.remove();
        if (routeElements.restaurantMarker) routeElements.restaurantMarker.remove();
      };
    }, [map, userLocation, restaurantLocation]);

    return null;
  };

// RESTAURANT DETAIL Map Component
interface RestaurantDetailMapProps {
  height?: string;
  userLocation: { lat: number; lng: number };
  restaurantLocation: { lat: number; lng: number };
}

export const RestaurantDetailMap: React.FC<RestaurantDetailMapProps> = ({
  height = '300px',
  userLocation,
  restaurantLocation
}) => {
  // For initial center, use middle point between user and restaurant
  const initialCenter = [
    (userLocation.lat + restaurantLocation.lat) / 2,
    (userLocation.lng + restaurantLocation.lng) / 2
  ];

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={initialCenter as L.LatLngExpression}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        minZoom={3}
        maxZoom={MAX_ZOOM_LEVEL}
        zoomControl={true}
      >
        <TileLayer url={config.api.maps.tiles} />
        <TileErrorHandler />

        <RestaurantDetailController
          userLocation={userLocation}
          restaurantLocation={restaurantLocation}
        />
      </MapContainer>
    </div>
  );
};

// Export all map components
export default {
  HomeMap,
  LocationSelectorMap,
  RestaurantDetailMap
};
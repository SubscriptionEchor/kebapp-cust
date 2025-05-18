import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { useApolloClient } from '@apollo/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API } from '../../graphql/queries';
import { config } from '../../config';
import Kebab from "../../assets/svg/kebabBlack.svg";
import MapEventCard from '../MapEventCard';
import RestaurantDetailCard from '../RestaurantDetailCard/RestaurantDetailCard';
import "./style.css";

// Constants
const MAX_ZOOM_LEVEL = 18;
const MAP_THROTTLE_MS = 500; // Reduced throttle time for better responsiveness
const DEBOUNCE_MS = 300; // Reduced debounce time
const DEBUG_MODE = true; // Enable debug logging
const MAX_REQUESTS_PER_MINUTE = 30; // Increased circuit breaker limit for better experience

// Global request tracking for circuit breaker - IMPROVED
const globalRequestTracker = {
  recentRequests: [],
  isCircuitOpen: false,
  lastRequestKey: null,
  lastSuccess: Date.now(),

  // Add a request timestamp to the tracker
  addRequest: () => {
    const now = Date.now();
    // Remove requests older than 60 seconds
    globalRequestTracker.recentRequests = globalRequestTracker.recentRequests
      .filter(time => now - time < 60000);

    // Add current request
    globalRequestTracker.recentRequests.push(now);

    // Check if circuit should be opened
    if (globalRequestTracker.recentRequests.length > MAX_REQUESTS_PER_MINUTE) {
      console.warn(`Circuit breaker activated: ${globalRequestTracker.recentRequests.length} requests in last minute - limiting for 3 seconds`);
      globalRequestTracker.isCircuitOpen = true;

      // Auto-reset after 3 seconds instead of 5 - faster recovery
      setTimeout(() => {
        console.log("Circuit breaker reset");
        globalRequestTracker.isCircuitOpen = false;
        globalRequestTracker.recentRequests = globalRequestTracker.recentRequests.slice(-10); // Keep only the most recent 10
      }, 3000);
    }
  },

  // Check if a request can proceed - MUCH LESS AGGRESSIVE
  canProceed: (requestKey) => {
    // Never block forced updates
    const now = Date.now();

    // Reset circuit breaker if it's been open too long
    if (globalRequestTracker.isCircuitOpen && now - globalRequestTracker.lastSuccess > 5000) {
      console.log("Circuit breaker was open too long - resetting");
      globalRequestTracker.isCircuitOpen = false;
    }

    // If circuit is open, only block exact duplicates of the last request
    if (globalRequestTracker.isCircuitOpen) {
      const isDuplicate = requestKey === globalRequestTracker.lastRequestKey &&
        now - globalRequestTracker.lastSuccess < 500; // Only block very recent duplicates

      if (isDuplicate) {
        return false;
      }
    }

    // Update tracking
    globalRequestTracker.lastRequestKey = requestKey;
    globalRequestTracker.lastSuccess = now;
    return true;
  }
};

// Helper function for logging debug information
const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

// Helper function for position comparison with precision
const isSamePosition = (pos1, pos2) => {
  if (!pos1 || !pos2) return false;
  const precision = 6; // 6 decimal places ≈ 10cm precision
  return (
    pos1.lat.toFixed(precision) === pos2.lat.toFixed(precision) &&
    pos1.lng.toFixed(precision) === pos2.lng.toFixed(precision)
  );
};

// IMPROVED: Function to fetch restaurants in chunks to handle large clusters
const fetchRestaurantsInChunks = async (client, position, restaurantIds, userLocation, onSuccess) => {
  const chunkSize = 20;
  const chunks = [];

  for (let i = 0; i < restaurantIds.length; i += chunkSize) {
    chunks.push(restaurantIds.slice(i, i + chunkSize));
  }

  let allRestaurants = [];
  let allCampaigns = [];

  console.log(`Fetching ${restaurantIds.length} restaurants in ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunk = chunks[i];
      console.log(`Fetching chunk ${i + 1}/${chunks.length} with ${chunk.length} restaurants`);

      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: {
          userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
          location: [position.lng, position.lat],
          distance: 2, // Use a reasonable distance
          restaurantIds: chunk,
          showEvents: false
        },
        fetchPolicy: 'network-only'
      });

      if (data?.allRestaurants?.restaurants) {
        allRestaurants = [...allRestaurants, ...data.allRestaurants.restaurants];

        if (data.allRestaurants.campaigns) {
          allCampaigns = [...allCampaigns, ...data.allRestaurants.campaigns];
        }
      }
    } catch (err) {
      console.error(`Error fetching chunk ${i + 1}:`, err);
    }
  }

  if (allRestaurants.length > 0) {
    console.log(`Successfully fetched ${allRestaurants.length} restaurants from chunks`);
    onSuccess(allRestaurants, allCampaigns);
    return true;
  }

  return false;
};

// IMPROVED: Function to fetch with expanding radius for large clusters
const fetchWithExpandingRadius = async (client, position, userLocation, radii, onSuccess) => {
  // Default radii if not provided - ENSURING MINIMUM 2KM RADIUS
  const radiusValues = radii || [2, 3, 4]; // Changed from [0.3, 0.5, 0.8] to always be >= 2

  for (let i = 0; i < radiusValues.length; i++) {
    const radius = Math.max(2, radiusValues[i]); // Ensure minimum 2km radius
    console.log(`Trying with radius ${radius}km`);

    try {
      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: {
          userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
          location: [position.lng, position.lat],
          distance: radius,
          limit: 100,
          showEvents: false
        },
        fetchPolicy: 'network-only'
      });

      if (data?.allRestaurants?.restaurants && data.allRestaurants.restaurants.length > 0) {
        console.log(`Found ${data.allRestaurants.restaurants.length} restaurants with radius ${radius}km`);
        onSuccess(data.allRestaurants.restaurants, data.allRestaurants.campaigns);
        return true;
      }
    } catch (err) {
      console.error(`Error with radius ${radius}:`, err);
    }
  }

  console.log("Failed to find restaurants with all attempted radii");
  return false;
};

// Tile Error Handler Component
const TileErrorHandler = () => {
  const map = useMap();

  useEffect(() => {
    const handleTileError = (e) => {
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

// Main Map Controller Component
const HomeMapController = ({
  userLocation,
  radius,
  maxCurrentRadius,
  onMapMove,
  onLocationChange,
  handleRestaurant,
  handleEvent,
  activeFilters = {},
  events = []
}) => {
  const map = useMap();
  const client = useApolloClient();

  // Use refs to maintain state without triggering re-renders
  const markersRef = useRef({
    clusters: [],
    restaurants: [],
    user: null,
    eventMarkers: {},
    selectedMarker: null
  });

  const stateRef = useRef({
    isInitialized: false,
    currentRadius: radius,
    currentCenter: null,
    isFetching: false,
    lastFetchTime: 0,
    lastRequestKey: "", // For deduplicating identical requests
    moveEndCount: 0,
    userLocationState: userLocation, // Store a local copy of userLocation
    isUserInteraction: false, // Flag to track if movement is from user interaction
    isEventFocused: false, // Flag to track if we're focused on an event
    previousZoom: null, // Track previous zoom level
    pendingFetch: null, // For debouncing
    lastFetchSuccess: Date.now(), // Track last successful fetch for better error handling
    clickedCluster: null, // Track which cluster was clicked
    viewingCluster: false // Flag to track if we're viewing a cluster detail
  });

  // Trigger for re-renders (used minimally)
  const [isLoading, setIsLoading] = useState(false);

  // Update local user location in ref whenever prop changes
  useEffect(() => {
    stateRef.current.userLocationState = userLocation;
  }, [userLocation]);

  // Define calculateRadius function - COMPLETELY REDESIGNED
  const calculateRadius = (zoom) => {
    // If zoom is not provided, get current zoom from map
    if (zoom === undefined) {
      zoom = map.getZoom();
    }

    // Force clear cluster state on zoom calculation for more reliable updates
    stateRef.current.clickedCluster = null;
    stateRef.current.viewingCluster = false;

    // SIGNIFICANTLY IMPROVED RADIUS CALCULATION:
    // More dramatic scaling between zoom levels
    // This will ensure clusters properly break down as zoom increases
    switch (zoom) {
      case 0: case 1: case 2: return 500;
      case 3: return 300;
      case 4: return 250;
      case 5: return 200;
      case 6: return 170;
      case 7: return 140;
      case 8: return 110;
      case 9: return 80;
      case 10: return 60;
      case 11: return 45;
      case 12: return 30;
      case 13: return 20;
      case 14: return 15;
      case 15: return 10;
      case 16: return 7;
      case 17: return 5;
      case 18: return 3;
      default: return 2; // Minimum radius
    }
  };

  // Helper function to consolidate clusters at very low zoom levels
  const consolidateClustersForLowZoom = (clusters, center) => {
    if (!clusters || clusters.length === 0) return [];

    // Calculate total count
    const totalCount = clusters.reduce((sum, cluster) => sum + (cluster.count || 0), 0);

    // Create a single consolidated cluster
    return [{
      _id: "consolidated-cluster",
      count: totalCount,
      location: {
        coordinates: [center.lng, center.lat]
      }
    }];
  };

  // Clear all markers except user marker
  const clearMarkers = useCallback(() => {
    // Remove cluster markers
    markersRef.current.clusters.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    markersRef.current.clusters = [];

    // Remove restaurant markers
    markersRef.current.restaurants.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    markersRef.current.restaurants = [];

    // Clear selected marker
    markersRef.current.selectedMarker = null;
  }, [map]);

  // Create cluster icon with improved visibility
  const createClusterIcon = (count) => {
    // Scale size based on count for better visibility
    const size = Math.min(68, Math.max(48, 48 + Math.floor(Math.log10(count)) * 8));

    return L.divIcon({
      html: `
        <div class="airbnb-cluster">
          <div class="airbnb-cluster-inner">
            <span>${count}</span>
          </div>
        </div>
      `,
      className: 'custom-cluster-marker',
      iconSize: L.point(size, size),
      iconAnchor: [size / 2, size / 2]
    });
  };

  // Create restaurant icon
  const createRestaurantIcon = (isAvailable, onboarded, gif) => {
    return L.divIcon({
      html: `
        <div class="restaurant" style="opacity: ${isAvailable ? 1 : 0.5}">
          <div class="${onboarded ? "restaurant-indicator" : "restaurant-indicator-dull"}">
            <img src="${Kebab}" style="height:20px" alt="restaurant"/>
          </div>
          ${gif ? `
            <div class="filter-icon-style">
              <img src="${gif}" style="height:20px" alt="offer"/>
            </div>
          ` : ''}
        </div>
      `,
      className: 'custom-restaurant-marker',
      iconSize: L.point(44, 44),
      iconAnchor: [22, 22]
    });
  };

  // Create highlighted restaurant icon
  const createRestaurantHighlightedIcon = (isAvailable, onboarded, gif) => {
    return L.divIcon({
      html: `
        <div class="restaurant highlighted" style="opacity: ${isAvailable ? 1 : 0.5}">
          <div class="${onboarded ? "restaurant-indicator" : "restaurant-indicator-dull"}">
            <img src="${Kebab}" style="height:22px" alt="restaurant"/>
          </div>
          ${gif ? `
            <div class="filter-icon-style">
              <img src="${gif}" style="height:20px" alt="offer"/>
            </div>
          ` : ''}
          <div class="highlight-ring"></div>
        </div>
      `,
      className: 'custom-restaurant-marker',
      iconSize: L.point(50, 50),
      iconAnchor: [25, 25]
    });
  };

  // Create event icon
  const createEventIcon = () => {
    return L.divIcon({
      html: `
        <div class="event-marker">
          <div class="event-marker-pulse"></div>
          <div class="event-marker-inner">EVENT</div>
        </div>
      `,
      className: '',
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    });
  };

  // Helper function for calculating distance
  const calculateDistance = (restaurant) => {
    if (!userLocation || !restaurant || !restaurant.location || !restaurant.location.coordinates) {
      return '';
    }

    const [lng, lat] = restaurant.location.coordinates;
    const userLat = userLocation.lat;
    const userLng = userLocation.lng;

    // Simple distance calculation using Haversine formula
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat - userLat);
    const dLon = deg2rad(lng - userLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Create a custom popup for restaurant details - AIRBNB STYLE
  const createRestaurantPopup = (restaurant, position) => {
    // Create a custom popup for the restaurant
    const popupContent = document.createElement('div');
    popupContent.className = 'custom-restaurant-popup';

    // Create the HTML content for the popup
    popupContent.innerHTML = `
      <div class="restaurant-popup-container">
        <div class="restaurant-popup-header">
          <h3 class="restaurant-popup-title">${restaurant.name || "Restaurant"}</h3>
          <button class="restaurant-popup-close" aria-label="Close">×</button>
        </div>
        <div class="restaurant-popup-content">
          <div class="restaurant-popup-info">
            <div class="restaurant-popup-address">${restaurant.address || ""}</div>
            <div class="restaurant-popup-distance">${calculateDistance(restaurant) || ""}</div>
          </div>
          <div class="restaurant-popup-actions">
            <button class="restaurant-popup-button view-details">View Details</button>
            <button class="restaurant-popup-button get-directions">Get Directions</button>
          </div>
        </div>
      </div>
    `;

    // Create the popup with the content
    const popup = L.popup({
      className: 'restaurant-custom-popup',
      closeButton: false,
      offset: [0, -25],
      maxWidth: 300
    }).setLatLng(position).setContent(popupContent);

    // Add event listeners after popup is added to map
    setTimeout(() => {
      // Close button
      const closeBtn = popupContent.querySelector('.restaurant-popup-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          map.closePopup(popup);
        });
      }

      // View details button
      const viewDetailsBtn = popupContent.querySelector('.view-details');
      if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
          handleRestaurant(restaurant);
          map.closePopup(popup);
        });
      }

      // Get directions button
      const getDirectionsBtn = popupContent.querySelector('.get-directions');
      if (getDirectionsBtn) {
        getDirectionsBtn.addEventListener('click', () => {
          // Get coordinates
          let lat, lng;
          if (restaurant.location && restaurant.location.coordinates) {
            [lng, lat] = restaurant.location.coordinates.map(coord => parseFloat(coord));

            // Open directions in Google Maps
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(url, '_blank');
          }
        });
      }
    }, 100);

    return popup;
  };

  // Function to highlight a selected marker
  const highlightMarker = (marker, restaurant) => {
    // Remove previous highlight
    if (markersRef.current.selectedMarker && markersRef.current.selectedMarker !== marker) {
      // Reset previous marker
      const prevMarker = markersRef.current.selectedMarker;
      prevMarker.setZIndexOffset(800);

      // Find the restaurant associated with this marker
      if (prevMarker.restaurant) {
        prevMarker.setIcon(createRestaurantIcon(
          prevMarker.restaurant.isAvailable,
          prevMarker.restaurant.onboarded,
          prevMarker.restaurant.campaigns?.length > 0 ? prevMarker.restaurant.gif : null
        ));
      }
    }

    // Set new highlighted marker
    markersRef.current.selectedMarker = marker;
    marker.setZIndexOffset(1000);

    // Store restaurant data in marker for easy access
    marker.restaurant = restaurant;

    // Set highlighted icon
    marker.setIcon(createRestaurantHighlightedIcon(
      restaurant.isAvailable,
      restaurant.onboarded,
      restaurant.campaigns?.length > 0 ? restaurant.gif : null
    ));
  };

  // New function: Render restaurants in a specific area WITHOUT clearing all markers
  const renderRestaurantsInArea = useCallback((restaurants, campaigns, center, radius) => {
    // Match campaigns with restaurants
    const campaignsByRestaurant = campaigns?.reduce((acc, campaign) => {
      const restaurantId = campaign.restaurant;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(campaign);
      return acc;
    }, {}) || {};

    // Apply filters
    let filteredRestaurants = [...restaurants];

    // Apply offers filter if enabled
    if (activeFilters?.offers) {
      console.log("Applying offers filter, starting with", filteredRestaurants.length, "restaurants");
      filteredRestaurants = filteredRestaurants.filter(restaurant => {
        const hasCampaigns = campaignsByRestaurant[restaurant._id]?.length > 0;
        return hasCampaigns && restaurant.isAvailable;
      });
      console.log("After offers filter:", filteredRestaurants.length, "restaurants remain");
    }

    // Clear any existing restaurant markers in this specific area
    const clearLocalMarkers = (position, clearRadius) => {
      const markersToRemove = markersRef.current.restaurants.filter(marker => {
        const markerPos = marker.getLatLng();
        const distance = markerPos.distanceTo(position) / 1000;
        return distance < clearRadius; // Only clear restaurants within this radius
      });

      markersToRemove.forEach(marker => {
        if (marker) map.removeLayer(marker);
      });

      // Filter out the removed markers from our tracking array
      markersRef.current.restaurants = markersRef.current.restaurants.filter(
        marker => !markersToRemove.includes(marker)
      );
    };

    // Clear any existing restaurant markers in this area first
    clearLocalMarkers(center, radius * 1.2);

    let renderedCount = 0;
    filteredRestaurants.forEach(restaurant => {
      if (!restaurant.location || !restaurant.location.coordinates) return;

      const [lng, lat] = restaurant.location.coordinates;
      const position = L.latLng(parseFloat(lat), parseFloat(lng));

      // Check if within radius
      const distance = center.distanceTo(position) / 1000;
      if (distance > radius * 1.2) return;

      const restaurantWithCampaigns = {
        ...restaurant,
        campaigns: campaignsByRestaurant[restaurant._id] || []
      };

      const marker = L.marker([lat, lng], {
        icon: createRestaurantIcon(
          restaurant.isAvailable,
          restaurant.onboarded,
          campaignsByRestaurant[restaurant._id]?.length > 0 ? restaurant.gif : null
        ),
        interactive: true,
        zIndexOffset: 800
      })
        .addTo(map)
        .bindTooltip(restaurant.name || "Restaurant", {
          direction: 'top',
          offset: [0, -15]
        });

      // Store restaurant data in marker for easy access
      marker.restaurant = restaurantWithCampaigns;

      // Add click handler to show restaurant details
      marker.on('click', () => {
        // Highlight this marker
        highlightMarker(marker, restaurantWithCampaigns);

        // Center map on restaurant
        map.setView([lat, lng], map.getZoom());

        // MODIFIED: First show a popup for Airbnb style
        const popup = createRestaurantPopup(restaurantWithCampaigns, [lat, lng]);
        popup.openOn(map);
      });

      markersRef.current.restaurants.push(marker);
      renderedCount++;
    });

    console.log(`Rendered ${renderedCount} restaurants in area (center: ${center.lat.toFixed(4)},${center.lng.toFixed(4)}, radius: ${radius}km)`);

    // Important: Update last successful fetch time
    stateRef.current.lastFetchSuccess = Date.now();

  }, [map, activeFilters, handleRestaurant]);

  // Fetch and render restaurants in a specific area - IMPROVED
  const fetchRestaurantsInArea = useCallback(async (position, radius) => {
    try {
      setIsLoading(true);

      // Generate a unique request key
      const requestKey = `area-${position.lat.toFixed(6)}-${position.lng.toFixed(6)}-${radius}`;

      // Prevent duplicate requests but with improved logic
      // Don't block if we're past a certain time since last fetch success
      const now = Date.now();
      const timeSinceLastSuccess = now - stateRef.current.lastFetchSuccess;

      if (requestKey === stateRef.current.lastRequestKey &&
        !stateRef.current.isUserInteraction &&
        timeSinceLastSuccess < 2000) {
        console.log("Skipping duplicate area request:", requestKey);
        setIsLoading(false);
        return;
      }

      stateRef.current.lastRequestKey = requestKey;
      console.log(`Fetching restaurants in area: ${position.lat.toFixed(5)},${position.lng.toFixed(5)} radius=${radius}`);

      // Always use a slightly larger radius to ensure we get all restaurants
      const safeRadius = Math.max(2, radius * 1.2);

      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: {
          userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
          location: [position.lng, position.lat],
          distance: safeRadius,
          limit: 200,
          showEvents: activeFilters?.events ?? true,
          showOffers: activeFilters?.offers ?? false
        },
        fetchPolicy: 'network-only'
      });

      if (data?.allRestaurants?.restaurants) {
        console.log(`Found ${data.allRestaurants.restaurants.length} restaurants in area`);
        // Show restaurants only in this area, don't clear others
        renderRestaurantsInArea(data.allRestaurants.restaurants, data.allRestaurants.campaigns, position, safeRadius);
      } else {
        console.log("No restaurants found in area");
      }

      // Update last successful fetch time
      stateRef.current.lastFetchSuccess = Date.now();

    } catch (error) {
      console.error("Error fetching restaurants in area:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [userLocation, client, activeFilters, renderRestaurantsInArea]);

  // Fetch single restaurant in a cluster - IMPROVED FOR AIRBNB STYLE
  const fetchSingleRestaurant = useCallback(async (position, cluster) => {
    try {
      setIsLoading(true);
      console.log("Fetching single restaurant:", cluster);

      // Get restaurant ID - try all possible formats from the API
      const restaurantId = cluster.restaurantId ||
        (cluster.restaurants && cluster.restaurants[0]) ||
        (typeof cluster.restaurants === 'string' ? cluster.restaurants : null);

      // Build query variables
      const queryVariables = {
        userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
        location: [position.lng, position.lat],
        distance: 2, // ALWAYS use minimum 2km distance
        limit: 5, // Increased from 1 to improve chances of finding the restaurant
        showEvents: false
      };

      // Add restaurantIds parameter ONLY if we have an ID
      if (restaurantId) {
        queryVariables.restaurantIds = [restaurantId];
        console.log("Using restaurant ID:", restaurantId);
      }

      // Run the query
      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: queryVariables,
        fetchPolicy: 'network-only'
      });

      // Log full response for debugging
      console.log("Single restaurant API response:", JSON.stringify(data, null, 2));

      // CRITICAL FIX: Handle both possible API response structures
      const restaurants = data?.allRestaurants?.restaurants || data?.restaurantsMapApi?.restaurants;
      const campaigns = data?.allRestaurants?.campaigns || data?.restaurantsMapApi?.campaigns || [];

      if (restaurants && restaurants.length > 0) {
        // If restaurant found, show details
        const restaurant = restaurants[0];
        console.log("Found restaurant:", restaurant.name);

        // ENSURE campaigns is always an array and correctly formatted
        const restaurantWithCampaigns = {
          ...restaurant,
          campaigns: Array.isArray(campaigns)
            ? campaigns.filter(c => c.restaurant === restaurant._id)
            : []
        };

        // Make sure we're not in the middle of another state update
        setTimeout(() => {
          // Center map on restaurant
          map.setView([position.lat, position.lng], map.getZoom());

          // Create a visible marker for the restaurant
          if (markersRef.current.selectedMarker) {
            map.removeLayer(markersRef.current.selectedMarker);
          }

          // Extract coordinates from the restaurant data safely
          let lat, lng;
          if (restaurant.location && restaurant.location.coordinates &&
            Array.isArray(restaurant.location.coordinates) &&
            restaurant.location.coordinates.length >= 2) {
            [lng, lat] = restaurant.location.coordinates.map(coord => parseFloat(coord));
          } else {
            // If no coordinates in restaurant, use cluster position
            lat = position.lat;
            lng = position.lng;
          }

          const marker = L.marker([lat, lng], {
            icon: createRestaurantHighlightedIcon(
              restaurant.isAvailable,
              restaurant.onboarded,
              restaurantWithCampaigns.campaigns?.length > 0 ? restaurant.gif : null
            ),
            zIndexOffset: 1000
          }).addTo(map);

          markersRef.current.selectedMarker = marker;

          // Important: Log restaurant data to make sure it's correctly formatted
          console.log("Restaurant data for detail card:", restaurantWithCampaigns);

          // IMPORTANT: Create and show the popup instead of redirecting - AIRBNB STYLE
          const popup = createRestaurantPopup(restaurantWithCampaigns, [lat, lng]);
          popup.openOn(map);
        }, 100);

        return true;
      } else {
        console.log("No restaurant found, trying area fetch as fallback");
        // If no restaurant found, try area fetch as fallback - use minimum 2km radius
        fetchRestaurantsInArea(position, 2);
      }
    } catch (error) {
      console.error("Error fetching single restaurant:", error);
      // Fallback to area fetch - use minimum 2km radius
      fetchRestaurantsInArea(position, 2);
    } finally {
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [map, userLocation, client, handleRestaurant, fetchRestaurantsInArea]);

  // Function to render restaurants on map - IMPROVED
  const renderRestaurants = useCallback((restaurants, campaigns, center, radius) => {
    // Clear any existing markers to prevent overlaps
    clearMarkers();

    // Match campaigns with restaurants
    const campaignsByRestaurant = campaigns?.reduce((acc, campaign) => {
      const restaurantId = campaign.restaurant;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(campaign);
      return acc;
    }, {}) || {};

    // FIX: Filter restaurants based on active filters - IMPROVED
    let filteredRestaurants = [...restaurants]; // Create a copy to avoid mutation

    // Apply offers filter if enabled
    if (activeFilters?.offers) {
      console.log("Applying offers filter, starting with", filteredRestaurants.length, "restaurants");
      filteredRestaurants = filteredRestaurants.filter(restaurant => {
        const hasCampaigns = campaignsByRestaurant[restaurant._id]?.length > 0;
        return hasCampaigns && restaurant.isAvailable;
      });
      console.log("After offers filter:", filteredRestaurants.length, "restaurants remain");
    }

    let renderedCount = 0;
    filteredRestaurants.forEach(restaurant => {
      if (!restaurant.location || !restaurant.location.coordinates) return;

      const [lng, lat] = restaurant.location.coordinates;
      const position = L.latLng(parseFloat(lat), parseFloat(lng));

      // Check if within radius - use a more generous radius check for clusters
      const distance = center.distanceTo(position) / 1000;
      if (distance > radius * 1.5) return;

      const restaurantWithCampaigns = {
        ...restaurant,
        campaigns: campaignsByRestaurant[restaurant._id] || []
      };

      const marker = L.marker([lat, lng], {
        icon: createRestaurantIcon(
          restaurant.isAvailable,
          restaurant.onboarded,
          campaignsByRestaurant[restaurant._id]?.length > 0 ? restaurant.gif : null
        ),
        interactive: true,
        zIndexOffset: 800
      })
        .addTo(map)
        .bindTooltip(restaurant.name || "Restaurant", {
          direction: 'top',
          offset: [0, -15]
        });

      // Store restaurant data in marker for easy access
      marker.restaurant = restaurantWithCampaigns;

      // Add click handler to show restaurant details
      marker.on('click', () => {
        // Highlight this marker
        highlightMarker(marker, restaurantWithCampaigns);

        // Center map on restaurant
        map.setView([lat, lng], map.getZoom());

        // MODIFIED: First show a popup for Airbnb style
        const popup = createRestaurantPopup(restaurantWithCampaigns, [lat, lng]);
        popup.openOn(map);
      });

      markersRef.current.restaurants.push(marker);
      renderedCount++;
    });

    console.log(`Rendered ${renderedCount} restaurants out of ${filteredRestaurants.length}`);

    // Important: Update last successful fetch time
    stateRef.current.lastFetchSuccess = Date.now();

  }, [map, activeFilters, handleRestaurant, clearMarkers]);

  // Function to render clusters on map - IMPROVED
  const renderClusters = useCallback((clusters, center, radius) => {
    clearMarkers();

    // Filter clusters based on active filters before rendering
    let filteredClusters = [...clusters];

    // If offers filter is enabled, only show clusters with offers
    // Note: This is an approximation as we don't know which restaurants in the cluster have offers
    if (activeFilters?.offers) {
      console.log("Filtering clusters for offers");
      // We can only approximate this by keeping clusters that mention offers in metadata
      // The real filtering happens when the cluster is clicked
    }

    let renderedCount = 0;
    filteredClusters.forEach(cluster => {
      if (!cluster.location || !cluster.location.coordinates) return;

      const [lng, lat] = cluster.location.coordinates;
      const clusterPosition = L.latLng(lat, lng);

      // Check if within radius
      const distance = center.distanceTo(clusterPosition) / 1000;
      if (distance > radius) return;

      const marker = L.marker([lat, lng], {
        icon: createClusterIcon(cluster.count),
        interactive: true,
        zIndexOffset: 900
      })
        .addTo(map)
        .bindTooltip(`${cluster.count} restaurants in this area`, {
          direction: 'top',
          offset: [0, -20]
        });

      // IMPROVED CLUSTER CLICK HANDLING for better breakdown
      marker.on('click', () => {
        // Track this as a user interaction to ensure state updates properly
        stateRef.current.isUserInteraction = true;
        stateRef.current.viewingCluster = true;

        console.log(`Cluster clicked: ${cluster.count} restaurants, zoom level: ${map.getZoom()}`);

        // Get current zoom info
        const currentZoom = map.getZoom();
        const isMaxZoom = currentZoom >= MAX_ZOOM_LEVEL - 1;

        // Store the cluster's position for preventing map resets
        stateRef.current.lastClusterPosition = clusterPosition;

        // Store which cluster was clicked
        stateRef.current.clickedCluster = {
          position: clusterPosition,
          count: cluster.count,
          id: cluster._id || `cluster-${lat}-${lng}`
        };

        // FIXED: Handle cluster clicking based on size and zoom level
        if (cluster.count === 1) {
          // For single restaurant clusters, show popup - AIRBNB STYLE
          fetchSingleRestaurant(clusterPosition, cluster);
        }
        else if (isMaxZoom || cluster.count <= 15) {
          // For small clusters at high zoom, fetch and show restaurants
          console.log(`Small cluster: Fetching ${cluster.count} restaurants directly`);

          // IMPORTANT: Don't clear markers until after successful fetch
          client.query({
            query: GET_RESTAURANTS_MAP_API,
            variables: {
              userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
              location: [clusterPosition.lng, clusterPosition.lat],
              distance: 2, // Use minimum 2km radius
              limit: 100,
              showEvents: false
            },
            fetchPolicy: 'network-only'
          }).then(response => {
            if (response?.data?.allRestaurants?.restaurants) {
              // Only clear this area AFTER successful fetch
              const clusterArea = markersRef.current.clusters.filter(m => {
                const mPos = m.getLatLng();
                const distance = mPos.distanceTo(clusterPosition) / 1000;
                return distance < 1;
              });

              clusterArea.forEach(m => {
                if (m) map.removeLayer(m);
                markersRef.current.clusters = markersRef.current.clusters.filter(existing => existing !== m);
              });

              // Render restaurants
              renderRestaurantsInArea(
                response.data.allRestaurants.restaurants,
                response.data.allRestaurants.campaigns,
                clusterPosition,
                2
              );
            }
          }).catch(error => {
            console.error("Error fetching cluster restaurants:", error);
          });
        }
        else {
          // For larger clusters, zoom in
          console.log(`Large cluster (${cluster.count}): Zooming in`);
          // Calculate zoom increment based on cluster size
          const zoomIncrement = cluster.count > 100 ? 3 : (cluster.count > 50 ? 2 : 1);
          const newZoom = Math.min(currentZoom + zoomIncrement, MAX_ZOOM_LEVEL);
          map.setView([lat, lng], newZoom);
        }

        // Reset user interaction flag after delay but keep viewingCluster true
        setTimeout(() => {
          stateRef.current.isUserInteraction = false;
        }, 500);
      });

      markersRef.current.clusters.push(marker);
      renderedCount++;
    });

    console.log(`Rendered ${renderedCount} clusters out of ${filteredClusters.length}`);

    // Important: Update last successful fetch time
    stateRef.current.lastFetchSuccess = Date.now();

  }, [map, activeFilters, clearMarkers, client, renderRestaurantsInArea, fetchSingleRestaurant]);

  // Fetch map data - IMPROVED
  const fetchMapData = useCallback(async (center, radius, forceUpdate = false) => {
    // IMPROVED CIRCUIT BREAKER LOGIC
    // Only block if circuit is definitely open and it's been less than 3 seconds
    const timeSinceLastSuccess = Date.now() - stateRef.current.lastFetchSuccess;
    if (globalRequestTracker.isCircuitOpen && timeSinceLastSuccess < 3000 && !forceUpdate) {
      console.warn("Circuit breaker open - skipping fetch");
      return;
    }

    // Ensure minimum radius of 2km for API requirements
    const safeRadius = Math.max(2, radius);

    // Generate a unique request key
    const requestKey = `${center.lat.toFixed(6)}-${center.lng.toFixed(6)}-${safeRadius}-${activeFilters?.offers ? 1 : 0}-${activeFilters?.events ? 1 : 0}`;

    // Skip duplicate requests unless forced or it's been a while
    const now = Date.now();
    const timeSinceLastRequest = now - stateRef.current.lastFetchTime;
    if (!forceUpdate &&
      requestKey === stateRef.current.lastRequestKey &&
      timeSinceLastRequest < 2000) {
      console.log("Skipping duplicate request:", requestKey);
      return;
    }

    // Prevent fetching too frequently unless forced or it's been a while
    if (!forceUpdate &&
      timeSinceLastRequest < MAP_THROTTLE_MS &&
      timeSinceLastSuccess < 5000) {

      // If we have a pending timeout, clear it
      if (stateRef.current.pendingFetch) {
        clearTimeout(stateRef.current.pendingFetch);
      }

      // Set up a new timeout to ensure this request eventually happens
      stateRef.current.pendingFetch = setTimeout(() => {
        stateRef.current.pendingFetch = null;
        fetchMapData(center, safeRadius, true);
      }, DEBOUNCE_MS);
      return;
    }

    // Prevent concurrent fetches but with improved logic
    if (stateRef.current.isFetching) {
      const timeSinceLastFetch = now - stateRef.current.lastFetchTime;

      // Only keep blocking if the last fetch started recently 
      // This fixes stuck states from failed network requests
      if (timeSinceLastFetch < 5000) {
        console.log("BLOCKED: Already fetching data");
        return;
      }

      // If it's been too long, force the fetch to proceed
      console.log("Fetch has been running too long - resetting status and trying again");
      stateRef.current.isFetching = false;
    }

    try {
      // Set fetching state
      stateRef.current.isFetching = true;
      stateRef.current.lastFetchTime = now;
      stateRef.current.lastRequestKey = requestKey;
      setIsLoading(true);

      // Clear existing markers before fetching
      clearMarkers();

      console.log(`Fetching data for radius: ${safeRadius} at center: ${center.lat.toFixed(5)},${center.lng.toFixed(5)} zoom: ${map.getZoom()} forceUpdate: ${forceUpdate}`);

      // IMPROVED: Decide whether to fetch clusters or restaurants based on zoom level
      const currentZoom = map.getZoom();

      // Fetch clusters for lower zoom levels, individual restaurants for higher zoom
      if (currentZoom < 14) {
        // FETCH CLUSTERS for lower zoom levels
        console.log("Fetching clusters");
        const { data } = await client.query({
          query: GET_RESTAURANT_CLUSTERS,
          variables: {
            input: {
              location: [center.lng, center.lat],
              maxDistance: safeRadius            }
          },
          fetchPolicy: 'network-only'
        });

        console.log("Cluster response:", data?.restaurantClusters?.clusters?.length || 0, "clusters");

        if (data?.restaurantClusters?.clusters) {
          // At very low zoom levels (< 6), consolidate all clusters into one super-cluster
          if (currentZoom < 6) {
            const consolidatedClusters = consolidateClustersForLowZoom(
              data.restaurantClusters.clusters,
              center
            );
            renderClusters(consolidatedClusters, center, safeRadius);
          } else {
            renderClusters(data.restaurantClusters.clusters, center, safeRadius);
          }
        } else {
          console.log("No clusters returned");
        }
      } else {
        // FETCH INDIVIDUAL RESTAURANTS for higher zoom levels
        console.log("Fetching individual restaurants");
        const { data } = await client.query({
          query: GET_RESTAURANTS_MAP_API,
          variables: {
            userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
            location: [center.lng, center.lat],
            distance: safeRadius,
            limit: 200,
            showEvents: activeFilters?.events ?? true,
            showOffers: activeFilters?.offers ?? false
          },
          fetchPolicy: 'network-only'
        });

        if (data?.allRestaurants?.restaurants) {
          console.log("Restaurant response:", data.allRestaurants.restaurants.length, "restaurants");
          renderRestaurants(data.allRestaurants.restaurants, data.allRestaurants.campaigns, center, safeRadius);
        } else {
          console.log("No restaurants returned");
        }
      }

      // Update last successful fetch time
      stateRef.current.lastFetchSuccess = Date.now();
      // Reset circuit breaker status after successful fetch
      globalRequestTracker.isCircuitOpen = false;

    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      // Add a small delay before allowing more fetches
      setTimeout(() => {
        stateRef.current.isFetching = false;
        setIsLoading(false);
      }, 100);
    }
  }, [map, userLocation, client, clearMarkers, activeFilters, renderClusters, renderRestaurants, consolidateClustersForLowZoom]);

  // Improved setup user location marker with better consistency
  const setupUserMarker = useCallback(() => {
    // Always remove previous marker first to prevent duplicates
    if (markersRef.current.user) {
      map.removeLayer(markersRef.current.user);
      markersRef.current.user = null;
    }

    // CRITICAL FIX: Use the most up-to-date location from state ref
    // This ensures we always use the latest coordinates, even if prop hasn't updated yet
    const currentLocation = stateRef.current.userLocationState || userLocation;

    if (!currentLocation) return;

    // Create draggable user location marker with the current location
    const marker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="user-location-dot">
            <div class="user-location-pulse"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      }),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(map);

    // Add tooltip
    marker.bindTooltip("Drag to move your location", {
      permanent: false,
      direction: 'top'
    });

    // Handle drag
    let isDragging = false;

    marker.on('dragstart', function () {
      isDragging = true;
      stateRef.current.isUserInteraction = true;
    });

    // Handle drag end
    marker.on('dragend', function (e) {
      if (!isDragging) return;
      isDragging = false;

      const newLocation = {
        lat: e.target.getLatLng().lat,
        lng: e.target.getLatLng().lng
      };

      // CRITICAL FIX: Update local state before view changes
      stateRef.current.currentCenter = e.target.getLatLng();
      stateRef.current.userLocationState = newLocation;

      // Notify parent component about the location change
      onLocationChange(newLocation);

      // CRITICAL FIX: Update map center FIRST which triggers the circle update
      // This ensures the radius circle moves with the pin
      onMapMove(e.target.getLatLng(), stateRef.current.currentRadius);

      // Set the map view to the new location
      map.setView([newLocation.lat, newLocation.lng], map.getZoom());

      // Fetch data for the new location with force update
      fetchMapData(e.target.getLatLng(), stateRef.current.currentRadius, true);

      // Reset user interaction flag after a short delay
      setTimeout(() => {
        stateRef.current.isUserInteraction = false;
      }, 300);
    });

    // Store the marker
    markersRef.current.user = marker;

  }, [map, userLocation, onLocationChange, onMapMove, fetchMapData]);

  // Separate function to update event markers for better code organization
  const updateEventMarkers = useCallback((events) => {
    if (!map) return;

    // Store current markers in a temporary object
    const currentMarkers = { ...markersRef.current.eventMarkers };
    const newMarkers = {};

    // Skip if events filter is explicitly disabled
    if (activeFilters?.events === false) {
      // Clear all event markers
      Object.entries(currentMarkers).forEach(([id, marker]) => {
        if (marker) map.removeLayer(marker);
      });
      markersRef.current.eventMarkers = {};
      return;
    }

    // Add/update needed markers
    if (events && events.length > 0) {
      events.forEach((event) => {
        if (!event.location || !event.location.coordinates) return;

        const [lng, lat] = event.location.coordinates;
        const eventLng = parseFloat(lng);
        const eventLat = parseFloat(lat);

        if (isNaN(eventLat) || isNaN(eventLng)) return;

        // Reuse existing marker if available
        if (currentMarkers[event._id]) {
          newMarkers[event._id] = currentMarkers[event._id];
          delete currentMarkers[event._id]; // Remove from the temporary object
        } else {
          // Create new marker only if needed
          const marker = L.marker([eventLat, eventLng], {
            icon: createEventIcon(),
            zIndexOffset: 900,
            interactive: true
          })
            .addTo(map)
            .bindTooltip(event.name || "Event", {
              direction: 'top',
              offset: [0, -20]
            })
            .on('click', () => {
              // Set user interaction flag
              stateRef.current.isUserInteraction = true;
              stateRef.current.isEventFocused = true;

              // Center map on event
              map.setView([eventLat, eventLng], map.getZoom());

              // Highlight this event marker
              Object.values(markersRef.current.eventMarkers).forEach((m) => {
                if (m) {
                  m.setIcon(createEventIcon());
                  m.setZIndexOffset(900);
                }
              });

              marker.setZIndexOffset(1000);

              // Show event details
              handleEvent(event);

              // Reset the user interaction flag after a delay
              setTimeout(() => {
                stateRef.current.isUserInteraction = false;
              }, 300);
            });

          newMarkers[event._id] = marker;
        }
      });
    }

    // Remove markers that are no longer needed
    Object.entries(currentMarkers).forEach(([id, marker]) => {
      if (marker) map.removeLayer(marker);
    });

    // Update reference
    markersRef.current.eventMarkers = newMarkers;
  }, [map, handleEvent, activeFilters]);

  // Initialize map and setup event handlers - GREATLY IMPROVED
  useEffect(() => {
    if (!map || stateRef.current.isInitialized) return;

    // Initialize state
    const center = map.getCenter();
    stateRef.current.currentCenter = center;
    stateRef.current.currentRadius = radius;
    stateRef.current.isInitialized = true;
    stateRef.current.previousZoom = map.getZoom();
    stateRef.current.lastFiltersKey = JSON.stringify(activeFilters || {});
    stateRef.current.hadInitialUserLocationUpdate = false;
    stateRef.current.viewingCluster = false;
    stateRef.current.triedClusters = {};
    stateRef.current.lastClusterPosition = null;
    stateRef.current.previousUserLocation = null;

    // Setup user marker
    setupUserMarker();

    // Initial data fetch - ensure minimum radius of 2km for API requirements
    // IMPORTANT: Only do this once at initialization
    console.log("INITIAL DATA FETCH ON MAP INITIALIZATION");
    fetchMapData(center, Math.max(2, radius), true);

    // Create a single debounced handler for all map events
    // This is critical to prevent cascading updates
    let mapUpdateTimeout = null;
    const debouncedMapUpdate = (forceUpdate = false) => {
      if (mapUpdateTimeout) {
        clearTimeout(mapUpdateTimeout);
      }

      mapUpdateTimeout = setTimeout(() => {
        // Skip if currently fetching unless forced
        if (stateRef.current.isFetching && !forceUpdate) {
          console.log("Skipping map update due to active fetch");
          return;
        }

        // Get current map state
        const currentZoom = map.getZoom();
        const center = map.getCenter();

        console.log(`Map update: zoom=${currentZoom} center=${center.lat.toFixed(5)},${center.lng.toFixed(5)} userInteraction=${stateRef.current.isUserInteraction}`);

        // More robust equality check with precision limit
        const centerChanged = !isSamePosition(center, stateRef.current.currentCenter);
        const zoomChanged = currentZoom !== stateRef.current.previousZoom;

        // Exit if nothing changed and not user interaction
        if (!centerChanged && !zoomChanged && !forceUpdate && !stateRef.current.isUserInteraction) {
          console.log("No significant changes, skipping update");
          return;
        }

        // Update state BEFORE triggering the fetch
        if (centerChanged) {
          stateRef.current.currentCenter = center;
          console.log("Center changed, updating state");
        }

        // Calculate effective radius only if zoom changed
        let effectiveRadius = stateRef.current.currentRadius;
        if (zoomChanged) {
          effectiveRadius = calculateRadius(currentZoom);
          stateRef.current.currentRadius = effectiveRadius;
          stateRef.current.previousZoom = currentZoom;
          console.log(`Zoom changed to ${currentZoom}, new radius: ${effectiveRadius}`);

          // CRITICAL FIX: For zoom changes, always force a refresh
          // This ensures clusters break down properly
          forceUpdate = true;
        }

        // Update parent component
        onMapMove(center, effectiveRadius);

        // Only fetch if something actually changed
        const shouldFetch = centerChanged || zoomChanged || forceUpdate || stateRef.current.isUserInteraction;
        if (shouldFetch) {
          // Use forceUpdate for zoom changes or user interactions
          const shouldForceUpdate = zoomChanged || stateRef.current.isUserInteraction || forceUpdate;
          console.log(`Fetching due to: center=${centerChanged} zoom=${zoomChanged} userInteraction=${stateRef.current.isUserInteraction} force=${shouldForceUpdate}`);

          // ENHANCED: Clear clicked cluster state on zoom change to refresh all markers
          if (zoomChanged) {
            stateRef.current.clickedCluster = null;
            stateRef.current.viewingCluster = false;
          }

          fetchMapData(center, effectiveRadius, shouldForceUpdate);
        }

        // Reset user interaction flag
        stateRef.current.isUserInteraction = false;
      }, DEBOUNCE_MS);
    };

    // Add zoom event handler with special handling for clusters
    map.on('zoomend', () => {
      if (!stateRef.current.isInitialized) return;

      // CRITICAL: Force refresh on EVERY zoom change to ensure clusters break down
      const newZoom = map.getZoom();
      const prevZoom = stateRef.current.previousZoom;

      console.log(`Zoom change detected: ${prevZoom} -> ${newZoom}`);
      stateRef.current.previousZoom = newZoom;

      // Force clear all states to ensure fresh data
      stateRef.current.clickedCluster = null;
      stateRef.current.viewingCluster = false;
      stateRef.current.lastRequestKey = ""; // Clear request cache

      // ENHANCED: Clear existing markers immediately to provide visual feedback
      clearMarkers();

      // Calculate new radius based on new zoom level - with more dramatic scaling
      const newRadius = calculateRadius(newZoom);
      stateRef.current.currentRadius = newRadius;

      // Force update map data with true force parameter to refresh all data
      const center = map.getCenter();
      const safeRadius = Math.max(2, newRadius); // Ensure minimum 2km radius

      // Update parent first
      onMapMove(center, safeRadius);

      // Then fetch new data with short delay to allow UI to update
      setTimeout(() => {
        fetchMapData(center, safeRadius, true); // true = force update
      }, 50);
    });

    // Other map event handlers
    map.on('moveend', () => {
      if (!stateRef.current.isInitialized) return;
      debouncedMapUpdate();
    });

    // Handle click to place user location with improved consistency
    map.on('click', (e) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        // Set user interaction flag
        stateRef.current.isUserInteraction = true;

        // CRITICAL: Reset event focus when user explicitly sets location
        stateRef.current.isEventFocused = false;
        stateRef.current.viewingCluster = false;

        // Update user location
        const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };

        // Update state FIRST before any map operations
        stateRef.current.currentCenter = e.latlng;
        stateRef.current.userLocationState = newLocation;
        stateRef.current.previousUserLocation = newLocation;

        // Notify parent component - important to do this before setupUserMarker 
        onLocationChange(newLocation);

        // CRITICAL: Update the Circle position by updating mapCenter
        // This ensures the radius circle moves with the pin
        if (onMapMove) {
          onMapMove(e.latlng, stateRef.current.currentRadius);
        }

        // Update user marker position - crucial for consistent behavior
        // This needs to happen AFTER state is updated
        setupUserMarker();

        // Set view to new location
        map.setView([newLocation.lat, newLocation.lng], map.getZoom());

        // Force an update with debounce
        debouncedMapUpdate(true);
      }
    });

    // Setup events
    updateEventMarkers(events);

    // Cleanup function
    return () => {
      map.off('moveend');
      map.off('zoomend');

      if (mapUpdateTimeout) {
        clearTimeout(mapUpdateTimeout);
      }

      // Clean up markers
      clearMarkers();

      if (markersRef.current.user) {
        map.removeLayer(markersRef.current.user);
      }

      Object.values(markersRef.current.eventMarkers).forEach(marker => {
        if (marker) map.removeLayer(marker);
      });
      markersRef.current.eventMarkers = {};

      // Clear any pending fetch
      if (stateRef.current.pendingFetch) {
        clearTimeout(stateRef.current.pendingFetch);
      }
    };
  }, [
    map, radius, userLocation, events,
    setupUserMarker, clearMarkers, onMapMove, onLocationChange,
    handleEvent, fetchMapData, updateEventMarkers, activeFilters
  ]);

  // Update user marker when location changes - improved to handle all cases
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized) return;

    // CRITICAL: Update our state ref with the latest userLocation
    // This ensures the state ref is always consistent with props
    if (userLocation) {
      stateRef.current.userLocationState = userLocation;
    }

    // Make sure user marker reflects the current location
    // This should now create a marker at the CORRECT location
    setupUserMarker();

    // MAJOR FIX: Only update view on initial load or explicit user location changes
    // This prevents the map from resetting during normal interactions
    const isInitialLoad = !stateRef.current.hadInitialUserLocationUpdate;

    if (isInitialLoad && userLocation) {
      stateRef.current.hadInitialUserLocationUpdate = true;

      console.log("INITIAL USER LOCATION UPDATE - setting view to user location");
      const userLatLng = L.latLng(userLocation.lat, userLocation.lng);

      // Set the map view to user location
      map.setView([userLocation.lat, userLocation.lng], map.getZoom());
      stateRef.current.currentCenter = userLatLng;

      // Update the Circle position for user location
      onMapMove(userLatLng, stateRef.current.currentRadius);

      // Fetch map data for initial view
      fetchMapData(userLatLng, stateRef.current.currentRadius, true);

      return; // Exit early after handling initial load
    }

    // For subsequent updates, only move the map if explicitly triggered by user
    // or if we're not in the middle of another interaction (like viewing a cluster)
    if (!stateRef.current.isUserInteraction &&
      !stateRef.current.isEventFocused &&
      !stateRef.current.viewingCluster &&
      userLocation &&
      userLocation !== stateRef.current.previousUserLocation) {

      console.log("Explicit user location change - updating map");
      stateRef.current.previousUserLocation = userLocation;

      const userLatLng = L.latLng(userLocation.lat, userLocation.lng);

      // Only move the map for explicit location changes
      map.setView([userLocation.lat, userLocation.lng], map.getZoom());
      stateRef.current.currentCenter = userLatLng;

      // Update the Circle position
      onMapMove(userLatLng, stateRef.current.currentRadius);

      // Fetch map data with the new center
      fetchMapData(userLatLng, stateRef.current.currentRadius, true);
    }
  }, [map, userLocation, setupUserMarker, onMapMove, fetchMapData]);

  // Handle filter changes with force update
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized || !stateRef.current.currentCenter) return;

    // Skip if circuit breaker is active
    if (globalRequestTracker.isCircuitOpen) {
      console.warn("Circuit breaker open - skipping filter update");
      return;
    }

    // Create a key to detect actual filter changes
    const filtersKey = JSON.stringify(activeFilters);

    // MAJOR FIX: Only process if filters actually changed
    if (filtersKey === stateRef.current.lastFiltersKey) {
      console.log("Filters unchanged, skipping update");
      return;
    }

    console.log(`Filters CHANGED from "${stateRef.current.lastFiltersKey}" to "${filtersKey}"`);
    stateRef.current.lastFiltersKey = filtersKey;

    // Use deferred update with higher priority
    if (stateRef.current.pendingFetch) {
      clearTimeout(stateRef.current.pendingFetch);
    }

    stateRef.current.pendingFetch = setTimeout(() => {
      stateRef.current.pendingFetch = null;
      // Only fetch if not already fetching
      if (!stateRef.current.isFetching) {
        console.log("Processing filter update");
        fetchMapData(stateRef.current.currentCenter, stateRef.current.currentRadius, true);
      }
    }, DEBOUNCE_MS);

  }, [map, activeFilters, fetchMapData]);

  // Handle radius changes from props with improved consistency
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized) return;

    // Skip if circuit breaker is active
    if (globalRequestTracker.isCircuitOpen) {
      console.warn("Circuit breaker open - skipping radius update");
      return;
    }

    // Only update if the radius actually changed
    if (Math.abs(radius - stateRef.current.currentRadius) > 0.1) {
      console.log(`Radius changed from ${stateRef.current.currentRadius} to ${radius}`);
      stateRef.current.currentRadius = radius;

      if (stateRef.current.currentCenter) {
        // Use deferred update to prevent cascade
        if (stateRef.current.pendingFetch) {
          clearTimeout(stateRef.current.pendingFetch);
        }

        stateRef.current.pendingFetch = setTimeout(() => {
          stateRef.current.pendingFetch = null;
          // Only fetch if not already fetching
          if (!stateRef.current.isFetching) {
            console.log("Processing radius update");
            fetchMapData(stateRef.current.currentCenter, radius, true);
          }
        }, DEBOUNCE_MS);
      }
    }
  }, [map, radius, fetchMapData]);

  // Re-render events when they change
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized) return;
    updateEventMarkers(events);
  }, [map, events, updateEventMarkers]);

  return (
    <>
      {isLoading && (
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

      <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded shadow-lg text-sm">
        <div className="font-medium text-gray-700">
          <span>Ctrl+Click to place location pin</span>
        </div>
      </div>
    </>
  );
};

// Fit map to bounds based on user location and radius
const FitMapToBounds = ({ userLocation, radius }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;

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
  }, [map, userLocation, radius]);

  return null;
};

// Main map component
export const HomeMap = ({
  height = '100%',
  userLocation,
  radius = 50,
  onMapMove = () => { },
  onLocationChange = () => { },
  handleRestaurant,
  activeFilters,
  events = [],
  debug = false
}) => {
  // Store location and circle details in state 
  const [mapCenter, setMapCenter] = useState({
    lat: userLocation?.lat || 52.516267,
    lng: userLocation?.lng || 13.322455
  });
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // For tracking state changes
  const lastLocationUpdateRef = useRef(null);

  // Update radius from filters if available
  useEffect(() => {
    if (activeFilters?.radius && !isNaN(parseFloat(activeFilters.radius))) {
      setCurrentRadius(parseFloat(activeFilters.radius));
    } else {
      setCurrentRadius(radius);
    }
  }, [radius, activeFilters]);

  // Update map center when userLocation changes with better consistency
  useEffect(() => {
    if (userLocation) {
      // Store update timestamp to track changes
      lastLocationUpdateRef.current = Date.now();

      setMapCenter({
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    }
  }, [userLocation]);

  const handleMapMove = useCallback((center, newRadius) => {
    // Update local state for the circle display
    setMapCenter({ lat: center.lat, lng: center.lng });
    setCurrentRadius(newRadius);

    // Call parent component's handler
    if (onMapMove) {
      onMapMove(center, newRadius);
    }
  }, [onMapMove]);

  // Handle location change callback
  const handleLocationChange = useCallback((newLocation) => {
    // Update parent component
    onLocationChange(newLocation);

    // Update local map center state
    setMapCenter(newLocation);

    // Store update timestamp
    lastLocationUpdateRef.current = Date.now();
  }, [onLocationChange]);

  // Handle event click with improved consistency
  const handleEvent = useCallback((event) => {
    // Clear restaurant selection
    setSelectedRestaurant(null);

    // Log the event data for debugging
    console.log('Event data for detail card:', event);

    // Set event selection
    setSelectedEvent(event);
  }, []);

  // Handle restaurant click with improved consistency
  const handleRestaurantClick = useCallback((restaurant) => {
    // Clear event selection
    setSelectedEvent(null);

    // Log restaurant data to verify its format
    console.log('Restaurant data type:', typeof restaurant);
    console.log('Restaurant data for detail card:', restaurant);

    // CRITICAL FIX: Make sure we have a valid restaurant object
    if (restaurant && typeof restaurant === 'object') {
      // Ensure campaigns is always an array to prevent rendering issues
      const safeRestaurant = {
        ...restaurant,
        campaigns: Array.isArray(restaurant.campaigns) ? restaurant.campaigns : []
      };

      // Set restaurant selection with safe data
      setSelectedRestaurant(safeRestaurant);

      // Call parent handler if provided
      if (handleRestaurant) {
        handleRestaurant(safeRestaurant);
      }
    } else {
      console.error('Invalid restaurant data received:', restaurant);
    }
  }, [handleRestaurant]);

  // Handle close event card
  const handleCloseEventCard = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Handle close restaurant card
  const handleCloseRestaurantCard = useCallback(() => {
    setSelectedRestaurant(null);

    // Also call parent handler with null
    if (handleRestaurant) {
      handleRestaurant(null);
    }
  }, [handleRestaurant]);

  // Handle visit stalls
  const handleVisitStalls = useCallback((eventId) => {
    console.log('Visit stalls clicked for event:', eventId);
  }, []);

  // Unique key to prevent remounting
  const mapKey = useRef(`map-${Date.now()}`).current;

  return (
    <div style={{ height, width: '100%' }} className="map-container">
      <MapContainer
        key={mapKey}
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        minZoom={3}
        maxZoom={MAX_ZOOM_LEVEL}
        zoomControl={true}
        attributionControl={false}
        preferCanvas={true}
      >
        <TileLayer
          url={config.api.maps.tiles}
          attribution={false}
        />
        <TileErrorHandler />

        {userLocation && <FitMapToBounds userLocation={userLocation} radius={radius} />}

        <HomeMapController
          maxCurrentRadius={radius}
          userLocation={userLocation}
          radius={currentRadius}
          onMapMove={handleMapMove}
          onLocationChange={handleLocationChange}
          handleRestaurant={handleRestaurantClick}
          handleEvent={handleEvent}
          activeFilters={activeFilters}
          events={events}
        />

        <Circle
          center={[mapCenter.lat, mapCenter.lng]}
          radius={currentRadius * 1000}
          pathOptions={{
            color: '#93c5fd',
            fillColor: '#93c5fd',
            fillOpacity: 0.1,
            weight: 3,
          }}
        />

        <div className="absolute bottom-4 right-4 bg-white px-4 py-3 rounded-lg shadow-md z-[1000] radius-indicator">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#93c5fd]"></div>
            <p className="text-sm font-medium">Radius: {currentRadius.toFixed(1)}km</p>
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

      {/* Restaurant Detail Card */}
      {selectedRestaurant && typeof selectedRestaurant === 'object' && (
        <RestaurantDetailCard
          data={selectedRestaurant}
          onClose={handleCloseRestaurantCard}
          userLocation={userLocation}
          onOrderNow={() => {
            // Navigate to restaurant detail page
            // This will be handled in the MapRestaurantCard component
          }}
        />
      )}
    </div>
  );
};

// Restaurant Detail Map Component
export const RestaurantDetailMap = ({
  height = '300px',
  userLocation,
  restaurantLocation
}) => {
  const RestaurantDetailController = () => {
    const map = useMap();
    const [routeElements, setRouteElements] = useState({
      polyline: null,
      userMarker: null,
      restaurantMarker: null
    });

    // Create a curved line between user and restaurant
    const createCurvedPolyline = (startPoint, endPoint, map) => {
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
        color: '#000000',
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.8,
        lineCap: 'round'
      }).addTo(map);
    };

    // Set up route and markers
    useEffect(() => {
      // Ensure we're waiting for map to be available
      if (!map) return;

      // Clean up previous elements
      if (routeElements.polyline) routeElements.polyline.remove();
      if (routeElements.userMarker) routeElements.userMarker.remove();
      if (routeElements.restaurantMarker) routeElements.restaurantMarker.remove();

      if (userLocation && restaurantLocation) {
        const startPoint = L.latLng(userLocation.lat, userLocation.lng);
        const endPoint = L.latLng(restaurantLocation.lat, restaurantLocation.lng);

        // Create curved line
        const polyline = createCurvedPolyline(startPoint, endPoint, map);

        // Add user marker with improved design
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="user-location-dot">
                <div class="user-location-pulse"></div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        }).addTo(map);

        // Add restaurant marker
        const restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng], {
          icon: L.divIcon({
            className: 'restaurant-destination-marker',
            html: `
              <div class="restaurant highlighted">
                <div class="restaurant-indicator">
                  <img src="${Kebab}" style="height:22px" alt="restaurant"/>
                </div>
                <div class="highlight-ring"></div>
              </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25]
          })
        }).addTo(map);

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [restaurantLocation.lat, restaurantLocation.lng]
        ]);
        map.fitBounds(bounds, { padding: [70, 70] });

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

  // Calculate the initial center point between user and restaurant
  const initialCenter = userLocation && restaurantLocation ? [
    (userLocation.lat + restaurantLocation.lat) / 2,
    (userLocation.lng + restaurantLocation.lng) / 2
  ] : [52.516267, 13.322455];

  // Use stable key to prevent remounting
  const mapKey = useRef(`detail-map-${Date.now()}`).current;

  return (
    <div style={{ height, width: '100%' }} className="restaurant-detail-map-container">
      <MapContainer
        key={mapKey}
        center={initialCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        minZoom={3}
        maxZoom={MAX_ZOOM_LEVEL}
        zoomControl={true}
        attributionControl={false}
        preferCanvas={true}
      >
        <TileLayer
          url={config.api.maps.tiles}
          attribution={false}
        />
        <TileErrorHandler />
        <RestaurantDetailController />
      </MapContainer>
    </div>
  );
};

// Location selector map
export const LocationSelectorMap = ({
  height = '55vh',
  initialLocation,
  onLocationSelected
}) => {
  const center = initialLocation
    ? [initialLocation.lat, initialLocation.lng]
    : [52.516267, 13.322455];

  const LocationSelectorController = ({ onLocationSelect }) => {
    const map = useMap();

    // Map events binding
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onLocationSelect({ lat: center.lat, lng: center.lng });
    };

    useEffect(() => {
      // Add event listener
      map.on('moveend', handleMoveEnd);

      // Initial call
      handleMoveEnd();

      // Cleanup
      return () => {
        map.off('moveend', handleMoveEnd);
      };
    }, [map]);

    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
        <div className="location-pin">
          <div className="location-pin-inner"></div>
          <div className="location-pin-shadow"></div>
        </div>
      </div>
    );
  };

  // Use stable key to prevent remounting
  const mapKey = useRef(`location-map-${Date.now()}`).current;

  return (
    <div style={{ height, width: '100%' }} className="location-selector-map-container">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        minZoom={3}
        maxZoom={MAX_ZOOM_LEVEL}
        zoomControl={true}
        attributionControl={false}
        preferCanvas={true}
      >
        <TileLayer
          url={config.api.maps.tiles}
          attribution={false}
        />
        <TileErrorHandler />
        <LocationSelectorController onLocationSelect={onLocationSelected} />
      </MapContainer>
    </div>
  );
};

export default {
  HomeMap,
  LocationSelectorMap,
  RestaurantDetailMap
};
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
const DEBUG_MODE = true;
const MAX_REQUESTS_PER_MINUTE = 20;

// FIXED: Strict radius calculation that never exceeds API limits
const calculateRadius = (zoom) => {
  if (zoom === undefined) return 10; // Safe default

  // CRITICAL: Ensure radius never exceeds 45km (under API limit)
  // Progressive scaling from 45km to 0.5km
  const radiusMap = {
    0: 45, 1: 45, 2: 40, 3: 35, 4: 30, 5: 25,
    6: 20, 7: 15, 8: 12, 9: 10, 10: 8,
    11: 6, 12: 4, 13: 3, 14: 2, 15: 1.5,
    16: 1, 17: 0.8, 18: 0.5
  };

  // Ensure we never exceed 45km or go below 0.5km
  const radius = radiusMap[zoom] || Math.max(0.5, Math.min(45, 45 - (zoom * 2.5)));
  return Math.max(0.5, Math.min(45, radius));
};

// ULTRA AGGRESSIVE request tracker 
const requestTracker = {
  lastRequest: 0,
  activeRequests: 0,
  lastRequestKey: '',
  processingRequests: new Set(),
  globalLock: false,

  canProceed: (key = '') => {
    const now = Date.now();
    const timeSinceLastRequest = now - requestTracker.lastRequest;

    // Global lock - blocks ALL requests
    if (requestTracker.globalLock) {
      debugLog('🔒 Request blocked: global lock active');
      return false;
    }

    // Block identical requests completely for longer
    if (key === requestTracker.lastRequestKey && timeSinceLastRequest < 2000) {
      debugLog('🚫 Blocking duplicate request:', key);
      return false;
    }

    // Check if this specific request is already processing
    if (requestTracker.processingRequests.has(key)) {
      debugLog('🔄 Request already processing:', key);
      return false;
    }

    // ULTRA STRICT: Only 1 request at a time, minimum 1 second between requests
    if (timeSinceLastRequest < 1000 || requestTracker.activeRequests >= 1) {
      debugLog(`⏱️ Rate limiting: ${timeSinceLastRequest}ms since last, ${requestTracker.activeRequests} active`);
      return false;
    }

    requestTracker.lastRequest = now;
    requestTracker.lastRequestKey = key;
    requestTracker.processingRequests.add(key);
    return true;
  },

  startRequest: () => {
    requestTracker.activeRequests++;
    requestTracker.globalLock = true; // Lock everything during request
  },

  endRequest: (key = '') => {
    requestTracker.activeRequests = Math.max(0, requestTracker.activeRequests - 1);
    if (key) {
      requestTracker.processingRequests.delete(key);
    }

    // Unlock after a delay to ensure request is fully processed
    setTimeout(() => {
      requestTracker.globalLock = false;
    }, 100);
  }
};

// Debug helper
const debugLog = (...args) => {
  if (DEBUG_MODE) console.log(...args);
};

// Position comparison helper
const isSamePosition = (pos1, pos2, precision = 5) => {
  if (!pos1 || !pos2) return false;
  return (
    pos1.lat.toFixed(precision) === pos2.lat.toFixed(precision) &&
    pos1.lng.toFixed(precision) === pos2.lng.toFixed(precision)
  );
};

// Helper function for calculating distance
const calculateDistance = (restaurant, userLocation) => {
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

// Function to fetch restaurants in chunks
const fetchRestaurantsInChunks = async (client, position, restaurantIds, userLocation, onSuccess) => {
  const chunkSize = 20;
  const chunks = [];

  for (let i = 0; i < restaurantIds.length; i += chunkSize) {
    chunks.push(restaurantIds.slice(i, i + chunkSize));
  }

  let allRestaurants = [];
  let allCampaigns = [];

  debugLog(`Fetching ${restaurantIds.length} restaurants in ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunk = chunks[i];
      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: {
          userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
          location: [position.lng, position.lat],
          distance: Math.max(2, Math.min(45, 2)), // Safe radius
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
    onSuccess(allRestaurants, allCampaigns);
    return true;
  }

  return false;
};

// Function to fetch with expanding radius for large clusters
const fetchWithExpandingRadius = async (client, position, userLocation, radii, onSuccess) => {
  const radiusValues = radii || [2, 3, 4, 5]; // Safe default radii

  for (let i = 0; i < radiusValues.length; i++) {
    const radius = Math.max(2, Math.min(45, radiusValues[i])); // Ensure safe radius

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
        onSuccess(data.allRestaurants.restaurants, data.allRestaurants.campaigns);
        return true;
      }
    } catch (err) {
      console.error(`Error with radius ${radius}:`, err);
    }
  }

  return false;
};

// Tile Error Handler Component
const TileErrorHandler = () => {
  const map = useMap();

  useEffect(() => {
    const handleTileError = () => {
      if (map.getZoom() > MAX_ZOOM_LEVEL) {
        map.setZoom(MAX_ZOOM_LEVEL);
      }
    };

    map.on('tileerror', handleTileError);
    return () => map.off('tileerror', handleTileError);
  }, [map]);

  return null;
};

// MAIN CONTROLLER - Completely rewritten for smooth zoom
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

  // Single state ref for everything to prevent conflicts
  const state = useRef({
    initialized: false,
    currentCenter: null,
    currentRadius: radius,
    currentZoom: 14,
    markers: {
      clusters: [],
      restaurants: [],
      user: null,
      events: {},
      selected: null
    },
    fetching: false,
    lastFetchKey: '',
    userLocationState: userLocation,
    isUserInteraction: false,
    lastFiltersKey: '',
    pendingFetch: null
  });

  const [loading, setLoading] = useState(false);

  // Update user location in state
  useEffect(() => {
    state.current.userLocationState = userLocation;
  }, [userLocation]);

  // Clear all markers except user and events
  const clearMarkers = useCallback(() => {
    // Clear clusters
    state.current.markers.clusters.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    state.current.markers.clusters = [];

    // Clear restaurants
    state.current.markers.restaurants.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    state.current.markers.restaurants = [];

    // Clear selected marker
    state.current.markers.selected = null;
  }, [map]);

  // Create cluster icon
  const createClusterIcon = (count) => {
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
      iconSize: [size, size],
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
      iconSize: [44, 44],
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
      iconSize: [50, 50],
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

  // Create restaurant popup
  const createRestaurantPopup = (restaurant, position) => {
    const popupContent = document.createElement('div');
    popupContent.className = 'custom-restaurant-popup';

    popupContent.innerHTML = `
      <div class="restaurant-popup-container">
        <div class="restaurant-popup-header">
          <h3 class="restaurant-popup-title">${restaurant.name || "Restaurant"}</h3>
          <button class="restaurant-popup-close" aria-label="Close">×</button>
        </div>
        <div class="restaurant-popup-content">
          <div class="restaurant-popup-info">
            <div class="restaurant-popup-address">${restaurant.address || ""}</div>
            <div class="restaurant-popup-distance">${calculateDistance(restaurant, state.current.userLocationState) || ""}</div>
          </div>
          <div class="restaurant-popup-actions">
            <button class="restaurant-popup-button view-details">View Details</button>
            <button class="restaurant-popup-button get-directions">Get Directions</button>
          </div>
        </div>
      </div>
    `;

    const popup = L.popup({
      className: 'restaurant-custom-popup',
      closeButton: false,
      offset: [0, -25],
      maxWidth: 300
    }).setLatLng(position).setContent(popupContent);

    // Add event listeners after popup is added to map
    setTimeout(() => {
      const closeBtn = popupContent.querySelector('.restaurant-popup-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          map.closePopup(popup);
        });
      }

      const viewDetailsBtn = popupContent.querySelector('.view-details');
      if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
          handleRestaurant(restaurant);
          map.closePopup(popup);
        });
      }

      const getDirectionsBtn = popupContent.querySelector('.get-directions');
      if (getDirectionsBtn) {
        getDirectionsBtn.addEventListener('click', () => {
          if (restaurant.location && restaurant.location.coordinates) {
            const [lng, lat] = restaurant.location.coordinates.map(coord => parseFloat(coord));
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
    if (state.current.markers.selected && state.current.markers.selected !== marker) {
      const prevMarker = state.current.markers.selected;
      prevMarker.setZIndexOffset(800);

      if (prevMarker.restaurant) {
        prevMarker.setIcon(createRestaurantIcon(
          prevMarker.restaurant.isAvailable,
          prevMarker.restaurant.onboarded,
          prevMarker.restaurant.campaigns?.length > 0 ? prevMarker.restaurant.gif : null
        ));
      }
    }

    // Set new highlighted marker
    state.current.markers.selected = marker;
    marker.setZIndexOffset(1000);
    marker.restaurant = restaurant;

    marker.setIcon(createRestaurantHighlightedIcon(
      restaurant.isAvailable,
      restaurant.onboarded,
      restaurant.campaigns?.length > 0 ? restaurant.gif : null
    ));
  };

  // Render restaurants in a specific area
  const renderRestaurantsInArea = useCallback((restaurants, campaigns, center, radius) => {
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

    if (activeFilters?.offers) {
      filteredRestaurants = filteredRestaurants.filter(restaurant => {
        const hasCampaigns = campaignsByRestaurant[restaurant._id]?.length > 0;
        return hasCampaigns && restaurant.isAvailable;
      });
    }

    // Clear existing restaurant markers in this area
    const markersToRemove = state.current.markers.restaurants.filter(marker => {
      const markerPos = marker.getLatLng();
      const distance = markerPos.distanceTo(center) / 1000;
      return distance < radius * 1.2;
    });

    markersToRemove.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });

    state.current.markers.restaurants = state.current.markers.restaurants.filter(
      marker => !markersToRemove.includes(marker)
    );

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

      marker.restaurant = restaurantWithCampaigns;

      marker.on('click', () => {
        highlightMarker(marker, restaurantWithCampaigns);
        map.setView([lat, lng], map.getZoom());
        const popup = createRestaurantPopup(restaurantWithCampaigns, [lat, lng]);
        popup.openOn(map);
      });

      state.current.markers.restaurants.push(marker);
      renderedCount++;
    });

    debugLog(`Rendered ${renderedCount} restaurants in area`);
  }, [map, activeFilters, handleRestaurant]);

  // Fetch restaurants in a specific area
  const fetchRestaurantsInArea = useCallback(async (position, radius) => {
    const safeRadius = Math.max(2, Math.min(45, radius * 1.2));
    const requestKey = `area-${position.lat.toFixed(6)}-${position.lng.toFixed(6)}-${safeRadius}`;

    if (!requestTracker.canProceed(requestKey)) {
      debugLog("Skipping duplicate area request");
      return;
    }

    try {
      requestTracker.startRequest();
      setLoading(true);

      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: {
          userLocation: state.current.userLocationState ? [state.current.userLocationState.lng, state.current.userLocationState.lat] : null,
          location: [position.lng, position.lat],
          distance: safeRadius,
          limit: 200,
          showEvents: activeFilters?.events ?? true,
          showOffers: activeFilters?.offers ?? false
        },
        fetchPolicy: 'network-only'
      });

      if (data?.allRestaurants?.restaurants) {
        renderRestaurantsInArea(data.allRestaurants.restaurants, data.allRestaurants.campaigns, position, safeRadius);
      }

    } catch (error) {
      console.error("Error fetching restaurants in area:", error);
    } finally {
      requestTracker.endRequest();
      setTimeout(() => setLoading(false), 100);
    }
  }, [client, activeFilters, renderRestaurantsInArea]);

  // Fetch single restaurant
  const fetchSingleRestaurant = useCallback(async (position, cluster) => {
    try {
      setLoading(true);

      const restaurantId = cluster.restaurantId ||
        (cluster.restaurants && cluster.restaurants[0]) ||
        (typeof cluster.restaurants === 'string' ? cluster.restaurants : null);

      const queryVariables = {
        userLocation: state.current.userLocationState ? [state.current.userLocationState.lng, state.current.userLocationState.lat] : null,
        location: [position.lng, position.lat],
        distance: Math.min(45, 2), // Safe radius
        limit: 5,
        showEvents: false
      };

      if (restaurantId) {
        queryVariables.restaurantIds = [restaurantId];
      }

      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: queryVariables,
        fetchPolicy: 'network-only'
      });

      const restaurants = data?.allRestaurants?.restaurants || data?.restaurantsMapApi?.restaurants;
      const campaigns = data?.allRestaurants?.campaigns || data?.restaurantsMapApi?.campaigns || [];

      if (restaurants && restaurants.length > 0) {
        const restaurant = restaurants[0];
        const restaurantWithCampaigns = {
          ...restaurant,
          campaigns: Array.isArray(campaigns)
            ? campaigns.filter(c => c.restaurant === restaurant._id)
            : []
        };

        setTimeout(() => {
          map.setView([position.lat, position.lng], map.getZoom());

          if (state.current.markers.selected) {
            map.removeLayer(state.current.markers.selected);
          }

          let lat, lng;
          if (restaurant.location && restaurant.location.coordinates &&
            Array.isArray(restaurant.location.coordinates) &&
            restaurant.location.coordinates.length >= 2) {
            [lng, lat] = restaurant.location.coordinates.map(coord => parseFloat(coord));
          } else {
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

          state.current.markers.selected = marker;

          const popup = createRestaurantPopup(restaurantWithCampaigns, [lat, lng]);
          popup.openOn(map);
        }, 100);

        return true;
      } else {
        fetchRestaurantsInArea(position, 2);
      }
    } catch (error) {
      console.error("Error fetching single restaurant:", error);
      fetchRestaurantsInArea(position, 2);
    } finally {
      setTimeout(() => setLoading(false), 100);
    }
  }, [map, client, handleRestaurant, fetchRestaurantsInArea]);

  // Render restaurants
  const renderRestaurants = useCallback((restaurants, campaigns) => {
    clearMarkers();

    const campaignsByRestaurant = campaigns?.reduce((acc, campaign) => {
      const restaurantId = campaign.restaurant;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(campaign);
      return acc;
    }, {}) || {};

    let filteredRestaurants = [...restaurants];

    if (activeFilters?.offers) {
      filteredRestaurants = filteredRestaurants.filter(restaurant => {
        const hasCampaigns = campaignsByRestaurant[restaurant._id]?.length > 0;
        return hasCampaigns && restaurant.isAvailable;
      });
    }

    let renderedCount = 0;
    filteredRestaurants.forEach(restaurant => {
      if (!restaurant.location || !restaurant.location.coordinates) return;

      const [lng, lat] = restaurant.location.coordinates;

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

      marker.restaurant = restaurantWithCampaigns;

      marker.on('click', () => {
        highlightMarker(marker, restaurantWithCampaigns);
        map.setView([lat, lng], map.getZoom());
        const popup = createRestaurantPopup(restaurantWithCampaigns, [lat, lng]);
        popup.openOn(map);
      });

      state.current.markers.restaurants.push(marker);
      renderedCount++;
    });

    debugLog(`Rendered ${renderedCount} restaurants`);
  }, [map, activeFilters, handleRestaurant, clearMarkers]);

  // Render clusters
  const renderClusters = useCallback((clusters, center, radius) => {
    clearMarkers();

    let filteredClusters = [...clusters];

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

      marker.on('click', () => {
        state.current.isUserInteraction = true;

        const currentZoom = map.getZoom();
        const isMaxZoom = currentZoom >= MAX_ZOOM_LEVEL - 1;

        if (cluster.count === 1) {
          fetchSingleRestaurant(clusterPosition, cluster);
        }
        else if (isMaxZoom || cluster.count <= 15) {
          // Fetch restaurants directly
          client.query({
            query: GET_RESTAURANTS_MAP_API,
            variables: {
              userLocation: state.current.userLocationState ? [state.current.userLocationState.lng, state.current.userLocationState.lat] : null,
              location: [clusterPosition.lng, clusterPosition.lat],
              distance: Math.min(45, 2), // Safe radius
              limit: 100,
              showEvents: false
            },
            fetchPolicy: 'network-only'
          }).then(response => {
            if (response?.data?.allRestaurants?.restaurants) {
              const clusterArea = state.current.markers.clusters.filter(m => {
                const mPos = m.getLatLng();
                const distance = mPos.distanceTo(clusterPosition) / 1000;
                return distance < 1;
              });

              clusterArea.forEach(m => {
                if (m) map.removeLayer(m);
                state.current.markers.clusters = state.current.markers.clusters.filter(existing => existing !== m);
              });

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
          // Zoom in for larger clusters
          const zoomIncrement = cluster.count > 100 ? 3 : (cluster.count > 50 ? 2 : 1);
          const newZoom = Math.min(currentZoom + zoomIncrement, MAX_ZOOM_LEVEL);
          map.setView([lat, lng], newZoom);
        }

        setTimeout(() => {
          state.current.isUserInteraction = false;
        }, 500);
      });

      state.current.markers.clusters.push(marker);
      renderedCount++;
    });

    debugLog(`Rendered ${renderedCount} clusters`);
  }, [map, clearMarkers, client, renderRestaurantsInArea, fetchSingleRestaurant]);

  // MAIN FETCH FUNCTION - Enhanced to prevent all cascading issues
  const fetchMapData = useCallback(async (center, fetchRadius, forceUpdate = false) => {
    // Strict radius validation - never exceed 45km
    const safeRadius = Math.max(0.5, Math.min(45, fetchRadius));
    const zoom = map.getZoom();

    // Generate detailed request key
    const requestKey = `fetch-${center.lat.toFixed(4)}-${center.lng.toFixed(4)}-${safeRadius}-${zoom}-${Date.now()}`;

    // Rate limiting check with enhanced tracker
    if (!forceUpdate && !requestTracker.canProceed(requestKey)) {
      debugLog('Request blocked by enhanced tracker');
      return Promise.resolve();
    }

    // Additional check: prevent concurrent requests to same endpoint
    if (state.current.fetching && !forceUpdate) {
      debugLog('Already fetching, skipping');
      return Promise.resolve();
    }

    try {
      state.current.fetching = true;
      requestTracker.startRequest();
      setLoading(true);

      debugLog(`🔄 Fetching: zoom=${zoom}, radius=${safeRadius}km, key=${requestKey}`);

      // Clear existing markers
      clearMarkers();

      let data;
      // Choose API based on zoom level
      if (zoom < 14) {
        // Fetch clusters
        const response = await client.query({
          query: GET_RESTAURANT_CLUSTERS,
          variables: {
            input: {
              location: [center.lng, center.lat],
              maxDistance: safeRadius
            }
          },
          fetchPolicy: 'network-only'
        });
        data = response.data;

        // Only process if zoom hasn't changed during fetch
        if (zoom !== map.getZoom()) {
          debugLog('Zoom changed during fetch, discarding cluster results');
          return;
        }

        if (data?.restaurantClusters?.clusters) {
          // Consolidate clusters at very low zoom levels
          if (zoom < 6) {
            const totalCount = data.restaurantClusters.clusters.reduce((sum, cluster) => sum + (cluster.count || 0), 0);
            const consolidatedClusters = [{
              _id: "consolidated-cluster",
              count: totalCount,
              location: {
                coordinates: [center.lng, center.lat]
              }
            }];
            renderClusters(consolidatedClusters, center, safeRadius);
          } else {
            renderClusters(data.restaurantClusters.clusters, center, safeRadius);
          }
        }
      } else {
        // Fetch restaurants
        const response = await client.query({
          query: GET_RESTAURANTS_MAP_API,
          variables: {
            userLocation: state.current.userLocationState ? [state.current.userLocationState.lng, state.current.userLocationState.lat] : null,
            location: [center.lng, center.lat],
            distance: safeRadius,
            limit: 200,
            showEvents: activeFilters?.events ?? true,
            showOffers: activeFilters?.offers ?? false
          },
          fetchPolicy: 'network-only'
        });
        data = response.data;

        // Only process if zoom hasn't changed during fetch
        if (zoom !== map.getZoom()) {
          debugLog('Zoom changed during fetch, discarding restaurant results');
          return;
        }

        if (data?.allRestaurants?.restaurants) {
          renderRestaurants(data.allRestaurants.restaurants, data.allRestaurants.campaigns);
        }
      }

      debugLog(`✅ Fetch completed successfully for zoom=${zoom}`);

    } catch (error) {
      console.error('❌ Error fetching map data:', error);
    } finally {
      state.current.fetching = false;
      requestTracker.endRequest(requestKey);
      setTimeout(() => setLoading(false), 100);
    }
  }, [map, client, activeFilters, clearMarkers, renderClusters, renderRestaurants]);

  // Setup user marker
  const setupUserMarker = useCallback(() => {
    if (state.current.markers.user) {
      map.removeLayer(state.current.markers.user);
    }

    const location = state.current.userLocationState;
    if (!location) return;

    const marker = L.marker([location.lat, location.lng], {
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

    marker.bindTooltip("Drag to move your location", {
      permanent: false,
      direction: 'top'
    });

    let isDragging = false;

    marker.on('dragstart', function () {
      isDragging = true;
      state.current.isUserInteraction = true;
    });

    marker.on('dragend', function (e) {
      if (!isDragging) return;
      isDragging = false;

      const newLocation = {
        lat: e.target.getLatLng().lat,
        lng: e.target.getLatLng().lng
      };

      state.current.currentCenter = e.target.getLatLng();
      state.current.userLocationState = newLocation;

      onLocationChange(newLocation);
      onMapMove(e.target.getLatLng(), state.current.currentRadius);
      map.setView([newLocation.lat, newLocation.lng], map.getZoom());
      fetchMapData(e.target.getLatLng(), state.current.currentRadius, true);

      setTimeout(() => {
        state.current.isUserInteraction = false;
      }, 300);
    });

    state.current.markers.user = marker;
  }, [map, onLocationChange, onMapMove, fetchMapData]);

  // Update event markers
  const updateEventMarkers = useCallback((events) => {
    if (!map) return;

    const currentMarkers = { ...state.current.markers.events };
    const newMarkers = {};

    if (activeFilters?.events === false) {
      Object.entries(currentMarkers).forEach(([id, marker]) => {
        if (marker) map.removeLayer(marker);
      });
      state.current.markers.events = {};
      return;
    }

    if (events && events.length > 0) {
      events.forEach((event) => {
        if (!event.location || !event.location.coordinates) return;

        const [lng, lat] = event.location.coordinates;
        const eventLng = parseFloat(lng);
        const eventLat = parseFloat(lat);

        if (isNaN(eventLat) || isNaN(eventLng)) return;

        if (currentMarkers[event._id]) {
          newMarkers[event._id] = currentMarkers[event._id];
          delete currentMarkers[event._id];
        } else {
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
              state.current.isUserInteraction = true;
              map.setView([eventLat, eventLng], map.getZoom());

              Object.values(state.current.markers.events).forEach((m) => {
                if (m) {
                  m.setIcon(createEventIcon());
                  m.setZIndexOffset(900);
                }
              });

              marker.setZIndexOffset(1000);
              handleEvent(event);

              setTimeout(() => {
                state.current.isUserInteraction = false;
              }, 300);
            });

          newMarkers[event._id] = marker;
        }
      });
    }

    Object.entries(currentMarkers).forEach(([id, marker]) => {
      if (marker) map.removeLayer(marker);
    });

    state.current.markers.events = newMarkers;
  }, [map, handleEvent, activeFilters]);

  // ULTRA AGGRESSIVE zoom handler - prevent all cascading zoom events
  useEffect(() => {
    if (!map || !state.current.initialized) return;

    let zoomTimeout = null;
    let isProcessingZoom = false;
    let zoomLocked = false;

    const handleZoomEnd = () => {
      // Completely ignore if zoom is locked or already processing
      if (zoomLocked || isProcessingZoom) {
        debugLog('🔒 Zoom blocked: locked or processing');
        return;
      }

      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }

      zoomTimeout = setTimeout(() => {
        const newZoom = map.getZoom();
        const center = map.getCenter();

        // Skip if zoom hasn't actually changed
        if (newZoom === state.current.currentZoom) {
          debugLog('Zoom unchanged, skipping');
          return;
        }

        // LOCK THE ZOOM to prevent any other zoom events
        zoomLocked = true;
        isProcessingZoom = true;

        debugLog(`🔄 LOCKED Zoom processing: ${state.current.currentZoom} → ${newZoom}`);

        // Update state IMMEDIATELY
        state.current.currentZoom = newZoom;
        const newRadius = calculateRadius(newZoom);
        state.current.currentRadius = newRadius;
        state.current.currentCenter = center;

        // Temporarily disable all map interactions to prevent zoom cascade
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();

        // DON'T call onMapMove here as it might trigger view changes
        // Just update the local UI state

        // Force fetch with new zoom level
        fetchMapData(center, newRadius, true)
          .then(() => {
            debugLog('✅ Zoom fetch completed');
            // Only call onMapMove AFTER fetch completes to prevent cascading
            if (onMapMove) {
              onMapMove(center, newRadius);
            }
          })
          .catch((error) => {
            console.error('❌ Zoom fetch failed:', error);
          })
          .finally(() => {
            // Re-enable map interactions after processing is complete
            setTimeout(() => {
              try {
                map.scrollWheelZoom.enable();
                map.doubleClickZoom.enable();
                map.boxZoom.enable();
                map.keyboard.enable();

                zoomLocked = false;
                isProcessingZoom = false;
                debugLog('🔓 Zoom unlocked - processing complete');
              } catch (error) {
                console.error('Error re-enabling map interactions:', error);
              }
            }, 200);
          });
      }, 100); // Shorter debounce since we're locking zoom
    };

    // Remove ALL existing zoom handlers to prevent conflicts
    map.off('zoomend');
    map.off('zoom');
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('zoom');
      if (zoomTimeout) clearTimeout(zoomTimeout);

      // Ensure interactions are re-enabled on cleanup
      try {
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
      } catch (error) {
        console.error('Error re-enabling interactions on cleanup:', error);
      }

      zoomLocked = false;
      isProcessingZoom = false;
    };
  }, [map, fetchMapData]); // Removed onMapMove from dependencies

  // Handle move events (separate from zoom) with enhanced protection
  useEffect(() => {
    if (!map || !state.current.initialized) return;

    let moveTimeout = null;
    let lastMovePosition = null;

    const handleMoveEnd = () => {
      // Don't handle move during zoom or fetch
      if (state.current.fetching) {
        debugLog('Move ignored: currently fetching');
        return;
      }

      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }

      moveTimeout = setTimeout(() => {
        const center = map.getCenter();

        // Skip if position hasn't significantly changed (more precise check)
        if (lastMovePosition && isSamePosition(center, lastMovePosition, 4)) {
          debugLog('Move ignored: position unchanged');
          return;
        }

        // Skip if position is same as current center
        if (isSamePosition(center, state.current.currentCenter, 4)) {
          debugLog('Move ignored: same as current center');
          return;
        }

        debugLog(`Map moved: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`);
        lastMovePosition = center;
        state.current.currentCenter = center;

        // Update parent
        onMapMove(center, state.current.currentRadius);

        // Fetch data for new position (non-forced)
        fetchMapData(center, state.current.currentRadius, false);
      }, 500); // Longer debounce for moves to reduce API calls
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      if (moveTimeout) clearTimeout(moveTimeout);
    };
  }, [map, onMapMove, fetchMapData]);

  // Initialize map
  useEffect(() => {
    if (!map || state.current.initialized) return;

    const center = map.getCenter();
    const zoom = map.getZoom();
    const initialRadius = calculateRadius(zoom);

    debugLog('Initializing map', { zoom, radius: initialRadius });

    // Set initial state
    state.current.initialized = true;
    state.current.currentCenter = center;
    state.current.currentRadius = initialRadius;
    state.current.currentZoom = zoom;
    state.current.lastFiltersKey = JSON.stringify(activeFilters || {});

    // Setup user marker
    setupUserMarker();

    // Initial data fetch
    onMapMove(center, initialRadius);
    fetchMapData(center, initialRadius, true);

    // Handle map clicks for location placement
    const handleMapClick = (e) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        state.current.isUserInteraction = true;

        const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        state.current.currentCenter = e.latlng;
        state.current.userLocationState = newLocation;

        onLocationChange(newLocation);
        onMapMove(e.latlng, state.current.currentRadius);
        setupUserMarker();
        map.setView([newLocation.lat, newLocation.lng], map.getZoom());
        fetchMapData(e.latlng, state.current.currentRadius, true);
      }
    };

    map.on('click', handleMapClick);
    updateEventMarkers(events);

    return () => {
      map.off('click', handleMapClick);
      clearMarkers();
      if (state.current.markers.user) {
        map.removeLayer(state.current.markers.user);
      }
      Object.values(state.current.markers.events).forEach(marker => {
        if (marker) map.removeLayer(marker);
      });
      state.current.markers.events = {};

      if (state.current.pendingFetch) {
        clearTimeout(state.current.pendingFetch);
      }
    };
  }, [map, setupUserMarker, onMapMove, onLocationChange, fetchMapData, clearMarkers, updateEventMarkers, events, activeFilters]);

  // Handle user location changes
  useEffect(() => {
    if (!state.current.initialized) return;
    setupUserMarker();
  }, [userLocation, setupUserMarker]);

  // Handle filter changes
  useEffect(() => {
    if (!state.current.initialized || !state.current.currentCenter) return;

    const filtersKey = JSON.stringify(activeFilters);
    if (filtersKey === state.current.lastFiltersKey) {
      return;
    }

    state.current.lastFiltersKey = filtersKey;

    if (state.current.pendingFetch) {
      clearTimeout(state.current.pendingFetch);
    }

    state.current.pendingFetch = setTimeout(() => {
      state.current.pendingFetch = null;
      if (!state.current.fetching) {
        fetchMapData(state.current.currentCenter, state.current.currentRadius, true);
      }
    }, 200);

  }, [activeFilters, fetchMapData]);

  // Handle radius prop changes
  useEffect(() => {
    if (!state.current.initialized) return;

    const newRadius = Math.max(0.5, Math.min(45, radius));
    if (Math.abs(newRadius - state.current.currentRadius) > 0.1) {
      state.current.currentRadius = newRadius;
      if (state.current.currentCenter) {
        if (state.current.pendingFetch) {
          clearTimeout(state.current.pendingFetch);
        }

        state.current.pendingFetch = setTimeout(() => {
          state.current.pendingFetch = null;
          if (!state.current.fetching) {
            fetchMapData(state.current.currentCenter, newRadius, true);
          }
        }, 200);
      }
    }
  }, [radius, fetchMapData]);

  // Re-render events when they change
  useEffect(() => {
    if (!map || !state.current.initialized) return;
    updateEventMarkers(events);
  }, [map, events, updateEventMarkers]);

  // Return loading indicator
  return loading ? (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        <span className="text-sm font-medium text-gray-600">Loading</span>
      </div>
    </div>
  ) : (
    <>
      <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded shadow-lg text-sm">
        <div className="font-medium text-gray-700">
          <span>Ctrl+Click to place location pin</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded shadow-lg text-sm">
        <div className="font-medium text-gray-700">
          <span>Zoom: {map.getZoom()}</span><br />
          <span>Radius: {state.current.currentRadius.toFixed(1)}km</span><br />
          <span>Type: {map.getZoom() <= 13 ? 'Clusters' : 'Restaurants'}</span>
        </div>
      </div>
    </>
  );
};

// Fit map to bounds component
const FitMapToBounds = ({ userLocation, radius }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;

    const safeRadius = Math.max(0.5, Math.min(45, radius));
    const radiusInMeters = safeRadius * 1000;
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

// Optimized circle component
const CircleComponent = React.memo(() => {
  const map = useMap();
  const circleRef = useRef(null);

  useEffect(() => {
    const circle = L.circle(map.getCenter(), {
      radius: Math.min(45, Math.max(0.5, calculateRadius(map.getZoom()))) * 1000, // Convert to meters with limits
      color: '#93c5fd',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(map);

    circleRef.current = circle;

    const updateCircle = () => {
      if (!circleRef.current) return;

      const zoomLevel = map.getZoom();
      const radius = Math.min(45, Math.max(0.5, calculateRadius(zoomLevel))) * 1000; // Convert to meters

      circleRef.current.setLatLng(map.getCenter());
      circleRef.current.setRadius(radius);
    };

    map.on('moveend', updateCircle);
    map.on('zoomend', updateCircle);

    return () => {
      map.off('moveend', updateCircle);
      map.off('zoomend', updateCircle);
      if (circleRef.current) map.removeLayer(circleRef.current);
    };
  }, [map]);

  return null;
});

// Main HomeMap component
export const HomeMap = ({
  height = '100%',
  userLocation,
  radius = 10,
  onMapMove = () => { },
  onLocationChange = () => { },
  handleRestaurant,
  activeFilters,
  events = [],
  debug = false
}) => {
  const [mapCenter, setMapCenter] = useState({
    lat: userLocation?.lat || 52.516267,
    lng: userLocation?.lng || 13.322455
  });
  const [currentRadius, setCurrentRadius] = useState(Math.min(45, radius));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const lastLocationUpdateRef = useRef(null);

  // Update radius from filters if available
  useEffect(() => {
    const newRadius = activeFilters?.radius && !isNaN(parseFloat(activeFilters.radius))
      ? Math.min(45, Math.max(0.5, parseFloat(activeFilters.radius)))
      : Math.min(45, Math.max(0.5, radius));
    setCurrentRadius(newRadius);
  }, [radius, activeFilters]);

  // Update map center when userLocation changes
  useEffect(() => {
    if (userLocation) {
      lastLocationUpdateRef.current = Date.now();
      setMapCenter({
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    }
  }, [userLocation]);

  const handleMapMove = useCallback((center, newRadius) => {
    const safeRadius = Math.min(45, Math.max(0.5, newRadius));
    setMapCenter({ lat: center.lat, lng: center.lng });
    setCurrentRadius(safeRadius);
    onMapMove(center, safeRadius);
  }, [onMapMove]);

  const handleLocationChange = useCallback((newLocation) => {
    onLocationChange(newLocation);
    setMapCenter(newLocation);
    lastLocationUpdateRef.current = Date.now();
  }, [onLocationChange]);

  const handleEvent = useCallback((event) => {
    setSelectedRestaurant(null);
    setSelectedEvent(event);
  }, []);

  const handleRestaurantClick = useCallback((restaurant) => {
    setSelectedEvent(null);

    if (restaurant && typeof restaurant === 'object') {
      const safeRestaurant = {
        ...restaurant,
        campaigns: Array.isArray(restaurant.campaigns) ? restaurant.campaigns : []
      };

      setSelectedRestaurant(safeRestaurant);

      if (handleRestaurant) {
        handleRestaurant(safeRestaurant);
      }
    } else {
      console.error('Invalid restaurant data received:', restaurant);
    }
  }, [handleRestaurant]);

  const handleCloseEventCard = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleCloseRestaurantCard = useCallback(() => {
    setSelectedRestaurant(null);
    if (handleRestaurant) {
      handleRestaurant(null);
    }
  }, [handleRestaurant]);

  const handleVisitStalls = useCallback((eventId) => {
    console.log('Visit stalls clicked for event:', eventId);
  }, []);

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

        {/* Temporarily disabled to prevent zoom conflicts */}
        {/* {userLocation && <FitMapToBounds userLocation={userLocation} radius={currentRadius} />} */}

        <HomeMapController
          maxCurrentRadius={currentRadius}
          userLocation={userLocation}
          radius={currentRadius}
          onMapMove={handleMapMove}
          onLocationChange={handleLocationChange}
          handleRestaurant={handleRestaurantClick}
          handleEvent={handleEvent}
          activeFilters={activeFilters}
          events={events}
        />

        <div className="absolute bottom-16 right-4 bg-white px-4 py-3 rounded-lg shadow-md z-[1000] radius-indicator">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#93c5fd]"></div>
            <p className="text-sm font-medium">Radius: {currentRadius.toFixed(1)}km</p>
          </div>
        </div>

        <CircleComponent />
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
      const midLat = (startPoint.lat + endPoint.lat) / 2;
      const midLng = (startPoint.lng + endPoint.lng) / 2;

      const controlPoint = L.latLng(
        midLat + Math.abs(startPoint.lat - endPoint.lat) * 0.5,
        midLng + Math.abs(startPoint.lng - endPoint.lng) * 0.2
      );

      const curvePoints = [];
      for (let t = 0; t <= 1; t += 0.01) {
        const lat = Math.pow(1 - t, 2) * startPoint.lat + 2 * (1 - t) * t * controlPoint.lat + Math.pow(t, 2) * endPoint.lat;
        const lng = Math.pow(1 - t, 2) * startPoint.lng + 2 * (1 - t) * t * controlPoint.lng + Math.pow(t, 2) * endPoint.lng;
        curvePoints.push([lat, lng]);
      }

      return L.polyline(curvePoints, {
        color: '#000000',
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.8,
        lineCap: 'round'
      }).addTo(map);
    };

    useEffect(() => {
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

        // Add user marker
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

        setRouteElements({ polyline, userMarker, restaurantMarker });

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

  const initialCenter = userLocation && restaurantLocation ? [
    (userLocation.lat + restaurantLocation.lat) / 2,
    (userLocation.lng + restaurantLocation.lng) / 2
  ] : [52.516267, 13.322455];

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

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onLocationSelect({ lat: center.lat, lng: center.lng });
    };

    useEffect(() => {
      map.on('moveend', handleMoveEnd);
      handleMoveEnd(); // Initial call

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
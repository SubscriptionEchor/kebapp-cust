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
    moveEndCount: 0
  });

  // Trigger for re-renders (used minimally)
  const [isLoading, setIsLoading] = useState(false);

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

  // Create cluster icon
  const createClusterIcon = (count) => {
    return L.divIcon({
      html: `
        <div class="airbnb-cluster">
          <div class="airbnb-cluster-inner">
            <span>${count}</span>
          </div>
        </div>
      `,
      className: 'custom-cluster-marker',
      iconSize: L.point(48, 48),
      iconAnchor: [24, 24]
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
  const createEventIcon = (name: string) => {
    return L.divIcon({
      html: `
        <div class="event-marker">
          <div class="event-marker-pulse"></div>
          <div class="event-marker-inner">${name}</div>
        </div>
      `,
      className: '',
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    });
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

  // Setup user location marker
  const setupUserMarker = useCallback(() => {
    if (markersRef.current.user) {
      map.removeLayer(markersRef.current.user);
      markersRef.current.user = null;
    }

    if (userLocation) {
      // Create draggable user location marker
      const marker = L.marker([userLocation.lat, userLocation.lng], {
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

      // Handle drag end to update location
      marker.on('dragend', function (e) {
        const newPos = e.target.getLatLng();
        onLocationChange({ lat: newPos.lat, lng: newPos.lng });

        // Update center and fetch new data
        stateRef.current.currentCenter = newPos;
        fetchMapData(newPos, stateRef.current.currentRadius, true);
      });

      markersRef.current.user = marker;
    }
  }, [map, userLocation, onLocationChange]);

  // Render clusters on map
  const renderClusters = (clusters, center, radius) => {
    clusters.forEach(cluster => {
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

      // Add click handler to zoom in or show details
      marker.on('click', () => {
        // If zoomed in enough, fetch the restaurants in this cluster
        if (map.getZoom() >= 13) {
          // Fetch restaurants in this area
          fetchRestaurantsInArea(clusterPosition, 1);
        } else {
          // Otherwise zoom in
          map.setView([lat, lng], map.getZoom() + 2);
        }
      });

      markersRef.current.clusters.push(marker);
    });
  };

  // Fetch and render restaurants in a specific area
  const fetchRestaurantsInArea = async (position, radius) => {
    try {
      setIsLoading(true);
      const { data } = await client.query({
        query: GET_RESTAURANTS_MAP_API,
        variables: {
          userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
          location: [position.lng, position.lat],
          distance: radius,
          limit: 200,
          showEvents: activeFilters?.events ?? true,
          showOffers: activeFilters?.offers ?? false
        },
        fetchPolicy: 'network-only'
      });

      if (data?.allRestaurants?.restaurants) {
        renderRestaurants(data.allRestaurants.restaurants, data.allRestaurants.campaigns, position, radius);
      }
    } catch (error) {
      console.error("Error fetching restaurants in area:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render restaurants on map
  const renderRestaurants = (restaurants, campaigns, center, radius) => {
    // Match campaigns with restaurants
    const campaignsByRestaurant = campaigns?.reduce((acc, campaign) => {
      const restaurantId = campaign.restaurant;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(campaign);
      return acc;
    }, {}) || {};

    // Filter restaurants based on active filters
    let filteredRestaurants = restaurants;
    if (activeFilters?.offers) {
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        campaignsByRestaurant[restaurant._id]?.length > 0 && restaurant.isAvailable
      );
    }

    filteredRestaurants.forEach(restaurant => {
      if (!restaurant.location || !restaurant.location.coordinates) return;

      const [lng, lat] = restaurant.location.coordinates;
      const position = L.latLng(parseFloat(lat), parseFloat(lng));

      // Check if within radius
      const distance = center.distanceTo(position) / 1000;
      if (distance > radius) return;

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

        // Show restaurant details
        handleRestaurant(restaurantWithCampaigns);
      });

      markersRef.current.restaurants.push(marker);
    });
  };

  // Fetch map data with proper throttling
  const fetchMapData = async (center, radius, forceUpdate = false) => {
    // Prevent fetching too frequently
    const now = Date.now();
    if (!forceUpdate && now - stateRef.current.lastFetchTime < 500) {
      return;
    }

    // Prevent concurrent fetches
    if (stateRef.current.isFetching) {
      return;
    }

    try {
      stateRef.current.isFetching = true;
      stateRef.current.lastFetchTime = now;
      setIsLoading(true);

      // Clear existing markers before fetching
      clearMarkers();

      console.log("Fetching data for radius:", radius, "at", center);

      if (radius > 3) {
        // Fetch clusters for larger radius
        const { data } = await client.query({
          query: GET_RESTAURANT_CLUSTERS,
          variables: {
            input: {
              location: [center.lng, center.lat],
              maxDistance: radius,
            }
          },
          fetchPolicy: 'network-only'
        });

        if (data?.restaurantClusters?.clusters) {
          return;
          renderClusters(data.restaurantClusters.clusters, center, radius);
        }
      } else {
        // Fetch individual restaurants for smaller radius
        const { data } = await client.query({
          query: GET_RESTAURANTS_MAP_API,
          variables: {
            userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
            location: [center.lng, center.lat],
            distance: radius,
            limit: 200,
            showEvents: activeFilters?.events ?? true,
            showOffers: activeFilters?.offers ?? false
          },
          fetchPolicy: 'network-only'
        });

        if (data?.allRestaurants?.restaurants) {
          renderRestaurants(data.allRestaurants.restaurants, data.allRestaurants.campaigns, center, radius);
        }
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      stateRef.current.isFetching = false;
      setIsLoading(false);
    }
  };

  // Initialize map and setup event handlers
  useEffect(() => {
    if (!map || stateRef.current.isInitialized) return;

    // Initialize state
    const center = map.getCenter();
    stateRef.current.currentCenter = center;
    stateRef.current.currentRadius = radius;
    stateRef.current.isInitialized = true;

    // Setup user marker
    setupUserMarker();

    // Initial data fetch
    fetchMapData(center, radius);

    // Calculate radius based on zoom level and visible area
    const calculateRadius = () => {
      try {
        // Use filter-specified radius if available
        if (activeFilters?.radius && !isNaN(parseFloat(activeFilters.radius))) {
          return parseFloat(activeFilters.radius);
        }

        const center = map.getCenter();
        const bounds = map.getBounds();
        const radiusInMeters = center.distanceTo(bounds.getNorthEast());
        const radiusInKm = radiusInMeters / 1000;

        // Apply constraints
        if (radiusInKm > maxCurrentRadius) {
          return maxCurrentRadius;
        }
        if (radiusInKm > 50) {
          return 50;
        }
        if (radiusInKm < 2) {
          return 2;
        }

        // Round to one decimal place
        return Math.round(radiusInKm * 10) / 10;
      } catch (error) {
        console.error("Error calculating radius:", error);
        return stateRef.current.currentRadius || radius;
      }
    };

    // Setup map event handlers
    const handleMapMoveEnd = () => {
      // Throttle updates
      const now = Date.now();
      if (now - stateRef.current.lastFetchTime < 200) {
        return;
      }

      // Get current center and calculate radius
      const center = map.getCenter();
      stateRef.current.currentCenter = center;

      // Calculate effective radius
      let effectiveRadius = calculateRadius();
      if (effectiveRadius !== stateRef.current.currentRadius) {
        stateRef.current.currentRadius = effectiveRadius;
      }

      // Update parent component
      onMapMove(center, effectiveRadius);

      // Fetch data with the updated center and radius
      fetchMapData(center, effectiveRadius);
    };

    // Add map event listeners
    map.on('moveend', handleMapMoveEnd);
    map.on('zoomend', handleMapMoveEnd);

    // Handle click to place user location
    map.on('click', (e) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        // Update user location
        const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        onLocationChange(newLocation);

        // Update marker
        if (markersRef.current.user) {
          map.removeLayer(markersRef.current.user);
        }

        // Create new marker
        const marker = L.marker([newLocation.lat, newLocation.lng], {
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
        marker.bindTooltip("Your location (drag to move)", {
          permanent: false,
          direction: 'top'
        });

        // Handle drag end
        marker.on('dragend', function (e) {
          const pos = e.target.getLatLng();
          onLocationChange({ lat: pos.lat, lng: pos.lng });

          // Update center and fetch new data
          stateRef.current.currentCenter = pos;
          fetchMapData(pos, stateRef.current.currentRadius, true);
        });

        markersRef.current.user = marker;

        // Update center and fetch new data
        stateRef.current.currentCenter = e.latlng;
        fetchMapData(e.latlng, stateRef.current.currentRadius, true);
      }
    });

    // Setup events
    if (events && events.length > 0) {
      events.forEach((event) => {
        if (!event.location || !event.location.coordinates) return;

        const [lng, lat] = event.location.coordinates;
        const eventLng = parseFloat(lng);
        const eventLat = parseFloat(lat);

        if (isNaN(eventLat) || isNaN(eventLng)) return;
        // Create event marker
        const marker = L.marker([eventLat, eventLng], {
          icon: createEventIcon(event.name),
          zIndexOffset: 900,
          interactive: true
        })
          .addTo(map)
          .bindTooltip(event.name || "Event", {
            direction: 'top',
            offset: [0, -20]
          })
          .on('click', () => {
            // Center map on event
            map.setView([eventLat, eventLng], map.getZoom());
            handleEvent(event);
          });

        // Store the marker
        markersRef.current.eventMarkers[event._id] = marker;
      });
    }

    // Cleanup function
    return () => {
      map.off('moveend', handleMapMoveEnd);
      map.off('zoomend', handleMapMoveEnd);

      // Clean up markers
      clearMarkers();

      if (markersRef.current.user) {
        map.removeLayer(markersRef.current.user);
      }

      Object.values(markersRef.current.eventMarkers).forEach(marker => {
        if (marker) map.removeLayer(marker);
      });
      markersRef.current.eventMarkers = {};
    };
  }, [
    map, radius, maxCurrentRadius, userLocation, events,
    setupUserMarker, clearMarkers, onMapMove, onLocationChange,
    handleEvent, activeFilters
  ]);

  // Update user marker when location changes
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized) return;
    setupUserMarker();
  }, [map, userLocation, setupUserMarker]);

  // Handle filter changes
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized || !stateRef.current.currentCenter) return;

    // Fetch data with current center and radius but force update
    fetchMapData(stateRef.current.currentCenter, stateRef.current.currentRadius, true);
  }, [map, JSON.stringify(activeFilters)]);

  // Handle radius changes from props
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized || radius === stateRef.current.currentRadius) return;

    stateRef.current.currentRadius = radius;

    if (stateRef.current.currentCenter) {
      fetchMapData(stateRef.current.currentCenter, radius, true);
    }
  }, [map, radius]);

  // Re-render events when they change
  useEffect(() => {
    if (!map || !stateRef.current.isInitialized) return;

    // Clear existing event markers
    Object.values(markersRef.current.eventMarkers).forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    markersRef.current.eventMarkers = {};

    // Add new event markers
    if (events && events.length > 0) {
      events.forEach((event) => {
        if (!event.location || !event.location.coordinates) return;

        const [lng, lat] = event.location.coordinates;
        const eventLng = parseFloat(lng);
        const eventLat = parseFloat(lat);

        if (isNaN(eventLat) || isNaN(eventLng)) return;

        // Create event marker
        const marker = L.marker([eventLat, eventLng], {
          icon: createEventIcon(event.name),
          zIndexOffset: 900,
          interactive: true
        })
          .addTo(map)
          .bindTooltip(event.name || "Event", {
            direction: 'top',
            offset: [0, -20]
          })
          .on('click', () => {
            // Center map on event
            map.setView([eventLat, eventLng], map.getZoom());
            handleEvent(event);
          });

        // Store the marker
        markersRef.current.eventMarkers[event._id] = marker;
      });
    }
  }, [map, events, handleEvent]);

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
  events = []
}) => {
  const [mapCenter, setMapCenter] = useState({
    lat: userLocation?.lat || 52.516267,
    lng: userLocation?.lng || 13.322455
  });
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Update radius from filters if available
  useEffect(() => {
    if (activeFilters?.radius && !isNaN(parseFloat(activeFilters.radius))) {
      setCurrentRadius(parseFloat(activeFilters.radius));
    } else {
      setCurrentRadius(radius);
    }
  }, [radius, activeFilters]);

  // Update map center when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter({
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    }
  }, [userLocation]);

  const handleMapMove = useCallback((center, newRadius) => {
    setMapCenter({ lat: center.lat, lng: center.lng });
    setCurrentRadius(newRadius);
    onMapMove(center, newRadius);
  }, [onMapMove]);

  // Handle event click
  const handleEvent = useCallback((event) => {
    setSelectedRestaurant(null);
    setSelectedEvent(event);
  }, []);

  // Handle restaurant click
  const handleRestaurantClick = useCallback((restaurant) => {
    setSelectedEvent(null);
    setSelectedRestaurant(restaurant);
  }, []);

  // Handle close event card
  const handleCloseEventCard = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Handle close restaurant card
  const handleCloseRestaurantCard = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

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
        minZoom={MAX_ZOOM_LEVEL - 2}
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
          onLocationChange={onLocationChange}
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
      {selectedRestaurant && (
        <RestaurantDetailCard
          data={selectedRestaurant}
          onClose={handleCloseRestaurantCard}
          userLocation={userLocation}
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
    : [13.436279296875002, 52.496159531097106];

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
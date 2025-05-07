import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, useMap, Popup, useMapEvents } from 'react-leaflet';
import { useQuery } from '@apollo/client';
import L from 'leaflet';
import { debounce } from 'lodash';
import 'leaflet/dist/leaflet.css';
import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API } from '../../graphql/queries';
import { config } from '../../config';

const RADIUS_THRESHOLDS = [5.02, 6.97, 9.67, 13.44, 18.66, 25.92, 36.0, 50.0];
const DEBOUNCE_DELAY = 2000; // 500ms delay

const MapController: React.FC<{ 
  userLocation: any; 
  radius: number; 
  onMapMove: (center: L.LatLng, radius: number) => void;
  showRoute?: boolean;
  restaurantLocation?: {
    lat: number;
    lng: number;
  };
}> = ({ 
  userLocation, 
  radius,
  onMapMove,
  showRoute = false,
  restaurantLocation
}) => {
  const map = useMap();
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [currentCenter, setCurrentCenter] = useState<L.LatLng | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [prevRadiusAbove3km, setPrevRadiusAbove3km] = useState(currentRadius > 3);
  const [clusterMarkers, setClusterMarkers] = useState<L.Marker[]>([]);
  const [restaurantMarkers, setRestaurantMarkers] = useState<L.Marker[]>([]);
  const [routeElements, setRouteElements] = useState<{
    polyline?: L.Polyline;
    userMarker?: L.Marker;
    restaurantMarker?: L.Marker;
  }>({});
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
      limit: 200
    },
    skip: !isInitialized || !currentCenter || currentRadius > 3,
    fetchPolicy: 'network-only',
  });

  const calculateDistance = (point1: L.LatLng, point2: L.LatLng): number => {
    return point1.distanceTo(point2) / 1000;
  };

  const fitMapToBounds = () => {
    if (userLocation) {
      const center = L.latLng(userLocation.lat, userLocation.lng);
      const radiusInMeters = radius * 1000;

      const earthCircumference = 40075016.686;
      const latChange = (radiusInMeters / earthCircumference) * 360;
      const lngChange = latChange / Math.cos((Math.PI / 180) * userLocation.lat);

      const southWest = L.latLng(userLocation.lat - latChange, userLocation.lng - lngChange);
      const northEast = L.latLng(userLocation.lat + latChange, userLocation.lng + lngChange);
      const bounds = L.latLngBounds(southWest, northEast);

      map.fitBounds(bounds, {
        padding: [20, 20]
      });
    }
  };

  const calculateEffectiveRadius = () => {
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const distance = southWest.distanceTo(northEast) / 1000;
    const effectiveRadius = distance / 2;

    let closestThreshold = RADIUS_THRESHOLDS[0];
    let minDiff = Math.abs(effectiveRadius - closestThreshold);

    for (const threshold of RADIUS_THRESHOLDS) {
      const diff = Math.abs(effectiveRadius - threshold);
      if (diff < minDiff) {
        minDiff = diff;
        closestThreshold = threshold;
      }
    }

    if (effectiveRadius < RADIUS_THRESHOLDS[0] && effectiveRadius > 3) {
      return RADIUS_THRESHOLDS[0];
    }
    if (effectiveRadius <= 3) {
      return effectiveRadius;
    }
    return closestThreshold;
  };

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce((center: L.LatLng, effectiveRadius: number) => {
      if (effectiveRadius > 3) {
        refetchClusters();
      } else {
        refetchRestaurants();
      }
    }, DEBOUNCE_DELAY),
    [refetchClusters, refetchRestaurants]
  );

  useEffect(() => {
    fitMapToBounds();
    const center = map.getCenter();
    const effectiveRadius = calculateEffectiveRadius();
    setCurrentCenter(center);
    setIsInitialized(true);
    onMapMove(center, effectiveRadius);
  }, [map, userLocation, radius]);

  useEffect(() => {
    const shouldUpdateRadius = RADIUS_THRESHOLDS.some((threshold, index) => {
      const prevThreshold = index > 0 ? RADIUS_THRESHOLDS[index - 1] : 3;
      return (currentRadius >= prevThreshold && currentRadius < threshold) !== 
             (radius >= prevThreshold && radius < threshold);
    });

    if (shouldUpdateRadius) {
      setCurrentRadius(radius);
      clusterMarkers.forEach(marker => marker.remove());
      setClusterMarkers([]);
      restaurantMarkers.forEach(marker => marker.remove());
      setRestaurantMarkers([]);
      debouncedFetch(currentCenter!, radius);
    }
  }, [radius, currentCenter]);

  // Handle route display
  useEffect(() => {
    if (showRoute && userLocation && restaurantLocation) {
      // Clean up previous route elements
      if (routeElements.polyline) routeElements.polyline.remove();
      if (routeElements.userMarker) routeElements.userMarker.remove();
      if (routeElements.restaurantMarker) routeElements.restaurantMarker.remove();

      // Create polyline between user and restaurant
      const polyline = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [restaurantLocation.lat, restaurantLocation.lng]
        ],
        {
          color: '#93c5fd',
          weight: 3,
          opacity: 0.8,
          dashArray: '10, 10'
        }
      ).addTo(map);

      // Add markers
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      const restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-4 h-4 bg-black rounded-full"></div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [restaurantLocation.lat, restaurantLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });

      // Store route elements for cleanup
      setRouteElements({ polyline, userMarker, restaurantMarker });

      return () => {
        polyline.remove();
        userMarker.remove();
        restaurantMarker.remove();
      };
    }
  }, [showRoute, userLocation, restaurantLocation, map]);

  // Moved handleMapUpdate outside of useEffect
  const handleMapUpdate = useCallback(() => {
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

    clusterMarkers.forEach(marker => marker.remove());
    setClusterMarkers([]);
    restaurantMarkers.forEach(marker => marker.remove());
    setRestaurantMarkers([]);
    debouncedFetch(center, effectiveRadius);
  }, [map, currentRadius, clusterMarkers, restaurantMarkers, debouncedFetch, onMapMove]);

  useMapEvents({
    moveend: handleMapUpdate,
    zoomend: handleMapUpdate
  });

  useEffect(() => {
    const isAbove3km = currentRadius > 3;
    if (isAbove3km !== prevRadiusAbove3km) {
      if (isAbove3km) {
        restaurantMarkers.forEach(marker => marker.remove());
        setRestaurantMarkers([]);
        debouncedFetch(currentCenter!, currentRadius);
      } else {
        clusterMarkers.forEach(marker => marker.remove());
        setClusterMarkers([]);
        debouncedFetch(currentCenter!, currentRadius);
      }
      setPrevRadiusAbove3km(isAbove3km);
    }
  }, [currentRadius, prevRadiusAbove3km, currentCenter]);

  useEffect(() => {
    if (currentRadius > 3 && clustersData?.restaurantClusters?.clusters && currentCenter) {
      clusterMarkers.forEach(marker => marker.remove());
      const newMarkers: L.Marker[] = [];

      clustersData.restaurantClusters.clusters.forEach(cluster => {
        const [lng, lat] = cluster.location.coordinates;
        const clusterPosition = L.latLng(lat, lng);
        
        if (calculateDistance(currentCenter, clusterPosition) <= currentRadius) {
          const position: L.LatLngExpression = [lat, lng];

          const el = document.createElement('div');
          el.className = 'restaurant-cluster';
          el.style.backgroundColor = '#E5E7EB';
          el.style.color = '#000000';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontWeight = 'bold';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          el.innerHTML = cluster.count.toString();

          const customIcon = L.divIcon({
            html: el,
            className: 'custom-cluster-marker',
            iconSize: L.point(32, 32),
            iconAnchor: L.point(16, 16)
          });

          const marker = L.marker(position, { icon: customIcon })
            .addTo(map)
            .bindPopup(`${cluster.count} restaurants in this area`);
          newMarkers.push(marker);
        }
      });

      setClusterMarkers(newMarkers);
    } else {
      clusterMarkers.forEach(marker => marker.remove());
      setClusterMarkers([]);
    }
  }, [clustersData, map, currentRadius, currentCenter]);

  useEffect(() => {
    if (currentRadius <= 3 && restaurantsData?.restaurantsMapApi?.restaurants && currentCenter) {
      restaurantMarkers.forEach(marker => marker.remove());
      const newMarkers: L.Marker[] = [];

      restaurantsData.restaurantsMapApi.restaurants.forEach(restaurant => {
        const [lng, lat] = restaurant.location.coordinates;
        const restaurantPosition = L.latLng(parseFloat(lat), parseFloat(lng));
        
        if (calculateDistance(currentCenter, restaurantPosition) <= currentRadius) {
          const position: L.LatLngExpression = [parseFloat(lat), parseFloat(lng)];

          const el = document.createElement('div');
          el.className = 'restaurant-cluster';
          el.style.backgroundColor = 'yellow';
          el.style.color = '#000000';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontWeight = 'bold';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          el.innerHTML = 'R';

          const customIcon = L.divIcon({
            html: el,
            className: 'custom-cluster-marker',
            iconSize: L.point(32, 32),
            iconAnchor: L.point(16, 16)
          });

          const marker = L.marker(position, { icon: customIcon })
            .addTo(map)
            .bindPopup(`Restaurant ID: ${restaurant._id}`);
          newMarkers.push(marker);
        }
      });

      setRestaurantMarkers(newMarkers);
    } else {
      restaurantMarkers.forEach(marker => marker.remove());
      setRestaurantMarkers([]);
    }
  }, [restaurantsData, map, currentRadius, currentCenter]);

  return (
    <>
      {(clustersLoading || restaurantsLoading) && (
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

interface OpenStreetMapProps {
  height?: string;
  userLocation: {
    lat: number;
    lng: number;
  };
  restaurantLocation?: {
    lat: number;
    lng: number;
  };
  showRoute?: boolean;
  radius?: number;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ 
  height = '100%', 
  userLocation = null,
  restaurantLocation = null,
  showRoute = false,
  radius = 50 
}) => {
  const defaultCenter = [52.516267, 13.322455];
  const center = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;
  
  const [mapCenter, setMapCenter] = useState<L.LatLng>(L.latLng(center[0], center[1]));
  const [currentRadius, setCurrentRadius] = useState(radius);

  const handleMapMove = (center: L.LatLng, newRadius: number) => {
    setMapCenter(center);
    setCurrentRadius(newRadius);
  };

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center as L.LatLngExpression}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        minZoom={6}
        maxZoom={22}
      >
        <TileLayer
          url={config.api.maps.tiles}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController 
          userLocation={userLocation}
          radius={radius}
          onMapMove={handleMapMove}
          showRoute={showRoute}
          restaurantLocation={restaurantLocation}
        />

        <Circle
          center={mapCenter}
          radius={currentRadius * 1000}
          pathOptions={{
            color: '#93c5fd',
            fillColor: '#93c5fd',
            fillOpacity: 0.1,
            weight: 3,
            dashArray: '10, 10'
          }}
        />

        <div className="absolute bottom-4 right-4 bg-white px-4 py-3 rounded-lg shadow-md z-[1000]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#93c5fd]"></div>
            <p className="text-sm">Radius: {currentRadius.toFixed(1)}km</p>
          </div>
        </div>
      </MapContainer>
    </div>
  );
};

export default OpenStreetMap;
// import React, { useEffect, useState, useCallback } from 'react';
// import { MapContainer, TileLayer, Circle, useMap, Popup, useMapEvents } from 'react-leaflet';
// import { useQuery } from '@apollo/client';
// import L from 'leaflet';
// import { debounce } from 'lodash';
// import 'leaflet/dist/leaflet.css';
// import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API } from '../../graphql/queries';
// import { config } from '../../config';

// const RADIUS_THRESHOLDS = [5.02, 6.97, 9.67, 13.44, 18.66, 25.92, 36.0, 50.0];
// const DEBOUNCE_DELAY = 2000; // 500ms delay

// const MapController: React.FC<{
//   userLocation: any;
//   radius: number;
//   onMapMove: (center: L.LatLng, radius: number) => void;
//   showRoute?: boolean;
//   restaurantLocation?: {
//     lat: number;
//     lng: number;
//   };
// }> = ({
//   userLocation,
//   radius,
//   onMapMove,
//   showRoute = false,
//   restaurantLocation
// }) => {
//     const map = useMap();
//     const [currentRadius, setCurrentRadius] = useState(radius);
//     const [currentCenter, setCurrentCenter] = useState<L.LatLng | null>(null);
//     const [isInitialized, setIsInitialized] = useState(false);
//     const [prevRadiusAbove3km, setPrevRadiusAbove3km] = useState(currentRadius > 3);
//     const [clusterMarkers, setClusterMarkers] = useState<L.Marker[]>([]);
//     const [restaurantMarkers, setRestaurantMarkers] = useState<L.Marker[]>([]);
//     const [routeElements, setRouteElements] = useState<{
//       polyline?: L.Polyline;
//       userMarker?: L.Marker;
//       restaurantMarker?: L.Marker;
//     }>({});
//     const { data: clustersData, refetch: refetchClusters, loading: clustersLoading } = useQuery(GET_RESTAURANT_CLUSTERS, {
//       variables: {
//         input: {
//           location: currentCenter
//             ? [currentCenter.lng, currentCenter.lat]
//             : userLocation
//               ? [userLocation.lng, userLocation.lat]
//               : [0, 0],
//           maxDistance: currentRadius,
//         }
//       },
//       skip: !isInitialized || !currentCenter || currentRadius <= 3,
//       fetchPolicy: 'network-only',
//     });

//     const { data: restaurantsData, refetch: refetchRestaurants, loading: restaurantsLoading } = useQuery(GET_RESTAURANTS_MAP_API, {
//       variables: {
//         userLocation: userLocation ? [userLocation.lng, userLocation.lat] : null,
//         location: currentCenter
//           ? [currentCenter.lng, currentCenter.lat]
//           : userLocation
//             ? [userLocation.lng, userLocation.lat]
//             : [0, 0],
//         distance: currentRadius,
//         limit: 200
//       },
//       skip: !isInitialized || !currentCenter || currentRadius > 3,
//       fetchPolicy: 'network-only',
//     });

//     const calculateDistance = (point1: L.LatLng, point2: L.LatLng): number => {
//       return point1.distanceTo(point2) / 1000;
//     };

//     const fitMapToBounds = () => {
//       if (userLocation) {
//         const center = L.latLng(userLocation.lat, userLocation.lng);
//         const radiusInMeters = radius * 1000;

//         const earthCircumference = 40075016.686;
//         const latChange = (radiusInMeters / earthCircumference) * 360;
//         const lngChange = latChange / Math.cos((Math.PI / 180) * userLocation.lat);

//         const southWest = L.latLng(userLocation.lat - latChange, userLocation.lng - lngChange);
//         const northEast = L.latLng(userLocation.lat + latChange, userLocation.lng + lngChange);
//         const bounds = L.latLngBounds(southWest, northEast);

//         map.fitBounds(bounds, {
//           padding: [20, 20]
//         });
//       }
//     };

//     const calculateEffectiveRadius = () => {
//       const bounds = map.getBounds();
//       const southWest = bounds.getSouthWest();
//       const northEast = bounds.getNorthEast();
//       const distance = southWest.distanceTo(northEast) / 1000;
//       const effectiveRadius = distance / 2;

//       let closestThreshold = RADIUS_THRESHOLDS[0];
//       let minDiff = Math.abs(effectiveRadius - closestThreshold);

//       for (const threshold of RADIUS_THRESHOLDS) {
//         const diff = Math.abs(effectiveRadius - threshold);
//         if (diff < minDiff) {
//           minDiff = diff;
//           closestThreshold = threshold;
//         }
//       }

//       if (effectiveRadius < RADIUS_THRESHOLDS[0] && effectiveRadius > 3) {
//         return RADIUS_THRESHOLDS[0];
//       }
//       if (effectiveRadius <= 3) {
//         return effectiveRadius;
//       }
//       return closestThreshold;
//     };

//     // Debounced fetch function
//     const debouncedFetch = useCallback(
//       debounce((center: L.LatLng, effectiveRadius: number) => {
//         if (effectiveRadius > 3) {
//           refetchClusters();
//         } else {
//           refetchRestaurants();
//         }
//       }, DEBOUNCE_DELAY),
//       [refetchClusters, refetchRestaurants]
//     );

//     useEffect(() => {
//       fitMapToBounds();
//       const center = map.getCenter();
//       const effectiveRadius = calculateEffectiveRadius();
//       setCurrentCenter(center);
//       setIsInitialized(true);
//       onMapMove(center, effectiveRadius);
//     }, [map, userLocation, radius]);

//     useEffect(() => {
//       const shouldUpdateRadius = RADIUS_THRESHOLDS.some((threshold, index) => {
//         const prevThreshold = index > 0 ? RADIUS_THRESHOLDS[index - 1] : 3;
//         return (currentRadius >= prevThreshold && currentRadius < threshold) !==
//           (radius >= prevThreshold && radius < threshold);
//       });

//       if (shouldUpdateRadius) {
//         setCurrentRadius(radius);
//         clusterMarkers.forEach(marker => marker.remove());
//         setClusterMarkers([]);
//         restaurantMarkers.forEach(marker => marker.remove());
//         setRestaurantMarkers([]);
//         debouncedFetch(currentCenter!, radius);
//       }
//     }, [radius, currentCenter]);

//     // Handle route display
//     useEffect(() => {
//       if (showRoute && userLocation && restaurantLocation) {
//         // Clean up previous route elements
//         if (routeElements.polyline) routeElements.polyline.remove();
//         if (routeElements.userMarker) routeElements.userMarker.remove();
//         if (routeElements.restaurantMarker) routeElements.restaurantMarker.remove();

//         // Create polyline between user and restaurant
//         const polyline = L.polyline(
//           [
//             [userLocation.lat, userLocation.lng],
//             [restaurantLocation.lat, restaurantLocation.lng]
//           ],
//           {
//             color: '#93c5fd',
//             weight: 3,
//             opacity: 0.8,
//             dashArray: '10, 10'
//           }
//         ).addTo(map);

//         // Add markers
//         const userMarker = L.marker([userLocation.lat, userLocation.lng], {
//           icon: L.divIcon({
//             className: 'custom-marker',
//             html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
//             iconSize: [32, 32],
//             iconAnchor: [16, 16]
//           })
//         }).addTo(map);

//         const restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng], {
//           icon: L.divIcon({
//             className: 'custom-marker',
//             html: `<div class="w-8 h-8 bg-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
//             <div class="w-4 h-4 bg-black rounded-full"></div>
//           </div>`,
//             iconSize: [32, 32],
//             iconAnchor: [16, 16]
//           })
//         }).addTo(map);

//         // Fit bounds to show both markers
//         const bounds = L.latLngBounds([
//           [userLocation.lat, userLocation.lng],
//           [restaurantLocation.lat, restaurantLocation.lng]
//         ]);
//         map.fitBounds(bounds, { padding: [50, 50] });

//         // Store route elements for cleanup
//         setRouteElements({ polyline, userMarker, restaurantMarker });

//         return () => {
//           polyline.remove();
//           userMarker.remove();
//           restaurantMarker.remove();
//         };
//       }
//     }, [showRoute, userLocation, restaurantLocation, map]);

//     // Moved handleMapUpdate outside of useEffect
//     const handleMapUpdate = useCallback(() => {
//       const center = map.getCenter();
//       const effectiveRadius = calculateEffectiveRadius();
//       setCurrentCenter(center);
//       onMapMove(center, effectiveRadius);

//       const shouldUpdateRadius = RADIUS_THRESHOLDS.some((threshold, index) => {
//         const prevThreshold = index > 0 ? RADIUS_THRESHOLDS[index - 1] : 3;
//         return (currentRadius >= prevThreshold && currentRadius < threshold) !==
//           (effectiveRadius >= prevThreshold && effectiveRadius < threshold);
//       });

//       if (shouldUpdateRadius || (currentRadius <= 3 && effectiveRadius > 3) || (currentRadius > 3 && effectiveRadius <= 3)) {
//         setCurrentRadius(effectiveRadius);
//       }

//       clusterMarkers.forEach(marker => marker.remove());
//       setClusterMarkers([]);
//       restaurantMarkers.forEach(marker => marker.remove());
//       setRestaurantMarkers([]);
//       debouncedFetch(center, effectiveRadius);
//     }, [map, currentRadius, clusterMarkers, restaurantMarkers, debouncedFetch, onMapMove]);

//     useMapEvents({
//       moveend: handleMapUpdate,
//       zoomend: handleMapUpdate
//     });

//     useEffect(() => {
//       const isAbove3km = currentRadius > 3;
//       if (isAbove3km !== prevRadiusAbove3km) {
//         if (isAbove3km) {
//           restaurantMarkers.forEach(marker => marker.remove());
//           setRestaurantMarkers([]);
//           debouncedFetch(currentCenter!, currentRadius);
//         } else {
//           clusterMarkers.forEach(marker => marker.remove());
//           setClusterMarkers([]);
//           debouncedFetch(currentCenter!, currentRadius);
//         }
//         setPrevRadiusAbove3km(isAbove3km);
//       }
//     }, [currentRadius, prevRadiusAbove3km, currentCenter]);

//     useEffect(() => {
//       if (currentRadius > 3 && clustersData?.restaurantClusters?.clusters && currentCenter) {
//         clusterMarkers.forEach(marker => marker.remove());
//         const newMarkers: L.Marker[] = [];

//         clustersData.restaurantClusters.clusters.forEach(cluster => {
//           const [lng, lat] = cluster.location.coordinates;
//           const clusterPosition = L.latLng(lat, lng);

//           if (calculateDistance(currentCenter, clusterPosition) <= currentRadius) {
//             const position: L.LatLngExpression = [lat, lng];

//             const el = document.createElement('div');
//             el.className = 'restaurant-cluster';
//             el.style.backgroundColor = '#E5E7EB';
//             el.style.color = '#000000';
//             el.style.width = '32px';
//             el.style.height = '32px';
//             el.style.borderRadius = '50%';
//             el.style.display = 'flex';
//             el.style.alignItems = 'center';
//             el.style.justifyContent = 'center';
//             el.style.fontWeight = 'bold';
//             el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
//             el.innerHTML = cluster.count.toString();

//             const customIcon = L.divIcon({
//               html: el,
//               className: 'custom-cluster-marker',
//               iconSize: L.point(32, 32),
//               iconAnchor: L.point(16, 16)
//             });

//             const marker = L.marker(position, { icon: customIcon })
//               .addTo(map)
//               .bindPopup(`${cluster.count} restaurants in this area`);
//             newMarkers.push(marker);
//           }
//         });

//         setClusterMarkers(newMarkers);
//       } else {
//         clusterMarkers.forEach(marker => marker.remove());
//         setClusterMarkers([]);
//       }
//     }, [clustersData, map, currentRadius, currentCenter]);

//     useEffect(() => {
//       if (currentRadius <= 3 && restaurantsData?.restaurantsMapApi?.restaurants && currentCenter) {
//         restaurantMarkers.forEach(marker => marker.remove());
//         const newMarkers: L.Marker[] = [];

//         restaurantsData.restaurantsMapApi.restaurants.forEach(restaurant => {
//           const [lng, lat] = restaurant.location.coordinates;
//           const restaurantPosition = L.latLng(parseFloat(lat), parseFloat(lng));

//           if (calculateDistance(currentCenter, restaurantPosition) <= currentRadius) {
//             const position: L.LatLngExpression = [parseFloat(lat), parseFloat(lng)];

//             const el = document.createElement('div');
//             el.className = 'restaurant-cluster';
//             el.style.backgroundColor = 'yellow';
//             el.style.color = '#000000';
//             el.style.width = '32px';
//             el.style.height = '32px';
//             el.style.borderRadius = '50%';
//             el.style.display = 'flex';
//             el.style.alignItems = 'center';
//             el.style.justifyContent = 'center';
//             el.style.fontWeight = 'bold';
//             el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
//             el.innerHTML = 'R';

//             const customIcon = L.divIcon({
//               html: el,
//               className: 'custom-cluster-marker',
//               iconSize: L.point(32, 32),
//               iconAnchor: L.point(16, 16)
//             });

//             const marker = L.marker(position, { icon: customIcon })
//               .addTo(map)
//               .bindPopup(`Restaurant ID: ${restaurant._id}`);
//             newMarkers.push(marker);
//           }
//         });

//         setRestaurantMarkers(newMarkers);
//       } else {
//         restaurantMarkers.forEach(marker => marker.remove());
//         setRestaurantMarkers([]);
//       }
//     }, [restaurantsData, map, currentRadius, currentCenter]);

//     return (
//       <>
//         {(clustersLoading || restaurantsLoading) && (
//           <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
//             <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
//                 <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
//                 <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
//               </div>
//               <span className="text-sm font-medium text-gray-600">Loading</span>
//             </div>
//           </div>
//         )}
//       </>
//     );
//   };

// interface OpenStreetMapProps {
//   height?: string;
//   userLocation: {
//     lat: number;
//     lng: number;
//   };
//   restaurantLocation?: {
//     lat: number;
//     lng: number;
//   };
//   showRoute?: boolean;
//   radius?: number;
// }

// const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
//   height = '100%',
//   userLocation = null,
//   restaurantLocation = null,
//   showRoute = false,
//   radius = 50
// }) => {
//   const defaultCenter = [52.516267, 13.322455];
//   const center = userLocation
//     ? [userLocation.lat, userLocation.lng]
//     : defaultCenter;

//   console.log(center, 'userLocation', userLocation);

//   const [mapCenter, setMapCenter] = useState<L.LatLng>(L.latLng(center[0], center[1]));
//   const [currentRadius, setCurrentRadius] = useState(radius);

//   const handleMapMove = (center: L.LatLng, newRadius: number) => {
//     setMapCenter(center);
//     setCurrentRadius(newRadius);
//   };

//   return (
//     <div style={{ height, width: '100%' }}>
//       <MapContainer
//         center={center as L.LatLngExpression}
//         zoom={14}
//         style={{ height: '100%', width: '100%' }}
//         className="rounded-lg"
//         minZoom={6}
//         maxZoom={22}
//       >
//         <TileLayer
//           url={config.api.maps.tiles}
//           attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />

//         <MapController
//           userLocation={userLocation}
//           radius={radius}
//           onMapMove={handleMapMove}
//           showRoute={showRoute}
//           restaurantLocation={restaurantLocation}
//         />

//         <Circle
//           center={mapCenter}
//           radius={currentRadius * 1000}
//           pathOptions={{
//             color: '#93c5fd',
//             fillColor: '#93c5fd',
//             fillOpacity: 0.1,
//             weight: 3,
//             dashArray: '10, 10'
//           }}
//         />

//         <div className="absolute bottom-4 right-4 bg-white px-4 py-3 rounded-lg shadow-md z-[1000]">
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-3 rounded-full bg-[#93c5fd]"></div>
//             <p className="text-sm">Radius: {currentRadius.toFixed(1)}km</p>
//           </div>
//         </div>
//       </MapContainer>
//     </div>
//   );
// };

// export default OpenStreetMap;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap, Popup, useMapEvents, Marker } from 'react-leaflet';
import { useQuery } from '@apollo/client';
import L from 'leaflet';
import { debounce } from 'lodash';
import 'leaflet/dist/leaflet.css';
import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API } from '../../graphql/queries';
import { config } from '../../config';
import MarkerIcon from '../../assets/PNG/marker-icon-2x-red.png';
import MarkerShadow from '../../assets/PNG/marker-shadow.png';
import MarketSvg from '../../assets/svg/KebappLogo.svg';



// export default CustomCircle;

// Constants
const RADIUS_THRESHOLDS = [5.02, 6.97, 9.67, 13.44, 18.66, 25.92, 36.0, 50.0];
const DEBOUNCE_DELAY = 2000;
const MAX_ZOOM_LEVEL = 18; // Most tile servers support up to zoom level 18

// Tile Error Handler Component - Used in all map types
const TileErrorHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const handleTileError = (e: any) => {
      console.error("Tile loading error:", e);

      // If current zoom is higher than max supported zoom, reduce it
      if (map.getZoom() > MAX_ZOOM_LEVEL) {
        console.log(`Reducing zoom from ${map.getZoom()} to ${MAX_ZOOM_LEVEL}`);
        map.setZoom(MAX_ZOOM_LEVEL);
      }
    };

    // Add tile error handler
    map.on('tileerror', handleTileError);

    return () => {
      map.off('tileerror', handleTileError);
    };
  }, [map]);

  return null;
};

/**************************************
 * 1. HOME MAP COMPONENT
 **************************************/

// Types for HOME map
interface MarkerInfo {
  marker: L.Marker;
  id: string;
}

// Controller for HOME map
// HomeMapController with reliable marker handling
const HomeMapController: React.FC<{
  userLocation: {
    lat: number;
    lng: number;
  };
  radius: number;
  onMapMove: (center: L.LatLng, radius: number) => void;
}> = ({
  userLocation,
  radius,
  onMapMove
}) => {
    const map = useMap();
    const markersRef = useRef<{
      clusters: MarkerInfo[],
      restaurants: MarkerInfo[],
      user: L.Marker | null
    }>({
      clusters: [],
      restaurants: [],
      user: null
    });

    const [currentRadius, setCurrentRadius] = useState(radius);
    const [currentCenter, setCurrentCenter] = useState<L.LatLng | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [prevRadiusAbove3km, setPrevRadiusAbove3km] = useState(currentRadius > 3);
    const [isLoading, setIsLoading] = useState(false);

    // Use refs for state that doesn't need to trigger re-renders
    const lastEventRef = useRef<{ time: number, type: string }>({ time: 0, type: '' });

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
        limit: 200
      },
      skip: !isInitialized || !currentCenter || currentRadius > 3,
      fetchPolicy: 'network-only',
      onCompleted: () => setIsLoading(false),
    });

    // Helper functions
    const calculateDistance = (point1: L.LatLng, point2: L.LatLng): number => {
      return point1.distanceTo(point2) / 1000;
    };

    const fitMapToBounds = () => {
      if (userLocation) {
        const radiusInMeters = radius * 1000;
        const earthCircumference = 40075016.686;
        const latChange = (radiusInMeters / earthCircumference) * 360;
        const lngChange = latChange / Math.cos((Math.PI / 180) * userLocation.lat);

        const southWest = L.latLng(userLocation.lat - latChange, userLocation.lng - lngChange);
        const northEast = L.latLng(userLocation.lat + latChange, userLocation.lng + lngChange);
        const bounds = L.latLngBounds(southWest, northEast);
        console.log(bounds, "dd")

        map.fitBounds(bounds, {
          padding: [50, 50] // Increased padding to ensure the circle fits within the screen
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

    // Reliable cleanup function that removes markers directly from the map
    const cleanupAllMarkers = useCallback(() => {
      console.log("Cleaning up markers:",
        markersRef.current.clusters.length,
        markersRef.current.restaurants.length
      );

      // Remove all markers from the map first
      [...markersRef.current.clusters, ...markersRef.current.restaurants].forEach(({ marker }) => {
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
        // Clean up markers before making new API calls
        cleanupAllMarkers();

        // Set loading state
        setIsLoading(true);

        if (effectiveRadius > 3) {
          refetchClusters();
        } else {
          refetchRestaurants();
        }
      }, 500), // Match your existing debounce delay
      [refetchClusters, refetchRestaurants, cleanupAllMarkers]
    );

    // Initialize map
    useEffect(() => {
      console.log("trigger", radius, "ss")
      // fitMapToBounds();
      const center = map.getCenter();
      const effectiveRadius = calculateEffectiveRadius();
      setCurrentCenter(center);
      setIsInitialized(true);
      onMapMove(center, effectiveRadius);
      setupUserMarker();

      if (map.getZoom() > MAX_ZOOM_LEVEL) {
        map.setZoom(MAX_ZOOM_LEVEL);
      }

      // Initial cleanup to clear any stale markers
      cleanupAllMarkers();

      // Cleanup on unmount
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
    }, [radius, currentCenter, cleanupAllMarkers, debouncedFetch]);

    // Consolidated map event handler with debouncing
    const handleMapEvent = useCallback((eventType: string) => {
      // Throttle events to prevent duplicate triggers
      const now = Date.now();
      if (now - lastEventRef.current.time < 300 && lastEventRef.current.type !== eventType) {
        // Skip this event if another event was triggered recently
        return;
      }

      lastEventRef.current = { time: now, type: eventType };

      // Clear markers immediately for responsive UI
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

    // Map events binding with separate handlers
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

    // Handle clusters rendering
    useEffect(() => {
      if (currentRadius > 3 && clustersData?.restaurantClusters?.clusters && currentCenter && !isLoading) {
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

            const el = document.createElement('div');
            el.className = 'restaurant-cluster';
            el.style.backgroundColor = '#E5E7EB';
            el.style.color = '#000000';
            el.style.width = '50px';
            el.style.height = '32px';
            el.style.borderRadius = '40%';
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

            // Create and add marker
            const marker = L.marker(position, { icon: customIcon })
              .addTo(map)
              .bindPopup(`${cluster.count} restaurants in this area`);

            newMarkers.push({ marker, id: cluster._id });
          }
        });

        // Update ref
        markersRef.current.clusters = newMarkers;
      }
    }, [clustersData, map, currentRadius, currentCenter, isLoading]);

    // Handle restaurants rendering
    useEffect(() => {
      if (currentRadius <= 3 && restaurantsData?.restaurantsMapApi?.restaurants && currentCenter && !isLoading) {
        // Clean existing markers
        markersRef.current.restaurants.forEach(({ marker }) => {
          if (marker) map.removeLayer(marker);
        });
        markersRef.current.restaurants = [];

        // Create new markers
        const newMarkers: MarkerInfo[] = [];

        restaurantsData.restaurantsMapApi.restaurants.forEach(restaurant => {
          const [lng, lat] = restaurant.location.coordinates;
          const restaurantPosition = L.latLng(parseFloat(lat), parseFloat(lng));

          if (calculateDistance(currentCenter, restaurantPosition) <= currentRadius) {
            const position: L.LatLngExpression = [parseFloat(lat), parseFloat(lng)];

            const el = document.createElement('div');
            el.className = 'restaurant-marker';
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
              className: 'custom-marker',
              iconSize: L.point(32, 32),
              iconAnchor: L.point(16, 16)
            });

            // Create and add marker
            const marker = L.marker(position, { icon: customIcon })
              .addTo(map)
              .bindPopup(`Restaurant ID: ${restaurant._id}`);

            newMarkers.push({ marker, id: restaurant._id });
          }
        });

        // Update ref
        markersRef.current.restaurants = newMarkers;
      }
    }, [restaurantsData, map, currentRadius, currentCenter, isLoading]);

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
      </>
    );
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
}

const FitMapToBounds = ({ userLocation, radius }) => {
  console.log("sysysysy")
  const map = useMap()
  function fitBounds() {
    const radiusInMeters = radius * 1000;
    const earthCircumference = 40075016.686;
    const latChange = (radiusInMeters / earthCircumference) * 360;
    const lngChange = latChange / Math.cos((Math.PI / 180) * userLocation.lat);

    const southWest = L.latLng(userLocation.lat - latChange, userLocation.lng - lngChange);
    const northEast = L.latLng(userLocation.lat + latChange, userLocation.lng + lngChange);
    const bounds = L.latLngBounds(southWest, northEast);
    console.log(bounds, "dd")

    map.fitBounds(bounds, {
      padding: [50, 50] // Increased padding to ensure the circle fits within the screen
    });
  }
  useEffect(() => {
    fitBounds()
  }, [userLocation, radius])
  return null
};

export const HomeMap: React.FC<HomeMapProps> = ({
  height = '100%',
  userLocation,
  radius = 50,
  onMapMove = () => { }
}) => {
  console.log(radius, "e")
  const [mapCenter, setMapCenter] = useState<L.LatLng>(
    L.latLng(userLocation?.lat || 52.516267, userLocation?.lng || 13.322455)
  );
  const [currentRadius, setCurrentRadius] = useState(radius);

  useEffect(() => {
    setCurrentRadius(radius)
  }, [radius])


  const handleMapMove = (center: L.LatLng, newRadius: number) => {
    setMapCenter(center);
    setCurrentRadius(newRadius);
    onMapMove(center, newRadius);
  };
  console.log(mapCenter, radius, "ssss")
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
      >
        <TileLayer url={config.api.maps.tiles} />
        <TileErrorHandler />
        <FitMapToBounds userLocation={userLocation} radius={radius} />
        <HomeMapController
          userLocation={userLocation}
          radius={radius}
          onMapMove={handleMapMove}
        />

        {/* <Circle
          center={mapCenter}
          radius={currentRadius * 1000}
          pathOptions={{
            color: '#93c5fd',
            fillColor: '#93c5fd',
            fillOpacity: 0.1,
            weight: 3,
            // dashArray: '10, 10'
          }}
        /> */}

        <Circle
          center={mapCenter}
          radius={currentRadius * 1000}
          pathOptions={{
            color: '#93c5fd',
            fillColor: '#93c5fd',
            fillOpacity: 0.1,
            weight: 3,
            // dashArray: '10, 10'
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
    console.log('Location selected:', location);
    onLocationSelected(location);
  }, [onLocationSelected]);

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center as L.LatLngExpression}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        // className="rounded-lg"
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

      // Create a control point for the curve (adjust these values to control the curve shape)
      const controlPoint = L.latLng(
        midLat + Math.abs(startPoint.lat - endPoint.lat) * 0.5,
        midLng + Math.abs(startPoint.lng - endPoint.lng) * 0.2
      );

      // Generate curve points
      const curvePoints = [];
      for (let t = 0; t <= 1; t += 0.01) {
        const lat =
          Math.pow(1 - t, 2) * startPoint.lat +
          2 * (1 - t) * t * controlPoint.lat +
          Math.pow(t, 2) * endPoint.lat;
        const lng =
          Math.pow(1 - t, 2) * startPoint.lng +
          2 * (1 - t) * t * controlPoint.lng +
          Math.pow(t, 2) * endPoint.lng;
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
        const restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng],
          {
            icon: L.icon({

              iconUrl: MarketSvg, // Replace with your icon path
              // shadowUrl: MarkerShadow, // Optional shadow
              iconSize: [25, 41], // Size of the icon
              iconAnchor: [12, 30], // Point of the icon which corresponds to marker's location
              popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
              shadowSize: [41, 41] // Size of the shadow

            })
          }
        ).addTo(map);

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
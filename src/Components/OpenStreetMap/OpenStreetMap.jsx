// OpenStreetMap.jsx
import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './style.css';
import { MAP_CAMPAIGN_TYPE, MAP_TYPES, HOME_API_PARAMETERS } from '../../constants/enums';
import Spinner from '../Spinner/Spinner';
import { config } from '../../config';
import { ConfigurableValues } from '../../constants/constants';
import MarkerIcon from '../../assets/PNG/marker-icon-2x-red.png';
import MarkerShadow from '../../assets/PNG/marker-shadow.png';
import { Context } from '../../Context/Context';
import Kebab from "../../assets/svg/kebabBlack.svg";

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Default marker icon
const DefaultIcon = L.icon({
  iconUrl: MarkerIcon,
  shadowUrl: MarkerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icon
const createCustomIcon = (mapType, user, distance, isAvailable, onboarded, gif, count, __typename) => {
  if (__typename !== "RestaurantCluster") {
    return L.divIcon({
      html: `
         <div class="restaurant" style="opacity: ${isAvailable ? 1 : 0.5}">
           <div class="${onboarded ? "restaurant-indicator" : "restaurant-indicator-dull"}">
            <img src="${Kebab}" style="height:20px" alt="cluster"/>
          </div>
           <div class="filter-icon-style" style="display: ${mapType === MAP_TYPES.HOME && gif ? "flex" : "none"}">
            <img src="${gif}" style="height:20px" alt="cluster"/>
          </div>
        </div>
      `,
      className: 'custom-distance-marker',
      iconSize: L.point(distance ? 80 : 40, 24)
    });
  }
  return L.divIcon({
    html: `
      <div class="restaurant">
        <div>${count}</div>
      </div>
    `,
    className: 'custom-distance-marker',
    iconSize: L.point(40, 24)
  });
};

// Calculate radius in kilometers
const calculateRadiusKm = (map) => {
  if (!map) return 50;
  try {
    const center = map.getCenter();
    const size = map.getSize();
    const eastPoint = map.containerPointToLatLng([size.x, size.y / 2]);
    const radiusInMeters = center.distanceTo(eastPoint);
    const radiusInKm = radiusInMeters / 1000;
    return Math.max(Math.round(radiusInKm * 10) / 10, 0.5);
  } catch (error) {
    console.error("Error calculating radius:", error);
    return 50;
  }
};

// MapController component
const MapController = ({ onRadiusChange, onApiCallNeeded, userLocation, setMapBounds, currentMapDistance }) => {
  const map = useMap();
  const lastApiRadiusRef = useRef(null);
  const initialSetupDoneRef = useRef(false);

  // Define radius thresholds for triggering API calls
  const RADIUS_THRESHOLDS = [5.02, 6.97, 9.67, 13.44, 18.66, 25.92, 36.0, 50.0];

  // Function to get the appropriate radius threshold and API type
  const getApiRadius = (radiusKm) => {
    if (radiusKm <= 3) {
      return { max: 3.0, type: 'restaurants' };
    }
    
    // Parse currentMapDistance to ensure it's a number
    const safeCurrentMapDistance = typeof currentMapDistance === 'undefined' 
      ? 50.0 // Default to maximum if undefined
      : parseFloat(currentMapDistance) || 50.0;
    
    // Find the closest radius that is <= currentMapDistance and >= radiusKm
    const closestRadius = RADIUS_THRESHOLDS.find(threshold => 
      radiusKm <= threshold && threshold <= safeCurrentMapDistance
    ) || Math.min(50.0, safeCurrentMapDistance);
    
    return { max: closestRadius, type: 'clusters' };
  };

  // Handle zoom and move events with debouncing
  const handleMapChange = useCallback(
    debounce(() => {
      const newRadius = calculateRadiusKm(map);
      onRadiusChange(newRadius);

      const apiInfo = getApiRadius(newRadius);
      if (apiInfo.max !== lastApiRadiusRef.current) {
        lastApiRadiusRef.current = apiInfo.max;
        setMapBounds([]);
        onApiCallNeeded(apiInfo, map.getCenter());
      }
    }, 500),
    [map, onApiCallNeeded, currentMapDistance]
  );

  const handleMapMove = useCallback(
    debounce(() => {
      const newRadius = calculateRadiusKm(map);
      onRadiusChange(newRadius);

      const apiInfo = getApiRadius(newRadius);
      // if (apiInfo.max !== lastApiRadiusRef.current) {
        // lastApiRadiusRef.current = apiInfo.max;
        setMapBounds([]);
        onApiCallNeeded(apiInfo, map.getCenter());
      // }
    }, 500),
    [map, onApiCallNeeded, currentMapDistance]
  );

  useEffect(() => {
    const handleZoomEnd = () => handleMapChange();
    const handleMoveEnd = () => handleMapMove();

    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
    };
  }, [map, handleMapChange]);

  return null;
};

// CircleComponent to handle 50km radius circle
const CircleComponent = ({ userDetails, currentDistance }) => {
  const map = useMap();
  const location = map.getCenter();
  if (!userDetails?.[0]?.coords) return null;

  const safeDistance = typeof currentDistance === 'undefined' 
    ? HOME_API_PARAMETERS.DISTANCE 
    : parseFloat(currentDistance) || HOME_API_PARAMETERS.DISTANCE;
    
  // Apply minimum distance and convert from km to meters
  const radiusInMeters = Math.max(safeDistance, 0.1) * 1000;
  
  const center = [Number(location.lat), Number(location.lng)];
  
  console.log(`CircleComponent rendering with radius: ${radiusInMeters}m (${safeDistance}km)`);
  
  return (
    <Circle
      center={center}
      radius={radiusInMeters} 
      pathOptions={{
        color: '#93c5fd',
        fillOpacity: 0.2,
      }}
    />
  );
};

// Campaign GIFs
const getCampaignGif = (baseCode) => {
  switch (baseCode) {
    case MAP_CAMPAIGN_TYPE.HAPPYHOURS: return Fire;
    case MAP_CAMPAIGN_TYPE.SPECIALDAY: return Star;
    case MAP_CAMPAIGN_TYPE.CHEFSPECIAL: return Hat;
    default: return null;
  }
};

const OpenStreetMap = ({
  isloading,
  bounds = [],
  promotionsData = [],
  height,
  handleMapModal,
  userDetails,
  type,
  isCampaignApplied,
  isDisabled = false,
  fetchClusters,
  fetchRestaurants,
  setMapBounds,
  currentMapDistance
}) => {
  const mapInstanceRef = useRef(null);
  const { zoneData } = useContext(Context);
  // Initialize currentRadius with currentMapDistance or default
  const [currentRadius, setCurrentRadius] = useState(50);

  // Implementation of handleApiCallNeeded
  const handleApiCallNeeded = useCallback((apiInfo, center) => {
    const { max: radius, type } = apiInfo;
    const location = [center.lng, center.lat];

    console.log(`Triggering API call: type=${type}, radius=${radius}, location=`, location);

    if (type === 'restaurants') {
      fetchRestaurants(location, radius, userDetails)
        .then(response => {
          console.log('Restaurants fetched:', response);
        })
        .catch(error => {
          console.error('Error fetching restaurants:', error);
        });
    } else {
      fetchClusters(location, radius)
        .then(response => {
          console.log('Clusters fetched:', response);
        })
        .catch(error => {
          console.error('Error fetching clusters:', error);
        });
    }
  }, [fetchClusters, fetchRestaurants]);

  // Process markers and bounds
  const { markers, boundsArray } = useMemo(() => {
    if (!bounds.length) return { markers: [], boundsArray: [] };

    const processRestaurants = (restaurants) => {
      if (!restaurants || !promotionsData) return restaurants;
      return restaurants.map(restaurant => {
        if (restaurant.restaurantInfo?.campaigns?.length > 0) {
          restaurant.restaurantInfo.campaigns.forEach(campaign => {
            if (campaign?.promotion) {
              const promotion = promotionsData.find(promo => promo._id === campaign.promotion);
              if (promotion?.baseCode) {
                restaurant.restaurantInfo.baseCode = promotion.baseCode;
              }
            }
          });
        }
        return restaurant;
      });
    };

    const updatedBounds = isCampaignApplied || bounds[0]?.__typename == "RestaurantCluster" ? bounds : processRestaurants(bounds);
    const coordinates = updatedBounds.map(item => {
      if (item?.location?.coordinates) {
        return [Number(item.location.coordinates[1]), Number(item.location.coordinates[0])]; // [lat, lng]
      } else if (item?.coords) {
        return [Number(item.coords.lat), Number(item.coords.lng)];
      }
      return [Number(item.lat), Number(item.lng)];
    });

    return { markers: updatedBounds, boundsArray: coordinates };
  }, [bounds, promotionsData, isCampaignApplied]);

  // Map center
  const mapCenter = useMemo(() => {
    if (userDetails?.[0]?.coords) {
      return [Number(userDetails[0].coords.lat), Number(userDetails[0].coords.lng)];
    }
    if (boundsArray.length > 0) {
      return [
        boundsArray.reduce((sum, coord) => sum + coord[0], 0) / boundsArray.length,
        boundsArray.reduce((sum, coord) => sum + coord[1], 0) / boundsArray.length
      ];
    }
    const coords = config.FALLBACK_LOCATION;
    return [Number(coords?.latitude), Number(coords?.longitude)];
  }, [boundsArray, userDetails]);

  const handleRadiusChange = useCallback((radius) => {
    setCurrentRadius(radius);
  }, []);

    // Store map key for stability
    // const mapKey = useMemo(() => {
    //   return `map-${userDetails?.[0]?.coords ? 'user' : 'bounds'}-${zoom}`;
    // }, [userDetails, zoom]);

  return (
    <div className='position-relative' style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={10}
        dragging={!isDisabled}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => {
          console.log("yatat");
          mapInstanceRef.current = mapInstance;
        }}
      >
        <TileLayer
          url={ConfigurableValues().TILE_URL}
          attribution='© OpenStreetMap contributors'
          maxZoom={22}
        />

        <MapController
          setMapBounds={setMapBounds}
          onRadiusChange={handleRadiusChange}
          onApiCallNeeded={handleApiCallNeeded}
          userLocation={userDetails?.[0]?.coords ? {
            lat: Number(userDetails[0].coords.lat),
            lng: Number(userDetails[0].coords.lng)
          } : null}
          currentMapDistance={currentMapDistance}
        />

        <CircleComponent 
          userDetails={userDetails}
          currentDistance={currentMapDistance}  
        />

        {/* {type === MAP_TYPES.HOME && <SetBoundsComponent boundsBefore={bounds} bounds={boundsArray} />} */}
        {/* { console.log(bounds, "bounds", "boundsArray", boundsArray)} */}
        {type === MAP_TYPES.HOME && (
          bounds.map((item, index) => {
            if (item?.isUser) return null;
            const position = [
              Number(item?.location?.coordinates ? item.location.coordinates[1] : item?.coords ? item.coords.lat : item.lat),
              Number(item?.location?.coordinates ? item.location.coordinates[0] : item?.coords ? item.coords.lng : item.lng)
            ];
            const gif = getCampaignGif(item?.restaurantInfo?.baseCode);
            return (
              <Marker
                key={`cluster-marker-${index}`}
                position={position}
                icon={createCustomIcon(type, item?.user, item?.restaurantInfo?.distanceInMeters, item?.restaurantInfo?.isAvailable, item?.restaurantInfo?.onboarded, gif, item?.count, item?.__typename)}
                eventHandlers={{
                  click: () => item?.restaurantInfo && handleMapModal?.(item?.restaurantInfo)
                }}
              />
            );
          })
        )}

        {type === MAP_TYPES.HOME && userDetails?.[0]?.coords && (
          <Marker
            position={[Number(userDetails[0].coords.lat), Number(userDetails[0].coords.lng)]}
          />
        )}

        <div className="radius-display" style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          boxShadow: '0 0 5px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          Current Radius: {currentRadius.toFixed(2)} km
          <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
            Data Type: {currentRadius <= 3 ? 'Restaurants' : 'Clusters'}
          </div>
        </div>
      </MapContainer>
    </div>
  );
};

export default React.memo(OpenStreetMap);
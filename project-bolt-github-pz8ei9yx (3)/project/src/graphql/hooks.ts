import { useQuery } from '@apollo/client';
import { GET_RESTAURANT_CLUSTERS, GET_RESTAURANTS_MAP_API, COMBINED_RESTAURANTS_QUERY } from './queries';
import type { 
  RestaurantClusterInput, 
  RestaurantClustersResponse,
  RestaurantsMapApiResponse,
  CombinedRestaurantsResponse,
  LastRestaurantInput
} from './types';

export const useRestaurantClusters = (input: RestaurantClusterInput) => {
  return useQuery<RestaurantClustersResponse>(GET_RESTAURANT_CLUSTERS, {
    variables: { input },
    skip: !input.location || !input.radius
  });
};

export const useRestaurantsMapApi = (
  userLocation: [number, number] | null,
  location: [number, number],
  distance: number,
  limit: number = 100
) => {
  return useQuery<RestaurantsMapApiResponse>(GET_RESTAURANTS_MAP_API, {
    variables: {
      userLocation,
      location,
      distance,
      limit
    },
    skip: !location || !distance
  });
};

export const useCombinedRestaurants = (
  location: [number, number],
  distance: number,
  limit: number = 20,
  lastRestaurant?: LastRestaurantInput
) => {
  return useQuery<CombinedRestaurantsResponse>(COMBINED_RESTAURANTS_QUERY, {
    variables: {
      location,
      distance,
      limit,
      lastRestaurant
    },
    skip: !location || !distance,
    fetchPolicy: 'cache-and-network'
  });
};
import { useState, useEffect } from 'react';
import { useMutation, useApolloClient } from '@apollo/client';
import { TOGGLE_FAVORITE, FAVORITES } from '../graphql/queries';
import { useUser } from '../context/UserContext';

interface UseFavoriteProps {
  id: string | number;
  initialLikeCount?: number;
  onUnfavorite?: () => void;
  showUnfavorite?: boolean;
}

export const useFavorite = ({
  id,
  initialLikeCount = 0,
  onUnfavorite,
  showUnfavorite = false
}: UseFavoriteProps) => {
  const { profile, refetchProfile } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const client = useApolloClient();

  const updateRestaurantInCache = (restaurantId: string, isNowFavorited: boolean) => {
    const newCount = isNowFavorited ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    // Update the restaurant in all relevant queries
    // Update in all restaurant queries
    client.cache.modify({
      fields: {
        allRestaurants: (existingData = {}) => {
          if (!existingData.restaurants) return existingData;
          const newRestaurants = existingData.restaurants.map((restaurant: any) => {
            if (restaurant._id === restaurantId) {
              return {
                ...restaurant,
                favoriteCount: newCount
              };
            }
            return restaurant;
          });
          return {
            ...existingData,
            restaurants: newRestaurants
          };
        },
        restaurantsMapApi: (existingData = {}) => {
          if (!existingData.restaurants) return existingData;
          const newRestaurants = existingData.restaurants.map((restaurant: any) => {
            if (restaurant._id === restaurantId) {
              return {
                ...restaurant,
                favoriteCount: newCount
              };
            }
            return restaurant;
          });
          return {
            ...existingData,
            restaurants: newRestaurants
          };
        },
        userFavourite: (existingData = []) => {
          if (!Array.isArray(existingData)) return existingData;
          const newFavorites = existingData.map((restaurant: any) => {
            if (restaurant._id === restaurantId) {
              return {
                ...restaurant,
                favoriteCount: newCount
              };
            }
            return restaurant;
          });
          return newFavorites;
        }
      }
    });

    // Update individual restaurant in cache
    try {
      client.cache.modify({
        id: `Restaurant:${restaurantId}`,
        fields: {
          favoriteCount: () => newCount
        }
      });
    } catch (error) {
      console.log('Restaurant not found in cache');
    }

    // Update the local state
    setLikeCount(newCount);
  };

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE, {
    onCompleted: async (data) => {
      if (data?.toggleFavorite) {
        const newFavorites = data.toggleFavorite.favourite;
        const isNowFavorited = newFavorites.includes(id.toString());
        setIsLiked(isNowFavorited);

        // Update all instances in cache
        updateRestaurantInCache(id.toString(), isNowFavorited);

        if (!isNowFavorited && showUnfavorite && onUnfavorite) {
          onUnfavorite();
        }

        await refetchProfile();
      }
    }
  });

  useEffect(() => {
    if (profile?.favourite) {
      const isFavorited = profile.favourite.includes(id.toString());
      setIsLiked(isFavorited);
    }
  }, [profile, id, initialLikeCount]);

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await toggleFavorite({
        variables: { toggleFavoriteId: id.toString() }
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsLiked(prev => !prev);
      setLikeCount(prev => prev); // Keep previous count on error
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    likeCount,
    isLoading,
    handleLike
  };
};
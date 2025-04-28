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

  const updateRestaurantCache = (isNowFavorited: boolean) => {
    // Update all instances of this restaurant in the cache
    const restaurantId = id.toString();
    const newFavoriteCount = isNowFavorited ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Update in allRestaurants query
    client.cache.modify({
      fields: {
        allRestaurants: (existingData = {}) => {
          if (!existingData.restaurants) return existingData;
          return {
            ...existingData,
            restaurants: existingData.restaurants.map((ref: any) => {
              const refId = client.cache.identify(ref);
              if (refId === `Restaurant:${restaurantId}`) {
                return {
                  ...ref,
                  favoriteCount: newFavoriteCount
                };
              }
              return ref;
            })
          };
        }
      }
    });

    // Update in userFavourite query
    client.cache.modify({
      fields: {
        userFavourite: (existingData = []) => {
          if (!Array.isArray(existingData)) return existingData;

          if (!isNowFavorited && showUnfavorite) {
            return existingData.filter((ref: any) => {
              const refId = client.cache.identify(ref);
              return refId !== `Restaurant:${restaurantId}`;
            });
          }

          return existingData.map((ref: any) => {
            const refId = client.cache.identify(ref);
            if (refId === `Restaurant:${restaurantId}`) {
              return {
                ...ref,
                favoriteCount: newFavoriteCount
              };
            }
            return ref;
          });
        }
      }
    });

    // Update the individual restaurant in the cache
    client.cache.modify({
      id: `Restaurant:${restaurantId}`,
      fields: {
        favoriteCount: () => newFavoriteCount
      }
    });

    setLikeCount(newFavoriteCount);
  };

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE, {
    onCompleted: async (data) => {
      if (data?.toggleFavorite) {
        const newFavorites = data.toggleFavorite.favourite;
        const isNowFavorited = newFavorites.includes(id.toString());
        
        setIsLiked(isNowFavorited);
        updateRestaurantCache(isNowFavorited);

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
      setLikeCount(initialLikeCount);
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
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
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
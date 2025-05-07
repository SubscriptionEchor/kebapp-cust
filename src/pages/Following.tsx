import React from 'react';
import { useQuery } from '@apollo/client';
import { FAVORITES } from '../graphql/queries';
import Layout from '../components/Layout';
import VerticalCard from '../components/RestaurantCard/VerticalCard';
import LoadingAnimation from '../components/LoadingAnimation';
import { useTranslation } from 'react-i18next';

const Following: React.FC = () => {
  const { t } = useTranslation();
  // Mock user location (Berlin)
  const currentLocation = {
    latitude: 52.516267,
    longitude: 13.322455
  };

  const { loading, error, data, refetch } = useQuery(FAVORITES, {
    variables: {
      longitude: Number(currentLocation.longitude),
      latitude: Number(currentLocation.latitude),
    },
    skip: !currentLocation.longitude || !currentLocation.latitude,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const handleUnfavorite = () => {
    refetch();
  };

  const formatDistance = (meters: number | null): string => {
    if (meters === null) return t('common.unknown');
    return meters < 1000 
      ? `${meters.toFixed(0)}m`
      : `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <Layout title={t('footer.following')}>
      <div className="space-y-4">
        {loading && !data?.userFavourite && (
          <div className="flex justify-center py-8">
            <LoadingAnimation />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">
            {t('common.loadError')}
          </div>
        )}

        {data?.userFavourite?.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {t('common.noFavorites')}
          </div>
        )}

        {data?.userFavourite?.map((restaurant: any) => (
          <VerticalCard
            key={restaurant._id}
            id={restaurant._id}
            name={restaurant.name}
            image={restaurant.image}
            rating={restaurant.reviewAverage || 0}
            distance={formatDistance(restaurant.distanceInMeters)}
            description={restaurant.cuisines?.join(', ') || ''}
            likes={restaurant.favoriteCount || 0}
            reviews={restaurant.reviewCount || 0}
            showUnfavorite={true}
            onUnfavorite={handleUnfavorite}
          />
        ))}
      </div>
    </Layout>
  );
};

export default Following;
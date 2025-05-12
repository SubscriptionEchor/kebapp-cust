import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft,X, Search as SearchIcon, Star, MapPin, ArrowDownAZ } from 'lucide-react';
import { useTranslation } from 'react-i18next'; 
import VerticalCard from '../components/RestaurantCard/VerticalCard';
import { useQuery } from '@apollo/client';
import { UseLocationDetails } from '../context/LocationContext';
import Layout from '../components/Layout';
import { gql } from '@apollo/client';

const SEARCH_RESTAURANTS = gql`
  query Restaurants(
    $searchTerm: String,
    $latitude: Float,
    $longitude: Float,
    $limit: Int,
    $distance: Float,
    $sortBy: String,
    $sortOrder: String,
    $rating: Float,
    $cuisines: [String],
    $location: [Float!]!
  ) {
    nearByRestaurantsNewV2(
      searchTerm: $searchTerm,
      distance: $distance,
      limit: $limit,
      latitude: $latitude,
      longitude: $longitude,
      sortBy: $sortBy,
      sortOrder: $sortOrder,
      rating: $rating,
      cuisines: $cuisines,
      location: $location
    ) {
      restaurants {
        _id
        name
        image
        slug
        address
        cuisines
        onboarded
        location {
          coordinates
        }
        favoriteCount
        rating
        reviewAverage
        distanceInMeters
        reviewCount
        isAvailable
      }
    }
  }
`;

type ValidSortBy = 'reviewAverage' | 'distanceInMeters' | null;

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { temporaryLocation } = UseLocationDetails();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [tempSortBy, setTempSortBy] = useState<ValidSortBy>(null);
  const [sortBy, setSortBy] = useState<ValidSortBy>(null);
  const [showRating4Plus, setShowRating4Plus] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setDebouncedSearchQuery(searchQuery);
  //   }, 500);

  //   return () => clearTimeout(timer);
  // }, [searchQuery]);

  const { loading, error, data } = useQuery(SEARCH_RESTAURANTS, {
    variables: {
      searchTerm: debouncedSearchQuery,
      location: [Number(temporaryLocation?.longitude), Number(temporaryLocation?.latitude)],
      distance: 50,
      limit: 20,
      ...(sortBy && { 
        sortBy,
        sortOrder: 'desc'
      }),
      rating: showRating4Plus ? 4 : undefined
    },
    skip: !temporaryLocation || !showResults
  });

  const restaurants = data?.nearByRestaurantsNewV2?.restaurants || [];

  useEffect(() => {
    if (showSortSheet) {
      setTempSortBy(sortBy);
      setHasChanges(false);
    }
  }, [showSortSheet]);

  useEffect(() => {
    setHasChanges(tempSortBy !== sortBy);
  }, [tempSortBy, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  return (
    <Layout
      showNavigation={false}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPage.searchhere')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            autoFocus
          />

          {searchQuery&&<button
            onClick={()=>{setSearchQuery('');setShowResults([])}}
            type="submit"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1.5 bg-secondary text-black rounded-lg"
          >
            <X size={16} />
          </button>}
          <button
            onClick={()=>setDebouncedSearchQuery(searchQuery)}
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 bg-secondary text-black rounded-lg"
          >
            <SearchIcon size={16} />
          </button>
          <SearchIcon
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </form>
      </div>

      {/* Filters */}
      {/* {showResults && (
        <div className="bg-white border-b border-gray-100">
          <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShowSortSheet(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${sortBy ? 'bg-secondary text-black' : 'bg-gray-100 text-gray-900'
                }`}
            >
              {t('searchPage.sort')}
              {sortBy && <span className="ml-1 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">1</span>}
            </button>

            <button
              onClick={() => {
                setShowRating4Plus(!showRating4Plus);
                handleSearch({ preventDefault: () => { } } as React.FormEvent);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${showRating4Plus ? 'bg-secondary text-black' : 'bg-gray-100 text-gray-900'
                }`}
            >
              {t('searchPage.ratings')} 4.0+
              <Star size={14} className={showRating4Plus ? 'fill-black' : ''} />
            </button>
          </div>
        </div>
      )} */}

      {/* Sort Bottom Sheet */}
      {showSortSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setShowSortSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-gray-900">Sort</h3>
                <button
                  onClick={() => setShowSortSheet(false)}
                  className="text-gray-400"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if(tempSortBy=="reviewAverage"){
                      setTempSortBy('')
                    }
                    else{
                    setTempSortBy('reviewAverage');
                    }
                    setHasChanges(true);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${tempSortBy === 'reviewAverage'
                    ? 'bg-secondary/10 border border-secondary'
                    : 'border border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-gray-600" />
                    <span className="text-[13px] text-gray-900">
                      {t('mapfilters.ratingsort')}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border transition-colors ${tempSortBy === 'reviewAverage'
                    ? 'border-secondary bg-secondary'
                    : 'border-gray-300'
                    }`}>
                    {tempSortBy === 'reviewAverage' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    if(tempSortBy=="distanceInMeters"){
                      setTempSortBy("")
                    }
                    else{
                    setTempSortBy('distanceInMeters');
                    }
                    setHasChanges(true);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${tempSortBy === 'distanceInMeters'
                    ? 'bg-secondary/10 border border-secondary'
                    : 'border border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownAZ size={18} className="text-gray-600" />
                    <span className="text-[13px] text-gray-900">
                      {t('mapfilters.distancesort')}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border transition-colors ${tempSortBy === 'distanceInMeters'
                    ? 'border-secondary bg-secondary'
                    : 'border-gray-300'
                    }`}>
                    {tempSortBy === 'distanceInMeters' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setTempSortBy(sortBy);
                    setHasChanges(false);
                  }}
                  disabled={!hasChanges}
                  className="flex-1 py-3 text-red-500 text-[13px] font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t('mapfilters.clearall')}
                </button>
                <button
                  onClick={() => {
                    if (hasChanges) {
                      setSortBy(tempSortBy);
                      setShowSortSheet(false);
                      handleSearch({ preventDefault: () => { } } as React.FormEvent);
                    }
                  }}
                  disabled={!hasChanges}
                  className="flex-1 py-3 bg-secondary text-black rounded-lg text-[13px] font-medium"
                >
                  {t('mapfilters.apply')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!showResults && (
        <div className="p-4">
          <p className="text-sm text-gray-500 text-center">
            {t('searchPage.searchKebabText')}
          </p>
        </div>
      )}

      {/* No Results State */}
      {showResults && restaurants.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <SearchIcon size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {t('searchPage.noKebab')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('searchPage.noKebabText')}
          </p>
        </div>
      )}

      {/* Search Results */}
      {showResults && !loading && restaurants.length > 0 && (
        <div className="p-4">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
            {t('searchPage.searchResults')} ({restaurants.length})
          </h2>
          <div>
            {restaurants.map(restaurant => (
              <VerticalCard
                key={restaurant._id}
                id={restaurant._id}
                name={restaurant.name}
                image={restaurant.image}
                rating={restaurant.reviewAverage || 0}
                distance={`${(restaurant.distanceInMeters / 1000).toFixed(1)} km`}
                description={restaurant.cuisines?.join(', ') || ''}
                likes={restaurant.favoriteCount || 0}
                reviews={restaurant.reviewCount || 0}
                onboarded={restaurant.onboarded}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent"></div>
        </div>
      )}
    </Layout>
  );
};

export default Search;
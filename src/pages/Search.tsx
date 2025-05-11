import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search as SearchIcon, Star, MapPin, ArrowDownAZ } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

const mockRestaurants = [
  {
    id: '1',
    name: 'Berlin Kebab House',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    rating: 4.5,
    reviews: 128,
    distance: '1.2 km',
    cuisines: ['Turkish', 'Middle Eastern'],
    address: 'Friedrichstraße 123, Berlin'
  },
  {
    id: '2',
    name: 'Sultan\'s Delight',
    image: 'https://images.pexels.com/photos/2641886/pexels-photo-2641886.jpeg',
    rating: 4.2,
    reviews: 89,
    distance: '2.1 km',
    cuisines: ['Turkish', 'Mediterranean'],
    address: 'Unter den Linden 45, Berlin'
  },
  {
    id: '3',
    name: 'Kebab Express',
    image: 'https://images.pexels.com/photos/1653877/pexels-photo-1653877.jpeg',
    rating: 4.8,
    reviews: 156,
    distance: '0.8 km',
    cuisines: ['Turkish', 'Fast Food'],
    address: 'Alexanderplatz 78, Berlin'
  }
];

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredRestaurants, setFilteredRestaurants] = useState(mockRestaurants);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [tempSortBy, setTempSortBy] = useState<'rating' | 'distance' | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | null>(null);
  const [showRating4Plus, setShowRating4Plus] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    let filtered = mockRestaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisines.some(cuisine =>
        cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    if (showRating4Plus) {
      filtered = filtered.filter(restaurant => restaurant.rating >= 4);
    }

    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      filtered.sort((a, b) =>
        parseFloat(a.distance.replace(' km', '')) - parseFloat(b.distance.replace(' km', ''))
      );
    }

    setFilteredRestaurants(filtered);
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
          <button
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
      {showResults && (
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
      )}

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
                    setTempSortBy('rating');
                    setHasChanges(true);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${tempSortBy === 'rating'
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
                  <div className={`w-4 h-4 rounded-full border transition-colors ${tempSortBy === 'rating'
                    ? 'border-secondary bg-secondary'
                    : 'border-gray-300'
                    }`}>
                    {tempSortBy === 'rating' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTempSortBy('distance');
                    setHasChanges(true);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${tempSortBy === 'distance'
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
                  <div className={`w-4 h-4 rounded-full border transition-colors ${tempSortBy === 'distance'
                    ? 'border-secondary bg-secondary'
                    : 'border-gray-300'
                    }`}>
                    {tempSortBy === 'distance' && (
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
      {showResults && filteredRestaurants.length === 0 && (
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
      {showResults && filteredRestaurants.length > 0 && (
        <div className="p-4">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
            {t('searchPage.searchResults')} ({filteredRestaurants.length})
          </h2>
          <div className="space-y-4">
            {filteredRestaurants.map(restaurant => (
              <div
                key={restaurant.id}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm flex gap-4 cursor-pointer"
              >
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium ml-1">{restaurant.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({restaurant.reviews})</span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{restaurant.distance}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {restaurant.cuisines.join(' • ')}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{restaurant.address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Search;
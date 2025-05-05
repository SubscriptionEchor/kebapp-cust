import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

interface FilterOptions {
  sortBy: 'distance' | 'rating' | null;
  distance: number;
  rating: number;
}

const ratingOptions = [
  { value: 4.5, label: '4.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 3.5, label: '3.5+' }
];

const FilterOptionsSheet: React.FC<FilterOptionsSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilters
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | null>(currentFilters.sortBy);
  const [distance, setDistance] = useState(currentFilters.distance);
  const [rating, setRating] = useState(currentFilters.rating);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSortBy(currentFilters.sortBy);
      setDistance(currentFilters.distance);
      setRating(currentFilters.rating);
      setHasChanges(false);
    }
  }, [isOpen, currentFilters]);

  const handleDistanceChange = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    const clampedValue = Math.min(Math.max(numValue, 3), 50);
    setDistance(clampedValue);
    setHasChanges(true);
  };

  const handleSortChange = (value: 'distance' | 'rating') => {
    setSortBy(sortBy === value ? null : value);
    setHasChanges(true);
  };

  const handleRatingChange = (value: number) => {
    setRating(rating === value ? 0 : value);
    setHasChanges(true);
  };

  const handleClear = () => {
    // Reset to previous values instead of clearing
    setSortBy(currentFilters.sortBy);
    setDistance(currentFilters.distance);
    setRating(currentFilters.rating);
    setHasChanges(false);
  };

  const handleApply = () => {
    onApply({
      sortBy,
      distance,
      rating
    });
    onClose();
  };

  const hasActualChanges = () => {
    return sortBy !== currentFilters.sortBy ||
           distance !== currentFilters.distance ||
           rating !== currentFilters.rating;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-hidden animate-slide-up"
        style={{
          boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-gray-900">{t('mapfilters.filter')}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6 overflow-y-auto">
          {/* Sort Options */}
          <div className="mb-8">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">{t('mapfilters.sort')}</h4>
            <div className="space-y-3">
              <button
                onClick={() => handleSortChange('distance')}
                className={`w-full flex items-center justify-between p-3.5 rounded-lg transition-colors ${
                  sortBy === 'distance' 
                    ? 'bg-secondary/10 border border-secondary' 
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[13px] ${sortBy === 'distance' ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                  {t('mapfilters.distancesort')}
                </span>
                <div className={`w-4 h-4 rounded-full border transition-colors ${
                  sortBy === 'distance' 
                    ? 'border-secondary bg-secondary' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {sortBy === 'distance' && (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleSortChange('rating')}
                className={`w-full flex items-center justify-between p-3.5 rounded-lg transition-colors ${
                  sortBy === 'rating' 
                    ? 'bg-secondary/10 border border-secondary' 
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[13px] ${sortBy === 'rating' ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                  {t('mapfilters.ratingsort')}
                </span>
                <div className={`w-4 h-4 rounded-full border transition-colors ${
                  sortBy === 'rating' 
                    ? 'border-secondary bg-secondary' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {sortBy === 'rating' && (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Distance Slider */}
          <div className="mb-8">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">{t('mapfilters.searchnearbyshops')}</h4>
            <div className="flex items-center gap-4 px-1">
              <div className="flex-1">
                <input
                  type="range"
                  min="3"
                  max="50"
                  value={distance}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  className="range-slider w-full"
                  style={{ 
                    '--value-percent': `${(distance - 3) / 47 * 100}%`,
                  } as React.CSSProperties}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={distance}
                  min="3"
                  max="50"
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  className="w-16 p-2 text-right border rounded-lg text-[13px]"
                />
                <span className="text-[13px] text-gray-600">km</span>
              </div>
            </div>
          </div>

          {/* Rating Options */}
          <div className="mb-8">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">{t('searchPage.ratings')}</h4>
            <div className="grid grid-cols-3 gap-3">
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRatingChange(option.value)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-lg transition-all ${
                    rating === option.value
                      ? 'bg-secondary/10 border border-secondary'
                      : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star
                      size={14}
                      className={`${
                        rating === option.value ? 'text-secondary fill-secondary' : 'text-gray-600'
                      }`}
                    />
                    <span className={`text-[13px] font-medium ${
                      rating === option.value ? 'text-secondary' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto pt-4">
            <button
              onClick={handleClear}
              className="flex-1 py-3 text-red-500 text-[13px] font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              {t('mapfilters.clearall')}
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges || !hasActualChanges()}
              className={`flex-1 py-3 rounded-lg text-[13px] font-medium transition-colors ${
                hasChanges && hasActualChanges()
                  ? 'bg-secondary text-black hover:bg-opacity-90' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('mapfilters.apply')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterOptionsSheet;
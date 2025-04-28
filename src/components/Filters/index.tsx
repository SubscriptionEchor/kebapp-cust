import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Star } from 'lucide-react';
import FilterOptionsSheet from './FilterOptionsSheet';
import SortOptionsSheet from './SortOptionsSheet';
import CuisineOptionsSheet from './CuisineOptionsSheet';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  id: string;
  label: string;
  type: 'sort' | 'distance' | 'rating';
  value?: number;
  options?: string[];
  range?: {
    min: number;
    max: number;
    unit: string;
  };
}

interface FilterOptions {
  sortBy: 'distance' | 'rating' | null;
  distance: number;
  rating: number;
  cuisines: string[];
}

const filters: FilterOption[] = [
  { 
    id: 'filter', 
    label: 'Filter', 
    type: 'sort',
  },
  { 
    id: 'sort', 
    label: 'Sort', 
    type: 'sort',
    options: ['Rating (High to low)', 'Distance (low to high)'] 
  },
  { 
    id: 'rating', 
    label: 'Ratings 4.0+', 
    type: 'rating',
    value: 4.0
  },
  { 
    id: 'cuisines', 
    label: 'Cuisines', 
    type: 'sort',
  }
];

const Filters: React.FC = () => {
  const { t } = useTranslation();
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showCuisineOptions, setShowCuisineOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: null,
    distance: 50,
    rating: 0,
    cuisines: []
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterOptions.rating > 0) count++;
    if (filterOptions.distance !== 50) count++;
    return count;
  };

  const handleFilterClick = (filterId: string) => {
    if (filterId === 'filter') {
      setShowFilterOptions(true);
    } else if (filterId === 'sort') {
      setShowSortOptions(true);
    } else if (filterId === 'cuisines') {
      setShowCuisineOptions(true);
    } else if (filterId === 'rating') {
      // Toggle rating filter
      const ratingOption = filters.find(f => f.id === 'rating');
      const newRating = filterOptions.rating === ratingOption?.value ? 0 : (ratingOption?.value || 0);
      setFilterOptions(prev => ({
        ...prev,
        rating: newRating
      }));
      setActiveFilter(newRating > 0 ? filterId : null);
    } else {
      setActiveFilter(activeFilter === filterId ? null : filterId);
    }
  };

  const handleApplyFilters = (newFilters: Omit<FilterOptions, 'cuisines'>) => {
    setFilterOptions(prev => ({
      ...prev,
      ...newFilters
    }));
    // Update active filter for rating if it's selected
    const ratingOption = filters.find(f => f.id === 'rating');
    if (newFilters.rating === ratingOption?.value) {
      setActiveFilter('rating');
    } else if (newFilters.rating === 0 && activeFilter === 'rating') {
      setActiveFilter(null);
    }
  };

  const handleApplySort = (sortOption: string | null) => {
    setFilterOptions(prev => ({
      ...prev,
      sortBy: sortOption as 'distance' | 'rating' | null
    }));
    setActiveFilter(sortOption ? 'sort' : null);
  };

  const handleApplyCuisines = (selectedCuisines: string[]) => {
    setFilterOptions(prev => ({
      ...prev,
      cuisines: selectedCuisines
    }));
    setActiveFilter(selectedCuisines.length > 0 ? 'cuisines' : null);
  };

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {filters.map((filter) => {
          const isActive = filter.id === 'rating' 
            ? filterOptions.rating === filter.value
            : filter.id === 'cuisines'
            ? filterOptions.cuisines.length > 0
            : filter.id === 'sort'
            ? filterOptions.sortBy !== null
            : filter.id === 'filter'
            ? getActiveFilterCount() > 0
            : activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#FFCD38] text-black border border-[#FFCD38]'
                  : 'bg-white text-[#02060C99] border border-[#E2E2E7]'
              }`}
            >
              {filter.id === 'filter' && (
                <>
                  <SlidersHorizontal size={16} />
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-1 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </>
              )}
              {filter.label}
              {(filter.id === 'sort' || filter.id === 'cuisines') && (
                <>
                  <ChevronDown size={16} />
                  {filter.id === 'sort' && filterOptions.sortBy && (
                    <span className="ml-1 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
                  )}
                  {filter.id === 'cuisines' && filterOptions.cuisines.length > 0 && (
                    <span className="ml-1 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                      {filterOptions.cuisines.length}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <FilterOptionsSheet
        isOpen={showFilterOptions}
        onClose={() => setShowFilterOptions(false)}
        onApply={handleApplyFilters}
        currentFilters={filterOptions}
      />

      <SortOptionsSheet
        isOpen={showSortOptions}
        onClose={() => setShowSortOptions(false)}
        onApply={handleApplySort}
        currentSort={filterOptions.sortBy}
      />

      <CuisineOptionsSheet
        isOpen={showCuisineOptions}
        onClose={() => setShowCuisineOptions(false)}
        onApply={handleApplyCuisines}
        currentCuisines={filterOptions.cuisines}
      />
    </div>
  );
};

export default Filters;
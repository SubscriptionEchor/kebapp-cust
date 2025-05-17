import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterUpdate: (radius: number) => void;
  onToggleOffers?: (showOffers: boolean) => void;
  onToggleEvents?: (showEvents: boolean) => void;
  activeFilters?: {
    radius?: number;
    offers?: boolean;
    events?: boolean;
  };
}

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  onFilterUpdate,
  onToggleOffers,
  onToggleEvents,
  activeFilters = {}
}) => {
  const { t } = useTranslation();
  const [radius, setRadius] = useState(activeFilters.radius || 50);
  const [showOffers, setShowOffers] = useState(activeFilters.offers || false);
  const [showEvents, setShowEvents] = useState(activeFilters.events !== false); // Default to true

  // Update local state when activeFilters prop changes
  useEffect(() => {
    if (activeFilters.radius !== undefined) {
      setRadius(activeFilters.radius);
    }
    if (activeFilters.offers !== undefined) {
      setShowOffers(activeFilters.offers);
    }
    if (activeFilters.events !== undefined) {
      setShowEvents(activeFilters.events);
    }
  }, [activeFilters]);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (onFilterUpdate) {
      onFilterUpdate(newRadius);
    }
  };

  const handleOffersToggle = (value: boolean) => {
    setShowOffers(value);
    if (onToggleOffers) {
      onToggleOffers(value);
    }
  };

  const handleEventsToggle = (value: boolean) => {
    setShowEvents(value);
    if (onToggleEvents) {
      onToggleEvents(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-end">
      <div className="bg-white w-full rounded-t-[20px] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">{t('mapfilters.title') || 'Filters'}</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">{t('mapfilters.radius') || 'Radius'}</h3>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 50].map((value) => (
              <button
                key={value}
                onClick={() => handleRadiusChange(value)}
                className={`px-4 py-2 rounded-full ${radius === value
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {value} {t('mapfilters.km') || 'km'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">{t('mapfilters.offers') || 'Show Offers'}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleOffersToggle(true)}
              className={`px-4 py-2 rounded-full ${showOffers
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800'
                }`}
            >
              {t('mapfilters.showOffers') || 'Show Offers'}
            </button>
            <button
              onClick={() => handleOffersToggle(false)}
              className={`px-4 py-2 rounded-full ${!showOffers
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800'
                }`}
            >
              {t('mapfilters.showAll') || 'Show All'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">{t('mapfilters.events') || 'Events'}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleEventsToggle(true)}
              className={`px-4 py-2 rounded-full ${showEvents
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800'
                }`}
            >
              {t('mapfilters.showEvents') || 'Show Events'}
            </button>
            <button
              onClick={() => handleEventsToggle(false)}
              className={`px-4 py-2 rounded-full ${!showEvents
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800'
                }`}
            >
              {t('mapfilters.hideEvents') || 'Hide Events'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-secondary text-black font-semibold rounded-lg"
        >
          {t('common.apply') || 'Apply Filters'}
        </button>
      </div>
    </div>
  );
};

export default FilterBottomSheet;
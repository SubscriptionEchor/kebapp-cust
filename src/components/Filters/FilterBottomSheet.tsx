import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterUpdate?: (radius: number) => void;
}

const offers = [
  {
    id: 1,
    name: "HAPPY HOUR",
    icon: "🔥",
  },
  {
    id: 2,
    name: "SPECIAL DAY",
    icon: "⭐",
  },
  {
    id: 3,
    name: "CHEF SPECIAL",
    icon: "👨‍🍳",
  }
];

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  onFilterUpdate
}) => {
  // Temporary state for current session
  const [tempDistance, setTempDistance] = useState(50);
  const [tempSelectedOffer, setTempSelectedOffer] = useState<number | null>(null);

  // Permanent state that persists after applying
  const [distance, setDistance] = useState(50);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);

  // Track if any changes were made
  const [hasChanges, setHasChanges] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset temporary values to current permanent values when opening
      setTempDistance(distance);
      setTempSelectedOffer(selectedOffer);
      setHasChanges(false);
      setIsCleared(false);
    }
  }, [isOpen, distance, selectedOffer]);

  const handleDistanceChange = (value: number) => {
    const clampedValue = Math.min(Math.max(value, 3), 50);
    setTempDistance(clampedValue);
    setHasChanges(!isDefaultState(clampedValue, tempSelectedOffer));
    setIsCleared(false);
  };

  const handleOfferSelect = (offerId: number) => {
    const newSelectedOffer = offerId === tempSelectedOffer ? null : offerId;
    setTempSelectedOffer(newSelectedOffer);
    setHasChanges(!isDefaultState(tempDistance, newSelectedOffer));
    setIsCleared(false);
  };

  const isDefaultState = (currentDistance: number, currentOffer: number | null) => {
    return currentDistance === distance && currentOffer === selectedOffer;
  };

  const handleClear = () => {
    // Reset to previous applied values
    setTempDistance(distance);
    setTempSelectedOffer(selectedOffer);
    setIsCleared(true);
    setHasChanges(false);
  };

  const handleApply = () => {
    // Update permanent state with temporary values
    setDistance(tempDistance);
    setSelectedOffer(tempSelectedOffer);
    if (onFilterUpdate) {
      onFilterUpdate(tempDistance);
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset temporary values and close
    setTempDistance(distance);
    setTempSelectedOffer(selectedOffer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 bg-black bg-opacity-50  animate-fade-in"
        onClick={handleCancel}
      />

      {/* Bottom Sheet */}
      <div
        // style={{ zIndex: 1000 }}

        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-hidden animate-slide-up"
        style={{
          zIndex: 10000,
          boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Filter</h3>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6">
          {/* Offers Section */}
          <div className="mb-6">
            <h4 className="text-base font-bold mb-3">Exciting offers</h4>
            <div className="grid grid-cols-3 gap-3">
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => handleOfferSelect(offer.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all bg-white border ${tempSelectedOffer === offer.id
                    ? 'border-secondary border-2'
                    : 'border-gray-200 border-2'
                    }`}
                >
                  <span className="text-xl mb-1.5">{offer.icon}</span>
                  <span className="text-xs font-medium text-center whitespace-nowrap">{offer.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Distance Section */}
          <div className="mb-6">
            <h4 className="text-base font-bold mb-3">Search Nearby Shops</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="3"
                  max="50"
                  value={tempDistance}
                  onChange={(e) => handleDistanceChange(Number(e.target.value))}
                  className="range-slider w-full"
                  style={{
                    '--value-percent': `${(tempDistance - 3) / 47 * 100}%`,
                  } as React.CSSProperties}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempDistance}
                  min="3"
                  max="50"
                  onChange={(e) => handleDistanceChange(Number(e.target.value))}
                  className="w-16 p-2 text-right border rounded-lg text-sm"
                />
                <span className="text-gray-600 text-sm">km</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 py-2.5 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges || isCleared}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${hasChanges && !isCleared
                ? 'bg-secondary text-black hover:bg-opacity-90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterBottomSheet;
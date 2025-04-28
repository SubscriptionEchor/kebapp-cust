import React, { useState, useEffect } from 'react';
import { X, ArrowDownAZ, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SortOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (sortOption: string | null) => void;
  currentSort: 'distance' | 'rating' | null;
}

const SortOptionsSheet: React.FC<SortOptionsSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  currentSort
}) => {
  const { t } = useTranslation();
  const [selectedSort, setSelectedSort] = useState<string | null>(currentSort);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedSort(currentSort);
      setHasChanges(false);
    }
  }, [isOpen, currentSort]);

  const sortOptions = [
    { 
      value: 'distance', 
      label: t('mapfilters.distancesort'),
      icon: <ArrowDownAZ size={18} className="text-gray-600" />
    },
    { 
      value: 'rating', 
      label: t('mapfilters.ratingsort'),
      icon: <Star size={18} className="text-gray-600" />
    }
  ];

  const handleSortChange = (value: string) => {
    setSelectedSort(selectedSort === value ? null : value);
    setHasChanges(true);
  };

  const handleClear = () => {
    // Reset to previous value instead of clearing
    setSelectedSort(currentSort);
    setHasChanges(false);
  };

  const handleApply = () => {
    onApply(selectedSort);
    onClose();
  };

  const hasActualChanges = () => {
    return selectedSort !== currentSort;
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
          <h3 className="text-[15px] font-semibold text-gray-900">{t('mapfilters.sort')}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="space-y-3">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  selectedSort === option.value 
                    ? 'bg-secondary/10 border border-secondary' 
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {option.icon}
                  <span className={`text-[13px] ${selectedSort === option.value ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </div>
                <div className={`w-4 h-4 rounded-full border transition-colors ${
                  selectedSort === option.value 
                    ? 'border-secondary bg-secondary' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {selectedSort === option.value && (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
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

export default SortOptionsSheet;
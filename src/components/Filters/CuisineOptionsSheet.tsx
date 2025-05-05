import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBootstrap } from '../../context/BootstrapContext';

interface CuisineOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedCuisines: string[]) => void;
  currentCuisines: string[];
}

const CuisineOptionsSheet: React.FC<CuisineOptionsSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  currentCuisines
}) => {
  const { t } = useTranslation();
  const { bootstrapData, loading } = useBootstrap();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(currentCuisines);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCuisines(currentCuisines);
      setHasChanges(false);
    }
  }, [isOpen, currentCuisines]);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => {
      const newSelection = prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine];
      setHasChanges(true);
      return newSelection;
    });
  };

  const handleClear = () => {
    // Reset to previous values instead of clearing
    setSelectedCuisines(currentCuisines);
    setHasChanges(false);
  };

  const handleApply = () => {
    onApply(selectedCuisines);
    onClose();
  };

  const hasActualChanges = () => {
    if (selectedCuisines.length !== currentCuisines.length) return true;
    return selectedCuisines.some(cuisine => !currentCuisines.includes(cuisine));
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
          <h3 className="text-[15px] font-semibold text-gray-900">Select Cuisines</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-secondary border-t-transparent"></div>
            </div>
          ) : (
            bootstrapData?.cuisines?.map((cuisine: { name: string }) => (
              <button
                key={cuisine.name}
                onClick={() => handleCuisineToggle(cuisine.name)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[13px] text-gray-900">
                  {cuisine.name}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedCuisines.includes(cuisine.name)
                    ? 'border-secondary bg-secondary'
                    : 'border-gray-300'
                }`}>
                  {selectedCuisines.includes(cuisine.name) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
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
    </>
  );
};

export default CuisineOptionsSheet;
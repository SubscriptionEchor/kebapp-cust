import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Variation {
  _id: string;
  title: string;
  price: number;
  hasAddons?: boolean;
}

interface Addon {
  _id: string;
  title: string;
  minQty: number;
  maxQty: number;
  options: {
    _id: string;
    title: string;
    price: number;
  }[];
}

interface VariationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  variations: Variation[];
  addons?: Addon[];
  onAddToCart?: (itemId: string) => void;
}

const VariationBottomSheet: React.FC<VariationBottomSheetProps> = ({
  isOpen,
  onClose,
  itemName,
  variations,
  addons,
  onAddToCart
}) => {
  const [step, setStep] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
  const [addonErrors, setAddonErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const resetState = () => {
    setStep(1);
    setSelectedVariation(null);
    setSelectedAddons({});
    setAddonErrors({});
    setIsValid(false);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const getSelectedVariation = () => variations.find(v => v._id === selectedVariation);
  const hasAddons = () => {
    const variation = getSelectedVariation();
    return variation?.hasAddons && addons && addons.length > 0;
  };

  const handleVariationSelect = (variationId: string) => {
    setSelectedVariation(variationId);
    setSelectedAddons({});
    setAddonErrors({});
    setIsValid(false);
  };

  const handleAddonSelect = (addonId: string, optionId: string) => {
    const addon = addons?.find(a => a._id === addonId);
    if (!addon) return;
    
    setSelectedAddons((prev) => {
      const currentSelected = prev[addonId] || [];
      const isSelected = currentSelected.includes(optionId);
      let newAddons;
      
      if (isSelected) {
        // Remove the option if it's already selected
        newAddons = {
          ...prev,
          [addonId]: currentSelected.filter(id => id !== optionId)
        };
      } else {
        // Add the option if it's not selected and we haven't reached the maximum
        if (currentSelected.length < addon.maxQty) {
          newAddons = {
            ...prev,
            [addonId]: [...currentSelected, optionId]
          };
        } else {
          return prev;
        }
      }

      // Validate immediately with the new state
      const newErrors: Record<string, string> = {};
      let allValid = true;

      addons?.forEach(addon => {
        const selectedCount = newAddons[addon._id]?.length || 0;
        if (selectedCount < addon.minQty) {
          const remaining = addon.minQty - selectedCount;
          const message = `Select ${remaining} more ${remaining === 1 ? 'option' : 'options'}`;
          newErrors[addon._id] = message;
          allValid = false;
        }
      });

      setAddonErrors(newErrors);
      setIsValid(allValid);

      return newAddons;
    });
  };

  const handleNext = () => {
    if (step === 1 && hasAddons()) {
      setStep(2);
    } else {
      const variation = getSelectedVariation();
      if (variation && onAddToCart) {
        onAddToCart(variation._id);
      }
      handleClose();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-gray-900">
            Step {step}/02 • {itemName}
          </h3>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-4">
              <h4 className="text-[13px] font-medium text-gray-900 mb-4">
                Select a Variation
              </h4>
              <div className="space-y-3">
                {variations.map((variation) => (
                  <button
                    key={variation._id}
                    onClick={() => handleVariationSelect(variation._id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      selectedVariation === variation._id
                        ? 'border-secondary bg-secondary/10'
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="text-[13px] text-left text-gray-900">
                        {variation.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Marinated in yogurt and spices for a tender and juicy flavor
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">
                        €{variation.price}
                      </span>
                      <div className={`w-4 h-4 rounded-full border transition-colors ${
                        selectedVariation === variation._id
                          ? 'border-secondary bg-secondary'
                          : 'border-gray-300'
                      }`}>
                        {selectedVariation === variation._id && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && addons && (
            <div className="p-4">
              <h4 className="text-[13px] font-medium text-gray-900 mb-4">
                Select Add-ons
              </h4>
              <div className="space-y-6">
                {addons.map((addon) => (
                  <div key={addon._id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-[13px] font-medium text-gray-900">
                          {addon.title}
                        </h5>
                        <p className="text-[11px] text-gray-500">
                          {addon.minQty > 0 ? (
                            <span>Select {addon.minQty} {addon.minQty === 1 ? 'option' : 'options'}</span>
                          ) : (
                            <span>Optional • Select up to {addon.maxQty}</span>
                          )}
                        </p>
                      </div>
                      {addonErrors[addon._id] && (
                        <span className="text-[11px] text-secondary">
                          {addonErrors[addon._id]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {addon.options.map((option) => {
                        const isSelected = selectedAddons[addon._id]?.includes(option._id);
                        const selectedCount = selectedAddons[addon._id]?.length || 0;
                        const isDisabled = !isSelected && selectedCount >= addon.maxQty;

                        return (
                          <button
                            key={option._id}
                            onClick={() => handleAddonSelect(addon._id, option._id)}
                            disabled={isDisabled}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-secondary bg-secondary/10'
                                : isDisabled
                                ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className={`text-[13px] ${
                              isDisabled ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {option.title}
                            </span>
                            <div className="flex items-center gap-3">
                              {option.price > 0 && (
                                <span className={`text-[13px] ${
                                  isDisabled ? 'text-gray-400' : 'text-gray-900'
                                }`}>
                                  +€{option.price}
                                </span>
                              )}
                              <div className={`w-4 h-4 rounded-full border transition-colors ${
                                isSelected
                                  ? 'border-secondary bg-secondary'
                                  : isDisabled
                                  ? 'border-gray-300 bg-gray-100'
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 flex gap-3">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex-1 py-3 rounded-lg text-[13px] font-medium transition-colors ${
              step === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedVariation || (step === 2 && !isValid)}
            className={`flex-1 py-3 rounded-lg text-[13px] font-medium transition-colors ${
              selectedVariation && (step === 1 || isValid)
                ? 'bg-secondary text-black hover:bg-opacity-90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {hasAddons() && step === 1 ? 'Next' : 'Add'}
          </button>
        </div>
      </div>
    </>
  );
};

export default VariationBottomSheet;
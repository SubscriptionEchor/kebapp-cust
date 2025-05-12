import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { CartItem, useCart } from '../../context/CartContext';
import { useBootstrap } from '../../context/BootstrapContext';

interface Variation {
  _id: string;
  title: string;
  price: number;
  hasAddons?: boolean;
  optionSetList?: string[];
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
  existingItem?: CartItem;
  isDecrementing?: boolean;
  addons?: Addon[];
  onAddToCart?: (cartItem: CartItem) => void;
}

const VariationBottomSheet: React.FC<VariationBottomSheetProps> = ({
  isOpen,
  onClose,
  itemName,
  variations,
  existingItem,
  isDecrementing = false,
  addons,
  onAddToCart,
  isVeg,
  restaurantId,
  foodId
}) => {
  const { cart, setCart, removeFromCart } = useCart();
  const [step, setStep] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
  const [addonErrors, setAddonErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(true);
  const [showVariationList, setShowVariationList] = useState(false);
  const [editingVariation, setEditingVariation] = useState<string | null>(null);
  const [selectedOptionSetList, setSelectedOptionSetList] = useState([])
  const [showAll, setShowAll] = useState(false);
  const { bootstrapData } = useBootstrap()
  // Move getSelectedVariation function before useEffect
  const getSelectedVariation = () => variations.find(v => v._id === selectedVariation);

  // Initialize selected addons from existing item
  useEffect(() => {
    if (isOpen && selectedOptionSetList?.optionSetList?.length > 0) {
      const initialAddons: Record<string, string[]> = {};
      selectedOptionSetList.optionSetList?.forEach(option => {
        initialAddons[option.addonId] = option.selectedOptions;
      });
      setSelectedAddons(initialAddons);

      // Validate initial state
      const optionSets = getSelectedVariation()?.optionSetList || [];
      let initialValid = true;
      const initialErrors: Record<string, string> = {};

      optionSets.forEach(addon => {
        const selectedCount = initialAddons[addon._id]?.length || 0;
        if (selectedCount < addon.minQty) {
          const remaining = addon.minQty - selectedCount;
          initialErrors[addon._id] = `Select ${remaining} more ${remaining === 1 ? 'option' : 'options'}`;
          initialValid = false;
        }
      });

      setAddonErrors(initialErrors);
      setIsValid(initialValid);
    }
  }, [isOpen, selectedOptionSetList]);
  // Get all cart items for this food
  const relatedCartItems = (restaurantId && foodId) ? cart.filter(item =>
    item.foodId === foodId && item?.restaurantId == restaurantId
  ) : [];



  const resetState = () => {
    setStep(1);
    setSelectedVariation(null);
    setSelectedAddons({});
    setAddonErrors({});
    setIsValid(false);
    setEditingVariation(null);
    setShowVariationList(false);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const hasAddons = () => {
    const variation = getSelectedVariation();
    return variation?.optionSetList && variation.optionSetList.length > 0;
  };

  const handleVariationSelect = (variationId: string) => {
    setSelectedVariation(variationId);

    // Keep addons if selecting the same variation while editing
    if (editingVariation && variationId === editingVariation) {
      const initialAddons: Record<string, string[]> = {};
      selectedOptionSetList?.optionSetList.forEach(option => {
        initialAddons[option.addonId] = option.selectedOptions;
      });
      setSelectedAddons(initialAddons);

      // Validate initial state
      const optionSets = getSelectedVariation()?.optionSetList || [];
      let initialValid = true;
      const initialErrors: Record<string, string> = {};

      optionSets.forEach(addon => {
        const selectedCount = initialAddons[addon._id]?.length || 0;
        if (selectedCount < addon.minQty) {
          const remaining = addon.minQty - selectedCount;
          initialErrors[addon._id] = `Select ${remaining} more ${remaining === 1 ? 'option' : 'options'}`;
          initialValid = false;
        }
      });

      setAddonErrors(initialErrors);
      setIsValid(initialValid);
    } else {
      setSelectedAddons({});
      setAddonErrors({});
      setIsValid(true);
    }
  };

  const handleAddonSelect = (addonId: string, optionId: string) => {
    const addon = getSelectedVariation()?.optionSetList?.find(a => a._id === addonId);
    if (!addon) return;

    setSelectedAddons((prev) => {
      const currentSelected = prev[addonId] || [];
      const isSelected = currentSelected.find(opt => opt.id === optionId);
      let newAddons;

      if (isSelected) {
        // Always allow deselection
        newAddons = {
          ...prev,
          [addonId]: currentSelected.filter(opt => opt.id !== optionId)
        };
      } else {
        // Add the option if it's not selected and we haven't reached the maximum
        if (currentSelected.length < addon.maxQty) {
          const option = addon.optionData.find(opt => opt._id === optionId);
          newAddons = {
            ...prev,
            [addonId]: [...currentSelected, {
              id: optionId,
              name: option?.name || '',
              price: option?.price || 0
            }]
          };
        } else {
          return prev;
        }
      }

      // Validate immediately with the new state
      const newErrors: Record<string, string> = {};
      let allValid = true;
      const optionSets = getSelectedVariation()?.optionSetList || [];

      optionSets.forEach(addon => {
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
      // Reset validation state when moving to step 2
      const optionSets = getSelectedVariation()?.optionSetList || [];
      let initialValid = true;
      const initialErrors: Record<string, string> = {};

      optionSets.forEach(addon => {
        if (addon.minQty > 0) {
          initialValid = false;
          initialErrors[addon._id] = `Select ${addon.minQty} ${addon.minQty === 1 ? 'option' : 'options'}`;
        }
      });

      setAddonErrors(initialErrors);
      setIsValid(initialValid);
    } else {
      const variation = getSelectedVariation();
      if (variation && onAddToCart) {
        // Create cart item directly
        const cartItem = {
          categoryId: '',  // You'll need to pass this as a prop if needed
          foodId: variation._id.split('-')[0],
          foodName: itemName,
          itemCount: 1,
          variationId: variation._id,
          variationName: variation.title,
          variationPrice: variation.price,
          variationDiscountedPrice: variation.discountedPrice,
          restaurantId: '',  // This will be set when adding to cart
          restaurantName: '',  // This will be set when adding to cart
          customized: Object.keys(selectedAddons).length > 0,
          optionSetList: Object.entries(selectedAddons).map(([addonId, selectedOptions]) => ({
            addonId,
            addonName: getSelectedVariation()?.optionSetList?.find(a => a._id === addonId)?.title || '',
            selectedOptions: selectedOptions
          }))
        };

        // First check if we're editing and if the new configuration matches any existing item
        const matchingCartItem = editingVariation ? cart.find(item => {
          // Skip the item being edited
          if (item.variationId === editingVariation) return false;
          // First check basic properties
          if (item.foodId !== cartItem.foodId ||
            item.variationId !== cartItem.variationId ||
            item.optionSetList.length !== cartItem.optionSetList.length) {
            return false;
          }
          // Then verify each addon and its options match exactly
          for (const itemAddon of item.optionSetList) {
            const matchingAddon = cartItem.optionSetList.find(a => a.addonId === itemAddon.addonId);
            // If no matching addon found or different number of options, not a match
            if (!matchingAddon ||
              matchingAddon.selectedOptions.length !== itemAddon.selectedOptions.length) {
              return false;
            }

            // Check if all selected options match exactly
            const optionsMatch =
              itemAddon.selectedOptions.length === matchingAddon.selectedOptions.length &&
              itemAddon.selectedOptions.every(option =>
                matchingAddon.selectedOptions.some(so => so?.id === option?.id)
              );

            if (!optionsMatch) {
              return false;
            }
          }

          // If we got here, everything matches
          return true;
        }) : null;


        if (editingVariation) {
          if (matchingCartItem) {
            // If editing and found a matching item, merge them
            setCart(prev => {
              // Remove the item being edited
              const filteredCart = prev.filter(item =>
                !(item.foodId === cartItem.foodId && item.variationId === editingVariation)
              );

              // Update matching item with combined count
              return filteredCart.map(item => {
                // Use property comparison instead of reference comparison
                if (item.foodId === matchingCartItem.foodId &&
                  item.variationId === matchingCartItem.variationId) {
                  return {
                    ...item,
                    // Check if selectedOptionSetList exists and has itemCount
                    itemCount: item.itemCount + (selectedOptionSetList?.itemCount || 1)
                  };
                }
                return item;
              });
            });
          } else {
            // Replace edited item if no match found
            setCart(prev => {
              const filteredCart = prev.filter(item =>
                !(item.foodId === cartItem.foodId && item.variationId === editingVariation)
              );
              // Make sure we have a valid itemCount
              return [...filteredCart, {
                ...cartItem,
                itemCount: selectedOptionSetList?.itemCount || 1
              }];
            });
          }
        } else {
          // Not editing - check for existing identical item
          const existingCartItem = cart.find(item => {
            // Check for exact match including addons
            if (item.foodId !== cartItem.foodId ||
              item.variationId !== cartItem.variationId ||
              item.optionSetList.length !== cartItem.optionSetList.length) {
              return false;
            }

            return item.optionSetList.every(itemAddon => {
              const matchingAddon = cartItem.optionSetList.find(a => a.addonId === itemAddon.addonId);
              // Improved option comparison
              return matchingAddon &&
                matchingAddon.selectedOptions.length === itemAddon.selectedOptions.length &&
                itemAddon.selectedOptions.every(option =>
                  matchingAddon.selectedOptions.some(so => so?.id === option?.id)
                );
            });
          });

          if (existingCartItem) {
            // Update existing item count
            setCart(prev => prev.map(item => {
              // Use property comparison instead of reference comparison
              if (item.foodId === existingCartItem.foodId &&
                item.variationId === existingCartItem.variationId) {
                return {
                  ...item,
                  itemCount: item.itemCount + 1
                };
              }
              return item;
            }));
          } else {
            // Add as new item
            onAddToCart(cartItem);
          }
        }
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
        style={{ zIndex: 100 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-70 animate-fade-in"
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div style={{ zIndex: 100 }} className="fixed bottom-0  left-0 right-0 bg-white rounded-t-2xl  max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="sticky  top-0 bg-white border-b  rounded-t-3xl border-gray-100 px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <div className={`w-4 h-4 border-2 ${isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
                <div className={`w-full h-full rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <h3 className="ms-2 text-[15px] font-semibold text-gray-900">
                {itemName}
              </h3>
            </div>

          </div>
          <button
            onClick={handleClose}
            className="p-3  absolute -top-14 bg-black left-[44%] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-100" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-4">
              {selectedOptionSetList && !showVariationList && relatedCartItems.length > 0 ? (
                <>
                  <h4 className="text-[13px] font-medium text-gray-900 mb-4">
                    Current Selections
                  </h4>

                  {relatedCartItems.map((item, index) => (
                    <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm text-gray-700 mb-1">
                            {item.variationName}

                          </p>
                          <div className="flex">
                            <p className="text-xs text-gray-900">
                              {bootstrapData?.currencyConfig?.currencySymbol}{item.variationPrice}
                            </p>
                            {item.variationDiscountedPrice ? <p className=" ms-2 line-through text-xs text-gray-500">
                              {bootstrapData?.currencyConfig?.currencySymbol} {item.variationPrice + item.variationDiscountedPrice}
                            </p> : null}
                          </div>
                          {item.optionSetList?.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              {item.optionSetList.map((addon, idx) => {

                                const options = addon.selectedOptions;
                                const displayOptions = showAll ? options : options.slice(0, 2);
                                const hasMore = options.length > 2;

                                return (<div key={idx} className="flex justify-center items-center flex-col gap-0.5">
                                  {/* <span className="font-medium">{addon.addonName}</span> */}
                                  <div className="flex justify-center">
                                    {displayOptions.map((option, optIdx) => (
                                      <div key={optIdx} className="flex me-2 items-center justify-between">
                                        <span>
                                          {option.name}
                                          {optIdx < displayOptions.length - 1 && ", "}
                                        </span>
                                      </div>
                                    ))}
                                    {hasMore && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowAll(!showAll);
                                        }}
                                        className="text-secondary ms-2 flex items-center text-[11px] font-medium mt-0.5"
                                      >
                                        {/* {showAll ? 'Show less' : `Show more`} */}
                                        {showAll ? <ChevronDown height={8} /> : <ChevronUp height={18} />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                )
                              })}
                            </div>
                          )}
                        </div>


                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                if (isDecrementing) {
                                  removeFromCart(item.foodId, item.variationId);
                                  if (relatedCartItems.length === 1 && item.itemCount === 1) {
                                    handleClose();
                                  }
                                } else {
                                  removeFromCart(item.foodId, item.variationId);
                                  if (item.itemCount === 1) {
                                    handleClose();
                                  }
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg"
                            >
                              <Minus size={16} className="text-gray-700" />
                            </button>

                            <span className="text-sm font-medium w-6 text-center">
                              {item.itemCount}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAddToCart) {
                                  onAddToCart({
                                    ...item,
                                    itemCount: item.itemCount + 1
                                  });
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-secondary rounded-lg"
                            >
                              <Plus size={16} className="text-black" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {!isDecrementing && (
                        <button
                          onClick={() => {
                            setShowVariationList(true);
                            setSelectedVariation(item.variationId);
                            setEditingVariation(item.variationId);
                            setSelectedOptionSetList(item)
                          }}
                          className="text-sm items-center flex text-secondary font-medium"
                        >
                          Edit
                          <ChevronRight height={18} />
                        </button>
                      )}
                    </div>
                  ))}

                  {!isDecrementing && (
                    <button
                      onClick={() => {
                        setShowVariationList(true);
                        setSelectedVariation(null);
                        setEditingVariation(null);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div>
                        <p className="text-[13px] text-left text-gray-900">
                          Add New Customization
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Choose a different variation
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                  )}
                </>
              ) : (
                // Show variation list for new selection or when editing
                <>
                  <h4 className="text-[13px] font-medium text-gray-900 mb-4">
                    {isDecrementing ? 'Select Item to Remove' : 'Select a Variation'}
                  </h4>
                  <div className="space-y-3">
                    {variations.map((variation) => (
                      <button
                        key={variation._id}
                        onClick={() => {
                          handleVariationSelect(variation._id);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${selectedVariation === variation._id || (editingVariation === variation._id && !selectedVariation)
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-200'
                          }`}
                      >
                        <div>
                          <p className="text-[13px] text-left text-gray-900">
                            {variation.title}

                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium">
                            {bootstrapData?.currencyConfig?.currencySymbol}{variation.price}
                          </span>
                          {variation?.discountedPrice ? <span className=" line-through text-gray-500 text-[13px] font-medium">
                            {bootstrapData?.currencyConfig?.currencySymbol}{variation.discountedPrice}
                          </span> : null}
                          <div className={`w-4 h-4 rounded-full border transition-colors ${selectedVariation === variation._id || (editingVariation === variation._id && !selectedVariation)
                            ? 'border-secondary bg-secondary'
                            : 'border-gray-300'
                            }`}>
                            {(selectedVariation === variation._id || (editingVariation === variation._id && !selectedVariation)) && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && addons && (
            <div className="p-4">
              <h4 className="text-[13px] font-medium text-gray-900 mb-4">
                Select Option set
              </h4>
              <div className="space-y-6">
                {getSelectedVariation()?.optionSetList?.map((addon) => (
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
                      {addon?.optionData?.map((option) => {
                        const isSelected = selectedAddons[addon._id]?.find(opt => opt?.id == option._id);
                        const selectedCount = selectedAddons[addon._id]?.length || 0;
                        const isDisabled = !isSelected && selectedCount >= addon.maxQty;

                        // Only highlight options if they're selected in the current variation being edited
                        const isEditingSelected = editingVariation === selectedOptionSetList?.variationId &&
                          !selectedVariation &&
                          selectedOptionSetList?.optionSetList?.find(opt =>
                            opt.addonId === addon._id &&
                            opt.selectedOptions.includes(option._id)
                          );

                        const buttonClasses = `w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${isSelected
                          ? 'border-secondary bg-secondary/10 shadow-sm transform scale-[1.02]'
                          : isEditingSelected
                            ? 'border-secondary bg-secondary/10 shadow-sm transform scale-[1.02]'
                            : isDisabled
                              ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`;

                        return (
                          <button
                            key={option._id}
                            onClick={() => handleAddonSelect(addon._id, option._id)}
                            disabled={isDisabled}
                            className={buttonClasses}
                          >
                            <span className={`text-[13px] ${isDisabled ? 'text-gray-400' : 'text-gray-900'
                              }`}>
                              {option?.name}
                            </span>
                            <div className="flex items-center gap-3">
                              {option.price > 0 && (
                                <span className={`text-[13px] ${isDisabled ? 'text-gray-400' : 'text-gray-900'
                                  }`}>
                                  {bootstrapData?.currencyConfig?.currencySymbol}{option.price.toFixed(2)}
                                </span>
                              )}
                              <div className={`w-4 h-4 rounded-full border transition-colors ${isSelected
                                ? 'border-secondary bg-secondary transform scale-110'
                                : isEditingSelected && !selectedVariation
                                  ? 'border-secondary bg-secondary transform scale-110'
                                  : isDisabled
                                    ? 'border-gray-300 bg-gray-100'
                                    : 'border-gray-300'
                                }`}>
                                {(isSelected || (isEditingSelected && !selectedVariation)) && (
                                  <div className="w-full h-full flex items-center justify-center animate-scale-in">
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
        <div className={`flex-shrink-0 bg-white border-t border-gray-100 p-4 flex gap-3 ${(relatedCartItems?.length && !selectedOptionSetList?.length && !showVariationList && !isDecrementing) || isDecrementing ? 'hidden' : ''
          }`}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex-1 py-3 rounded-lg text-[13px] font-medium transition-colors ${step === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={(!selectedVariation && !editingVariation) || (step === 2 && !isValid) && (!editingVariation && step == 2)}
            className={`flex-1 py-3 rounded-lg text-[13px] font-medium transition-colors ${(selectedVariation && (step === 1 || isValid) || (editingVariation && step == 1))
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
import React from 'react';
import { Navigation, Clock, MapPin, Info, Store, PersonStanding as Person, ChevronDown, PenLine, MessageSquare, Ticket, ChevronRight, ArrowRight, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import { SINGLE_RESTAURANT_QUERY } from '../graphql/queries';
import HoldingTimeInfoSheet from '../components/HoldingTimeInfoSheet';
import VerificationModal from '../components/Verification/VerificationModal';
import { useCart } from '../context/CartContext';
import VariationBottomSheet from '../components/Restaurant/VariationBottomSheet';
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import { UseLocationDetails } from '../context/LocationContext';
import { RestaurantDetailMap } from '../components/Map/OpenStreetMap';
import { onClickViewDirections } from '../utils/directions';
import { useAuth } from '../context/AuthContext';
import { useBootstrap } from '../context/BootstrapContext';

const Checkout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useUser();
  const { cart, setCart, addToCart, removeFromCart, getItemCount, getCartItems } = useCart();
  const { placeOrder, loading: placeOrderLoading } = usePlaceOrder();
  const [isMobileVerified, setIsMobileVerified] = React.useState(profile?.phoneIsVerified || false);
  const [isEmailVerified, setIsEmailVerified] = React.useState(profile?.emailIsVerified || false);
  const [showMobileVerification, setShowMobileVerification] = React.useState(false);
  const [showEmailVerification, setShowEmailVerification] = React.useState(false);
  const [showHoldingTimeInfo, setShowHoldingTimeInfo] = React.useState(false);
  const [showNoteInput, setShowNoteInput] = React.useState<Record<string, boolean>>({});
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [showCookingRequests, setShowCookingRequests] = React.useState(false);
  const [cookingRequest, setCookingRequest] = React.useState('');
  const [confirmedCookingRequest, setConfirmedCookingRequest] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [isSliding, setIsSliding] = React.useState(false);
  const [slideComplete, setSlideComplete] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [slidePosition, setSlidePosition] = React.useState(0);
  const [showVariations, setShowVariations] = React.useState(false);
  const [isDecrementing, setIsDecrementing] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [showAll, setShowAll] = React.useState(false);
  const [notes, setNotes] = React.useState('')
  const location = useLocation();
  const state = location.state as { restaurantId?: string } || {};
  const restaurantId = state.restaurantId;
  const { temporaryLocation } = UseLocationDetails()
  const { bootstrapData } = useBootstrap()
  const { couponCodeId, setCouponCodeId } = useAuth()

  // Fetch restaurant data
  const { data: restaurantData, loading: restaurantLoading } = useQuery(SINGLE_RESTAURANT_QUERY, {
    variables: {
      id: restaurantId,
      restaurantId: restaurantId
    },
    skip: !restaurantId
  });

  // Get cart items for this restaurant
  const restaurantCartItems = React.useMemo(() => {
    if (!restaurantId) return [];
    return cart.filter(item => item.restaurantId === restaurantId);
  }, [cart, restaurantId]);

  const restaurant = restaurantData?.restaurant;

  const calculateSubtotal = () => {
    return restaurantCartItems.reduce((sum, item) => {
      let itemTotal = item.variationPrice * item.itemCount;
      if (item.optionSetList?.length > 0) {
        item.optionSetList.forEach(optionSet => {
          optionSet.selectedOptions.forEach((option: any) => {
            itemTotal += (option.price || 0) * item.itemCount;
          });
        });
      }
      return sum + itemTotal;
    }, 0);
  };

  const calculateDiscount = () => {
    return appliedCoupon ? 5 : 0; // Example discount
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleNoteChange = (itemIndex: number, note: string) => {
    // setCart((prev: any) => prev.map((item: any) => {
    //   if (item.itemIndex==itemIndex) {
    //     return {
    //       ...item,
    //       instructions: note
    //     };
    //   }
    //   return item;
    // }));
    setNotes(note)
  };

  const handleNoteDone = (itemIndex: string) => {

    const trimmedNote = notes?.trim();

    if (trimmedNote) {
      setCart((prev: any) => prev.map((item: any) => {
        if (item.itemIndex === itemIndex) {
          const { instructions, ...rest } = item;
          return {
            ...rest,
            instructions: trimmedNote
          };
        }
        return item;
      }));
    }
    setNotes('')
    setEditingNoteId(null);
    setShowNoteInput(prev => ({
      ...prev,
      [itemIndex]: false
    }));
  };

  const toggleNoteInput = (itemId: string, note: string) => {

    setNotes(note)

    setShowNoteInput(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleQuantityChange = (item: any, increment: boolean) => {
    if (increment) {
      if (item.variationList?.length > 1 || item.optionSetList?.length > 0) {
        setSelectedItem(item);
        setIsDecrementing(false);
        setShowVariations(true);
      } else {
        addToCart({
          ...item,
          itemCount: 1
        });
      }
    } else {
      if (getItemCount(item.foodId, item.variationId, item.restaurantId) === 1 &&
        getCartItems(item.foodId, item.restaurantId).length > 1) {
        setSelectedItem(item);
        setIsDecrementing(true);
        setShowVariations(true);
      } else {
        removeFromCart(item.foodId, item.variationId);
      }
    }
  };

  // Update verification status when profile changes
  React.useEffect(() => {
    if (profile) {
      setIsMobileVerified(profile.phoneIsVerified || false);
      setIsEmailVerified(profile.emailIsVerified || false);
    }
  }, [profile]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsSliding(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSliding || !sliderRef.current) return;
    const touch = e.touches[0];
    const slider = sliderRef.current;
    const sliderRect = slider.getBoundingClientRect();
    const maxSlide = sliderRect.width - 48; // Width minus button width

    let newPosition = touch.clientX - sliderRect.left;
    newPosition = Math.max(0, Math.min(newPosition, maxSlide));
    setSlidePosition(newPosition);

    // Only complete when fully slid (>= 98% of max)
    if (newPosition >= maxSlide * 0.98) {
      setSlideComplete(true);
      setIsSliding(false);
    }
  };

  const handleTouchEnd = () => {
    if (!slideComplete) {
      setSlidePosition(0);
    } else {
      if (!isMobileVerified) {
        // Show mobile verification first
        setShowMobileVerification(true);
      } else if (!isEmailVerified) {
        // Then show email verification
        setShowEmailVerification(true);
      } else if (!placeOrderLoading) {
        handlePlaceOrder();
      }
    }
    setIsSliding(false);
  };

  const handlePlaceOrder = async () => {
    if (!restaurantId || !profile) return;

    const orderInput = restaurantCartItems.map(item => ({
      food: item.foodId,
      quantity: item.itemCount,
      variation: item.variationName,
      addons: item.optionSetList.map(addon => ({
        _id: addon.addonId,
        options: addon.selectedOptions.map(opt => opt.id)
      })),
      specialInstructions: item.instructions || ''
    }));

    // Use dummy Berlin address
    const address = {
      label: temporaryLocation?.label || temporaryLocation?.area,
      deliveryAddress: temporaryLocation?.address,
      longitude: String(temporaryLocation?.longitude),
      latitude: String(temporaryLocation?.latitude)
    };
    const orderData = {
      restaurant: restaurantId,
      orderInput,
      paymentMethod: 'COD',
      couponCode: couponCodeId || '',
      tipping: 0,
      taxationAmount: 0, // 10% tax
      address: address,
      isPickedUp: true,
      deliveryCharges: 0,
      specialInstructions: confirmedCookingRequest
    };

    try {
      await placeOrder(orderData);
      setSlidePosition(0);
      setSlideComplete(false);
      setConfirmedCookingRequest('')
      setCookingRequest('')
      setCouponCodeId('')
      setCart((prev) => prev?.filter(prevItem => prevItem?.restaurantId !== restaurantId))
    } catch (error) {
      setSlidePosition(0);
      setSlideComplete(false);
    }
  };

  const handleMobileVerify = (mobile: string) => {
    // Only update if actually verified in profile
    if (profile?.phoneIsVerified) {
      setIsMobileVerified(true);
    }
    setShowMobileVerification(false);
    // Show email verification immediately after mobile verification
    if (!isEmailVerified) {
      setShowEmailVerification(true);
    }
  };

  const handleEmailVerify = (email: string) => {
    // Only update if actually verified in profile
    if (profile?.emailIsVerified) {
      setIsEmailVerified(true);
    }
    setShowEmailVerification(false);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setShowVariations(true);
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (!restaurantId || !restaurant || restaurantCartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={24} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add items to your cart to proceed with checkout</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-secondary text-black rounded-lg font-medium"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F8F9FA]" style={{ paddingBottom: 125 }}>
      {/* Location Section */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          {/* Time and Location */}
          <div className="mb-2">
            <div className="flex items-center  gap-2">
              <Clock size={20} className="text-gray-600" />
              <h2 className="text-md font-medium text-gray-900">{t('orderStatus.timeAndLocation')}</h2>
            </div>
          </div>

          {/* Holding Time */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-900">
                {t('orderStatus.holdingTime')}: <span className="text-gray-900 font-medium">4 {t('orderStatus.hr')}</span>
              </p>
              <button
                onClick={() => setShowHoldingTimeInfo(true)}
                className="text-sm text-[#00B37A] font-medium flex items-center gap-1"
              >
                <Info size={14} />
                <span>{t('orderStatus.whatsThis')}</span>
              </button>
            </div>
          </div>

          {/* Map Placeholder */}
          {/* <div className="h-[150px] bg-[#F3F4F6] rounded-lg mb-4" /> */}

          {temporaryLocation?.latitude && restaurantData?.restaurant?.location?.coordinates && <RestaurantDetailMap
            userLocation={{
              lat: Number(temporaryLocation?.latitude),
              lng: Number(temporaryLocation?.longitude)
            }}

            restaurantLocation={{
              lat: Number(restaurantData?.restaurant?.location?.coordinates[1]),
              lng: Number(restaurantData?.restaurant?.location?.coordinates[0])
            }}
            height={"150px"}

          />}

          {/* Restaurant Details */}
          <div className="ps-10 pb-5 border-b">
            <div className="flex items-center gap-3 mb-3 mt-8">
              {/* <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center flex-shrink-0"> */}
              <Store size={25} className="text-gray-600 " />
              {/* </div> */}
              <div className="flex-1">
                <h3 className="text-md font-medium text-gray-900">{restaurant?.name}</h3>
                <p className="text-xs text-gray-500">{restaurant.address}</p>
              </div>
            </div>
            <button
              onClick={() => onClickViewDirections(temporaryLocation, restaurantData?.restaurant?.location)}
              className="mx-auto ms-10 px-4 inline-flex items-center justify-center gap-2 py-2 border border-[#CCAD11] text-[#CCAD11] rounded-lg text-[13px] font-medium mt-2"
            >
              <Navigation size={16} />
              {t('orderStatus.getDirections')}
            </button>
          </div>
          {/* Distance */}
          <div className="flex items-center gap-3 mb-3 ms-10 mt-4">
            {/* <div className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center flex-shrink-0"> */}
            <Person size={25} className="text-gray-900" />
            {/* </div> */}
            <div>
              <p className="text-md text-black">{t('orderStatus.distance')}</p>
              <p className="text-xs font-medium text-gray-600">
                {(restaurant.distanceInMeters / 1000).toFixed(1)} {t('orderStatus.kilometers')}
              </p>
            </div>
          </div>

          {/* Saved Amount */}

        </div>
        <div className="flex items-center justify-center gap-1.5 text-sm bg-[#E6FFE6] p-2">
          <div className="flex items-center gap-1">
            <span className="text-[#00B37A]">{bootstrapData?.currencyConfig?.currencySymbol}</span>
            <span className="text-[#00B37A] font-medium">
              {restaurantCartItems.reduce((total, item) => {
                const itemSaved = ((item.variationDiscountedPrice || 0) * item.itemCount);
                const addonSaved = item.optionSetList?.reduce((sum, addon) =>
                  sum + addon.selectedOptions.reduce((optSum, opt) =>
                    optSum + ((opt.discountedPrice || 0) * item.itemCount), 0), 0) || 0;
                return total + itemSaved + addonSaved;
              }, 0).toFixed(2)}
            </span>
            <span className="text-[#00B37A]">{t('orderStatus.saved')}</span>
          </div>
          <span className="text-[#00B37A]">{t('orderStatus.onThisOrder')}</span>
        </div>
      </div>

      {/* Cart Items Section */}
      <div className="bg-white mt-4 p-4 m-3 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Your items</h2>
        <div className="space-y-6">
          {restaurantCartItems.map((item, index) => {
            const isVeg = item.dietaryType?.includes("VEG");
            return (
              <div key={index} className="border-b border-gray-100 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 border-2 ${isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
                        <div className={`w-full h-full rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      <h3 className="text-[15px] font-medium">{item.foodName}</h3>
                    </div>
                    <div className="text-[13px] text-gray-500 flex">
                      <p>{item.variationName}</p>

                    </div>

                    {item.optionSetList?.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {item.optionSetList.map((addon, idx) => {
                          const options = addon.selectedOptions;
                          const displayOptions = showAll ? options : options.slice(0, 2);
                          const hasMore = options.length > 2;
                          const optionSetTotal = options.reduce((sum, opt) => sum + (opt.price || 0), 0);

                          return (
                            <div key={idx} className="flex items-center gap-0.5">
                              {displayOptions.map((option, optIdx) => (
                                <span key={optIdx}>
                                  {option.name}
                                  {optIdx < displayOptions.length - 1 && ", "}
                                </span>
                              ))}
                              {hasMore && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAll(!showAll);
                                  }}
                                  className="text-secondary ms-2 flex items-center text-[11px] font-medium"
                                >
                                  {showAll ? <ChevronDown height={8} /> : <ChevronUp height={18} />}
                                </button>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 line-through">
                        {bootstrapData?.currencyConfig?.currencySymbol}{((item.variationPrice + item.variationDiscountedPrice +
                          (item.optionSetList?.reduce((sum, addon) =>
                            sum + addon.selectedOptions.reduce((optSum, opt) =>
                              optSum + (opt.price || 0), 0), 0) || 0)) * item.itemCount).toFixed(2)}
                      </span>
                      <span className="font-medium text-sm">
                        {bootstrapData?.currencyConfig?.currencySymbol}{((item.variationPrice +
                          (item.optionSetList?.reduce((sum, addon) =>
                            sum + addon.selectedOptions.reduce((optSum, opt) =>
                              optSum + (opt.price || 0), 0), 0) || 0)) * item.itemCount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => handleQuantityChange(item, false)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                      >
                        -
                      </button>
                      <span className="w-6 text-center">{item.itemCount}</span>
                      <button
                        onClick={() => handleQuantityChange(item, true)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customizations */}
                {item?.instructions && !showNoteInput[item.itemIndex] && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E6FFE6] flex items-center justify-center">
                      <PenLine size={12} className="text-[#00B37A]" />
                    </div>
                    <span className="text-[13px] text-[#00B37A]">Added</span>
                  </div>
                )}

                {/* Note Button/Input */}
                <div className="mt-3">
                  {showNoteInput[item.itemIndex] && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[13px] font-medium">Add Note</h4>

                      </div>
                      <textarea
                        placeholder="Add special instructions for this item..."
                        value={notes || ''}
                        onChange={(e) => handleNoteChange(item.itemIndex, e.target.value)}
                        className="w-full h-20 bg-white rounded-lg p-2 text-[13px] outline-none border border-gray-200 focus:border-secondary resize-none"
                      />
                    </div>
                  )}

                  {!item.instructions && !showNoteInput[item.itemIndex] && (
                    <button
                      onClick={() => toggleNoteInput(item.itemIndex, item?.instructions)}
                      className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <MessageSquare size={16} />
                      Add Note
                    </button>
                  )}

                  {item.instructions && !showNoteInput[item.itemIndex] && (
                    <div className="mt-2 bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                      <p className="text-[13px] text-gray-600 flex-1">{item.instructions}</p>
                      <button
                        onClick={() => toggleNoteInput(item.itemIndex, item?.instructions)}
                        className="ml-3 text-[13px] text-secondary font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {showNoteInput[item.itemIndex] && <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setNotes('')
                        setShowNoteInput((prev) => ({ ...prev, [item.itemIndex]: !prev[item.itemIndex] }))
                      }}
                      className="me-3 text-[13px] p-2 py-1 rounded-lg text-secondary border border-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleNoteDone(item.itemIndex)}
                      className="text-[13px] text-[13px] p-2 py-1 rounded-lg text-white bg-secondary"
                    >
                      Done
                    </button>

                  </div>}
                </div>

                {/* Edit button for customized items */}
                {item.customized && (
                  <button
                    onClick={() => handleEditItem(item)}
                    className="mt-3 text-sm text-secondary font-medium flex items-center"
                  >
                    Edit
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => { setCookingRequest(confirmedCookingRequest); setShowCookingRequests(true) }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium"
          >

            <>

              {confirmedCookingRequest ? (<div className="w-5 h-5 rounded-full bg-[#E6FFE6] flex items-center justify-center ml-1">
                <PenLine size={12} className="text-[#00B37A]" />
              </div>

              ) :

                <MessageSquare size={16} />}
              Cooking requests
            </>

          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium">
            <span className="text-xl">+</span>
            <span onClick={() => navigate(`/restaurant/${restaurantId}`)}>Add more items</span>
          </button>
        </div>

        {confirmedCookingRequest && !showCookingRequests && (
          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <p className="text-[13px] text-gray-600">{confirmedCookingRequest}</p>
          </div>
        )}

        {/* Cooking Requests Input */}
        {showCookingRequests && (
          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] font-medium">Add Cooking Instructions</h4>
              <div>
                <button
                  onClick={() => {

                    setCookingRequest('');
                    setShowCookingRequests(false);
                  }}
                  className="text-[13px] text-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const trimmedRequest = cookingRequest.trim();
                    setConfirmedCookingRequest(trimmedRequest);
                    setCookingRequest('');
                    setShowCookingRequests(false);
                  }}
                  className="ms-3 text-[13px] text-secondary"
                >
                  Done
                </button>
              </div>
            </div>
            <textarea
              placeholder="Add any special cooking instructions..."
              value={cookingRequest}
              onChange={(e) => setCookingRequest(e.target.value)}
              className="w-full h-20 bg-white rounded-lg p-2 text-[13px] outline-none border border-gray-200 focus:border-secondary resize-none"
            />
          </div>
        )}
      </div>

      {/* Variation Bottom Sheet */}
      {selectedItem && (
        <VariationBottomSheet
          isOpen={showVariations}
          onClose={() => setShowVariations(false)}
          itemName={selectedItem.foodName}
          isVeg={selectedItem.dietaryType?.includes("VEG")}
          restaurantId={selectedItem.restaurantId}
          foodId={selectedItem.foodId}
          existingItem={selectedItem}
          variations={restaurantData?.menu?.food?.find(food => food?._id === selectedItem?.foodId)?.variationList?.map((eachVariation, i) => ({
            _id: `${selectedItem.foodId}-${i}`,
            title: eachVariation.title,
            price: eachVariation.price,
            discountedPrice: eachVariation.discountedPrice,
            hasAddons: eachVariation.optionSetList?.length > 0,
            optionSetList: eachVariation?.optionSetList?.map((item, i) => {
              const foundOptionSet = restaurantData?.menu?.optionSetList?.find(od => od._id === item);
              return {
                ...foundOptionSet,
                optionData: foundOptionSet?.optionData?.map(od => ({
                  ...od,
                  name: restaurantData?.menu?.food?.find(food => food?._id === od?.foodId)?.name
                }))
              };
            })
          }))}
          addons={restaurantData?.menu?.optionSetList}
          onAddToCart={(cartItem) => {
            addToCart({
              ...cartItem,
              restaurantId: selectedItem.restaurantId,
              restaurantName: selectedItem.restaurantName,
              categoryId: selectedItem.categoryId || ''
            });
            // setShowVariations(false);
          }}
          isDecrementing={isDecrementing}
        />
      )}

      {/* Coupon Section */}
      <div className="bg-white mt-4 p-4 m-3 rounded-lg">
        <button
          onClick={() => navigate('/coupons', {
            state: {
              restaurantId: restaurantId
            }
          })}
          className="w-full flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFF3D0] rounded-full flex items-center justify-center">
              <Ticket size={20} className="text-secondary" />
            </div>
            <div className="text-left">
              <h3 className="text-[15px] font-medium text-gray-900">Apply Coupon</h3>
              {couponCodeId ? (
                <p className="text-xs text-[#00B37A]">Coupon {couponCodeId} applied</p>
              ) : (
                <p className="text-xs text-gray-500">Save more on your order</p>
              )}
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Payment Details */}
      <div className="bg-white mt-4 p-4 m-3 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('checkout.paymentDetails')}</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-gray-600">{t('checkout.totalItem')}</span>
            <span className="font-medium">{bootstrapData?.currencyConfig?.currencySymbol}{calculateSubtotal().toFixed(2)}</span>
          </div>

          {appliedCoupon && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#00B37A]">{t('checkout.extraDiscount')}</span>
              <span className="text-[#00B37A] font-medium">-{bootstrapData?.currencyConfig?.currencySymbol}{calculateDiscount().toFixed(2)}</span>
            </div>
          )}



          <div className="pt-3 mt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('checkout.toPay')}</span>
              <span className="text-lg font-semibold">{bootstrapData?.currencyConfig?.currencySymbol}{(calculateTotal()).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-white mt-4 p-4 m-3 rounded-lg">
        <h2 className="text-[15px] font-semibold mb-2">Cancellation Policy</h2>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          Cancellations are accepted up to 1 hour before the pickup time. Please review your order and restaurant details carefully to avoid charges
        </p>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 select-none">
        {!isMobileVerified || !isEmailVerified ? (
          <div className="space-y-3">
            {!isMobileVerified ? (
              <button
                onClick={() => setShowMobileVerification(true)}
                className="w-full py-3 bg-secondary text-black rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Verify Mobile Number
              </button>
            ) : !isEmailVerified && (
              <button
                onClick={() => setShowEmailVerification(true)}
                className="w-full py-3 bg-secondary text-black rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Verify Email Address
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-center font-bold text-lg pb-3">
              {placeOrderLoading ? 'Placing your order...' : 'Pay on pickup'}
            </p>
            <button
              onClick={handlePlaceOrder}
              disabled={placeOrderLoading}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${placeOrderLoading ? 'bg-gray-300 text-gray-500' : 'bg-[#16B364] text-white'
                }`}
            >
              {placeOrderLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Processing your order...
                </>
              ) : (
                `Place Order | ${bootstrapData?.currencyConfig?.currencySymbol} ${(calculateTotal()).toFixed(2)}`
              )}
            </button>
          </div>
        )}
      </div>

      <HoldingTimeInfoSheet
        isOpen={showHoldingTimeInfo}
        onClose={() => setShowHoldingTimeInfo(false)}
      />

      <VerificationModal
        isOpen={showMobileVerification}
        onClose={() => setShowMobileVerification(false)}
        type="mobile"
        onVerify={handleMobileVerify}
      />

      <VerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        type="email"
        onVerify={handleEmailVerify}
      />
    </div>

  );
};

export default Checkout;

import React from 'react';
import { MenuItem } from './MenuSection';
import VariationBottomSheet from './VariationBottomSheet';
import DishInfoModal from './DishInfoModal';
import { Info } from 'lucide-react';
import { useCart, CartItem } from '../../context/CartContext';

interface HorizontalMenuCardProps {
  item: MenuItem;
  fallbackImage: string;
}

const HorizontalMenuCard: React.FC<HorizontalMenuCardProps> = ({
  item,
  fallbackImage,
  optionSetList
}) => {
  const { addToCart, removeFromCart, getItemCount, getCartItems } = useCart();
  const [showVariations, setShowVariations] = React.useState(false);
  const [isDecrementing, setIsDecrementing] = React.useState(false);
  const [showDishInfo, setShowDishInfo] = React.useState(false);

  const cartItems = getCartItems(item._id, item?.restaurantId);
  const existingCartItem = cartItems[0];

  const variationId = existingCartItem?.variationId || `${item._id}-0`;
  const itemCount = getItemCount(item._id, variationId, item?.restaurantId);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      setShowDishInfo(true);
    }
  };

  const handleAddClick = () => {
    // Show bottom sheet only if there are multiple variations
    if (item.variationList?.length > 1 || item.variationList?.[0]?.optionSetList?.length > 0) {
      setIsDecrementing(false)
      setShowVariations(true);
    } else {
      // Add item with single variation
      const cartItem = {
        categoryId: item.categoryId || '',
        foodId: item._id,
        foodName: item.name,
        itemCount: itemCount + 1,
        variationId,
        variationName: item.name,
        variationPrice: item.variationList[0]?.price || 0,
        variationDiscountedPrice: item.variationList[0]?.discountedPrice || 0,
        customized: false,
        optionSetList: []
      };
      addToCart({
        ...cartItem,
        restaurantId: item.restaurantId || '',
        restaurantName: item.restaurantName || ''
      });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const items = getCartItems(item._id, item?.restaurantId);;
    if (items.length > 1) {
      setIsDecrementing(true);
      setShowVariations(true);
    } else {
      removeFromCart(item._id, variationId);
    }
  };

  // Safely get the price from variations or use a default
  const price = item.variationList?.[0]?.price || item.price || 0;
  const originalPrice = price + item.variationList?.[0]?.discountedPrice || 0;
  const isVeg = item?.dietaryType?.includes("VEG")

  return (
    <>
      <div className="w-[220px] flex-shrink-0 bg-black rounded-xl overflow-hidden relative shadow-lg group cursor-pointer" onClick={handleCardClick}>
        <div className="relative w-full">
          <img
            src={item.imageData?.images?.[0]?.url || fallbackImage}
            alt={item.name}
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          </div>

          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-4 h-4 border-2 ${isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
                <div className={`w-full h-full rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <span className="text-sm font-semibold text-white">
                {item.name}
              </span>
            </div>
            <p className="text-[11px] text-white/80 line-clamp-2">
              {item.description}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDishInfo(true);
              }}
              className="mt-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-[11px] text-white font-medium flex items-center gap-1.5 hover:bg-white/20 transition-colors"
            >
              <Info size={12} />
              View dish info
            </button>
          </div>

          {item.outOfStock && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-gray-900 font-medium text-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white">
                ₹{price}
              </span>
              {originalPrice > price && (
                <span className="text-[10px] text-white/60 line-through ml-2">₹{originalPrice}</span>
              )}
            </div>

            {itemCount > 0 ? (
              <div className="flex items-center gap-1 bg-white rounded-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(e);
                  }}
                  className="px-2 py-1 text-[15px] font-medium text-black hover:bg-gray-100 rounded-l-lg transition-colors"
                >
                  -
                </button>
                <span className="text-[13px] font-medium text-black px-2">{itemCount}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddClick();
                  }}
                  className="px-2 py-1 text-[15px] font-medium text-black hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                disabled={item?.outOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick();
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-opacity-90 transition-colors"
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>

      <VariationBottomSheet
        isOpen={showVariations}
        onClose={() => setShowVariations(false)}
        itemName={item.name}
        isVeg={isVeg}
        restaurantId={item?.restaurantId}
        foodId={item._id}
        existingItem={existingCartItem}
        variations={item.variationList.map((v, i) => ({
          _id: `${item._id}-${i}`,
          title: `${v.title}`,
          discountedPrice: v.discountedPrice,
          price: v.price,
          hasAddons: v.optionSetList?.length > 0 || false,
          optionSetList: v.optionSetList?.map(item => optionSetList?.find(osl => osl?._id == item))
        }))}
        addons={item.variationList}
        onAddToCart={(cartItem: CartItem) => {
          addToCart({
            ...cartItem,
            restaurantId: item.restaurantId || '',
            restaurantName: item.restaurantName || '',
            categoryId: item.categoryId || ''
          });
        }}
        isDecrementing={isDecrementing}
      />

      <DishInfoModal
        isOpen={showDishInfo}
        onClose={() => setShowDishInfo(false)}
        item={item}
        onAddToCart={handleAddClick}
      />
    </>
  );
};

export default HorizontalMenuCard;
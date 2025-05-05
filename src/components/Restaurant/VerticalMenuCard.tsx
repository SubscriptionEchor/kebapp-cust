import React from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { MenuItem } from './MenuSection';
import DishInfoModal from './DishInfoModal';
import VariationBottomSheet from './VariationBottomSheet';
import { useCart } from '../../context/CartContext';

interface VerticalMenuCardProps {
  item: MenuItem;
  fallbackImage: string;
}

const VerticalMenuCard: React.FC<VerticalMenuCardProps> = ({
  item,
  fallbackImage,
  optionSetList
}) => {
  const { addToCart, removeFromCart, getItemCount, getCartItems } = useCart();
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [showDishInfo, setShowDishInfo] = React.useState(false);
  const [showVariations, setShowVariations] = React.useState(false);
  const [isDecrementing, setIsDecrementing] = React.useState(false);

  const cartItems = getCartItems(item._id,item?.restaurantId);;
  const existingCartItem = cartItems[0];
  
  const variationId = existingCartItem?.variationId || `${item._id}-0`;
  const itemCount = getItemCount(item._id, variationId,item?.restaurantId);
    const isVeg=item?.dietaryType?.includes("VEG")

  const handleAddClick = () => {
    // Only show bottom sheet if there are multiple variations
    if (item.variationList?.length > 1) {
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
    
    const items =  getCartItems(item._id,item?.restaurantId);;
    if (items.length > 1) {
      setIsDecrementing(true);
      setShowVariations(true);
    } else {
      removeFromCart(item._id, variationId);
    }
  };

  return (
    <div className="flex gap-4 p-4 mb-4 bg-white">
      {/* Left Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-4 h-4 border-2 ${isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
            <div className={`w-full h-full rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <h3 className="text-[15px] font-medium text-gray-900 truncate">{item.name}</h3>
        </div>

        <div className="mb-1.5">
          <span className="text-[13px] font-medium text-gray-900">
            ₹{item.variationList[0]?.price || 0}
          </span>
           <span className="text-[10px] font-medium ms-2 line-through text-gray-400 strike">
            ₹{item.variationList[0]?.price || 0}
          </span>
        </div>

        <div className="mb-3">
          <p className={`text-[13px] text-gray-500 ${showFullDescription ? '' : 'line-clamp-2'}`}>
            {item.internalName}
          </p>
          {item.internalName.length > 50 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="flex items-center gap-0.5 text-[11px] text-gray-600 mt-1"
            >
              {showFullDescription ? (
                <>
                  Show less
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>

        <button
          onClick={() => setShowDishInfo(true)}
          className="flex items-center gap-1.5 text-[12px] bg-gray-200 rounded-full px-2 py-1 text-gray-900 transition-colors"
        >
          <span>View dish info</span>
        </button>
      </div>

      {/* Right Content */}
      <div className="relative h-[140px] ">
        <div className="relative w-[160px]">
          <img
            src={item.imageData?.images[0]?.url || fallbackImage}
            alt={item.name}
            className="w-[160px] h-[140px] object-cover rounded-lg relative"
          />
        </div>

        <button
          onClick={handleAddClick}
          disabled={item.outOfStock}
          className={`absolute left-1/2 -bottom-3 -translate-x-1/2 ${
            itemCount > 0 ? 'flex items-center gap-3 px-2' : 'px-6'
          } py-1.5 rounded-lg text-[14px] font-medium ${
            item.outOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-green-600 shadow-md '
          } transition-all`}
        >
          {item.outOfStock ? (
            'Out of stock'
          ) : itemCount > 0 ? (
            <div className="flex items-center gap-2">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(e);
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer"
              >
                -
              </div>
              <span>{itemCount}</span>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick();
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer"
              >
                +
              </div>
            </div>
          ) : (
            'ADD'
          )}
        </button>

        {item.variationList.length > 0 && (
          <div className="text-center mt-4">
            <span className="text-[11px] text-gray-500 px-2 py-0.5">
              {item.variationList.length > 1 || item.variationList[0]?.optionSetList?.length > 0 
                ? 'Customizable' 
                : ''}
            </span>
          </div>
        )}
      </div>
      
      <DishInfoModal
        isOpen={showDishInfo}
        onClose={() => setShowDishInfo(false)}
        item={item}
        onAddToCart={handleAddClick}
      />
      
      <VariationBottomSheet
        isVeg={isVeg}
         isOpen={showVariations}
      onClose={() => setShowVariations(false)}
      itemName={item.name}
      existingItem={existingCartItem}
        restaurantId={item?.restaurantId}
      foodId={item._id}
      variations={item.variationList.map((v, i) => ({
        _id: `${item._id}-${i}`,
        title: `${v.title}`,
        price: v.price,
        hasAddons: v.optionSetList?.length > 0 || false,
        optionSetList: v.optionSetList?.map(item=>optionSetList?.find(osl=>osl?._id==item))
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
    </div>
  );
};

export default VerticalMenuCard;
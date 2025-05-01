import React from 'react';
import { MenuItem } from './MenuSection';
import VariationBottomSheet from './VariationBottomSheet';

interface HorizontalMenuCardProps {
  item: MenuItem;
  fallbackImage: string;
  cartItems: Record<string, number>;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
}

const HorizontalMenuCard: React.FC<HorizontalMenuCardProps> = ({
  item,
  fallbackImage,
  onAddToCart,
  onRemoveFromCart,
  cartItems
}) => {
  const [showVariations, setShowVariations] = React.useState(false);
  const itemCount = cartItems[item._id] || 0;

  const handleAddClick = () => {
    if (item.variationList?.length > 0) {
      setShowVariations(true);
    } else {
      onAddToCart(item._id);
    }
  };

  // Safely get the price from variations or use a default
  const price = item.variationList?.[0]?.price || item.price || 0;
  const originalPrice = price + 5; // Example calculation for the original price, adjust as needed

  return (
    <>
    <div className="w-[220px] flex-shrink-0 bg-black rounded-xl overflow-hidden relative shadow-lg group" onClick={handleAddClick}>
      <div className="relative w-full">
        <img
          src={item.imageData?.images?.[0]?.url || fallbackImage}
          alt={item.name}
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          {itemCount > 0 && (
            <div className="absolute top-2 right-2 bg-secondary text-black font-medium text-xs px-2 py-1 rounded-full">
              {itemCount}x
            </div>
          )}
        </div>
        
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-4 h-4 border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
              <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <span className="text-sm font-semibold text-white">
              {item.name}
            </span>
          </div>
          <p className="text-[11px] text-white/80 line-clamp-2">
            {item.internalName}
          </p>
        </div>

        {item.outOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-gray-900 font-medium text-xs">
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
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddClick();
            }}
            disabled={item.outOfStock}
            className={`${
              itemCount > 0 
                ? 'flex items-center gap-2 px-1' 
                : 'px-2.5 py-1'
            } rounded-lg text-[10px] font-medium bg-white text-black hover:bg-opacity-90 transition-colors`}
          >
            {item.outOfStock ? (
              'Out of stock'
            ) : itemCount > 0 ? (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromCart(item._id);
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-black/10 rounded"
                >
                  -
                </button>
                <span>{itemCount}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(item._id);
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-black/10 rounded"
                >
                  +
                </button>
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>
    </div>

    <VariationBottomSheet
      isOpen={showVariations}
      onClose={() => setShowVariations(false)}
      itemName={item.name}
      variations={(item.variationList || []).map((v, i) => ({
        _id: `${item._id}-${i}`,
        title: `${item.name} - Variation ${i + 1}`,
        price: v.price,
        hasAddons: v.hasAddons || false
      }))}
      addons={item.addons}
    />
    </>
  );
};

export default HorizontalMenuCard;
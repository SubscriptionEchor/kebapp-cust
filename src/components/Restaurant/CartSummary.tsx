import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { ChevronLeft, ChevronRight, Store, ChevronUp, ChevronDown, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppRoutes } from '../../routeenums';

interface RestaurantCart {
  restaurantId: string;
  restaurantName: string;
  itemCount: number;
  total: number;
  items: any[];
}

interface CartSummaryProps {
  restaurantId?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ restaurantId }) => {
  const { cart, setCart } = useCart();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Group cart items by restaurant and calculate totals
  const restaurantCarts = React.useMemo(() => {
    // Ensure cart is an array
    const safeCart = Array.isArray(cart) ? cart : [];

    if (restaurantId) {
      // If restaurantId is provided, only show that restaurant's cart
      const items = safeCart.filter(item => item.restaurantId === restaurantId);
      if (items.length === 0) return [];

      const itemCount = items.reduce((sum, item) => sum + item.itemCount, 0);
      const total = items.reduce((sum, item) => {
        let itemTotal = item.variationPrice * item.itemCount;
        if (item.optionSetList?.length > 0) {
          item.optionSetList.forEach(optionSet => {
            optionSet.selectedOptions.forEach(option => {
              itemTotal += (option.price || 0) * item.itemCount;
            });
          });
        }
        return sum + itemTotal;
      }, 0);

      return [{
        restaurantId,
        restaurantName: items[0].restaurantName,
        itemCount,
        total,
        items
      }];
    }

    // Group items by restaurant
    const groupedItems = safeCart.reduce((groups, item) => {
      if (!groups[item.restaurantId]) {
        groups[item.restaurantId] = {
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          items: [],
          itemCount: 0,
          total: 0
        };
      }

      let itemTotal = item.variationPrice * item.itemCount;
      if (item.optionSetList?.length > 0) {
        item.optionSetList.forEach(optionSet => {
          optionSet.selectedOptions.forEach(option => {
            itemTotal += (option.price || 0) * item.itemCount;
          });
        });
      }

      groups[item.restaurantId].items.push(item);
      groups[item.restaurantId].itemCount += item.itemCount;
      groups[item.restaurantId].total += itemTotal;

      return groups;
    }, {} as Record<string, RestaurantCart>);

    return Object.values(groupedItems);
  }, [cart, restaurantId]);

  if (restaurantCarts.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + restaurantCarts.length) % restaurantCarts.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % restaurantCarts.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };
  return (
    <div
      style={{ bottom: restaurantId ? 0 : 70 }}
      className={`fixed z-50 left-0 px-3 right-0 bg-white transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[80vh]  border rounded-t-3xl pt-3' : 'max-h-[72px]'
        }`}
    >
      {isExpanded ? <button
        onClick={toggleExpand}
        className="p-3  absolute -top-14 bg-black left-[44%] hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={20} className="text-gray-100" />
      </button> : null}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cart items stacked view */}
        <div
          className="relative"
          style={{
            height: isExpanded ? `${20 + (restaurantCarts.length * 80)}px` : '80px',
            transition: 'height 300ms ease-in-out'
          }}
        >
          {/* First card (always fixed) */}
          {restaurantCarts.length > 0 && (
            <div
              onClick={toggleExpand}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-3 px-3 absolute w-full cursor-pointer"
              style={{
                bottom: 20,
                zIndex: restaurantCarts.length
              }}
            >
              <div className="flex relative items-center justify-between">
                {!isExpanded && restaurantCarts.length > 1 ? <div className="flex items-center absolute text-[10px] font-bold text-secondary bg-white z-50 shadow-sm py-2 px-3 rounded-3xl" style={{ top: -40, left: '40%' }}>
                  {isExpanded ? 'Collapse' : 'All carts'}
                  <ChevronUp width={20} height={20} />
                </div> : null}
                <div>
                  <div className="flex items-center">

                    <p className="text-sm font-bold text-gray-900">{restaurantCarts[0].restaurantName}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{restaurantCarts[0].itemCount} item(s)</p>
                </div>
                <div className="text-right flex items-center">
                  <button onClick={() => navigate(AppRoutes.CHECKOUT, { state: { restaurantId: restaurantCarts[0].restaurantId } })} className="bg-secondary p-2 rounded-lg px-3 text-xs font-semibold me-2">View Cart</button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCart(cart.filter(item => item.restaurantId !== restaurantCarts[0].restaurantId));
                    }}
                    className="bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                  {/* <p className="text-sm font-medium">{bootstrapData?.currencyConfig?.{bootstrapData?.currencyConfig?.currencySymbol}{restaurantCarts[0].total.toFixed(2)}</p> */}
                </div>
              </div>
            </div>
          )}

          {/* Additional cards (only rendered if there are more than one restaurant) */}
          {restaurantCarts.length > 1 && restaurantCarts.slice(1).map((item, index) => (
            <div
              key={index}
              onClick={toggleExpand}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-4 absolute w-full transition-all duration-300 cursor-pointer"
              style={{
                bottom: isExpanded
                  ? `${15 + (index + 1) * 80}px` // Start after the first card
                  : `${20 + (index * 10)}px`, // Peeking from behind
                zIndex: restaurantCarts.length - index - 1,
                opacity: 1,
                transition: 'bottom 300ms ease-in-out'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">

                    <p className="text-sm font-bold text-gray-900">{item.restaurantName}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.itemCount} item(s)</p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => navigate(AppRoutes.CHECKOUT, { state: { restaurantId: item.restaurantId } })}
                    className="bg-secondary p-2 rounded-lg px-3 text-xs font-semibold me-2">View Cart</button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCart(cart.filter(cartItem => cartItem.restaurantId !== item.restaurantId));
                    }}
                    className="bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
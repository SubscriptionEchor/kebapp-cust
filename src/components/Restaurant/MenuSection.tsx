import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import HorizontalMenuCard from './HorizontalMenuCard';
import VerticalMenuCard from './VerticalMenuCard';

export interface MenuItem {
  _id: string;
  name: string;
  isVeg?: boolean;
  internalName: string;
  imageData?: {
    images: {
      url: string;
    }[];
  };
  outOfStock: boolean;
  variationList: {
    price: number;
  }[];
}

interface MenuSectionProps {
  name: string;
  items: MenuItem[];
  fallbackImage: string;
  cartItems: Record<string, number>;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
  layout?: 'horizontal' | 'vertical';
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  name,
  items,
  fallbackImage,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  layout = 'horizontal'
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  console.log(cartItems,"CI")

  return (
    <div className="mb-6">
      <div className="px-4 py-3 sticky top-0 bg-white z-10">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-[15px] font-semibold text-gray-900">{name}</h2>
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-600" />
          ) : (
            <ChevronDown size={20} className="text-gray-600" />
          )}
        </button>
      </div>
      <div className={`
        ${layout === 'horizontal' ? 'overflow-x-auto no-scrollbar' : ''}
        ${isExpanded ? 'block' : 'hidden'}
        transition-all duration-300
      `}>
        <div className={`
          ${layout === 'horizontal' 
            ? 'flex gap-3 pb-4 px-4 min-w-max' 
            : 'space-y-2'
          }
        `}>
          {items.map((item) => (
            layout === 'horizontal' ? (
              <HorizontalMenuCard
                key={item._id}
                item={item}
                fallbackImage={fallbackImage}
                cartItems={cartItems}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            ) : (
              <VerticalMenuCard
                key={item._id}
                item={item}
                fallbackImage={fallbackImage}
                cartItems={cartItems}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuSection;
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
  restaurantId?: string;
  restaurantName?: string;
  categoryId?: string;
}

interface MenuSectionProps {
  name: string;
  items: MenuItem[];
  fallbackImage: string;
  layout?: 'horizontal' | 'vertical';
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  name,
  items,
  fallbackImage,
  layout = 'horizontal',
  restaurantId,
  restaurantName,
  categoryId,
  optionSetList
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Add restaurant and category info to each item
  const enrichedItems = items.map(item => ({
    ...item,
    restaurantId,
    restaurantName,
    categoryId
  }));

  return (
    <div className="mb-6">
      <div className="px-4 py-3 sticky top-0 bg-white z-40">
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
          {enrichedItems.map((item) => (
            layout === 'horizontal' ? (
              <HorizontalMenuCard
                key={item._id}
                item={item}
                fallbackImage={fallbackImage}
                optionSetList={optionSetList}
              />
            ) : (
              <VerticalMenuCard
                key={item._id}
                item={item}
                fallbackImage={fallbackImage} 
                optionSetList={optionSetList}
                
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuSection;
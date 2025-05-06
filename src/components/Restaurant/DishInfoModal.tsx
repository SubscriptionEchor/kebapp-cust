import React from 'react';
import { X } from 'lucide-react';
import { MenuItem } from './MenuSection';
import Button from '../Button';

interface DishInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  onAddToCart?: (itemId: string) => void;
}

const DishInfoModal: React.FC<DishInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  item,
  onAddToCart 
}) => {
  if (!isOpen) return null;

  // const allergens = [
  //   'Contains Gluten',
  //   'Contains Dairy',
  //   'Contains Nuts',
  //   'Contains Soy'
  // ];

  return (
    <>
      {/* Backdrop */}
      <div 
       style={{zIndex:150}} 
        className="fixed inset-0 bg-black bg-opacity-50  animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div  style={{zIndex:150}} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl  max-h-[90vh] overflow-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3 flex justify-end border-b border-gray-100">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-6">
          <img
            src={item.imageData?.images[0]?.url}
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />

          <div className="flex items-center gap-2 mb-4">
            <div className={`w-4 h-4 border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
              <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
              
            </div>
             <p className="text-gray-900">{item.name}</p>
          </div>

          <p className="text-gray-600 text-sm mb-6">{item.internalName}</p>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Allergen Information</h4>
            <ul className="space-y-2">
              {item?.allergen?.map((allergen, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                  {allergen}
                </li>
              ))}
            </ul>
          </div>

          {/* <Button
            fullWidth
            onClick={() => onAddToCart?.(item._id)}
            disabled={item.outOfStock}
          >
            {item.outOfStock ? 'Out of Stock' : `Add to Cart • ₹${item.variationList[0]?.price}`}
          </Button> */}
        </div>
      </div>
    </>
  );
};

export default DishInfoModal;
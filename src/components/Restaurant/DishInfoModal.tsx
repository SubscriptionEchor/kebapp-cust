import React from 'react';
import { X } from 'lucide-react';
import { MenuItem } from './MenuSection';
import Button from '../Button';
import { useBootstrap } from "../../context/BootstrapContext";
import celery from '../../assets/allergenSvg/celery.svg';
import crustaceans from '../../assets/allergenSvg/crustaceans.svg';
import eggs from '../../assets/allergenSvg/eggs.svg';
import fish from '../../assets/allergenSvg/fish.svg';
import gluten from '../../assets/allergenSvg/gluten.svg';
import lupin from '../../assets/allergenSvg/lupin.svg';
import milk from '../../assets/allergenSvg/milk.svg';
import molluscs from '../../assets/allergenSvg/molluscs.svg';
import mustard from '../../assets/allergenSvg/mustard.svg';
import peanuts from '../../assets/allergenSvg/peanuts.svg';
import sesameSeeds from '../../assets/allergenSvg/seeds.svg';
import soybeans from '../../assets/allergenSvg/soybeans.svg';
import sulphurDioxide from '../../assets/allergenSvg/sulphurDioxide.svg';
import treeNuts from '../../assets/allergenSvg/treeNuts.svg';

interface DishInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  onAddToCart?: (itemId: string) => void;
}

const allergenIcons: { [key: string]: string } = {
  CELERY: celery,
  CRUSTACEANS: crustaceans,
  EGGS: eggs,
  FISH: fish,
  GLUTEN: gluten,
  LUPIN: lupin,
  MILK: milk,
  MOLLUSCS: molluscs,
  MUSTARD: mustard,
  PEANUTS: peanuts,
  SESAME_SEEDS: sesameSeeds,
  SOYBEANS: soybeans,
  SULPHUR_DIOXIDE: sulphurDioxide,
  TREE_NUTS: treeNuts
};

const DishInfoModal: React.FC<DishInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  item,
  onAddToCart 
}) => {
  const { bootstrapData } = useBootstrap();
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{zIndex:150}} 
        className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{zIndex:150}} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-auto animate-slide-up">
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
              {item?.allergen?.map((allergen, index) => {
                const currentAllergen = bootstrapData?.allergens?.find((aler) => aler.enumVal === allergen);
                return (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <img src={allergenIcons[allergen]} height={40} width={40} alt={currentAllergen?.description} />
                    
                    {currentAllergen?.description}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default DishInfoModal;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const coupons = [
  {
    code: 'WEEKEND20',
    description: 'Enjoy 20% off on orders over ₹500',
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    isActive: true
  },
  {
    code: 'WEEKEND20',
    description: 'Enjoy 20% off on orders over ₹500',
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    isActive: true
  },
  {
    code: 'WEEKEND20',
    description: 'Enjoy 20% off on orders over ₹500',
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    isActive: true
  },
  {
    code: 'WEEKEND20',
    description: 'Enjoy 20% off on orders over ₹500',
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    isActive: true
  }
];

const Coupons: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-[15px] font-semibold text-gray-900 ml-2">
          Coupons
        </h1>
      </div>

      {/* Coupons List */}
      <div className="p-4 space-y-4">
        {coupons.map((coupon, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
          >
            <div className="flex p-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={coupon.image} 
                  alt={coupon.code}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 ml-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Weekend Deal 20% Off
                </h3>
                <p className="text-[13px] text-gray-600 mb-4">
                  {coupon.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-[13px] font-medium w-[48%] text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {coupon.code}
                  </div>
                  <button
                    onClick={() => {
                      if (coupon.isActive) {
                        navigate(-1);
                      }
                    }}
                    className="px-6 py-2 bg-white w-[48%] text-secondary border border-secondary rounded text-[13px] font-medium hover:bg-secondary hover:text-black transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coupons;
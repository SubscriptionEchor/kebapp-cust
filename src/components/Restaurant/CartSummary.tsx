import React from 'react';

interface CartSummaryProps {
  itemCount: number;
  total: number;
  onViewCart: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  itemCount,
  total,
  onViewCart
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {itemCount} items
          </p>
          <p className="font-medium">₹{total}</p>
        </div>
        <button 
          onClick={onViewCart}
          className="px-6 py-2 bg-secondary text-black rounded-lg font-medium"
        >
          View Cart
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  id: string;
  quantity: number;
  categoryId?: string;
  customized?: boolean;
  restaurantId?: string;
  restaurantName?: string;
  variation?: {
    id: string;
    title: string;
    price: number;
    discounted?: number;
  };
  addons?: {
    id: string;
    title: string;
    options: {
      id: string;
      title: string;
      price: number;
      optionId?: string;
    }[];
  }[];
}

interface CartContextType {
  items: Record<string, CartItem>;
  addItem: (
    itemId: string,
    variationId?: string,
    quantity?: number,
    addons?: any[],
    price?: number,
    discounted?: number,
    variationTitle?: string,
    itemName?: string,
    categoryId?: string,
    customized?: boolean,
    restaurantId?: string,
    restaurantName?: string,
    key?: string
  ) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  itemCount: (itemId: string) => number;
  totalItems: number;
  checkItemCart: (itemId: string) => { exist: boolean; key: string };
  addQuantity: (key: string, quantity?: number) => void;
  removeQuantity: (key: string, quantity?: number) => void;
}

const CartContext = createContext<CartContextType>({
  items: {},
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  itemCount: () => 0,
  totalItems: 0,
  checkItemCart: () => ({ exist: false, key: '' }),
  addQuantity: () => {},
  removeQuantity: () => {},
});

export const useCart = () => useContext(CartContext);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<Record<string, CartItem>>({});

  const addItem = (
    itemId: string,
    variationId?: string,
    quantity: number = 1,
    addons: any[] = [],
    price?: number,
    discounted?: number,
    variationTitle?: string,
    itemName?: string,
    categoryId?: string,
    customized?: boolean,
    restaurantId?: string,
    restaurantName?: string,
    key?: string
  ) => {
    setItems(prev => {
      const itemKey = key || itemId;
      const existingItem = prev[itemKey];

      const formattedAddons = addons.map(addon => ({
        id: addon._id,
        title: addon.title,
        options: addon.options.map((opt: any) => ({
          id: opt._id,
          title: opt.title,
          price: opt.price,
          optionId: opt.optionId
        }))
      }));

      return {
        ...prev,
        [itemKey]: {
          id: itemId,
          quantity: quantity,
          categoryId,
          customized,
          restaurantId,
          restaurantName,
          variation: variationId ? {
            id: variationId,
            title: variationTitle || '',
            price: price || 0,
            discounted
          } : undefined,
          addons: formattedAddons
        },
      };
    });
  };

  const checkItemCart = (itemId: string) => {
    const cartItem = Object.entries(items).find(([key, item]) => item.id === itemId);
    return {
      exist: Boolean(cartItem),
      key: cartItem ? cartItem[0] : ''
    };
  };

  const addQuantity = (key: string, quantity: number = 1) => {
    setItems(prev => {
      const item = prev[key];
      if (!item) return prev;
      return {
        ...prev,
        [key]: {
          ...item,
          quantity: item.quantity + quantity
        }
      };
    });
  };

  const removeQuantity = (key: string, quantity: number = 1) => {
    setItems(prev => {
      const item = prev[key];
      if (!item) return prev;
      
      const newQuantity = item.quantity - quantity;
      if (newQuantity <= 0) {
        const newItems = { ...prev };
        delete newItems[key];
        return newItems;
      }
      
      return {
        ...prev,
        [key]: {
          ...item,
          quantity: newQuantity
        }
      };
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const existingItem = prev[itemId];
      if (!existingItem) return prev;

      const newItems = { ...prev };
      if (existingItem.quantity <= 1) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = {
          ...existingItem,
          quantity: existingItem.quantity - 1,
        };
      }
      return newItems;
    });
  };

  const clearCart = () => {
    setItems({});
  };

  const itemCount = (itemId: string) => {
    // Check all items for matching itemId
    return Object.values(items)
      .filter(item => item.id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const totalItems = Object.values(items).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        itemCount,
        totalItems,
        checkItemCart,
        addQuantity,
        removeQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
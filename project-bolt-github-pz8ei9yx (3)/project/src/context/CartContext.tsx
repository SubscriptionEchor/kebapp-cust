import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartState, CartItem, CartContextType } from '../types/cart';

const CART_STORAGE_KEY = 'cart_data';

const initialState: CartState = [];

const CartContext = createContext<CartContextType>({
  cart: initialState,
  addToCart: () => { },
  removeFromCart: () => { },
  clearCart: () => { },
  getItemCount: () => 0,
  getCartItems: () => [],
  setCart: () => []
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartState>(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : initialState;
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        existingItem => {
          // First check basic properties match
          if (existingItem.foodId !== item.foodId ||
            existingItem.variationId !== item.variationId) {
            return false;
          }

          // If either item has no optionSetList, they only match if both have none
          if (!existingItem.optionSetList?.length || !item.optionSetList?.length) {
            return !existingItem.optionSetList?.length && !item.optionSetList?.length;
          }

          // Check if optionSetLists have same length
          if (existingItem.optionSetList.length !== item.optionSetList.length) {
            return false;
          }

          // Verify each addon and its options match exactly
          return existingItem.optionSetList.every(existingAddon => {
            const matchingAddon = item.optionSetList.find(
              addon => addon.addonId === existingAddon.addonId
            );

            if (!matchingAddon ||
              matchingAddon.selectedOptions.length !== existingAddon.selectedOptions.length) {
              return false;
            }

            // Check if all selected options match exactly
            return existingAddon.selectedOptions.every((option: any) =>
              matchingAddon.selectedOptions.includes(option)
            );
          });
        }
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...item,
          itemCount: newCart[existingItemIndex].itemCount + 1
        };
        return newCart;
      }

      return [...prevCart, item];
    });
  };

  const removeFromCart = (foodId: string, variationId: string) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(
        item => item.foodId === foodId && item.variationId === variationId
      );

      if (itemIndex === -1) return prevCart;

      const newCart = [...prevCart];
      const item = newCart[itemIndex];

      if (item.itemCount > 1) {
        // Decrease count if more than 1
        newCart[itemIndex] = {
          ...item,
          itemCount: item.itemCount - 1
        };
        return newCart;
      } else {
        // Remove item if count is 1
        newCart.splice(itemIndex, 1);
        return newCart.length === 0 ? initialState : newCart;
      }
    });
  };

  const clearCart = () => {
    setCart(initialState);
  };

  const getItemCount = (foodId: string, variationId: string, restId: string): number => {
    const items = cart.filter(item => item?.foodId === foodId && item?.restaurantId == restId);
    if (items.length > 1) {
      // If multiple variations exist, return total count
      return items.reduce((sum, item) => sum + (item?.itemCount || 0), 0);
    }
    // Otherwise return count for specific variation
    return items.find(item => item?.variationId === variationId)?.itemCount || 0;
  };

  const getCartItems = (foodId: string, restId: string) => {
    return cart.filter(item => item?.foodId === foodId && item?.restaurantId == restId);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      getItemCount,
      getCartItems,
      setCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
export interface CartItem {
  categoryId: string;
  foodId: string;
  foodName: string;
  itemCount: number;
  variationId: string;
  variationName: string;
  variationPrice: number;
  variationDiscountedPrice: number;
  customized: boolean;
  restaurantId: string;
  restaurantName: string;
  optionSetList: any[];
}

export type CartState = CartItem[];

export interface CartContextType {
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (foodId: string, variationId: string) => void;
  clearCart: () => void;
  getItemCount: (foodId: string, variationId: string, restId: string) => number;
  getCartItems: (foodId: string, restId: string) => CartItem[];
  setCart: (item: any) => void
}
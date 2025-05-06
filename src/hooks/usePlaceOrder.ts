import { useMutation } from '@apollo/client';
import { PLACE_ORDER } from '../graphql/queries';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface OrderInput {
  food: string;
  quantity: number;
  variation: string;
  addons: {
    _id: string;
    options: string[];
  }[];
  specialInstructions?: string;
}

interface AddressInput {
  label: string;
  deliveryAddress: string;
  longitude: string;
  latitude: string;
}

interface PlaceOrderVariables {
  restaurant: string;
  orderInput: OrderInput[];
  paymentMethod: string;
  couponCode?: string;
  tipping: number;
  taxationAmount: number;
  address: AddressInput;
  orderDate: string;
  isPickedUp: boolean;
  deliveryCharges: number;
}

export const usePlaceOrder = () => {
  const navigate = useNavigate();
  const [placeOrder, { loading }] = useMutation(PLACE_ORDER, {
    onCompleted: (data) => {
      if (data?.placeOrder) {
        toast.success('Order placed successfully!');
        navigate(`/order/${data.placeOrder._id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place order');
    }
  });

  const handlePlaceOrder = async (variables: PlaceOrderVariables) => {
    try {
      await placeOrder({
        variables: {
          ...variables,
          orderDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  return {
    placeOrder: handlePlaceOrder,
    loading
  };
};
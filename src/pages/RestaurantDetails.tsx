import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { useCart } from '../context/CartContext';
import { SINGLE_RESTAURANT_QUERY } from '../graphql/queries';
import LoadingAnimation from '../components/LoadingAnimation';
import RestaurantHeader from '../components/Restaurant/RestaurantHeader';
import SearchBar from '../components/Restaurant/SearchBar';
import MenuSection from '../components/Restaurant/MenuSection';

// Mock addons
const mockAddons = [
  {
    _id: 'addon1',
    title: 'Spice Level',
    minQty: 1,
    maxQty: 1,
    options: [
      { _id: 'spice1', title: 'Mild', price: 0 },
      { _id: 'spice2', title: 'Medium', price: 0 },
      { _id: 'spice3', title: 'Hot', price: 0 }
    ]
  },
  {
    _id: 'addon2',
    title: 'Extra Toppings',
    minQty: 0,
    maxQty: 2,
    options: [
      { _id: 'extra1', title: 'Extra Cheese', price: 30 },
      { _id: 'extra2', title: 'Extra Meat', price: 50 },
      { _id: 'extra3', title: 'Extra Sauce', price: 20 }
    ]
  }
];

// Mock menu data
const mockMenu = {
  categoryData: [
    {
      _id: 'cat1',
      name: 'Popular Items',
      active: true,
      foodList: ['item1', 'item2', 'item3']
    }
  ],
  food: [
    {
      // Item with single variation, no addons
      _id: 'item1',
      name: 'Classic Kebab',
      internalName: 'Traditional grilled kebab',
      isVeg: false,
      imageData: {
        images: [{ url: 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg' }]
      },
      outOfStock: false,
      variationList: [
        {
          _id: 'var1',
          title: 'Regular',
          price: 199,
          hasAddons: false
        }
      ]
    },
    {
      // Item with multiple variations, no addons
      _id: 'item2',
      name: 'Mixed Grill Platter',
      internalName: 'Assorted grilled meats',
      isVeg: false,
      imageData: {
        images: [{ url: 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg' }]
      },
      outOfStock: false,
      variationList: [
        {
          _id: 'var2',
          title: 'Small',
          price: 299,
          hasAddons: false
        },
        {
          _id: 'var3',
          title: 'Large',
          price: 499,
          hasAddons: false
        }
      ]
    },
    {
      // Item with variations and addons
      _id: 'item3',
      name: 'Special Kebab',
      internalName: 'Customizable kebab with choices',
      isVeg: false,
      imageData: {
        images: [{ url: 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg' }]
      },
      outOfStock: false,
      variationList: [
        {
          _id: 'var4',
          title: 'Regular',
          price: 249,
          hasAddons: true,
          addons: mockAddons
        },
        {
          _id: 'var5',
          title: 'Family Pack',
          price: 449,
          hasAddons: true,
          addons: mockAddons
        }
      ]
    }
  ]
};


const RestaurantDetails: React.FC = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isNonVegOnly, setIsNonVegOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { itemCount, addItem, removeItem } = useCart();

  const { loading, error, data } = useQuery(SINGLE_RESTAURANT_QUERY, {
    variables: {
      id,
      restaurantId: id
    },
    skip: !id
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  if (error || !data?.restaurant) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load restaurant details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <RestaurantHeader
        id={data.restaurant._id}
        name={data.restaurant.name}
        rating={data.restaurant.reviewAverage || 0}
        reviews={data.restaurant.reviewCount || 0}
        distance={data.restaurant.distanceInMeters}
        address={data.restaurant.address}
        initialLikeCount={data.restaurant.favoriteCount || 0}
      />
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        isVegOnly={isVegOnly}
        onVegToggle={() => {
          setIsVegOnly(!isVegOnly);
          if (!isVegOnly) setIsNonVegOnly(false);
        }}
        isNonVegOnly={isNonVegOnly}
        onNonVegToggle={() => {
          setIsNonVegOnly(!isNonVegOnly);
          if (!isNonVegOnly) setIsVegOnly(false);
        }}
        selectedTags={selectedTags}
        onTagSelect={(tag) => {
          setSelectedTags(prev =>
            prev.includes(tag)
              ? prev.filter(t => t !== tag)
              : [...prev, tag]
          );
        }}
      />
        
      {/* Menu Sections */}
      <div className="mt-4">
        {mockMenu.categoryData
          ?.filter((category: any) => category.active)
          .map((category: any, index: number) => {
            const categoryItems = category.foodList
              ?.map((foodId: string) => 
                mockMenu.food?.find((f: any) => f._id === foodId)
              )
              .filter(Boolean);

            return (
              <MenuSection
                key={category._id}
                name={category.name}
                items={categoryItems}
                fallbackImage={data.restaurant.image}
                cartItems={Object.fromEntries(
                  categoryItems.map(item => [item._id, itemCount(item._id)])
                )}
                onAddToCart={addItem}
                onRemoveFromCart={removeItem}
                layout={index === 0 ? 'horizontal' : 'vertical'}
              />
            );
          })}
      </div>
    </div>
  );
};

export default RestaurantDetails;
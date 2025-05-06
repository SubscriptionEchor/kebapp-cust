import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Store, ChevronDown, ChevronUp, Edit2, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

// Mock data
const mockOrders = [
  {
    id: 'QMQPI-58',
    status: 'PENDING',
    date: '2024-02-16T16:15:00',
    restaurant: {
      name: 'Gasthaus Kater Alex',
      image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    },
    items: [
      {
        name: 'Special chicken kebab',
        quantity: 1,
        variation: 'Large',
        addons: [
          {
            name: 'Sauces',
            options: ['Garlic Mayo', 'Chili Sauce']
          },
          {
            name: 'Extras',
            options: ['Extra Cheese', 'Grilled Vegetables']
          }
        ]
      },
      {
        name: 'Chicken kebab',
        quantity: 2,
        variation: 'Regular',
        addons: [
          {
            name: 'Sauces',
            options: ['Garlic Mayo']
          }
        ]
      }
    ],
    total: 29.70,
    itemCount: 3
  },
  {
    id: 'QMQPI-57',
    status: 'DELIVERED',
    date: '2024-02-15T14:30:00',
    restaurant: {
      name: 'Gasthaus Kater Alex',
      image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    },
    items: [
      {
        name: 'Special chicken kebab',
        quantity: 1,
        variation: 'Large',
        addons: [
          {
            name: 'Sauces',
            options: ['Garlic Mayo', 'Chili Sauce']
          }
        ]
      },
      {
        name: 'Chicken kebab',
        quantity: 2,
        variation: 'Regular'
      }
    ],
    total: 29.70,
    itemCount: 3,
    hasRated: false
  },
  {
    id: 'QMQPI-56',
    status: 'COMPLETED',
    date: '2024-02-14T19:45:00',
    restaurant: {
      name: 'Gasthaus Kater Alex',
      image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    },
    items: [
      {
        name: 'Special chicken kebab',
        quantity: 1,
        variation: 'Large'
      },
      {
        name: 'Chicken kebab',
        quantity: 2,
        variation: 'Regular'
      }
    ],
    total: 29.70,
    itemCount: 3,
    rating: 4.5
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-50 text-yellow-700';
    case 'DELIVERED':
      return 'bg-green-50 text-green-700';
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

const Orders: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [showReviewInput, setShowReviewInput] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (orderId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleRatingHover = (orderId: string, rating: number) => {
    setHoveredRatings(prev => ({
      ...prev,
      [orderId]: rating
    }));
  };

  const handleRatingClick = (orderId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [orderId]: rating
    }));
    setShowReviewInput(prev => ({
      ...prev,
      [orderId]: true
    }));
  };

  const handleReviewSubmit = (orderId: string) => {
    const rating = ratings[orderId];
    const review = reviews[orderId];
    
    // Here you would make your API call to submit the rating and review
    console.log('Submitting:', { orderId, rating, review });
    
    // Update local state
    mockOrders.find(order => order.id === orderId)!.hasRated = true;
    mockOrders.find(order => order.id === orderId)!.rating = rating;
    
    // Clear states
    setShowReviewInput(prev => ({ ...prev, [orderId]: false }));
  };

  return (
    <Layout title={t('screenTitle.orderHistory')}>
      <div className="space-y-4">
        {mockOrders.map((order) => (
          <div 
            key={order.id}
            className="bg-white rounded-lg overflow-hidden border border-gray-100"
          >
            {/* Order Header with ID and Status */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-900">
                    Ref #{order.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {moment(order.date).format('MMM DD, hh:mm A')}
                </span>
              </div>

              {/* Restaurant Name */}
              <h3 className="text-[15px] font-medium text-gray-900 mb-3">
                {order.restaurant.name}
              </h3>

              {/* Items List */}
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="text-[13px] text-gray-600">
                    {item.quantity}x {item.name}
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{order.itemCount} items</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">€{order.total.toFixed(2)}</span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">Saved €4.45</span>
                </div>
              </div>
            </div>

            {/* Rating Section for Delivered Orders */}
            {order.status === 'DELIVERED' && !order.hasRated && (
              <div className="p-4 ">
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => handleRatingHover(order.id, star)}
                        onMouseLeave={() => handleRatingHover(order.id, 0)}
                        onClick={() => handleRatingClick(order.id, star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star 
                          size={28}
                          className={`transition-colors ${
                            star <= (hoveredRatings[order.id] || ratings[order.id] || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  
                  {showReviewInput[order.id] && (
                    <div className="w-full space-y-3">
                      <textarea
                        value={reviews[order.id] || ''}
                        onChange={(e) => setReviews(prev => ({
                          ...prev,
                          [order.id]: e.target.value
                        }))}
                        placeholder="Share your experience..."
                        className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-secondary resize-none"
                      />
                      <button
                        onClick={() => handleReviewSubmit(order.id)}
                        className="w-full py-2.5 bg-secondary text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        Submit Review
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show Rating if Already Rated */}
            {order.status === 'DELIVERED'&&order.rating && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      size={20}
                      className={star <= order.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {mockOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Store size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-4">When you place orders, they will appear here</p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-secondary text-black rounded-lg text-sm font-medium"
            >
              Browse Restaurants
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
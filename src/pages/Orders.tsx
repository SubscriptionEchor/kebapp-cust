import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Store, ChevronDown, ChevronUp, Edit2, Send } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ORDERS, REVIEW_ORDER } from '../graphql/queries';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { useBootstrap } from '../context/BootstrapContext';
import toast from 'react-hot-toast';
import { AppRoutes } from '../routeenums';

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
  const { loading, error, data, refetch } = useQuery(GET_ORDERS);
  // const orders = data?.orders || [];
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [showReviewInput, setShowReviewInput] = useState<Record<string, boolean>>({});
  const optionsRef = useRef<HTMLDivElement>(null);
  const { bootstrapData } = useBootstrap()
  const [REVIEWORDER] = useMutation(REVIEW_ORDER);
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [orders, setOrders] = useState([])


  useEffect(() => {
    const interval = setInterval(() => {
      if (orders.some(order => order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED')) {
        refetch(); // Poll the API if at least one order is not delivered or cancelled
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [orders, refetch]);

  useEffect(() => {
    if (data?.orders) {
      setOrders(data?.orders)
    }

  }, [data])

  if (loading) {
    return (
      <Layout title={t('screenTitle.orderHistory')}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (orderId: string) => {
    if (!orderId) {
      return toast.error("Invalid order id");
    }
    if (!ratings[orderId] || ratings[orderId] < 1) {
      return toast.error("Please add at least 1 rating");
    }

    setIsSubmitted(true); // Show loader
    try {
      const { data } = await REVIEWORDER({
        variables: {
          reviewInput: {
            description: reviews[orderId] || "",
            order: orderId,
            rating: ratings[orderId],
          },
        },
      });
      if (data) {
        toast.success("Thank you for sharing your review");
        setShowReviewInput((prev) => ({ ...prev, [orderId]: false }));
        setRatings((prev) => ({ ...prev, [orderId]: 0 }));
        setReviews((prev) => ({ ...prev, [orderId]: "" }));

        // Update the order's review locally to show the rating in the card
        const updatedOrders = orders.map((order) =>
          order._id === orderId
            ? {
              ...order,
              review: {
                rating: ratings[orderId]
              }
            }
            : order
        );
        setOrders(updatedOrders);
      } else {
        toast.error("Failed to submit review");
      }
    } catch (error) {
      toast.error("An error occurred while submitting your review");
    } finally {
      setIsSubmitted(false); // Hide loader
    }
  };

  console.log(orders, "ss's")

  return (
    <Layout title={t('screenTitle.orderHistory')}>
      <div className="space-y-4 pb-20">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
            onClick={() => navigate(AppRoutes.ORDER, {
              state: {
                id: order._id,
                type: "history"
              }
            })}
          >
            {/* Order Header with ID and Status */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-900">
                    #{order.orderId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {moment(order.orderDate).format('MMM DD, hh:mm A')}
                </span>
              </div>

              {/* Restaurant Name */}
              <h3 className="text-[15px] font-medium text-gray-900 mb-3">
                {order.restaurant?.name}
              </h3>

              {/* Items List */}
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="text-[13px] text-gray-600">
                    {item.quantity}x {item.title}
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{order.items?.length} items</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">
                    {bootstrapData?.currencyConfig?.currencySymbol}{order.orderAmount?.toFixed(2)}
                  </span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                    {order.taxationAmount > 0 && `Saved ${bootstrapData?.currencyConfig?.currencySymbol} ${order.taxationAmount?.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Section for Delivered Orders */}
            {order.orderStatus === 'DELIVERED' && !order.review && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() =>
                          setHoveredRatings((prev) => ({ ...prev, [order._id]: star }))
                        }
                        onMouseLeave={() =>
                          setHoveredRatings((prev) => ({ ...prev, [order._id]: 0 }))
                        }
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [order._id]: star })) ||
                          setShowReviewInput((prev) => ({ ...prev, [order._id]: true }))
                        }
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${star <=
                            (hoveredRatings[order._id] || ratings[order._id] || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      </button>
                    ))}
                  </div>

                  {showReviewInput[order._id] && (
                    <div className="w-full space-y-3">
                      <textarea
                        value={reviews[order._id] || ''}
                        onChange={(e) =>
                          setReviews((prev) => ({
                            ...prev,
                            [order._id]: e.target.value,
                          }))
                        }
                        placeholder="Share your experience..."
                        className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-secondary resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSubmit(order._id)}
                          className="flex-1 py-2.5 bg-secondary text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {isSubmitted ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                          ) : (
                            <>
                              Submit Review
                              <Send size={16} />
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowReviewInput((prev) => ({
                              ...prev,
                              [order._id]: false,
                            }));
                            setRatings((prev) => ({
                              ...prev,
                              [order._id]: 0,
                            }));
                            setReviews((prev) => ({
                              ...prev,
                              [order._id]: '',
                            }));
                          }}
                          className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {order.orderStatus === 'DELIVERED' && order.review?.rating && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={
                        star <= order.review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Store size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-4">When you place orders, they will appear here</p>
            <button
              onClick={() => navigate(AppRoutes.HOME)}
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
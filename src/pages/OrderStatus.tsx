import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ShoppingBag, ChefHat, Utensils, PackageCheck, ThumbsUp, XCircle, Store, PersonStanding, ChevronDown, ChevronUp, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from '@apollo/client';
import { GET_ORDER } from '../graphql/queries';
import LoadingAnimation from '../components/LoadingAnimation';
import { onClickViewDirections } from '../utils/directions';
import { UseLocationDetails } from '../context/LocationContext';
import { RestaurantDetailMap } from '../components/Map/OpenStreetMap';
import Review from './Review';
import toast from 'react-hot-toast';
import { useBootstrap } from '../context/BootstrapContext';


const ORDER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PREPARED: 'PREPARED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: {
    icon: ShoppingBag,
    title: 'Order Placed',
    description: 'Thank you! Your order has been received and is awaiting confirmation.',
    color: '#00B37A'
  },
  [ORDER_STATUS.ACCEPTED]: {
    icon: ChefHat,
    title: 'Order Accepted',
    description: 'Restaurant has accepted your order and your order is being prepared with care.',
    color: '#00B37A'
  },
  [ORDER_STATUS.PREPARED]: {
    icon: Utensils,
    title: 'Prepared',
    description: 'Your order preparation completed.',
    color: '#00B37A'
  },
  [ORDER_STATUS.DELIVERED]: {
    icon: PackageCheck,
    title: 'Delivered',
    description: 'Order delivered successfully.',
    color: '#00B37A'
  },
  [ORDER_STATUS.CANCELLED]: {
    icon: XCircle,
    title: 'Cancelled',
    description: 'Order cancelled.',
    color: '#EF4444'
  }
};

const STATUS_ORDER = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARED,
  ORDER_STATUS.DELIVERED
];

const OrderStatus: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showHoldingTimeInfo, setShowHoldingTimeInfo] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [showRefIdSheet, setShowRefIdSheet] = useState(false);
  const { temporaryLocation } = UseLocationDetails()
  const [status, setStatus] = useState('')
  const { bootstrapData } = useBootstrap()

  let totalDiscount = 0

  console.log(state, "state")

  const { loading, error, data, stopPolling } = useQuery(GET_ORDER, {
    variables: { orderId: state?.id },
    pollInterval: 10000,
    skip: !state?.id
  });

  useEffect(() => {
    if (state?.type == "history") {
      return
    }
    const currentStatus = data?.order?.orderStatus;
    setStatus(currentStatus);

    if (currentStatus === ORDER_STATUS.CANCELLED || currentStatus === ORDER_STATUS.DELIVERED) {
      stopPolling();
      if (currentStatus === ORDER_STATUS.CANCELLED) {
        toast.error("sorry for the inconvinience. Your order has been cancelled")
        setTimeout(() => {
          toast.error("Navigating back to home page")
          navigate('/home', { replace: true })
        }, 5000)
      }
    }
  }, [data, stopPolling, state?.type]);

  const currentStatus = data?.order?.orderStatus || ORDER_STATUS.PENDING;
  console.log(currentStatus, "CS")
  const statusConfig = STATUS_CONFIG[currentStatus];
  const statusIndex = STATUS_ORDER.indexOf(currentStatus);
  const progress = (statusIndex / (STATUS_ORDER.length - 1)) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingAnimation />
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load order details</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-secondary text-black rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const order = data.order;
  console.log(OrderStatus, ORDER_STATUS?.DELIVERED)
  if (currentStatus === ORDER_STATUS?.DELIVERED && state?.type !== "history") {
    return <Review restaurant={{
      ...order?.restaurant,
      orderId: order?._id
    }
    } />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Order #{order?.orderId}</h1>

        <div className="mt-6 mb-4">
          <div className="flex items-center gap-3">
            {React.createElement(statusConfig.icon, {
              size: 20,
              className: `text-[${statusConfig.color}]`
            })}
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">
                {statusConfig.title}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {statusConfig.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 relative">
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-gray-200">
            <motion.div
              className={`h-full bg-[${statusConfig.color}]`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <div className="relative flex justify-between px-4">
            {STATUS_ORDER.map((status, index) => {
              const isComplete = index <= statusIndex;
              const isCurrent = index === statusIndex;
              const config = STATUS_CONFIG[status];

              return (
                <div
                  key={index}
                  className={`flex flex-col items-center ${isComplete ? `text-[${config.color}]` : 'text-gray-400'
                    }`}
                  style={{ width: '20%' }}
                >
                  <div className="relative">
                    {isCurrent && (
                      <motion.div
                        className={`absolute -inset-3 rounded-full opacity-20`}
                        style={{ backgroundColor: config.color }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center`}
                      style={{
                        backgroundColor: isComplete ? config.color : '#E5E7EB',
                        color: isComplete ? 'white' : '#9CA3AF'
                      }}
                      initial={false}
                      animate={{
                        scale: isCurrent ? [1, 1.1, 1] : 1,
                        rotate: isCurrent ? [0, 10, -10, 0] : 0
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                        repeat: isCurrent ? Infinity : 0,
                        repeatDelay: 1
                      }}
                    >
                      {isComplete && !isCurrent ? (
                        <Check size={20} />
                      ) : (
                        React.createElement(config.icon, { size: 20 })
                      )}
                    </motion.div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {temporaryLocation?.latitude && order?.restaurant?.location?.coordinates && <RestaurantDetailMap
          userLocation={{
            lat: Number(temporaryLocation?.latitude),
            lng: Number(temporaryLocation?.longitude)
          }}

          restaurantLocation={{
            lat: Number(order?.restaurant?.location?.coordinates[1]),
            lng: Number(order?.restaurant?.location?.coordinates[0])
          }}
          height={"150px"}

        />}
        {/* Section 2: Restaurant Details */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">In-restaurant pick-up</h2>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Store size={20} className="text-gray-600" />
            </div>

            <div className="flex-1">
              <div className="mb-3">
                <h3 className="text-[15px] font-medium text-gray-900">{order.restaurant.name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">{order.restaurant.address}</p>
              </div>

              {/* <div className=" gap-2">
                <button className="px-4 py-2 bg-white text-[13px] text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Contact Deatils
                </button>
                <p></p>
              </div> */}
              <button
                onClick={() => onClickViewDirections(temporaryLocation, data?.order?.restaurant?.location)}
                className="mx-auto px-4 inline-flex items-center justify-center gap-2 py-2 border border-[#CCAD11] text-[#CCAD11] rounded-lg text-[13px] font-medium mt-2"
              >
                <Navigation size={16} />
                {t('orderStatus.getDirections')}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <PersonStanding size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-[13px] text-gray-900">Distance</p>
              <p className="text-xs text-gray-600 mt-0.5">{(order.restaurant.distanceInMeters / 1000).toFixed(1)} kilometers</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Reference ID</h3>
              <p className="text-[13px] text-green-600 mt-1">{order.orderId}</p>
            </div>
          </div>
        </div>

        {/* Section 3: Order Items and Billing */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[13px] text-gray-900">
                {t('orderStatus.holdingTime')}:
              </p>
              <p className="text-[13px] text-red-500 font-medium">
                4 hrs
              </p>
            </div>
            <button
              onClick={() => setShowHoldingTimeInfo(true)}
              className="text-[13px] text-[#00B37A] font-medium ml-1"
            >
              {t('orderStatus.whatsThis')}
            </button>
          </div>

          <h2 className="text-[15px] font-semibold text-gray-900">Your Items</h2>
          <div className="space-y-3 mt-4">
            {order.items.map((item, index) => {
              totalDiscount += (item.variation.discountedPrice || 0) * item.quantity
              return (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[13px] text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description || ''}</p>

                  </div>
                  <div className="text-right">
                    <span className="text-[13px] font-medium">
                      {bootstrapData?.currencyConfig?.currencySymbol}{(((item.variation?.price || 0) + (item.addons?.reduce((sum, addon) =>
                        sum + addon.options.reduce((optSum, opt) => optSum + (opt.price || 0), 0), 0) || 0)) * item.quantity).toFixed(2)}
                    </span>
                    {item.variation?.discountedPrice > 0 && (
                      <p className="text-xs text-green-600">
                        Saved {bootstrapData?.currencyConfig?.currencySymbol}{((item.variation.discountedPrice) * item.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div
              role="button"
              onClick={() => setShowBillingDetails(!showBillingDetails)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <span className="text-[15px] font-medium">Billing info</span>
              {showBillingDetails ? (
                <ChevronUp size={18} className="text-gray-500" />
              ) : (
                <ChevronDown size={18} className="text-gray-500" />
              )}
            </div>

            <AnimatePresence>
              {showBillingDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between text-[13px] text-gray-900">
                      <span>Item total</span>
                      <span>{bootstrapData?.currencyConfig?.currencySymbol}{(order.orderAmount - order.taxationAmount).toFixed(2)}</span>
                    </div>
                    {/* <div className="flex justify-between text-[13px] text-gray-900">
                      <span>Restaurant tip</span>
                      <span>{bootstrapData?.currencyConfig?.{bootstrapData?.currencyConfig?.currencySymbol}{order.tipping.toFixed(2)}</span>
                    </div> */}
                    {/* <div className="flex justify-between text-[13px] text-gray-900">
                      <span>Platform fee</span>
                      <span>{bootstrapData?.currencyConfig?.{bootstrapData?.currencyConfig?.currencySymbol}{order.deliveryCharges.toFixed(2)}</span>
                    </div> */}
                    <div className="flex justify-between text-[13px] font-medium text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <div className="text-right">
                        <p>{bootstrapData?.currencyConfig?.currencySymbol}{order.orderAmount.toFixed(2)}</p>
                        <p className="text-[11px] text-green-600 font-normal">
                          {bootstrapData?.currencyConfig?.currencySymbol}{totalDiscount.toFixed(2)} saved on this order
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showBillingDetails && (
              <div className="mt-3 flex justify-between items-end">
                <span className="text-[13px] text-gray-900">Total</span>
                <div className="text-right">
                  <p className="text-[13px] font-medium text-gray-900">{bootstrapData?.currencyConfig?.currencySymbol}{order?.orderAmount?.toFixed(2)}</p>
                  <p className="text-[11px] text-green-600">
                    {bootstrapData?.currencyConfig?.currencySymbol}{totalDiscount?.toFixed(2)} saved on this order
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
          <p className="text-[13px] text-gray-600">
            Cancellations are accepted up to 1 hour before the pickup time. Please review your order and restaurant details carefully to avoid charges.
          </p>
        </div>


        {/* Holding Time Info Modal */}
        {showHoldingTimeInfo && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setShowHoldingTimeInfo(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up">
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setShowHoldingTimeInfo(false)}
                  className="text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-4 pb-6">
                <p className="text-[13px] text-gray-900 leading-relaxed mb-6">
                  {t('orderStatus.warningText1')}
                </p>
                <p className="text-[13px] text-gray-900 leading-relaxed mb-8">
                  {t('orderStatus.warningText2')}
                </p>
                <button
                  onClick={() => setShowHoldingTimeInfo(false)}
                  className="w-full py-3 bg-[#00B37A] text-white rounded-lg text-[13px] font-medium"
                >
                  {t('orderStatus.okButton')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
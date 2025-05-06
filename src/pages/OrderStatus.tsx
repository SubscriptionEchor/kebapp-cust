import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ShoppingBag, ChefHat, Utensils, Package, ThumbsUp, XCircle, Store, PersonStanding, ChevronDown, ChevronUp,X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderStatus: React.FC = () => {
  const { t } = useTranslation();
  const [currentStatus, setCurrentStatus] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [showHoldingTimeInfo, setShowHoldingTimeInfo] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [showRefIdSheet, setShowRefIdSheet] = useState(false);

  const orderItems = [
    {
      name: "Special Chicken Kebab",
      description: "Choice Extra Cheese, Choice Chicken, Extra",
      price: 20
    },
    {
      name: "Special Chicken Kebab",
      description: "Choice Extra Cheese, Choice Chicken",
      price: 20
    },
    {
      name: "Special Chicken Kebab",
      description: "Choice Extra Cheese",
      price: 20
    },
    {
      name: "Special Chicken Kebab",
      description: "Choice Extra Cheese",
      price: 20
    }
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
  const savedAmount = 45;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  
  const baseStatuses = [
    {
      title: 'Order Placed',
      description: 'Thank you! Your order has been received and is awaiting confirmation.',
      icon: ShoppingBag
    },
    {
      title: 'Order Accepted',
      description: 'Great news! The restaurant has accepted your order.',
      icon: ChefHat
    },
    {
      title: 'In Preparation',
      description: 'Your order is being prepared with care.',
      icon: Utensils
    },
    {
      title: 'Ready for Pickup',
      description: 'Your order is ready! You can pick it up now.',
      icon: Package
    },
    {
      title: 'Delivered',
      description: 'Enjoy your meal! Thank you for ordering.',
      icon: ThumbsUp
    }
  ];

  const cancelledStatus = {
    title: 'Cancelled',
    description: 'Order cancelled due to no pickup within 2 hours.',
    icon: XCircle
  };

  const rejectedStatus = {
    title: 'Order Rejected',
    description: 'Restaurant has rejected your order.',
    icon: XCircle
  };

  const statuses = isCancelled ? [...baseStatuses.slice(0, 4), cancelledStatus] : baseStatuses;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatus((prev) => {
        // Simulate order rejection at second status
        if (prev === 3) {
          // setIsRejected(true);
          clearInterval(interval);
          return prev;
        }
        // Continue if not rejected
        else if (prev < 3 && !isRejected) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Start 2-hour timer when order is ready for pickup
  useEffect(() => {
    if (currentStatus === 3) {
      // Set initial time to 2 hours in seconds
      setTimeLeft(1 *1 * 1);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            setIsCancelled(true);
            setCurrentStatus(4); // Move to cancelled state
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStatus]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Order placed successfully</h1>

        {/* Current Status Text */}
        <div className="mt-6 mb-4">
          <div className="flex items-center gap-3">
            {React.createElement(statuses[currentStatus].icon, { 
              size: 20,
              className: isCancelled || isRejected ? "text-red-500" : "text-[#00B37A]"
            })}
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">
                {isRejected ? rejectedStatus.title : statuses[currentStatus].title}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {isRejected ? rejectedStatus.description : statuses[currentStatus].description}
              </p>
              
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 relative ">
          {/* Progress Line */}
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-gray-200">
            <div 
              className={`h-full transition-all duration-300 ease-in-out ${isRejected ? 'bg-red-500' : 'bg-[#00B37A]'}`}
              style={{ width: isRejected ? '25%' : `${((currentStatus-(isCancelled?1:0)) / (statuses.length - 1)) * 100}%` }}
            />
            {isCancelled && (
              <div 
                className="h-full absolute -top-0  right-0 bg-red-500 transition-all duration-300"
                style={{ width: '25%' }}
              />
            )}
          </div>

          {/* Status Points */}
          <div className="relative flex justify-between px-4">
            {baseStatuses.slice(0, isCancelled ? 4 : undefined).map((status, index) => (
              <div 
                key={index}
                className={`flex flex-col items-center ${
                  index <= currentStatus
                    ? (isCancelled && index === currentStatus)
                      ? 'text-red-500'
                      : 'text-[#00B37A]'
                    : 'text-gray-400'
                }`}
                style={{ width: '20%' }}
              >
                <div
                  className="relative"
                >
                  {/* Outer glowing circle for current status */}
                  {((isRejected && index === 1) || (!isRejected && index === currentStatus)) && (
                    <div className={`absolute -inset-3 rounded-full opacity-20 animate-pulse ${
                      isRejected ? 'bg-red-500' : 'bg-[#00B37A]'
                    }`} />
                  )}
                  
                  {/* Main status circle */}
                  <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRejected && index > 1 
                      ? 'bg-gray-200 text-gray-400'
                      : isRejected && index === 1
                        ? 'bg-red-500 text-white'
                        : (index <= currentStatus && !isCancelled) || (isCancelled && index === currentStatus)
                          ? isCancelled 
                            ? 'bg-red-500 text-white' 
                            : 'bg-[#00B37A] text-white'
                        : 'bg-[#00B37A] text-white'
                  }`}
                  >
                  {(index < currentStatus && !isRejected) || (isRejected && index < 1) ? (
                    <Check size={20} />
                  ) : (
                    <AnimatePresence>
                      {index === currentStatus ? (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}>
                          {React.createElement(isRejected ? rejectedStatus.icon : statuses[index].icon, { size: 20 })}
                        </motion.div>
                      ) : (
                        React.createElement(statuses[index].icon, { 
                          size: 20, 
                          className: isRejected && index > 1 ? "text-gray-400" : "text-current"
                        })
                      )}
                    </AnimatePresence>
                  )}
                  </div>
                </div>
              </div>
            ))}
            {/* Cancelled Status */}
            {isCancelled && (
              <div 
                className="flex flex-col items-center text-red-500"
                style={{ width: '20%' }}
              >
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-red-500 opacity-20 animate-pulse" />
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white"
                  >
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <XCircle size={20} />
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Restaurant Details */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">In-restaurant pick-up</h2>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Store size={20} className="text-gray-600" />
            </div>
            
            <div className="flex-1">
              <div className="mb-3">
                <h3 className="text-[15px] font-medium text-gray-900">Gasthaus Kater Alex</h3>
               
                
              
                <p className="text-[13px] text-gray-500 mt-1">Kaiser Place 123 Place Road, Downtown, Berlin, Germany, 10115</p>
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white text-[13px] text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Contact restaurant
                </button>
                <button className="px-4 py-2 bg-white text-[13px] text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Get directions
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <PersonStanding size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-[13px] text-gray-900">Distance</p>
              <p className="text-xs text-gray-600 mt-0.5">17 kilometers</p>
            </div>
          </div>
       
          <div className="flex items-center gap-4 mt-4 justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Reference ID</h3>
                <p className="text-[13px] text-green-600 mt-1">QMQPI-58</p>
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
          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h3 className="text-[13px] text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <span className="text-[13px] font-medium">€{item.price.toFixed(2)}</span>
              </div>
            ))}
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
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-gray-900">
                      <span>Restaurant tip</span>
                      <span>€45.00</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-gray-900">
                      <span>Platform fee</span>
                      <span>€45.00</span>
                    </div>
                    <div className="flex justify-between text-[13px] font-medium text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <div className="text-right">
                        <p>€297.00</p>
                        <p className="text-[11px] text-green-600 font-normal">
                          €45 saved on this order
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
                  <p className="text-[13px] font-medium text-gray-900">€297.00</p>
                  <p className="text-[11px] text-green-600">
                    €45 saved on this order
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

        {/* Reference ID Section - Show when order is completed */}

       

        {/* Reference ID Validation Sheet */}
        {showRefIdSheet && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setShowRefIdSheet(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up">
              <div className="flex justify-end p-4">
                <button 
                  onClick={() => setShowRefIdSheet(false)}
                  className="text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-4 pb-6">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Validate Order</h3>
                <p className="text-[13px] text-gray-600 mb-6">
                  Show this reference ID to the restaurant staff to validate your order:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center">
                  <p className="text-2xl font-bold text-gray-900">QMQPI-58</p>
                </div>
                <button
                  onClick={() => setShowRefIdSheet(false)}
                  className="w-full py-3 bg-[#00B37A] text-white rounded-lg text-[13px] font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}

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
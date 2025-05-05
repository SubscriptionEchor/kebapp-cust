import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ChevronLeft, Star, Heart, Clock, MapPin, Users, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFavorite } from '../hooks/useFavorite';
import { SINGLE_RESTAURANT_QUERY } from '../graphql/queries';
import LoadingAnimation from '../components/LoadingAnimation';

const HEADER_HEIGHT = 250;
const SCROLL_THRESHOLD = 100;

const Restaurant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const prevScrollY = useRef(0);

  const { loading, error, data } = useQuery(SINGLE_RESTAURANT_QUERY, {
    variables: {
      id,
      restaurantId: id
    },
    skip: !id
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const { isLiked, likeCount, isLoading, handleLike } = useFavorite({
    id: id || '',
    initialLikeCount: data?.restaurant?.favoriteCount || 0
  });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const currentScrollY = containerRef.current.scrollTop;
      setIsScrollingUp(currentScrollY < prevScrollY.current);
      prevScrollY.current = currentScrollY;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollProgress = useTransform(
    scrollY,
    [0, SCROLL_THRESHOLD],
    [0, 1]
  );

  const headerHeight = useTransform(
    scrollProgress,
    [0, 1],
    [HEADER_HEIGHT, 64]
  );

  const imageOpacity = useTransform(
    scrollProgress,
    [0, 0.3, 1],
    [1, 0.8, isScrollingUp ? 0.8 : 0.3]
  );

  const headerInfoOpacity = useTransform(
    scrollProgress,
    [0, 0.3, 0.5],
    [1, 0.6, 0]
  );

  const navBarBg = useTransform(
    scrollProgress,
    [0, 1],
    ['rgba(0, 0, 0, 0)', 'rgba(255, 255, 255, 1)']
  );

  const navBarTextColor = useTransform(
    scrollProgress,
    [0, 1],
    ['rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 1)']
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load restaurant details</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-secondary text-black rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const restaurant = data?.restaurant;
  const menu = data?.menu;
console.log(data,"data")
  if (!restaurant) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Restaurant not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-secondary text-black rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const categories = menu?.categoryData?.filter(cat => cat.active) || [];

  return (
    <div className="fixed inset-0 bg-white">
      {/* Header */}
      <motion.div 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-20"
        style={{ height: headerHeight }}
      >
        {/* Image Gallery */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            src={restaurant.image}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: imageOpacity }}
          />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70"
            style={{ opacity: imageOpacity }}
          />
        </div>

        {/* Navigation Bar */}
        <motion.div 
          className="relative z-10 px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: navBarBg }}
        >
          <motion.button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            style={{ color: navBarTextColor }}
          >
            <ChevronLeft size={24} />
          </motion.button>
          <motion.button 
            onClick={handleLike}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            disabled={isLoading}
          >
            <Heart 
              size={24} 
              className={`transition-colors ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
              style={{ color: !isLiked ? navBarTextColor : undefined }}
            />
          </motion.button>
        </motion.div>

        {/* Restaurant Info */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 text-white"
          style={{ opacity: headerInfoOpacity }}
        >
          <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-gray-200 mb-4">{restaurant.cuisines?.join(', ')}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
              <span className="font-medium">{restaurant.reviewAverage?.toFixed(1)}</span>
              <span className="text-sm">({restaurant.reviewCount})</span>
            </div>
            {restaurant.deliveryTime && (
              <div className="flex items-center gap-1">
                <Clock size={20} />
                <span>{restaurant.deliveryTime} min</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin size={20} />
              <span>{(restaurant.distanceInMeters / 1000).toFixed(1)} km</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scrollable Content */}
      <motion.div 
        ref={containerRef}
        className="absolute inset-0 overflow-auto bg-gray-50"
        style={{ 
          paddingTop: HEADER_HEIGHT,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Menu Items */}
        <div className="relative pb-4">
          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 p-4 bg-white mb-4 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category._id
                    ? 'bg-secondary text-black'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="px-4 space-y-3">
            {menu?.food?.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 bg-white rounded-xl shadow-sm"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden">
                  <img 
                    src={item.imageData?.images?.[0]?.url || restaurant.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.internalName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium">
                      ₹{item.variationList?.[0]?.price || 0}
                    </span>
                    <button 
                      className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                        item.outOfStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-secondary text-black hover:bg-opacity-90'
                      }`}
                      disabled={item.outOfStock}
                    >
                      {item.outOfStock ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Restaurant;
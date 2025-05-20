import React, { useState } from 'react';
import { Star, Heart, Loader2, Users, MapPin, MessageCircleCode, Sparkles, BadgePercent, AlertTriangle } from 'lucide-react';
import { useFavorite } from '../../hooks/useFavorite';
import { useRestaurantNotifications } from '../../hooks/useRestaurantNotifications';
import { useBootstrap } from '../../context/BootstrapContext';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routeenums';

interface RestaurantProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  distance: string;
  description: string;
  likes?: number;
  reviews?: number;
  onUnfavorite?: () => void;
  showUnfavorite?: boolean;
  onboarded: boolean;
  campaigns?: any[];
}

const HorizontalCard: React.FC<RestaurantProps> = ({
  id,
  name,
  image,
  rating,
  distance,
  description,
  likes = 0,
  reviews = 0,
  onUnfavorite,
  showUnfavorite = false,
  onboarded = false,
  campaigns = []
}) => {
  const [imageError, setImageError] = useState(false);
  const { bootstrapData } = useBootstrap();
  const { isLiked, likeCount, isLoading, handleLike } = useFavorite({
    id,
    initialLikeCount: likes,
    onUnfavorite,
    showUnfavorite
  });
  const { handleFollowWithNotifications, handleUnfollowWithNotifications } = useRestaurantNotifications();
  const navigate = useNavigate()
  const placeholderImage = "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg";

  const handleFollowClick = async () => {
    if (isLiked) {
      await handleLike();
      await handleUnfollowWithNotifications(id);
    } else {
      await handleLike();
      await handleFollowWithNotifications(id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(AppRoutes.RESTAURANT, {
      state: {
        id: id
      }
    });
    localStorage.setItem("restaurant", id)
  };
  return (
    <div onClick={handleCardClick} className={`w-[180px] flex-shrink-0 shadow-sm bg-white rounded-xl overflow-hidden card-hover animate-scale-in card-width`}>
      <div className="relative overflow-hidden">
        <img
          src={!image ? placeholderImage : image}
          alt={name}
          className="w-full h-[85px] object-cover image-hover"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rating Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
          <Star size={12} className="text-[#24963F] fill-[#24963F]" />
          <span className="text-[#24963F] font-bold text-xs">{rating.toFixed(1)}</span>
        </div>

        {/* Like Button */}
        <button
          onClick={handleFollowClick}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-300 animate-slide-in-right"
          style={{ animationDelay: '0.2s' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={14} className="text-gray-700 animate-spin" />
          ) : (
            <Heart
              size={14}
              className={`${showUnfavorite ? 'text-red-500 fill-red-500' : isLiked ? 'text-red-500 fill-red-500' : 'text-gray-700'} transition-colors`}
            />
          )}
        </button>

        {/* Onboarded Badge */}
        {onboarded && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-secondary/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
            <Star size={12} className="text-black" />
          </div>
        )}

        {campaigns?.length > 0 && (

          <div className="absolute bottom-0 left-0 right-0">
            <div className={`px-2.5 py-1.5 rounded-lg backdrop-blur-sm ${'bg-gradient-to-r from-black/80 to-gray-900/80 text-white'

              }`}>
              {campaigns.length > 1 ? (
                <span className="text-[11px] flex items-center font-medium">
                  <BadgePercent size={12} className="text-secondary me-1" />
                  {campaigns.length} offers available
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <BadgePercent size={12} className="text-current" />
                  <span className="text-[11px] font-semibold">
                    {campaigns[0]?.campaignType === "PERCENTAGE"
                      ? `${campaigns[0].percentageDiscount}% off`
                      : `${bootstrapData?.currencyConfig?.currencySymbol} ${campaigns[0].flatDiscount} off`}
                  </span>
                  <span className="text-[10px] opacity-90">
                    min. {bootstrapData?.currencyConfig?.currencySymbol} {campaigns[0].minimumOrderValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5">
        <div className="mb-1 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-1">
            {name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1 animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-1">
            <MapPin size={10} />
            <span>{distance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={10} />
            <span>{likeCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <MessageCircleCode size={10} />
            <p className="line-clamp-1 text-[10px] text-gray-500">{reviews} reviews</p>
          </div>
        </div>

        <p className="line-clamp-1 text-[10px] text-gray-500 mt-1 animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default HorizontalCard;
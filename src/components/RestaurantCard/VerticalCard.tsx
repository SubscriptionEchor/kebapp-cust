import React, { useState } from 'react';
import { Star, Heart, Loader2, Users, MapPin, Clock, Percent, BadgePercent, Sparkles } from 'lucide-react';
import { useFavorite } from '../../hooks/useFavorite';
import { useRestaurantNotifications } from '../../hooks/useRestaurantNotifications';
import { useTranslation } from 'react-i18next';
import { formatTimeTo12Hour, isCurrentlyOpen } from '../../utils/time';
import { useNavigate } from 'react-router-dom';
import { useBootstrap } from '../../context/BootstrapContext';
import moment from 'moment';
import Lottie from 'lottie-react';
import fireAnimation from './fire-animation.json';
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
  openingTimes?: {
    day: string;
    times: {
      startTime: [number, number];
      endTime: [number, number];
    }[];
    isOpen: boolean;
  }[];
  isAvailable?: boolean;
  onboarded: boolean;
  campaigns?: any[];
}

interface OpeningStatus {
  message: string;
  isOpen: boolean;
  color: string;
  bgColor: string;
}

const VerticalCard: React.FC<RestaurantProps> = ({
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
  openingTimes,
  isAvailable,
  onboarded,
  campaigns = []
}) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bootstrapData } = useBootstrap();
  const { isLiked, likeCount, isLoading, handleLike } = useFavorite({
    id,
    initialLikeCount: likes,
    onUnfavorite,
    showUnfavorite,
  });
  const { handleFollowWithNotifications, handleUnfollowWithNotifications } = useRestaurantNotifications();

  const handleFollowClick = async () => {
    if (isLiked) {
      await handleLike();
      await handleUnfollowWithNotifications(id);
    } else {
      await handleLike();
      await handleFollowWithNotifications(id);
    }
  };

  const placeholderImage = "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg";

  const getOpeningStatus = (): OpeningStatus => {
    if (!isAvailable) {
      return {
        message: t('home.closed'),
        isOpen: false,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      };
    }
    if (!openingTimes || !Array.isArray(openingTimes) || openingTimes.length === 0) {
      return {
        message: t('home.closed'),
        isOpen: false,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      };
    }

    const now = new Date();
    const todayKey = moment(now).format('ddd').toUpperCase();
    const todaySchedule = openingTimes.find((d) => d.day === todayKey);
    const openNow = isCurrentlyOpen(openingTimes, now);

    if (openNow) {
      return {
        message: t('common.openNow'),
        isOpen: true,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
      };
    }

    if (todaySchedule?.isOpen && todaySchedule.times.length > 0) {
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const nextTime = todaySchedule.times.find((slot) => {
        const startMins = slot.startTime[0] * 60 + slot.startTime[1];
        return startMins > currentMins;
      });
      if (nextTime) {
        return {
          message: `${t('restaurant.hour')}: ${formatTimeTo12Hour(nextTime.startTime)}`,
          isOpen: false,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
      }
    }

    const dayNames: Record<string, string> = {
      MON: 'Monday',
      TUE: 'Tuesday',
      WED: 'Wednesday',
      THU: 'Thursday',
      FRI: 'Friday',
      SAT: 'Saturday',
      SUN: 'Sunday',
    };

    for (let i = 1; i <= 7; i++) {
      const nextDate = moment(now).add(i, 'days');
      const nextKey = nextDate.format('ddd').toUpperCase();
      const nextSchedule = openingTimes.find((d) => d.day === nextKey);
      if (nextSchedule?.isOpen && nextSchedule.times.length > 0) {
        return {
          message: `${t('timings.openson', {
            day: t(`timings.${dayNames[nextKey]}`),
          })} ${t('timings.at')} ${formatTimeTo12Hour(nextSchedule.times[0].startTime)}`,
          isOpen: false,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
      }
    }

    return {
      message: t('timings.closedforthisweek'),
      isOpen: false,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
    };
  };

  const openingStatus = getOpeningStatus();

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

  const showPromotion = campaigns?.find((camp) => camp?.promotion);

  const formatPromotionTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  return (
    <div
      className="w-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-4"
      onClick={handleCardClick}
    >
      <div className="flex px-4 pt-4 pb-2">
        <div className="relative w-32 h-32">
          <img
            src={!imageError && image ? image : placeholderImage}
            alt={name}
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await handleFollowClick();
            }}
            disabled={isLoading}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-gray-700" />
            ) : (
              <Heart
                size={18}
                className={isLiked || showUnfavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}
              />
            )}
          </button>
          {onboarded && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
              <Star size={12} className="text-black" />
            </div>
          )}
        </div>

        <div className="flex-1 ml-4">
          <h3 className="font-bold text-gray-900 mb-1 text-sm line-clamp-1">{name}</h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-1">{description}</p>

          <div className={`text-xs mb-2 ${openingStatus.color}`}>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{openingStatus.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{likeCount}</span>
            </div>
          </div>
          <div className="flex items-center  justify-between mb-2">
            <div className="flex items-center justify-center mt-2 py-1 rounded-lg">
              <span className="text-emerald-600  font-bold text-xs mr-1">{rating.toFixed(1)}</span>
              <Star className="text-emerald-600 " size={14} />
              <span className="text-xs text-emerald-600  ml-1">({reviews})</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center px-4  pb-3 gap-2">
        {showPromotion && (
          <div className="flex  items-center bg-secondary/10 text-black px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <BadgePercent size={14} className="text-secondary" />
              <span className="text-[11px] font-bold">{showPromotion?.displayName}</span>
            </div>
          </div>
        )}
        {campaigns?.length > (showPromotion ? 1 : 0) && (
          <div className="flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-gray-600" />
              <span className="text-[11px] font-bold">
                {t('verticalcard.moreoffers', { count: campaigns.length - (showPromotion ? 1 : 0) })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerticalCard;
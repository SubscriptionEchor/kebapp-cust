import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Navigation, Users, Loader2, QrCode, Bell, BellOff } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { useFavorite } from '../../hooks/useFavorite';
import { SET_RESTAURANT_NOTIFICATION, GET_RESTAURANT_NOTIFICATION_STATUS } from '../../graphql/queries';
import toast from 'react-hot-toast';

interface RestaurantHeaderProps {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  distance: number;
  address: string;
  initialLikeCount: number;
  setIsMapView: (prev: boolean) => void,
  isMapView: boolean
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  id,
  name,
  rating,
  reviews,
  distance,
  address,
  initialLikeCount,
  setIsMapView,
  isMapView
}) => {
  const navigate = useNavigate();
  const [showUnfollowModal, setShowUnfollowModal] = React.useState(false);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(false);
  const [isTogglingNotification, setIsTogglingNotification] = React.useState(false);

  const { isLiked, likeCount, isLoading, handleLike } = useFavorite({
    id,
    initialLikeCount
  });

  const [setRestaurantNotification] = useMutation(SET_RESTAURANT_NOTIFICATION);

  // Query to get notification status
  const { data: notificationData } = useQuery(GET_RESTAURANT_NOTIFICATION_STATUS, {
    variables: { restaurantId: id },
    skip: !id
  });

  // Initialize notifications state from query data
  useEffect(() => {
    if (notificationData?.getUserRestaurantSubscriptionStatus !== undefined) {
      setNotificationsEnabled(notificationData.getUserRestaurantSubscriptionStatus);
    }
  }, [notificationData]);

  const handleNotificationToggle = async () => {
    try {
      setIsTogglingNotification(true);
      await setRestaurantNotification({
        variables: {
          input: {
            restaurantId: id,
            enabled: !notificationsEnabled
          }
        }
      });
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled');
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsTogglingNotification(false);
    }
  };
  useEffect(() => {
    if (!isLiked) {
      setShowUnfollowModal(false)
    }
  }, [isLiked])

  const handleFollowClick = async () => {
    if (isLiked) {
      setShowUnfollowModal(true);
    } else {
      try {
        await handleLike();
        // Enable notifications after successful follow
        await setRestaurantNotification({
          variables: {
            input: {
              restaurantId: id,
              enabled: true
            }
          }
        });
        setNotificationsEnabled(!notificationsEnabled);
      } catch (error) {
        console.error('Error following restaurant:', error);
        toast.error('Failed to follow restaurant');
      }
    }
  };

  return (
    <>
      <div className="bg-white p-4 mx-4 my-3 rounded-xl shadow-md">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{name}</h1>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center ">
            <Star size={16} className="text-emerald-600 fill-emerald-600" />
            <span className="font-semibold ml-1">{rating.toFixed(1)}</span>
            <span className="text-gray-900 ml-1">({reviews})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-gray-900">{(distance / 1000).toFixed(1)} Km</span>
            </div>
            <button
              onClick={handleNotificationToggle}
              disabled={isTogglingNotification}
              className={`p-1.5 rounded-lg transition-colors ${notificationsEnabled ? 'text-secondary' : 'text-gray-600'} hover:bg-gray-100`}
            >
              {isTogglingNotification ? (
                <Loader2 size={25} className="animate-spin" />
              ) : (
                notificationsEnabled ? (
                  <BellOff size={25} className="fill-secondary text-secondary" />
                ) : (
                  <Bell size={25} className="text-gray-600" />
                )
              )}
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
            >
              <QrCode size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-2">
          <Users size={16} className="text-gray-600" />
          <span className="text-gray-600">{likeCount} Followers</span>
        </div>
        <p className="text-gray-600 text-sm mb-4">{address}</p>

        <div className="flex gap-2">
          <button
            onClick={handleFollowClick}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isLiked
              ? ' border-secondary text-secondary'
              : 'border-gray-200 text-gray-700'
              }`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Heart size={16} className={isLiked ? 'fill-secondary' : ''} />
            )}
            {isLiked ? 'Following' : 'Follow'}
          </button>

          <button
            onClick={() => setIsMapView(prev => !prev)}
            className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-900 text-sm font-medium transition-colors"
          >
            {!isMapView ? "View Map" : "View Menu"}
          </button>

          <button
            onClick={() => navigate(`/restaurant/${id}/directions`)}
            className="py-2.5 px-4 rounded-lg bg-secondary text-black hover:bg-opacity-90 transition-colors"
          >
            <Navigation size={16} />
          </button>
        </div>
      </div>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (

        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowUnfollowModal(false)}
        >
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unfollow Restaurant
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unfollow <strong>{name}?</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLike();
                }}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-secondary text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Unfollowing...' : 'Unfollow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
              <p className="text-sm text-gray-500 mt-1">
                Scan this QR code to share {name}
              </p>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${window.location.href}`}
                  alt="Restaurant QR Code"
                  className="w-40 h-40"
                />
              </div>

              <p className="text-sm text-gray-600 text-center mb-4">
                Share this QR code to let others discover this restaurant
              </p>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-3 bg-secondary text-black rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RestaurantHeader;
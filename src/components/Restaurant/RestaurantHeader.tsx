import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Navigation, Users, Loader2, QrCode, Bell, BellOff, Info } from 'lucide-react';
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
  owner?: {
    email: string;
  };
  username?: string;
  phone?: string;
  openingTimes?: {
    day: string;
    times: {
      startTime: [number, number];
      endTime: [number, number];
    }[];
    isOpen: boolean;
  }[];
  initialLikeCount: number;
  setIsMapView: (prev: boolean) => void,
  isMapView: boolean
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  id,
  name,
  rating,
  reviews,
  owner,
  username,
  phone,
  openingTimes,
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
  const [showDetailsSheet, setShowDetailsSheet] = React.useState(false);
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
        await setRestaurantNotification({
          variables: {
            input: {
              restaurantId: id,
              enabled: true
            }
          }
        });
        setNotificationsEnabled(true);
        toast.success('Following restaurant with notifications enabled');
      } catch (error) {
        console.error('Error following restaurant:', error);
        toast.error('Failed to follow restaurant');
      }
    }
  };

  const handleUnfollow = async () => {
    try {
      await handleLike();
      // Disable notifications when unfollowing
      await setRestaurantNotification({
        variables: {
          input: {
            restaurantId: id,
            enabled: false
          }
        }
      });
      setNotificationsEnabled(false);
      setShowUnfollowModal(false);
      toast.success('Unfollowed restaurant');
    } catch (error) {
      console.error('Error unfollowing restaurant:', error);
      toast.error('Failed to unfollow restaurant');
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
            <button
            onClick={() => setShowDetailsSheet(true)}
            className="py-2.5 px-4 rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Info size={16} />
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
          style={{zIndex:1000000}}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
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
                  handleUnfollow();
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
        <div style={{ zIndex: 1000 }} className="fixed inset-0 bg-black/50  flex items-center justify-center p-4">
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
      
      {/* Restaurant Details Sheet */}
      {showDetailsSheet && (
        <>
          <div 
            style={{zIndex:100000}}
            className="fixed inset-0 bg-black/50  animate-fade-in"
            onClick={() => setShowDetailsSheet(false)}
          />
          <div  style={{zIndex:100000}} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Restaurant Details</h3>
              
              {/* Basic Info */}
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Address</h4>
                  <p className="text-[15px] text-gray-900">{address}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Distance</h4>
                  <p className="text-[15px] text-gray-900">{(distance / 1000).toFixed(1)} km</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Rating</h4>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[15px] text-gray-900">{rating.toFixed(1)}</span>
                    <span className="text-[15px] text-gray-500">({reviews} reviews)</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Following</h4>
                  <p className="text-[15px] text-gray-900">{initialLikeCount} followers</p>
                </div>
                {(owner?.email || username) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Owner Details</h4>
                    {owner?.email && (
                      <p className="text-[15px] text-gray-900 mb-1">
                        Email: {owner.email}
                      </p>
                    )}
                    {username && (
                      <p className="text-[15px] text-gray-900">
                        Username: {username}
                      </p>
                    )}
                  </div>
                )}
                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contact</h4>
                  {phone ? (
                    <a href={`tel:${phone}`} className="text-[15px] text-secondary hover:underline">
                      {phone}
                    </a>
                  ) : (
                    <p className="text-[15px] text-gray-500">No phone number available</p>
                  )}
                </div>

                {/* Opening Hours */}
                {openingTimes?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Opening Hours</h4>
                    <div className="space-y-2">
                      {openingTimes.map((schedule, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-[15px] text-gray-900">{schedule.day}</span>
                          <div>
                            {schedule.isOpen ? (
                              schedule.times.map((time, timeIndex) => (
                                <span key={timeIndex} className="text-[15px] text-gray-900">
                                  {String(time.startTime[0]).padStart(2, '0')}:
                                  {String(time.startTime[1]).padStart(2, '0')} - 
                                  {String(time.endTime[0]).padStart(2, '0')}:
                                  {String(time.endTime[1]).padStart(2, '0')}
                                </span>
                              ))
                            ) : (
                              <span className="text-[15px] text-red-500">Closed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Owner Details */}
                
              </div>
              
              <button
                onClick={() => setShowDetailsSheet(false)}
                className="w-full py-3 bg-secondary text-black rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RestaurantHeader;
import { useMutation } from '@apollo/client';
import { SET_RESTAURANT_NOTIFICATION } from '../graphql/queries';
import toast from 'react-hot-toast';

export const useRestaurantNotifications = () => {
  const [setRestaurantNotification] = useMutation(SET_RESTAURANT_NOTIFICATION);

  const handleNotificationToggle = async (restaurantId: string, enabled: boolean) => {
    try {
      await setRestaurantNotification({
        variables: {
          input: {
            restaurantId,
            enabled
          }
        }
      });
      toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
      return true;
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to update notification settings');
      return false;
    }
  };

  const handleFollowWithNotifications = async (restaurantId: string) => {
    try {
      await setRestaurantNotification({
        variables: {
          input: {
            restaurantId,
            enabled: true
          }
        }
      });
      toast.success('Following restaurant with notifications enabled');
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  };

  const handleUnfollowWithNotifications = async (restaurantId: string) => {
    try {
      await setRestaurantNotification({
        variables: {
          input: {
            restaurantId,
            enabled: false
          }
        }
      });
      toast.success('Unfollowed restaurant');
      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  };

  return {
    handleNotificationToggle,
    handleFollowWithNotifications,
    handleUnfollowWithNotifications
  };
};
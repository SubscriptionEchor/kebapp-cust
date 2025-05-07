import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CHECK_ZONE_RESTRICTIONS } from '../graphql/queries';
import { useLocation } from '../context/LocationContext';

interface FallbackLocation {
  defaultLocation: number[] | { lat: number; lon: number } | null;
  title: string;
}

export const useZoneCheck = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTemporaryLocation } = useLocation();
  const [showFallbackModal, setShowFallbackModal] = React.useState(false);
  const [fallbackLocation, setFallbackLocation] = React.useState<FallbackLocation | null>(null);

  const [checkZone, { loading }] = useLazyQuery(CHECK_ZONE_RESTRICTIONS, {
    onCompleted: (data) => {
      if (data.checkZoneRestrictions.selectedZone) {
        toast.success(t('toasts.locationfetchedsuccessfully'));
        navigate('/home');
      } else if (data.checkZoneRestrictions.fallbackZone) {
        setFallbackLocation(data.checkZoneRestrictions.fallbackZoneDetails);
        setShowFallbackModal(true);
      } else {
        toast.error(t('common.outsidezone'));
      }
    },
    onError: (error) => {
      toast.error(t('toasts.locationerror'));
      console.error('Zone check error:', error);
    }
  });

  const checkLocationZone = (latitude: number, longitude: number) => {
    checkZone({
      variables: {
        inputValues: {
          latitude,
          longitude
        }
      }
    });
  };

  const handleFallbackConfirm = () => {
    if (!fallbackLocation) {
      console.error('No fallback location available');
      toast.error(t('toasts.locationerror'));
      return;
    }

    let latitude: number;
    let longitude: number;

    console.log(fallbackLocation,"fg")

    // Handle different possible formats of defaultLocation
    if (Array.isArray(fallbackLocation.defaultLocation?.coordinates)) {
      // Format: [longitude, latitude]
      longitude = fallbackLocation.defaultLocation?.coordinates[0];
      latitude = fallbackLocation.defaultLocation?.coordinates[1];
    } else if (fallbackLocation.defaultLocation && typeof fallbackLocation.defaultLocation === 'object') {
      // Format: { lat: number, lon: number }
      latitude = fallbackLocation.defaultLocation.lat;
      longitude = fallbackLocation.defaultLocation.lon;
    } else {
      console.error('Invalid or missing fallback location coordinates');
      toast.error(t('toasts.locationerror'));
      setShowFallbackModal(false);
      return;
    }
      
    // Get address from coordinates
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&lang=en`)
      .then(res => res.json())
      .then(data => {
        const area=data?.address?.borough 
        const address = data?.display_name || fallbackLocation.title;
        setTemporaryLocation({ 
          latitude, 
          longitude,
          area,
          address 
        });
        navigate('/home');
      })
      .catch(err => {
        console.error('Error getting address:', err);
        // Still set location but with fallback title as address
        setTemporaryLocation({ 
          latitude, 
          longitude,
          area:fallbackLocation.title ,
          address: fallbackLocation.title 
        });
        navigate('/home');
      });
    
    setShowFallbackModal(false);
  };

  const handleFallbackCancel = () => {
    setShowFallbackModal(false);
    setFallbackLocation(null);
  };

  return {
    checkLocationZone,
    loading,
    showFallbackModal,
    handleFallbackConfirm,
    handleFallbackCancel
  };
};
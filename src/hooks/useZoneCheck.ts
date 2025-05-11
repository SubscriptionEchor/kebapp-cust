import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CHECK_ZONE_RESTRICTIONS } from '../graphql/queries';
import { UseLocationDetails } from '../context/LocationContext';

interface FallbackLocation {
  defaultLocation: number[] | { lat: number; lon: number } | null;
  title: string;
}

export const useZoneCheck = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTemporaryLocation } = UseLocationDetails();
  const [showFallbackModal, setShowFallbackModal] = React.useState(false);
  const [fallbackLocation, setFallbackLocation] = React.useState<FallbackLocation | null>(null);

  const [checkZone, { loading }] = useLazyQuery(CHECK_ZONE_RESTRICTIONS)
  //, {
  // onCompleted: (data) => {
  //   if (data.checkZoneRestrictions.selectedZone) {
  //     setFallbackLocation(data.checkZoneRestrictions.selectedZoneDetails);
  //   } else if (data.checkZoneRestrictions.fallbackZone) {
  //     setFallbackLocation(data.checkZoneRestrictions.fallbackZoneDetails);
  //     setShowFallbackModal(true);
  //   } else {
  //     toast.error(t('common.outsidezone'));
  //   }
  // },
  // onError: (error) => {
  //   toast.error(t('toasts.locationerror'));
  //   console.error('Zone check error:', error);
  // }
  // });

  const checkLocationZone = async (latitude: number, longitude: number) => {
    let result = await checkZone({
      variables: {
        inputValues: {
          latitude,
          longitude
        }
      }
    });
    if (result?.data?.checkZoneRestrictions?.selectedZone) {
      setFallbackLocation(
        result.data.checkZoneRestrictions.selectedZoneDetails
      );
    }
    else if (result?.data?.checkZoneRestrictions?.fallbackZone) {
      setFallbackLocation(result.data.checkZoneRestrictions.fallbackZoneDetails);
      setShowFallbackModal(true);
    }
  };

  const handleFallbackConfirm = () => {

    // Get address from coordinates
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&lang=en`)
      .then(res => res.json())
      .then(data => {
        const area = data?.address?.borough
        const address = data?.display_name || fallbackLocation.title;
        setTemporaryLocation({
          latitude,
          longitude,
          area,
          address
        });
        navigate('/save');
      })
      .catch(err => {

        setTemporaryLocation({
          latitude,
          longitude,
          area: fallbackLocation.title,
          address: fallbackLocation.title
        });
        // navigate('/home');
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
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApolloClient, NormalizedCacheObject } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { handleNavigationWithZoneCheck } from '../utils/navigation';
import LoadingAnimation from '../components/LoadingAnimation';
import Logo from '../components/Logo';
import { getLocationFromCoordinates } from '../utils/locationUtils';
import { UseLocationDetails } from '../context/LocationContext';
import KebappNameLogo from "../assets/svg/KebappNameLogo.svg";
import KebappLogo from "../assets/svg/KebappLogo.svg";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import Spinner from '../components/Spinner/Spinner';
import OnboardingZero from "../assets/jpeg/OnboardingZero.png";
import OnboardingOne from "../assets/jpeg/OnboardingOne.png";
import OnboardingTwo from "../assets/jpeg/OnboardingTwo.png";
import OnboardingThree from "../assets/jpeg/OnboardingThree.png";
import '../css/splash.css'; // Import your CSS file
import { useBootstrap } from '../context/BootstrapContext';
import { AppRoutes } from '../routeenums';

const Splash: React.FC = () => {
  const { t } = useTranslation(); // Initialize translation hook
  const { isLoading, error, isNewUser } = useAuth();
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [showDefaultLocationPopup, setShowDefaultLocationPopup] = useState(false);
  const [fallbackZoneDetails, setFallbackZoneDetails] = useState<any>(null);
  const { temporaryLocation, storeTemporaryLocation, setTemporaryLocation } = UseLocationDetails();
  const [isLocationUnvailable, setIsLocationUnvailable] = useState(false);

  const { bootstrapData } = useBootstrap()


  useEffect(() => {
    if (isLoading) return;
    const checkLocationAndNavigate = async () => {
      let res = await handleNavigationWithZoneCheck(
        navigate,
        apolloClient as ApolloClient<NormalizedCacheObject>,
        setFallbackZoneDetails,
        setShowDefaultLocationPopup
      );

      if (!res?.success) {
        setIsLocationUnvailable(true);
        return;
      }
    };

    checkLocationAndNavigate();
    [OnboardingZero, OnboardingOne, OnboardingTwo, OnboardingThree].forEach(imageUrl => {
      const img = new Image();
      img.onload = () => {
        console.log("imageLoaded")
      };
      img.onerror = () => {

      };
      img.src = imageUrl;
    });
  }, [isLoading, isNewUser, navigate, apolloClient]);

  useEffect(() => {
    (async () => {
      if (!fallbackZoneDetails) {
        return;
      }
      let getLocationDetails = await getLocationFromCoordinates(
        fallbackZoneDetails?.defaultLocation?.coordinates[1],
        fallbackZoneDetails?.defaultLocation?.coordinates[0]
      );
      storeTemporaryLocation(getLocationDetails);
      if (showDefaultLocationPopup) return;
      setFallbackZoneDetails(false);
      setShowDefaultLocationPopup(false);

      if (!isNewUser) {
        navigate(AppRoutes.ONBOARDING, { replace: true });
      } else {
        navigate(AppRoutes.HOME, { replace: true });
      }
    })();
  }, [fallbackZoneDetails]);

  const handleSetDefaultLocation = () => {
    if (temporaryLocation) {
      setFallbackZoneDetails(null);
      setShowDefaultLocationPopup(false);
      if (!isNewUser) {
        navigate(AppRoutes.ONBOARDING, { replace: true });
      } else {
        navigate(AppRoutes.HOME, { replace: true });
      }
    }
  };

  const handleRetry = async () => {
    setIsLocationUnvailable(false);
    const res = await handleNavigationWithZoneCheck(
      navigate,
      apolloClient as ApolloClient<NormalizedCacheObject>,
      setFallbackZoneDetails,
      setShowDefaultLocationPopup
    );

    if (!res?.success) {
      setIsLocationUnvailable(true);
      return;
    }
  };

  const handleDefaultLocation = () => {
    if (bootstrapData?.operationalZones?.fallBackCoordinates) {
      const { latitude, longitude } = fallbackZoneDetails.operationalZones?.fallBackCoordinates;
      storeTemporaryLocation({
        latitude: latitude,
        longitude: longitude,
        area: fallbackZoneDetails.title,
        address: fallbackZoneDetails.title,
      });

      if (isNewUser) {
        navigate(AppRoutes.ONBOARDING, { replace: true });
      } else {
        navigate(AppRoutes.HOME, { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center splash-screen-component p-4">
      <div className="text-center">
        <img src={KebappLogo} alt={t('splash.logoAlt')} className="mb-8 animate-fade-in" />
        <img src={KebappNameLogo} alt={t('splash.nameLogoAlt')} className="mb-8 animate-fade-in" />
        {/* Uncomment the line below to use the Logo component */}
        {/* <Logo className="mb-8" variant="light" /> */}
        <Spinner color="white" size={40} />
        {isLoading ? (
          <LoadingAnimation className="animate-fade-in" />
        ) : error ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white animate-scale-in">
            <p className="mb-4">{t('common.error', { error })}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-blue-900 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : null}
        {isLocationUnvailable && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
              <p className="mb-4 text-gray-800 font-medium">
                {t('common.gpsInfo')}
              </p>
              <div className="flex items-center justify-end mt-4">
                <div className=" me-3" onClick={handleRetry}>
                  <p className="l-fs semiBold-fw black-text">{t('common.retry')}</p>
                </div>
                <div
                  className="p-2 px-3  rounded bg-secondary"
                  onClick={handleDefaultLocation}
                >
                  <p className="l-fs text-nowrap semiBold-fw black-text">
                    {t('common.setAsDefault')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {showDefaultLocationPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
              <p className="mb-4 text-gray-800 font-medium">
                {t('common.unavailableInfo')}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleSetDefaultLocation}
                  className="px-4 py-2 bg-secondary text-white rounded-lg font-medium transition-colors"
                >
                  {t('common.ok')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Splash;
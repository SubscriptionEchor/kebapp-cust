import React, { useContext, useEffect, useState } from 'react';
import './styles.css';
import { useNavigate } from 'react-router-dom';
import KebabLogo from '../../assets/svg/KebabLogo.svg';
import KebaapNameLogo from '../../assets/svg/KebaapNameLogo.svg';
import { routeName } from '../../Router/RouteName';
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { loginViaTelegram, getUserData, zoneCheck } from '../../apollo/server';
import { Context } from '../../Context/Context';
import Loader from '../../Components/Loader/Loader';
import { checkLocationAccess, CurrentLocationStorage, fetchAddressFromCoordinates, getHaversineDistance, getRestaurantIdFromTelegram } from '../../Utils';
import useGeolocation from '../../Hooks/useGeolocation/useGeolocation';
import OnboardingZero from "../../assets/jpeg/OnboardingZero.png";
import OnboardingOne from "../../assets/jpeg/OnboardingOne.png";
import OnboardingTwo from "../../assets/jpeg/OnboardingTwo.png";
import OnboardingThree from "../../assets/jpeg/OnboardingThree.png";
import { useTranslation } from 'react-i18next';
import Spinner from '../../Components/Spinner/Spinner';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import { showErrorToast } from '../../Components/Toast';
import { config } from '../../config';
import { t } from 'i18next';
const ZONECHECK = gql`${zoneCheck}`;

const screens = [
    {
        image: OnboardingZero,
        titleKey: "onboarding.screen0.title",
        descriptionKey: "onboarding.screen0.description",
        buttonTextKey: "onboarding.screen0.buttonText"
    },
    {
        image: OnboardingOne,
        titleKey: "onboarding.screen1.title",
        descriptionKey: "onboarding.screen1.description",
        buttonTextKey: "onboarding.screen1.buttonText"
    },
    {
        image: OnboardingTwo,
        titleKey: "onboarding.screen2.title",
        descriptionKey: "onboarding.screen2.description",
        buttonTextKey: "onboarding.screen2.buttonText"
    },
    {
        image: OnboardingThree,
        titleKey: "onboarding.screen3.title",
        descriptionKey: "onboarding.screen3.description",
        buttonTextKey: "onboarding.screen3.buttonText"
    }
];


const SplashScreen = () => {
    const { t } = useTranslation();
    const DISTANCE_THRESHOLD = 500; // meters
    const navigate = useNavigate();
    const { setUserDetails, setZoneData, setIdentifier } = useContext(Context)
    const [shouldFetchUserData, setShouldFetchUserData] = useState(false);
    // const [operationalZones, setOperationalZones] = useState([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isUnavailable, setIsUnavailable] = useState(false);

    



    const [checkZone] = useLazyQuery(ZONECHECK, {
        fetchPolicy: "network-only"
    });

    const { longitude: tempLongitude, latitude: tempLatitude } = CurrentLocationStorage.getCurrentLocation() || {}
    let locationObj

    useEffect(() => {
        const t = window?.Telegram?.WebApp
        console.log("printing T", t)
    },[])

    const handleLocationSuccess = async (location) => {
        try {
            if (!location?.latitude || !location?.longitude) {
                showErrorToast("Location permission denied");
                let coords = { ...config.FALLBACK_LOCATION };
                const formattedAddress = await fetchAddressFromCoordinates(coords?.latitude, coords?.longitude);
                if (formattedAddress) {
                    CurrentLocationStorage.setCurrentLocation({ ...formattedAddress, ...coords, type: 'CurrentLocation' });
                }
                setIsUnavailable(true);
                return
            }
            let coords = {
                latitude: Number(location?.latitude),
                longitude: Number(location?.longitude)
            }
            const response = await checkZone({
                variables: {
                    inputValues: coords
                }
            });
            if (!response?.data || !response?.data?.checkZoneRestrictions) {
                showErrorToast(t('toasts.locationnotinservicezone'));
                return;
            }
            let unavailable = false;
            let zoneData = response?.data?.checkZoneRestrictions?.selectedZoneDetails?.coordinates[0]
            let identifier = response?.data?.checkZoneRestrictions?.selectedZoneDetails?.identifier
            if (response?.data?.checkZoneRestrictions?.fallbackZoneDetails && response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates) {
                coords['latitude'] = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates[1]
                coords['longitude'] = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates[0]
                zoneData = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.coordinates[0]
                identifier = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.identifier
                unavailable = true;
            }
            const formattedAddress = await fetchAddressFromCoordinates(coords?.latitude, coords?.longitude);
            if (formattedAddress) {
                CurrentLocationStorage.setCurrentLocation({ ...formattedAddress, ...coords, type: 'CurrentLocation' });
                setZoneData(zoneData)
                setIdentifier(identifier)
                if (!unavailable) {
                    navigate(routeName.HOME);
                    return;
                }
                setIsUnavailable(true);
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            let res = await checkLocationAccess();
            if (!res?.success) {
                showErrorToast(t(res?.message) || t("errorfetching"));
                let coords = { ...config.FALLBACK_LOCATION };
                const formattedAddress = await fetchAddressFromCoordinates(coords?.latitude, coords?.longitude);
                if (formattedAddress) {
                    CurrentLocationStorage.setCurrentLocation({ ...formattedAddress, ...coords, type: 'CurrentLocation' });
                }
                setIsUnavailable(true);
                return
            }
        }
    };

    const handleLocationError = (error) => {
        console.error('Error retrieving location:', error);
        showErrorToast(error || "Error fetching coordinates");
        setIsPopupVisible(true);
    };

    const { location, error: locationError, requestLocation } = useGeolocation(handleLocationSuccess, handleLocationError)

    const { loading: userLoading, error: userError, data: userDetails } = useQuery(getUserData, {
        skip: !shouldFetchUserData,
        onCompleted: async (data) => {
            if (data?.profile?.userType === "telegram") {
                setUserDetails(data?.profile);
                let tempAddress = data?.profile?.addresses?.filter(address => {
                    if (!address?.location?.coordinates) return false;

                    let haversineDistance = getHaversineDistance(
                        address.location.coordinates[1],
                        address.location.coordinates[0],
                        tempLatitude,
                        tempLongitude
                    );
                    return haversineDistance < DISTANCE_THRESHOLD;
                });
                if (tempAddress?.length) {
                    locationObj = {
                        address: tempAddress[0].deliveryAddress,
                        place: tempAddress[0].label,
                        latitude: tempAddress[0].location.coordinates[1],
                        longitude: tempAddress[0].location.coordinates[0],
                        type: "CurrentLocation"
                    }
                    const { data } = await checkZone({
                        variables: {
                            inputValues: {
                                latitude: Number(locationObj?.latitude),
                                longitude: Number(locationObj?.longitude)
                            }
                        }
                    });
                    if (data && data?.checkZoneRestrictions) {
                        let res = data?.checkZoneRestrictions?.selectedZoneDetails?.coordinates[0]
                        let identifier = data?.checkZoneRestrictions?.selectedZoneDetails?.identifier
                        setZoneData(res)
                        setIdentifier(identifier)
                    }
                    return navigate(routeName.HOME, { state: locationObj })
                } else {
                    requestLocation("CurrentLocation");
                }
            }
        },
        onError: (error) => {
            console.error('Error fetching user data:', error);
        }
    });

    const [loginViaTelegramResponse, { loading, error, data }] = useMutation(loginViaTelegram, {
        onCompleted: (data) => {
            const telegramAuthData = data.loginViaTelegram;
            if (!telegramAuthData) {
                console.error('No initial data received');
                return;
            }
            localStorage.setItem('token', telegramAuthData.token);
            localStorage.setItem('userId', telegramAuthData.userId);
            setUserDetails(telegramAuthData);

            if (telegramAuthData?.isNewUser) {
                const prefetchImages = () => {
                    const imagesToPrefetch = screens.map(screen => screen.image);

                    return new Promise((resolve, reject) => {
                        let loadedImages = 0;
                        const totalImages = imagesToPrefetch.length;

                        imagesToPrefetch.forEach(imageUrl => {
                            const img = new Image();
                            img.onload = () => {
                                loadedImages++;

                                if (loadedImages === totalImages) {
                                    resolve(true);
                                }
                            };
                            img.onerror = () => {
                                loadedImages++;

                                if (loadedImages === totalImages) {
                                    resolve(true);
                                }
                            };
                            img.src = imageUrl;
                        });
                    });
                };
                const navigateToOnboarding = async () => {
                    try {
                        await prefetchImages();
                    } catch (error) {
                        console.error('Prefetching failed, navigating anyway', error);
                    }
                    localStorage.setItem(LOCALSTORAGE_NAME.ONBOARDING_DATA, JSON.stringify(screens));
                    navigate(routeName.ONBOARDING);
                };
                navigateToOnboarding();
                return;
            }

            const { phoneIsVerified, emailIsVerified, addresses } = telegramAuthData || {};

            if (!phoneIsVerified) {
                console.log('Navigating to Phone Number Verification');
                navigate(routeName.PHONE_NUMBER_VERIFICATION);
                return;
            }

            if (!emailIsVerified) {
                console.log('Navigating to Email Verification');
                navigate(routeName.EMAIL_VERIFICATION);
                return;
            }

            if (!addresses?.location && !tempLatitude && !tempLongitude) {
                console.log('Navigating to Location');
                navigate(routeName.LOCATION);
                return;
            }

            const restaurantId = getRestaurantIdFromTelegram();
            console.log(restaurantId, "restaurantId");
            if (restaurantId) {
                // Save restaurant ID to localStorage for use in Restaurant component
                localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({ _id: restaurantId }));
                console.log('Navigating to Restaurant page with ID:', restaurantId);
                navigate(routeName.RESTAURANT);
                return;
            }

            console.log('Navigating to Home');
            setShouldFetchUserData(true);

        },
        onError: (error) => {
            console.error('Mutation error:', error);
            if (error.networkError) {
                console.error('Network error details:', error.networkError);
            }
            if (error.graphQLErrors) {
                error.graphQLErrors.forEach(({ message, locations, path }) =>
                    console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`)
                );
            }
        }
    });


    // useEffect(() => {
    //     if (typeof window === "undefined" || !window.Telegram) {
    //         console.error('Telegram WebApp is not available');
    //         return;
    //     }
    //     const telegram = window.Telegram.WebApp;
    //     telegram.ready();
    //     telegram.expand();
    //     telegram.disableVerticalSwipes();

    //     // const initData = telegram.initData;
    //     //console.log(initData, "initData");

    //     const initData = "query_id=AAFaCK5IAwAAAFoIrkgFvAom&user=%7B%22id%22%3A7661815898%2C%22first_name%22%3A%22Nik%22%2C%22last_name%22%3A%22Red%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FO_d6KG5pC3ZikiIM4TniSbgHFEZdv59CG8zBoq3bzV5vQ-ENam_fBijq-w-uy4q5.svg%22%7D&auth_date=1735041263&signature=muUncpLrRItIxCkhxghHHW-OfrgOeBIXV3s9XpbYkL1DlZq-99z6RakPm7ytER_UoXkfxZtML6dz57075PLLCQ&hash=68ecd83817ef0f024abd24e0f5fd7b4c820b353aecbc0814be9eaf04e42b82a2";


    //     if (!initData) {
    //         console.error('initData is not available');
    //         telegram.close();
    //         return;
    //     }
    //     loginViaTelegramResponse({ variables: { initData } });
    // }, []);

    // if (loading || userLoading) {
    //     return <Loader />
    // }

    useEffect(() => {
        if (typeof window === "undefined" || !window?.Telegram) {
            console.error('Telegram WebApp is not available');
            return;
        }
        const telegram = window?.Telegram?.WebApp;
        telegram.ready();
        telegram.expand();
        telegram.disableVerticalSwipes();

        // Parse the initData to check for startParam 
        // For development/testing:
        // const initData = "query_id=AAFaCK5IAwAAAFoIrkgFvAom&user=%7B%22id%22%3A7661815898%2C%22first_name%22%3A%22Nik%22%2C%22last_name%22%3A%22Red%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FO_d6KG5pC3ZikiIM4TniSbgHFEZdv59CG8zBoq3bzV5vQ-ENam_fBijq-w-uy4q5.svg%22%7D&auth_date=1735041263&signature=muUncpLrRItIxCkhxghHHW-OfrgOeBIXV3s9XpbYkL1DlZq-99z6RakPm7ytER_UoXkfxZtML6dz57075PLLCQ&hash=68ecd83817ef0f024abd24e0f5fd7b4c820b353aecbc0814be9eaf04e42b82a2";

        // Use actual initData for production
        const initData = telegram.initData;

        const startParam = telegram?.initDataUnsafe?.start_param || new URLSearchParams(initData).get("start_param");

        if (startParam) {
            // loginViaTelegramResponse({ variables: { initData } });
        } else {
            localStorage.removeItem(LOCALSTORAGE_NAME.RESTAURANT_ID);
        }

        loginViaTelegramResponse({ variables: { initData } });
    }, []);
    const handleRetry = async () => {
        setIsPopupVisible(false);
        let res = await checkLocationAccess();
        if (!res?.success) {
            showErrorToast(t(res?.message) || t("locationerror"));
            setIsPopupVisible(true);
            return
        }
        await handleLocationSuccess(res?.data);
    };

    const handleDefaultLocation = async () => {
        let coords = { ...config.FALLBACK_LOCATION };
        const formattedAddress = await fetchAddressFromCoordinates(coords?.latitude, coords?.longitude);
        if (formattedAddress) {
            CurrentLocationStorage.setCurrentLocation({ ...formattedAddress, ...coords, type: 'CurrentLocation' });
            setIsPopupVisible(false);
            navigate(routeName.HOME);
        }
    };

    return (
        <div className='splash-screen-component d-flex flex-column align-items-center justify-content-center'>
            <img src={KebabLogo} alt="Kebab Logo" width="204" height="204" />
            {/* <p className='app-name white-text mt-3 normal-fw goldman-bold'> {t('splashScreen.appName')}</p> */}
            <p className='app-name white-text normal-fw goldman-bold'>
                <img className='mt-0 pt-0' src={KebaapNameLogo} alt="KEBAAP" width="204" height="80" />
            </p>
            <div className='loader-position-bottom'>
                <Spinner color="white" size={40} />
            </div>
            {isPopupVisible && (
                <div className={`popup-bg ${isPopupVisible ? 'fade-in' : 'fade-out'}`}>
                    <div className="popup-container" onClick={e => e.stopPropagation()}>
                        <p className="xl-fs semiBold-fw black-text text-center mt-2">
                            {t('common.gpsInfo')}
                        </p>
                        <div className="d-flex align-items-center justify-content-end mt-4">
                            <div className='btn-confirm me-3' onClick={handleRetry} >
                                <p className='l-fs semiBold-fw black-text'>{t('common.retry')}</p>
                            </div>
                            <div className='p-2 px-3 border border-2 rounded btn-cancel' onClick={handleDefaultLocation} >
                                <p className='l-fs text-nowrap semiBold-fw black-text'>{t('common.setAsDefault')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isUnavailable && (
                <div className={`popup-bg ${isUnavailable ? 'fade-in' : 'fade-out'}`}>
                    <div className="popup-container" onClick={e => e.stopPropagation()}>
                        <p className="xl-fs semiBold-fw black-text text-center mt-2">
                            {t('common.unavailableInfo')}
                        </p>
                        <div className='d-flex justify-content-end' >
                            {/* <div className="d-flex align-items-center justify-content-between mt-4 me-3">
                                <div className='p-2 px-3 border border-2 rounded' onClick={() => setIsUnavailable(false)} >
                                    <p className='l-fs semiBold-fw black-text'>{t('common.cancel')}</p>
                                </div>
                            </div> */}
                            <div className="d-flex align-items-center justify-content-between mt-4">
                                <div className='p-2 px-3 border border-2 rounded btn-cancel' onClick={() => { setIsUnavailable(false); navigate(routeName.HOME) }}  >
                                    <p className='l-fs semiBold-fw black-text'>{t('common.ok')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SplashScreen;

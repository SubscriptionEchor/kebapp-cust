import React, { useContext, useEffect, useState } from 'react';
import "./style.css"
import RestaurantCard from '../../Components/RestaurantCard'
import Close from '../../assets/svg/close.svg'
import PageTitle from '../../Components/PageTitle';
import { useTranslation } from 'react-i18next';
import { routeName } from '../../Router/RouteName';
import { FavouriteRestaurant, getRestaurantNotificationIds, toggleFavorite, toggleRestaurantNotification } from '../../apollo/server';
import { gql, useMutation, useQuery } from '@apollo/client';
import Loader from '../../Components/Loader/Loader';
import { Context } from '../../Context/Context';
import { CurrentLocationStorage, prefetchImages } from '../../Utils';
import Spinner from '../../Components/Spinner/Spinner';
import Crying from "../../assets/Lottie/Crying.json"
import LottieAnimation from '../../Components/LottieAnimation/LottieAnimation';
import { showErrorToast, showSuccessToast } from '../../Components/Toast';

const FAVORITES = gql`${FavouriteRestaurant}`;
const TOGGLEFAVORITE = gql`${toggleFavorite}`;
const TOGGLE_NOTIFICATION = gql`${toggleRestaurantNotification}`;
const NOTIFICATIONIDS = gql`${getRestaurantNotificationIds}`;

// const filters = [
//     "Veg",
//     "Non-veg",
// ]

const Following = () => {
    const { userDetails } = useContext(Context);
    const { t } = useTranslation();
    const windowHeight = window.innerHeight;
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [favoriteRestaurant, setFavoriteRestaurant] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [interactionLoader, setInteractionLoader] = useState(0);
    const [notificationLoader, setNotificationLoader] = useState(null);
    // const [selectedFilters, setSelectedFilters] = useState([]);

    const [toggleFavoriteMutation] = useMutation(TOGGLEFAVORITE);
    const [toggleNotificationMutation] = useMutation(TOGGLE_NOTIFICATION);

    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setCurrentLocation(response)
        })();
    }, []);

    // GET favorites list
    const { loading } = useQuery(FAVORITES, {
        variables: {
            longitude: Number(currentLocation?.longitude),
            latitude: Number(currentLocation?.latitude),
            ip: null,
        },
        skip: !currentLocation?.longitude || !currentLocation?.latitude,
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        onCompleted: (data) => {
            prefetchImages(data?.userFavourite.map(d => d.image).filter(Boolean))
                .catch(error => {
                    console.error('Error prefetching images:', error);
                });
            setFavoriteRestaurant(data?.userFavourite)
        },
    });

    const { loading: notifyLoader } = useQuery(NOTIFICATIONIDS, {
        skip: favoriteRestaurant?.length === 0,
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        onCompleted: (data) => {
            if (data?.getSubscribedRestaurantIdsByUser.length === 0) return;
            const resultData = favoriteRestaurant?.map(restaurant => ({
                ...restaurant,
                isNotify: data?.getSubscribedRestaurantIdsByUser?.includes(restaurant._id)
            }));
            setFavoriteRestaurant(resultData);
        },
    });

    const handleFollow = (restaurant) => {
        document.body.style.overflow = "hidden";
        setSelectedRestaurant(restaurant);
    };

    const handleClosePopup = () => {
        if (interactionLoader == 1) return;
        document.body.style.overflow = "auto";
        setSelectedRestaurant(null);
    };

    // Unfollow functionality
    const handleConfirmUnfollow = async () => {
        if (interactionLoader == 1) return;
        document.body.style.overflow = "auto";
        setInteractionLoader(1);
        try {
            const { data } = await toggleFavoriteMutation({
                variables: { toggleFavoriteId: selectedRestaurant?._id }
            });

            if (!data || !data?.toggleFavorite?.favourite) {
                setInteractionLoader(0);
                return;
            }
            setFavoriteRestaurant(prevState => {
                return prevState.filter(restaurant => restaurant._id !== selectedRestaurant?._id);
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
        setSelectedRestaurant(null);
        setInteractionLoader(0);
    };

    const handleNotification = async (el) => {
        if (notificationLoader) return;
        setNotificationLoader(el?._id);
        try {
            const response = await toggleNotificationMutation({
                variables: {
                    "input": {
                        "restaurantId": el?._id,
                        "enabled": !el?.isNotify
                    }
                }
            });
            if (!response?.data) {
                showErrorToast(t('common.failureMessage'))
                setNotificationLoader(null);
                return;
            }
            setFavoriteRestaurant(prevState => {
                let updatedRestaurants = prevState.map(restaurant => {
                    if (restaurant._id === el?._id) {
                        return {
                            ...restaurant,
                            isNotify: !el?.isNotify
                        };
                    }
                    return restaurant;
                });
                return updatedRestaurants;
            });
            showSuccessToast('Updated successfully')
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showErrorToast(t('common.failureMessage'))
        }
        setNotificationLoader(null);
    };

    // const handleFilterSelection = (filter) => {
    //     setSelectedFilters(prev => {
    //         if (prev.includes(filter)) {
    //             return prev.filter(item => item !== filter);
    //         }
    //         return [...prev, filter];
    //     });
    // }

    if (loading) {
        return <Loader />
    }

    return (
        <div className="following">
            <PageTitle title={t("screenTitle.following")} />
            {/* <div className='d-flex align-items-center overflow-auto hide-scroll-bar pd-horizontal mt-4'>
                {filters.map((el, i) => {
                    return (
                        <div key={i} className='filter-pill d-flex align-items-center justify-content-center px-3 py-1 me-2' onClick={() => handleFilterSelection(el)} style={{ borderColor: selectedFilters.includes(el) && "#000" }}>
                            <p className='m-fs normal-fw black-text text-nowrap'>{el}</p>
                            {selectedFilters.includes(el) && <img className="close ms-1" src={Close} alt="crying" />}
                        </div>
                    )
                })}
            </div> */}
            <div>
                {favoriteRestaurant.length > 0 ? favoriteRestaurant.map((el, i) => (
                    <div key={i} className="mt-4">
                        <RestaurantCard
                            isCancel={false}
                            navigateTo={routeName.RESTAURANT}
                            handleFollow={() => handleFollow(el)}
                            handleNotification={() => handleNotification(el)}
                            data={el}
                            route={"following"}
                            isLoadingId={notificationLoader}
                        />
                    </div>
                )) :
                    <div className='noData'><p className='m-fs bold-fw placeholder-text'>{t('common.noData')}</p></div>
                }
                <div style={{ height: windowHeight * 0.08 }} />
            </div>

            {selectedRestaurant && (
                <div className="popup-bg" onClick={handleClosePopup}>
                    <div className="popup-container" onClick={e => e.stopPropagation()}>
                        <div className='d-none popup-img  d-flex align-items-center justify-content-center'>
                            <LottieAnimation
                                animationData={Crying}
                                width={120}
                                height={120}
                                autoplay={true}
                                loop={true}
                            />
                        </div>
                        <p className="xl-fs semiBold-fw black-text text-center mt-4">
                            {t('following.unfollowRestaurant', { restaurantName: selectedRestaurant?.name })}
                        </p>
                        <div className="d-flex align-items-center justify-content-between mt-4">
                            <div className='popup-btn-confirm' onClick={handleConfirmUnfollow}>
                                {interactionLoader == 1 ? <Spinner color="#000" size="24px" /> : <p className='l-fs semiBold-fw black-text'>{t('following.confirm')}</p>}
                            </div>
                            <div className='popup-btn-cancel' onClick={handleClosePopup}>
                                <p className='l-fs semiBold-fw black-text'>{t('following.cancel')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Following;
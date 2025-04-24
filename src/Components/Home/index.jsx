// components/Home/index.jsx - Main Container Component
import React, { useContext, useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";
import { restaurantList, toggleFavorite, profile, zoneCheck, recordConsent } from "../../apollo/server";
import "./style.css";

// Core Components
import Header from '../../Components/Header';
import Loader from '../../Components/Loader/Loader';
import { showErrorToast } from '../../Components/Toast';

// Custom Components
import RestaurantListView from './RestaurantListView';
import MapView from './MapView';
import MapControls from './MapControls';
import CompliancePopup from './CompliancePopup';

// Lazy Loaded Components
const CartCarousel = lazy(() => import('../../Components/Caurosel'));
const SortFilter = lazy(() => import('../../Components/Filters'));
const MapRestaurantCard = lazy(() => import('../../Components/MapRestaurantCard'));

// Context, Router, Utilities
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { routeName } from '../../Router/RouteName';
import {
    HOME_API_PARAMETERS,
    LOCALSTORAGE_NAME,
    MAP_TYPES,
    SORTING_FILTER_ENUMS
} from '../../constants/enums';
import { Context } from '../../Context/Context';
import UserContext from '../../Context/User';
import { BootstrapContext } from '../../Context/Bootstrap';
import { CurrentLocationStorage } from '../../Utils';

// GraphQL Queries
import { COMBINED_RESTAURANTS_QUERY } from './queries';
import { useRestaurantData } from './hooks/useRestaurantData';
import Footer from '../Footer';

const Home = () => {
    const windowHeight = window.innerHeight;
    const navigate = useNavigate();
    const { t } = useTranslation();
    const client = useApolloClient();
    const { userDetails, setUserDetails, zoneData, setZoneData, setIdentifier, identifier } = useContext(Context);
    const { cart } = useContext(UserContext);
    const { bootstrapData } = useContext(BootstrapContext);

    // State management
    const [isMapActive, setIsMapActive] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [mapSelectedFilters, setMapSelectedFilters] = useState({});
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [openSheet, setOpenSheet] = useState(false);
    const [openMapSheet, setOpenMapSheet] = useState(false);
    const [selectedOption, setSelectedOption] = useState({});
    const [mapSelectedOption, setMapSelectedOption] = useState({});
    const [type, setType] = useState('');
    const [filterLoading, setFilterLoading] = useState(false);
    const [mapFilterLoading, setMapFilterLoading] = useState(false);
    const [cuisinesData, setCuisinesData] = useState([]);
    const [bannersData, setBannersData] = useState([]);
    const [promotionsData, setPromotionsData] = useState([]);
    const [isMapFilterBounds, setIsMapFilterBounds] = useState(false);
    const [isCompliance, setIsCompliance] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [mapModalData, setMapModalData] = useState({});
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Custom hook for restaurant data fetching and processing
    const {
        loading,
        allRestaurants,
        setAllRestaurants,
        visibleRestaurants,
        organizedSections,
        mapBounds,
        checkAllApiStatusFailed,
        isMapLoader,
        handleMapModal,
        handleToggleFavorite,
        onHandleApplyFilter,
        onHandleApplyMapFilter,
        getOpeningStatus,
        loadingFavorites,
        setPagination,
        pagination,
        setMapBounds,
        currentMapDistance,
    } = useRestaurantData({
        selectedLocation,
        identifier,
        userDetails,
        promotionsData,
        client,
        setFilterLoading,
        setMapFilterLoading
    });

    // GraphQL mutations
    const [toggleFavoriteMutation] = useMutation(gql`${toggleFavorite}`);
    const [toggleConsentMutation] = useMutation(gql`${recordConsent}`);

    // // // Handle map modal click
    // // const handleCardClick = useCallback((restaurantId) => {
    // //     // Store restaurant ID in localStorage
    // //     localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({
    // //         _id: restaurantId,
    // //         slug: '' // You might need to get the slug from your restaurant data if needed
    // //     }));
        
    // //     // Navigate to the restaurant page
    // //     navigate(routeName.RESTAURANT);
    // // }, [navigate, routeName]);

    // const handleCardClick = useCallback((restaurantId) => {
    //     const restaurantData = handleMapModal(restaurantId);
    //     if (restaurantData) {
    //         setMapModalData(restaurantData);
    //         setIsModalVisible(true);
    //     }
    // }, [handleMapModal]);

    // const handleCardClick = useCallback((restaurantId, openInModal = false) => {
    //     alert("hiiii")
    //     console.log(restaurantId)
    //     const restaurantData = handleMapModal(restaurantId);
    //     console.log(restaurantData)
    
    //     if (!restaurantData) return;
       
    //    localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({_id:restaurantData?._id,slug:restaurantData?.slug}));
    //         navigate(routeName.RESTAURANT, {
    //             state: {
    //                 _id: restaurantData._id,
    //                 slug: restaurantData.slug
    //             }
    //         });
    //     // }
    // },[]);

    const handleCardClick = useCallback((restaurant, openInModal = false) => {
        // console.log(restaurant, 'restaurantId');
        // const restaurantData = handleMapModal(restaurantId);
        // console.log(restaurantData,'restaurantData');
    
        if (!restaurant) return;
    
        localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({
            _id: restaurant?._id,
            slug: restaurant?.slug
        }));
    
        if (openInModal) {
            setMapModalData(restaurant);
            setIsModalVisible(true);
        } else {
            navigate(routeName.RESTAURANT, {
                state: {
                    _id: restaurant._id,
                    slug: restaurant.slug
                }
            });
        }
    }, [navigate]);
    
    
    // Load current location on component mount
    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setSelectedLocation(response);
        })();
    }, []);

    // Body scroll lock when modals are open
    useEffect(() => {
        if (openSheet || isModalVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto'; // Cleanup on unmount
        };
    }, [openSheet, isModalVisible]);

    // Get user profile
    const { loading: profileLoading } = useQuery(gql`${profile}`, {
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            setUserDetails(data?.profile || {});
        },
        skip: userDetails
    });

    // Handle bootstrap data
    useEffect(() => {
        if (bootstrapData?.cuisines?.length) {
            setCuisinesData(bootstrapData.cuisines);
        }
        if (bootstrapData?.banners && bootstrapData.banners.length) {
            setBannersData(bootstrapData.banners);
        }
        if (bootstrapData?.promotions && bootstrapData.promotions.length) {
            setPromotionsData(bootstrapData.promotions);
        }
        if (bootstrapData?.currencyConfig?.currencySymbol) {
            localStorage.setItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL, bootstrapData.currencyConfig.currencySymbol);
        }
    }, [bootstrapData]);

    // Zone check query
    const { data: zoneQueryResult } = useQuery(gql`${zoneCheck}`, {
        variables: {
            inputValues: {
                longitude: Number(selectedLocation?.longitude),
                latitude: Number(selectedLocation?.latitude)
            }
        },
        skip: (zoneData?.length || !selectedLocation?.longitude || !selectedLocation?.latitude),
        fetchPolicy: "cache-and-network"
    });

    // Process zone data
    useEffect(() => {
        if (zoneQueryResult?.checkZoneRestrictions) {
            const { fallbackZoneDetails, selectedZoneDetails } = zoneQueryResult.checkZoneRestrictions;
            if (fallbackZoneDetails) {
                setZoneData(fallbackZoneDetails.coordinates[0]);
                setIdentifier(fallbackZoneDetails.identifier);
            }
            else if (selectedZoneDetails) {
                setZoneData(selectedZoneDetails.coordinates[0]);
                setIdentifier(selectedZoneDetails.identifier);
            }
        }
    }, [zoneQueryResult, setZoneData, setIdentifier]);

    // Check user consent
    useEffect(() => {
        if (!userDetails?.consentInfo || !bootstrapData?.activeConsentDocData) return;
        const consentResult = userDetails?.consentInfo?.find(
            consent => consent.docVersionId === bootstrapData?.activeConsentDocData?.docVersionId
        );
        if (!consentResult) {
            setIsCompliance(true);
        }
    }, [userDetails?.consentInfo, bootstrapData?.activeConsentDocData]);

    // Handle filter selection
    const handleFilterSelection = (key, value) => {
        key = SORTING_FILTER_ENUMS[key];
        if (!key) return;

        if (key === "rating") {
            const newFilters = {
                ...(selectedFilters || {}),
                filter: { ...selectedFilters?.filter, rating: value }
            };
            setSelectedFilters(newFilters);
            onHandleApplyFilter(newFilters);
            return;
        }

        setType(key);
        setSelectedOption(selectedFilters[key]);
        setOpenSheet(true);
    };

    // Handle consent agreement
    const handleAgree = async () => {
        if (btnLoader) return;

        setBtnLoader(true);
        try {
            await toggleConsentMutation({
                variables: { docVersionId: bootstrapData?.activeConsentDocData?.docVersionId }
            });
            setIsCompliance(false);
        } catch (error) {
            console.error('Error recording consent:', error);
            showErrorToast(error?.graphQLErrors?.[0]?.message || t("home.consentError"));
        } finally {
            setBtnLoader(false);
        }
    };

    // Load more restaurants function
    const loadMoreRestaurants = useCallback(async () => {
        if (!pagination?.hasNextPage || isLoadingMore || !selectedLocation) return;

        try {
            setIsLoadingMore(true);

            // Prepare variables for pagination query
            const lastRestaurantData = pagination?.lastRestaurant || {};

            // Execute the query
            const result = await client.query({
                query: gql`${COMBINED_RESTAURANTS_QUERY}`,
                variables: {
                    distance: HOME_API_PARAMETERS.DISTANCE,
                    limit: HOME_API_PARAMETERS.LIMIT,
                    location: [Number(selectedLocation.longitude), Number(selectedLocation.latitude)],
                    lastRestaurant: {
                        _id: lastRestaurantData?._id,
                        distanceInMeters: lastRestaurantData?.distanceInMeters?.toString()
                    }
                },
                fetchPolicy: "network-only"
            });

            // Process the data
            if (result?.data?.allRestaurants?.restaurants) {
                setAllRestaurants(prevRestaurants => [...prevRestaurants, ...result.data.allRestaurants.restaurants]);

                // Update pagination information
                if (result.data.allRestaurants.pagination) {
                    setPagination(result.data.allRestaurants.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading more restaurants:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [pagination, isLoadingMore, selectedLocation, client, setAllRestaurants, setPagination]);

    return (
        <div className='position-relative'>
            <Header
                searchPlaceholders={bootstrapData?.homeSearchPlaceholder}
                isMapActive={isMapActive}
                height={!isMapActive ? 146 : 80}
            />

            <div id="rest" className='overflow-hidden'>
                {/* Restaurant List View */}
                <div id="scrollableDiv" style={{ display: isMapActive ? 'none' : 'block' }}>
                    <RestaurantListView
                        checkAllApiStatusFailed={checkAllApiStatusFailed}
                        bannersData={bannersData}
                        organizedSections={organizedSections}
                        allRestaurants={allRestaurants}
                        visibleRestaurants={visibleRestaurants}
                        filterLoading={filterLoading}
                        windowHeight={windowHeight}
                        isModalVisible={isModalVisible}
                        t={t}
                        handleMapModal={handleCardClick}
                        handleToggleFavorite={handleToggleFavorite}
                        promotionsData={promotionsData}
                        getOpeningStatus={getOpeningStatus}
                        loadingFavorites={loadingFavorites}
                        onBottomReached={loadMoreRestaurants} // Pass the loadMoreRestaurants function as onBottomReached
                        pagination={pagination}
                        setPagination={setPagination}
                        isLoadingMore={isLoadingMore}
                        
                    />
                </div>

                {/* Map View */}
                <MapView
                    isMapActive={isMapActive}
                    loading={loading}
                    isMapLoader={isMapLoader}
                    selectedLocation={selectedLocation}
                    mapFilterLoading={mapFilterLoading}
                    promotionsData={promotionsData}
                    isMapFilterBounds={isMapFilterBounds}
                    mapBounds={mapBounds}
                    // handleMapModal={handleCardClick}
                    currentMapDistance={currentMapDistance}
                    setMapBounds={setMapBounds}
                    handleMapModal={(id) => handleCardClick(id, true)}
                    t={t}
                />

                {/* Map floating button and controls */}
                <MapControls
                    isModalVisible={isModalVisible}
                    loading={loading}
                    isMapLoader={isMapLoader}
                    mapFilterLoading={mapFilterLoading}
                    isMapActive={isMapActive}
                    setIsMapActive={setIsMapActive}
                    cart={cart}
                    mapSelectedFilters={mapSelectedFilters}
                    setMapSelectedOption={setMapSelectedOption}
                    setOpenMapSheet={setOpenMapSheet}
                    t={t}
                />

                {/* Restaurant modal */}
                {isModalVisible && (
                    <div className="restaurant-card-container">
                        <Suspense fallback={<Loader />}>
                            <MapRestaurantCard
                                isCancel={true}
                                navigateTo={routeName.RESTAURANT}
                                setIsModalVisible={setIsModalVisible}
                                data={mapModalData}
                                promotionsData={promotionsData}
                                route={"home"}
                            />
                        </Suspense>
                    </div>
                )}

                {/* Cart carousel */}
                {cart?.length > 0 && !isMapActive && (
                    <Suspense fallback={<div className="cart-placeholder" />}>
                        <CartCarousel cart={cart} />
                    </Suspense>
                )}

                {/* Filters */}
                <Suspense fallback={null}>
                    {/* Home filters */}
                    <SortFilter
                        cuisinesData={cuisinesData}
                        onHandleApplyFilter={onHandleApplyFilter}
                        setIsOpen={setOpenSheet}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        isOpen={openSheet}
                        filterKey={type}
                        setSelectedFilters={setSelectedFilters}
                    />

                    {/* Map filters */}
                    <SortFilter
                        onHandleApplyFilter={onHandleApplyMapFilter}
                        setIsOpen={setOpenMapSheet}
                        selectedOption={mapSelectedOption}
                        setSelectedOption={setMapSelectedOption}
                        isOpen={openMapSheet}
                        filterKey={"mapFilter"}
                        setSelectedFilters={setMapSelectedFilters}
                    />
                </Suspense>

                {/* Compliance popup */}
                {isCompliance && (
                    <CompliancePopup
                        t={t}
                        navigate={navigate}
                        bootstrapData={bootstrapData}
                        handleAgree={handleAgree}
                        btnLoader={btnLoader}
                        routeName={routeName}
                    />
                )}
            </div>
            {!isMapActive && (
                <Footer />
            )}

        </div>
    );
};

export default React.memo(Home);
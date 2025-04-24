import React, { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";
import { restaurantList, toggleFavorite, profile, zoneCheck, recordConsent } from "../../apollo/server";
import "./style.css"
import Header from '../../Components/Header'
import CardImage from '../../Components/CardImage'
import LeftLine from '../../assets/svg/lineLeft.svg'
import RightLine from '../../assets/svg/lineRight.svg'
import Star from '../../assets/svg/rating.svg'
import Dot from '../../assets/svg/dot.svg'
import Map from '../../assets/svg/map.svg'
import HomeIcon from '../../assets/svg/home.svg'
import Footer from '../../Components/Footer'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import { routeName } from '../../Router/RouteName'
import { HOME_API_PARAMETERS, LOCALSTORAGE_NAME, MAP_CAMPAIGN_TYPE, MAP_TYPES, SORTING_FILTER_ENUMS } from '../../constants/enums'
import { useLocation } from 'react-router-dom'
import { Context } from '../../Context/Context'
import UserContext from '../../Context/User';
import CartCarousel from '../../Components/Caurosel';
import Loader from '../../Components/Loader/Loader';
import Banners from '../../Components/Banners';
import { CurrentLocationStorage, prefetchImages, metersToKilometers, ratingStructure, numberToK, enhancedImageCache } from '../../Utils';
import SortFilter from '../../Components/Filters';
import Faders from "../../assets/svg/fadershorizontal.svg"
import FadersWhite from "../../assets/svg/fadershorizontalWhite.svg"
import DownArrow from "../../assets/svg/downarrow.svg"
import OpenStreetMap from '../../Components/OpenStreetMap/OpenStreetMap';
import Close from "../../assets/svg/close.svg"
import FireGif from "../../assets/gif/fire.gif"
import HatGif from "../../assets/gif/hat.gif"
import StarGif from "../../assets/gif/star.gif"
import LoaderAnimation from "../../assets/Lottie/mapLoader.json"
import MapRestaurantCard from '../../Components/MapRestaurantCard';
import LottieAnimation from '../../Components/LottieAnimation/LottieAnimation';
import { BootstrapContext } from '../../Context/Bootstrap';
import { showErrorToast } from '../../Components/Toast';
import Spinner from '../../Components/Spinner/Spinner';

const RESTAURANTS = gql`${restaurantList}`;
const TOGGLEFAVORITE = gql`${toggleFavorite}`;
const TOGGLECONSENT = gql`${recordConsent}`;
const PROFILE = gql`${profile}`;
const ZONECHECK = gql`${zoneCheck}`
const COMBINED_RESTAURANTS_QUERY = gql`
  query CombinedRestaurants(
    $distance: Float!, 
    $limit: Int!, 
    $longitude: Float!, 
    $latitude: Float!,
    $zoneIdentifier:String!
  ) {
    allRestaurants: nearByRestaurantsNewV2(
      distance: $distance,
      limit: $limit,
      longitude: $longitude,
      latitude: $latitude
      zoneIdentifier:$zoneIdentifier
    ) {
      sections {
        _id
        name
        restaurants
      }
      restaurants {
        _id
        name
        image
        slug
        address
        cuisines
        onboarded
        location {
          coordinates
        }
        favoriteCount
        reviewAverage
        distanceInMeters
        reviewCount
        isAvailable
        openingTimes {
          day
          times {
            startTime
            endTime
          }
          isOpen
        }
      }
      campaigns {
        _id
        restaurant
        name
        description
        couponCode
        campaignType
        promotion
        isActive
        startDate
        endDate
        startTime
        endTime
        percentageDiscount
        flatDiscount
        maxDiscount
        minimumOrderValue
      }
    }
  }
`;

const filters = [
    {
        displayName: "Filter",
        key: "FILTER",
        icon: Faders
    },
    {
        displayName: "sort",
        key: "SORT",
        icon: DownArrow
    },
    {
        displayName: "Ratings 4.0+",
        key: "RATING",
        value: 4
    },
    {
        displayName: "Cuisines",
        key: "CUISINES",
        icon: DownArrow
    }
];

// Optimized: Wrapped in React.memo to avoid unnecessary re-renders
const CommonRestaurantSection = React.memo(({ title, restaurants, handleMapModal, onFavoriteClick, promotions, index }) => {
    const { t } = useTranslation();
    const animationClass = index % 2 === 0 ? 'slide-left' : 'slide-right';
    return (
        <div className={`mt-4 ${animationClass}`}>
            <div className='d-flex align-items-center justify-content-center pd-horizontal'>
                <img className='line' src={LeftLine} alt="line" />
                <p className='heading m-fs semiBold-fw mx-2 text-nowrap'>{title}</p>
                <img className='line' src={RightLine} alt="line" />
            </div>
            <div className='d-flex overflow-auto hide-scroll-bar pd-horizontal mt-3'>
                {restaurants?.map((el, i) => {
                    return (
                        <div key={i} className='card-spacing' onClick={() => handleMapModal(el?._id)}>
                            <CardImage props={{
                                type: "custom",
                                height: 155,
                                width: 131,
                                img: el?.image,
                                isFavorite: el.isFavorite,
                                favoriteCount: el?.favoriteCount,
                                campaigns: el?.campaigns,
                                promotions: promotions,
                                onFavoriteClick: () => onFavoriteClick(el._id)
                            }} />
                            <div className='card-content-1'>
                                <p className='l-fs bold-fw black-text text-ellipsis'>{el?.name}</p>
                                <div className='d-flex align-items-center my-1'>
                                    <img className='star' src={Star} alt="star" />
                                    {el?.reviewAverage && el?.reviewAverage > 0 ?
                                        <div className='d-flex align-items-center ps-1'>
                                            <p className='content-fontsize bold-fw black-text'>{ratingStructure(el?.reviewAverage) || 0}</p>
                                            <p className='content-fontsize bold-fw black-text ms-1'>({numberToK(el?.reviewCount) || 0})</p>
                                        </div> :
                                        <div className='ps-1'>
                                            <p className='content-fontsize bold-fw black-text'>{t("common.new")}</p>
                                        </div>
                                    }
                                    <img className='dot mx-1' src={Dot} alt="dot" />
                                    <p className='black-text bold-fw content-fontsize'>{metersToKilometers(el?.distanceInMeters)} {t("common.km")}</p>
                                </div>
                                <p className='black-text normal-fw s-fs text-ellipsis'>{el?.cuisines?.join(', ')}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
});

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const Home = () => {
    const windowHeight = window.innerHeight;
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { userDetails, setUserDetails, zoneData, setZoneData, setIdentifier, identifier } = useContext(Context);
    const { cart } = useContext(UserContext);
    const [isMapActive, setIsMapActive] = useState(true);
    const [isMapLoader, setIsMapLoader] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [mapSelectedFilters, setMapSelectedFilters] = useState({});
    const [popularRestaurants, setPopularRestaurants] = useState([]);
    const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
    const [recentRestaurants, setRecentRestaurants] = useState([]);
    const [allRestaurants, setAllRestaurants] = useState([]);
    const [organizedSections, setOrganizedSections] = useState([]);
    const [mapBounds, setMapBounds] = useState([]);
    const [mapModalData, setMapModalData] = useState({});
    const [selectedLocation, setSelectedLocation] = useState(null);
    const section4Ref = useRef(null);
    const [checkAllApiStatusFailed, setCheckAllApiStatusFailed] = useState({
        favourie: false,
        popular: false,
        recent: false,
        all: false
    });
    const [toggleFavoriteMutation] = useMutation(TOGGLEFAVORITE);
    const [toggleConsentMutation] = useMutation(TOGGLECONSENT);
    const [openSheet, setOpenSheet] = useState(false)
    const [openMapSheet, setOpenMapSheet] = useState(false)
    const [selectedOption, setSelectedOption] = useState({})
    const [mapSelectedOption, setMapSelectedOption] = useState({})
    const [type, setType] = useState('')
    const [filterLoading, setFilterLoading] = useState(false)
    const [mapFilterLoading, setMapFilterLoading] = useState(false)
    const [cuisinesData, setCuisinesData] = useState([])
    const [bannersData, setBannersData] = useState([])
    const [promotionsData, setPromotionsData] = useState([])
    const [isMapFilterBounds, setIsMapFilterBounds] = useState(false);
    const [isCompliance, setIsCompliance] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const client = useApolloClient();
    const { bootstrapData } = useContext(BootstrapContext);

    // Added chunking variables and state for visible restaurants
    const INITIAL_CHUNK_SIZE = 10; // Show 10 restaurants immediately
    const SUBSEQUENT_CHUNK_SIZE = 25; // Then load 25 at a time
    const [visibleRestaurants, setVisibleRestaurants] = useState([]);

    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setSelectedLocation(response)
        })();
    }, []);

    useEffect(() => {
        if (openSheet || isModalVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [openSheet, isModalVisible]);

    // GET user details
    const { loading: profileLoading } = useQuery(PROFILE, {
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            setUserDetails(data?.profile || {});
        },
        skip: userDetails
    });

    useEffect(() => {
        if (bootstrapData?.cuisines?.length) {
            setCuisinesData(bootstrapData?.cuisines)
        }
        if (bootstrapData?.banners && bootstrapData?.banners?.length) {
            setBannersData(bootstrapData?.banners)
        }
        if (bootstrapData?.promotions && bootstrapData?.promotions?.length) {
            setPromotionsData(bootstrapData?.promotions)
        }
        if (bootstrapData?.currencyConfig && bootstrapData?.currencyConfig?.currencySymbol) {
            localStorage.setItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL, bootstrapData?.currencyConfig?.currencySymbol)
        }
    }, [bootstrapData]);

    const { data } = useQuery(ZONECHECK, {
        variables: {
            inputValues: {
                longitude: Number(selectedLocation?.longitude),
                latitude: Number(selectedLocation?.latitude)
            }
        },
        skip: (zoneData?.length || !selectedLocation?.longitude || !selectedLocation?.latitude)
    })

    useEffect(() => {
        if (data && data?.checkZoneRestrictions) {
            const { fallbackZoneDetails, selectedZoneDetails } = data?.checkZoneRestrictions
            if (fallbackZoneDetails) {
                setZoneData(fallbackZoneDetails?.coordinates[0])
                setIdentifier(fallbackZoneDetails?.identifier)
            }
            else if (selectedZoneDetails) {
                setZoneData(selectedZoneDetails?.coordinates[0])
                setIdentifier(selectedZoneDetails?.identifier)
            }
        }
    }, [data])

    useEffect(() => {
        if (!userDetails?.consentInfo || !bootstrapData?.activeConsentDocData) return;
        const consentResult = userDetails?.consentInfo?.find(consent => consent.docVersionId === bootstrapData?.activeConsentDocData?.docVersionId);
        if (!consentResult) {
            setIsCompliance(true);
        }
    }, [userDetails?.consentInfo, bootstrapData?.activeConsentDocData])

    const { loading } = useQuery(COMBINED_RESTAURANTS_QUERY, {
        variables: {
            distance: HOME_API_PARAMETERS.DISTANCE,
            limit: HOME_API_PARAMETERS.LIMIT,
            longitude: Number(selectedLocation?.longitude),
            latitude: Number(selectedLocation?.latitude),
            zoneIdentifier: identifier
        },
        skip: !selectedLocation?.longitude || !selectedLocation?.latitude || !identifier,
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: 'cache-only',
        onCompleted: (data) => {
            // setIsMapLoader(true);

            // Process popular restaurants
            if (data?.popularRestaurants?.restaurants) {
                const restaurants = data.popularRestaurants.restaurants;
                prefetchImages(
                    restaurants.map(restaurant => restaurant.image).filter(Boolean)
                ).catch(error => {
                    console.error('Error prefetching popular restaurant images:', error);
                });
                const matchedRestaurants = matchCampaignsWithRestaurants(
                    restaurants,
                    data.popularRestaurants.campaigns
                );
                setPopularRestaurants(updateRestaurantFavoriteStatus(matchedRestaurants));
            }

            // Process favorite restaurants
            if (data?.favoriteRestaurants?.restaurants) {
                const restaurants = data.favoriteRestaurants.restaurants;
                prefetchImages(
                    restaurants.map(restaurant => restaurant.image).filter(Boolean)
                ).catch(error => {
                    console.error('Error prefetching favorite restaurant images:', error);
                });
                const matchedRestaurants = matchCampaignsWithRestaurants(
                    restaurants,
                    data.favoriteRestaurants.campaigns
                );
                setFavoriteRestaurants(updateRestaurantFavoriteStatus(matchedRestaurants));
            }

            // Process recent restaurants
            if (data?.recentRestaurants?.restaurants) {
                const restaurants = data.recentRestaurants.restaurants;
                prefetchImages(
                    restaurants.map(restaurant => restaurant.image).filter(Boolean)
                ).catch(error => {
                    console.error('Error prefetching recent restaurant images:', error);
                });
                const matchedRestaurants = matchCampaignsWithRestaurants(
                    restaurants,
                    data.recentRestaurants.campaigns
                );
                setRecentRestaurants(updateRestaurantFavoriteStatus(matchedRestaurants));
            }
            // Process all restaurants, sections, and offers
            if (data?.allRestaurants?.restaurants) {
                const restaurants = data.allRestaurants.restaurants;
                // Prefetch images for initial chunk
                const initialChunk = restaurants.slice(0, INITIAL_CHUNK_SIZE);
                enhancedImageCache.prefetchImages(
                    initialChunk.map(restaurant => restaurant.image).filter(Boolean)
                ).catch(error => {
                    console.error('Error prefetching all restaurant images:', error);
                });
                const matchedRestaurants = matchCampaignsWithRestaurants(
                    restaurants,
                    data.allRestaurants.campaigns
                );
                const modifiedRestaurants = updateRestaurantFavoriteStatus(matchedRestaurants);
                setAllRestaurants(modifiedRestaurants);
                setVisibleRestaurants(modifiedRestaurants.slice(0, INITIAL_CHUNK_SIZE));
                const loadChunks = async () => {
                    for (let i = INITIAL_CHUNK_SIZE; i < modifiedRestaurants.length; i += SUBSEQUENT_CHUNK_SIZE) {
                        const chunk = modifiedRestaurants.slice(i, i + SUBSEQUENT_CHUNK_SIZE);
                        const imageUrls = chunk.map(r => r.image).filter(Boolean);
                        try {
                            await enhancedImageCache.prefetchImages(imageUrls);
                        } catch (error) {
                            console.error("Error prefetching chunk images:", error);
                        }
                        setVisibleRestaurants(prev => [...prev, ...chunk]);
                    }
                };
                loadChunks();

                // Set map bounds
                const bounds = getBounds(modifiedRestaurants);
                setMapBounds(bounds);

                // Process sections
                if (data.allRestaurants.sections) {
                    const organized = data.allRestaurants.sections.reduce((acc, section) => {
                        const sectionRestaurants = modifiedRestaurants.filter(restaurant =>
                            section.restaurants.includes(restaurant._id)
                        );
                        if (sectionRestaurants.length > 0) {
                            acc.push({
                                sectionName: section.name,
                                restaurants: sectionRestaurants
                            });
                        }
                        return acc;
                    }, []);
                    setOrganizedSections(organized);
                }
            }
            setCheckAllApiStatusFailed({
                // favourite: !data?.favoriteRestaurants?.restaurants?.length,
                // popular: !data?.popularRestaurants?.restaurants?.length,
                // recent: !data?.recentRestaurants?.restaurants?.length,
                all: !data?.allRestaurants?.restaurants?.length
            });
            // setIsMapLoader(false);
        }
    });


    const matchCampaignsWithRestaurants = (restaurants, campaigns) => {
        const campaignsByRestaurant = campaigns.reduce((acc, campaign) => {
            const restaurantId = campaign.restaurant;
            if (!acc[restaurantId]) {
                acc[restaurantId] = [];
            }
            acc[restaurantId].push(campaign);
            return acc;
        }, {});

        return restaurants.map(restaurant => ({
            ...restaurant,
            campaigns: campaignsByRestaurant[restaurant._id] || []
        }));
    };

    const updateRestaurantFavoriteStatus = (restaurants) => {
        return restaurants.map(restaurant => ({
            ...restaurant,
            isFavorite: userDetails?.favourite?.includes(restaurant._id)
        }));
    };

    useEffect(() => {
        if (userDetails?.favourite) {
            setPopularRestaurants(prev => updateRestaurantFavoriteStatus(prev));
            setFavoriteRestaurants(prev => updateRestaurantFavoriteStatus(prev));
            setRecentRestaurants(prev => updateRestaurantFavoriteStatus(prev));
            setAllRestaurants(prev => updateRestaurantFavoriteStatus(prev));
            setVisibleRestaurants(prev => updateRestaurantFavoriteStatus(prev));
            setOrganizedSections(prev => prev.map(section => ({
                ...section,
                restaurants: updateRestaurantFavoriteStatus(section.restaurants)
            })));
        }
    }, [userDetails?.favourite]);

    const handleFilterSelection = (key, value) => {
        key = SORTING_FILTER_ENUMS[key]
        if (!key) {
            return;
        }
        if (key === "rating") {
            let res = { ...(selectedFilters || {}), filter: { ...selectedFilters?.filter, rating: value } }
            setSelectedFilters(res)
            onHandleApplyFilter(res)
            return;
        }
        setType(key)
        setSelectedOption(selectedFilters[key])
        setOpenSheet(true)
    };

    const navigateToSingleRestaurant = (restaurant) => {
        localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({
            _id: restaurant._id,
            slug: restaurant.slug
        }));
        navigate(routeName.RESTAURANT);
    };

    const handleToggleFavorite = async (restaurantId) => {
        try {
            const { data } = await toggleFavoriteMutation({
                variables: { toggleFavoriteId: restaurantId }
            });
            if (!data || !data?.toggleFavorite?.favourite) {
                return;
            }
            const updateRestaurantList = (restaurants) => {
                return restaurants.map(restaurant => {
                    if (restaurant._id === restaurantId) {
                        return {
                            ...restaurant,
                            isFavorite: !restaurant.isFavorite,
                            favoriteCount: restaurant.isFavorite
                                ? restaurant.favoriteCount - 1
                                : restaurant.favoriteCount + 1
                        };
                    }
                    return restaurant;
                });
            };

            setPopularRestaurants(prev => updateRestaurantList(prev));
            setFavoriteRestaurants(prev => updateRestaurantList(prev));
            setRecentRestaurants(prev => updateRestaurantList(prev));
            setAllRestaurants(prev => updateRestaurantList(prev));
            setVisibleRestaurants(prev=>updateRestaurantList(prev))
            setOrganizedSections(prev => prev.map(section => ({
                ...section,
                restaurants: updateRestaurantList(section.restaurants)
            })));
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleMapModal = async (restaurantId) => {
        let res = allRestaurants?.find(restaurant => restaurant?._id === restaurantId);
        setMapModalData(res)
        setIsModalVisible(true);
    };

    const getBounds = (restaurants) => {
        if (!restaurants || restaurants.length === 0) return [];
        return restaurants.map(restaurant => ({
            coords: {
                lat: Number(restaurant?.location?.coordinates[1]),
                lng: Number(restaurant?.location?.coordinates[0])
            },
            isUser: false,
            restaurantInfo: {
                _id: restaurant._id,
                name: restaurant.name,
                slug: restaurant.slug,
                address: restaurant.address,
                distanceInMeters: restaurant?.distanceInMeters,
                onboarded: restaurant?.onboarded,
                isAvailable: restaurant?.isAvailable,
                campaigns: restaurant?.campaigns
            }
        }));
    };

    const verifyAllData = (data) => {
        for (const key in data) {
            if (!data[key]) {
                continue;
            }
            return true;
        }
    };

    const checkFilterOrSortApplied = (data, el) => {
        const filterKey = SORTING_FILTER_ENUMS[el?.key];
        if (!data || !el || !filterKey) return false;
        if (filterKey === "rating") {
            return data?.filter?.rating === 4 ? 'rating' : false;
        }
        const filterValue = data[filterKey];
        if (!filterValue) return false;
        return typeof filterValue === 'object' && filterValue !== null
            ? Object.keys(filterValue).length
            : true;
    };

    const onHandleApplyFilter = async (filters) => {
        let payload = {
            "distance": HOME_API_PARAMETERS.DISTANCE,
            "limit": HOME_API_PARAMETERS.LIMIT,
            "location":[Number(selectedLocation?.longitude), Number(selectedLocation?.latitude)],
            // "longitude": Number(selectedLocation?.longitude),
            // "latitude": Number(selectedLocation?.latitude),
            // "zoneIdentifier": identifier
        };

        for (const key in filters) {
            if (filters[key]) {
                if (typeof filters[key] === 'object' && key !== 'cuisines') {
                    let new_key = filters[key]
                    for (const subKey in new_key) {
                        if (new_key[subKey] === "reviewAverage") {
                            payload['sortOrder'] = "desc"
                        }
                        payload[subKey] = new_key[subKey]
                    }
                } else {
                    payload[key] = filters[key]
                }
            }
        }
        setFilterLoading(true)
        let query = await client.query({
            query: RESTAURANTS,
            variables: {
                ...payload
            },
            fetchPolicy: 'network-only'
        });
        if (query?.loading) {
            return;
        }
        if (!query?.data?.nearByRestaurantsNewV2?.restaurants?.length) {
            setAllRestaurants([]);
            setFilterLoading(false);
            return;
        }
        let restaurantData = matchCampaignsWithRestaurants(query?.data?.nearByRestaurantsNewV2?.restaurants, query?.data?.nearByRestaurantsNewV2?.campaigns);
        restaurantData = await updateRestaurantFavoriteStatus(restaurantData);
        if (filters?.filter?.campaign) {
            const processedRestaurants = restaurantData
                .map(restaurant => {
                    if (!restaurant?.campaigns?.length) return restaurant;
                    const processedRestaurant = { ...restaurant };
                    restaurant.campaigns.forEach(campaign => {
                        if (campaign?.promotion) {
                            const matchingPromotion = promotionsData?.find(
                                promo => promo._id === campaign.promotion
                            );
                            if (matchingPromotion?.baseCode) {
                                processedRestaurant.baseCode = matchingPromotion.baseCode;
                            }
                        }
                    });
                    return processedRestaurant;
                }).filter(restaurant => restaurant.baseCode);
            if (!processedRestaurants?.length) {
                setAllRestaurants([]);
                setFilterLoading(false);
                return;
            }
            restaurantData = processedRestaurants?.filter(item => item?.baseCode === filters?.filter?.campaign);
            if (!restaurantData?.length) {
                setAllRestaurants(restaurantData);
                setFilterLoading(false);
                return;
            }
        }
        setAllRestaurants(restaurantData);
        setFilterLoading(false);
    };

    const onHandleApplyMapFilter = async (filters) => {
        setMapFilterLoading(true);
        if (filters?.mapFilter?.distance) {
            let payload = {
                "distance": filters?.mapFilter?.distance,
                "limit": HOME_API_PARAMETERS.LIMIT,
                "longitude": Number(selectedLocation?.longitude),
                "latitude": Number(selectedLocation?.latitude),
                "zoneIdentifier": identifier
            };
            let query = await client.query({
                query: RESTAURANTS,
                variables: {
                    ...payload
                },
                fetchPolicy: 'network-only'
            });
            if (query?.loading) {
                return;
            }
            if (!query?.data?.nearByRestaurantsNewV2?.restaurants?.length) {
                return setMapBounds([]);
            }
            const matchCampaignsResult = matchCampaignsWithRestaurants(query?.data?.nearByRestaurantsNewV2?.restaurants, query?.data?.nearByRestaurantsNewV2?.campaigns);
            const restaurantData = await updateRestaurantFavoriteStatus(matchCampaignsResult);
            await onHandleMapFilterChange(filters?.mapFilter, restaurantData);
        } else {
            if (!allRestaurants?.length) {
                return setMapBounds([]);
            }
            await onHandleMapFilterChange(filters?.mapFilter, allRestaurants);
        }
        setMapFilterLoading(false);
    };

    const onHandleMapFilterChange = async (filters, restaurants) => {
        setIsMapFilterBounds(false);
        if (filters?.options === "following") {
            let filteredData = restaurants?.filter(restaurant => restaurant?.isFavorite);
            restaurants = filteredData;
            if (!restaurants?.length) {
                return setMapBounds([]);
            }
        }
        if (filters?.options === "closed") {
            let filteredData = restaurants?.filter(restaurant => (restaurant?.onboarded && !restaurant?.isAvailable));
            restaurants = filteredData;
            if (!restaurants?.length) {
                return setMapBounds([]);
            }
        }
        if (filters?.offers) {
            restaurants = await processAndGetBounds(restaurants);
            if (!restaurants?.length) {
                return setMapBounds([]);
            }
            restaurants = restaurants?.filter(item => item?.restaurantInfo?.baseCode === filters?.offers);
            if (!restaurants?.length) {
                return setMapBounds([]);
            }
            setIsMapFilterBounds(true);
            return setMapBounds(restaurants);
        }
        const bounds = getBounds(restaurants);
        setMapBounds(bounds);
    };

    const processAndGetBounds = (restaurants) => {
        if (!restaurants || !promotionsData) return [];
        const processedRestaurants = restaurants.map(restaurant => {
            if (!restaurant?.campaigns?.length) return restaurant;
            const processedRestaurant = { ...restaurant };
            restaurant.campaigns.forEach(campaign => {
                if (campaign?.promotion) {
                    const matchingPromotion = promotionsData?.find(
                        promo => promo._id === campaign.promotion
                    );
                    if (matchingPromotion?.baseCode) {
                        processedRestaurant.baseCode = matchingPromotion.baseCode;
                    }
                }
            });
            return processedRestaurant;
        });
        return processedRestaurants.map(restaurant => ({
            coords: {
                lat: Number(restaurant?.location?.coordinates[1]),
                lng: Number(restaurant?.location?.coordinates[0])
            },
            isUser: false,
            restaurantInfo: {
                _id: restaurant._id,
                name: restaurant.name,
                slug: restaurant.slug,
                address: restaurant.address,
                distanceInMeters: restaurant?.distanceInMeters,
                onboarded: restaurant?.onboarded,
                isAvailable: restaurant?.isAvailable,
                campaigns: restaurant?.campaigns,
                ...(restaurant.baseCode && { baseCode: restaurant.baseCode })
            }
        }));
    };

    const formatTimeTo12Hour = (timeInput) => {
        let hours, minutes;

        // Check if the input is in array format (e.g., ['04', '30']) or string format (e.g., ['03:00'])
        if (Array.isArray(timeInput)) {
            if (timeInput.length === 2) {
                hours = parseInt(timeInput[0]);
                minutes = parseInt(timeInput[1]);
            } else if (timeInput.length === 1) {
                const [hourMinuteString] = timeInput[0].split(':');
                hours = parseInt(hourMinuteString);
                minutes = parseInt(timeInput[0].split(':')[1] || "00");
            }
        } else {
            return ""; // Invalid format
        }

        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHour = hours % 12 === 0 ? 12 : hours % 12; // Convert 0 or 12 to 12
        return `${formattedHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getOpeningStatus = (data) => {
        // Check if the restaurant is available
        if (!data?.isAvailable) {
            return { message: t('home.closed') };
        }

        // Check for opening times
        if (!data?.openingTimes || !Array.isArray(data.openingTimes) || data.openingTimes.length === 0) {
            return { message: t('home.closed') };
        }

        const currentDate = new Date();
        const currentDay = currentDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(); // E.g., "WED"
        const currentTimeInMinutes = currentDate.getHours() * 60 + currentDate.getMinutes(); // Current time in minutes

        // Find the matching day object
        const currentDayOpening = data.openingTimes.find(day => day.day === currentDay);

        // Check for open intervals
        let isOpenNow = false;
        let nextOpenTimeMessage = '';

        // First, check if the restaurant is open today
        if (currentDayOpening && currentDayOpening.isOpen) {
            let todayNextOpening = null;
            for (const time of currentDayOpening.times) {
                const startTimeInMinutes = parseInt(time?.startTime[0]) * 60 + parseInt(time?.startTime[1]);
                const endTimeInMinutes = parseInt(time?.endTime[0]) * 60 + parseInt(time?.endTime[1]);

                // Check if the restaurant is currently open
                if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
                    isOpenNow = true;
                    break; // The restaurant is currently open
                }
                if (currentTimeInMinutes < startTimeInMinutes && !todayNextOpening) {
                    todayNextOpening = startTimeInMinutes;
                    nextOpenTimeMessage = `Opens today at ${formatTimeTo12Hour(time.startTime)}`;
                }
            }
            if (!isOpenNow && todayNextOpening) {
                return { message: nextOpenTimeMessage };
            }
        }

        // If it's not open today, let's find the next opening day
        if (!isOpenNow) {
            for (let i = 1; i <= 7; i++) { // Check the next 7 days
                const futureDate = new Date(currentDate);
                futureDate.setDate(currentDate.getDate() + i);
                const futureDay = futureDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();

                const futureDayOpening = data.openingTimes.find(day => day.day === futureDay);
                if (futureDayOpening && futureDayOpening.isOpen && futureDayOpening.times?.length > 0) {
                    // Find the first opening time for this future day
                    const firstOpeningTime = futureDayOpening.times[0]; // Assuming sorted times
                    const formattedOpenTime = formatTimeTo12Hour(firstOpeningTime?.startTime);
                    // console.log(futureDayOpening.times, data?.name)
                    nextOpenTimeMessage = `${t('timings.openson', { day: futureDay })} ${t('timings.at')} ${formattedOpenTime}`;
                    break; // We've found the next open day
                }
            }

            if (nextOpenTimeMessage) {
                return { message: nextOpenTimeMessage };
            } else {
                return { message: t('timings.closedforthisweek') };
            }
        }
    };

    const handleAgree = async () => {
        if (btnLoader) return;
        setBtnLoader(true);
        try {
            await toggleConsentMutation({
                variables: { docVersionId: bootstrapData?.activeConsentDocData?.docVersionId }
            });
            setIsCompliance(false);
        } catch (error) {
            console.log(error);
            showErrorToast(error?.graphQLErrors?.[0]?.message || t("home.consentError"));
        } finally {
            setBtnLoader(false);
        }
    };

    return (
        <div className='position-relative'>
            <Header
                searchPlaceholders={bootstrapData?.homeSearchPlaceholder}
                isMapActive={isMapActive}
                height={!isMapActive ? 146 : 80}
            />

            <div className='overflow-hidden'>

                {/* Home View – Always rendered; visibility toggled via inline style */}
                <div style={{ display: isMapActive ? 'none' : 'block' }}>
                    {!verifyAllData(checkAllApiStatusFailed) ? <div>

                        {/* banner section */}
                        {bannersData && bannersData?.length > 0 && <div className="slide-down-banner" style={{ width: "100%" }}>
                            <Banners data={bannersData} />
                        </div>}

                        {/* section 1 */}
                        {false && favoriteRestaurants?.length > 0 && <div className='mt-4'>
                            <div className='d-flex align-items-center justify-content-center pd-horizontal'>
                                <img className='line' src={LeftLine} alt="line" />
                                <p className='heading m-fs semiBold-fw mx-2 text-nowrap'>{t("home.peopleFavorite")}</p>
                                <img className='line' src={RightLine} alt="line" />
                            </div>
                            <div className='d-flex overflow-auto hide-scroll-bar pd-horizontal mt-3'>
                                {favoriteRestaurants?.map((el, i) => {
                                    return (
                                        <div key={i} className='card-spacing' onClick={() => navigateToSingleRestaurant(el)}>
                                            <CardImage props={{
                                                type: "favorite",
                                                height: 155,
                                                width: 131,
                                                img: el?.image,
                                                isFavorite: el.isFavorite,
                                                favoriteCount: el?.favoriteCount,
                                                campaigns: el?.campaigns,
                                                promotions: promotionsData,
                                                onFavoriteClick: () => handleToggleFavorite(el._id)
                                            }} />
                                            <div className='card-content-1'>
                                                <p className='l-fs bold-fw black-text text-ellipsis'>{el?.name}</p>
                                                <div className='d-flex align-items-center'>
                                                    <img className='star' src={Star} alt="star" />
                                                    {el?.reviewAverage && el?.reviewAverage > 0 ?
                                                        <div className='d-flex align-items-center ps-1'>
                                                            <p className='s-fs bold-fw black-text'>{ratingStructure(el?.reviewAverage) || 0}</p>
                                                            <p className='s-fs bold-fw black-text ms-1'>({numberToK(el?.reviewCount) || 0})</p>
                                                        </div> :
                                                        <div className='ps-1'>
                                                            <p className='s-fs bold-fw black-text'>{t("common.new")}</p>
                                                        </div>
                                                    }
                                                    <img className='dot mx-1' src={Dot} alt="dot" />
                                                    <p className='black-text bold-fw s-fs'>{metersToKilometers(el?.distanceInMeters)} {t("common.km")}</p>
                                                </div>
                                                <p className='black-text normal-fw s-fs text-ellipsis'>{el?.cuisines?.join(', ')}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>}

                        {/* section 2 */}
                        {false && popularRestaurants?.length > 0 && <div className='mt-5'>
                            <div className='d-flex align-items-center justify-content-center pd-horizontal'>
                                <img className='line' src={LeftLine} alt="line" />
                                <p className='heading m-fs semiBold-fw mx-2 text-nowrap'>{t("home.inTheSpotlight")}</p>
                                <img className='line' src={RightLine} alt="line" />
                            </div>
                            <div className='d-flex overflow-auto hide-scroll-bar pd-horizontal mt-3'>
                                {popularRestaurants?.map((el, i) => {
                                    return (
                                        <div key={i} className='card-spacing' onClick={() => navigateToSingleRestaurant(el)}>
                                            <CardImage props={{
                                                type: "popular",
                                                height: 155,
                                                width: 237,
                                                img: el?.image,
                                                isFavorite: el.isFavorite,
                                                favoriteCount: el?.favoriteCount,
                                                campaigns: el?.campaigns,
                                                promotions: promotionsData,
                                                onFavoriteClick: () => handleToggleFavorite(el._id)
                                            }} />
                                            <div className='card-content-2'>
                                                <div className='d-flex align-items-center justify-content-between'>
                                                    <p className='l-fs bold-fw black-text text-ellipsis' style={{ width: "65%" }}>{el?.name}</p>
                                                    <div className='d-flex align-items-center me-1'>
                                                        <img className='star' src={Star} alt="star" />
                                                        {el?.reviewAverage && el?.reviewAverage > 0 ?
                                                            <div className='d-flex align-items-center ps-1'>
                                                                <p className='s-fs bold-fw black-text'>{ratingStructure(el?.reviewAverage) || 0}</p>
                                                                <p className='s-fs bold-fw black-text ms-1'>({numberToK(el?.reviewCount) || 0})</p>
                                                            </div> :
                                                            <div className='ps-1'>
                                                                <p className='s-fs bold-fw black-text'>{t("common.new")}</p>
                                                            </div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>}

                        {/* section 3 */}
                        {false && recentRestaurants?.length > 0 && <div className='mt-5 py-4 section-3-bg'>
                            <div className='d-flex align-items-center justify-content-center pd-horizontal'>
                                <img className='line' src={LeftLine} alt="line" />
                                <p className='heading m-fs semiBold-fw mx-2 text-nowrap'>{t("home.newlyAdded")}</p>
                                <img className='line' src={RightLine} alt="line" />
                            </div>
                            <div className='d-flex overflow-auto hide-scroll-bar pd-horizontal mt-3'>
                                {recentRestaurants?.map((el, i) => {
                                    return (
                                        <div key={i} className='card-spacing' onClick={() => navigateToSingleRestaurant(el)}>
                                            <CardImage props={{
                                                type: "recent",
                                                height: 155,
                                                width: 156,
                                                img: el?.image,
                                                isFavorite: el.isFavorite,
                                                favoriteCount: el?.favoriteCount,
                                                campaigns: el?.campaigns,
                                                promotions: promotionsData,
                                                onFavoriteClick: () => handleToggleFavorite(el._id),
                                                // isNew: true
                                            }} />
                                            <div className='card-content-3'>
                                                <p className='l-fs bold-fw black-text text-ellipsis'>{el?.name}</p>
                                                <div className='d-flex align-items-center'>
                                                    <p className='black-text semiBold-fw m-fs text-nowrap'>{metersToKilometers(el?.distanceInMeters)} {t("common.km")}</p>
                                                    <img className='dot mx-1' src={Dot} alt="dot" />
                                                    <p className='black-text normal-fw s-fs text-ellipsis'>{el?.cuisines?.join(', ')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>}

                        {organizedSections?.map((section, index) => (
                            <CommonRestaurantSection
                                key={index}
                                index={index}
                                title={section?.sectionName}
                                restaurants={section?.restaurants}
                                navigateToSingleRestaurant={navigateToSingleRestaurant}
                                onFavoriteClick={handleToggleFavorite}
                                promotions={promotionsData}
                                handleMapModal={handleMapModal}
                            />
                        ))}

                        {/* Section 4 */}
                        <div className='mt-4' ref={section4Ref}>
                            <div className='d-flex align-items-center justify-content-center pd-horizontal mb-3'>
                                <img className='line' src={LeftLine} alt="line" />
                                <p className='heading m-fs semiBold-fw mx-2 text-nowrap'>
                                    {allRestaurants.length} {t("home.restaurantsNearYou")}
                                </p>
                                <img className='line' src={RightLine} alt="line" />
                            </div>
                            {false && <div className='d-flex align-items-center overflow-auto hide-scroll-bar pd-horizontal'>
                                {filters?.map((el, i) => {
                                    let isApplied = checkFilterOrSortApplied(selectedFilters, el);
                                    return (
                                        <div
                                            key={i}
                                            className={`${isApplied ? "filter-pill-selected1" : "filter-pill1"} d-flex align-items-center justify-content-center me-2`}
                                            onClick={() => handleFilterSelection(el?.key, el?.value)}>
                                            {/* Show the pill only if isApplied is a number (object length) */}
                                            {typeof isApplied === "number" && isApplied > 0 && (
                                                <div
                                                    style={{ height: 17, width: 17 }}
                                                    className="d-flex align-items-center justify-content-center secondary-bgcolor rounded-pill me-1 text-white fw-semiBold"
                                                >
                                                    <p style={{ fontSize: 10 }}>{isApplied}</p>
                                                </div>
                                            )}
                                            <p
                                                className={` m-fs me-1 normal-fw text-nowrap`}
                                            >
                                                {el?.displayName}
                                            </p>
                                            {el?.icon ? <img alt="filter icon" src={el?.icon} /> : null}
                                            {isApplied === 'rating' && (
                                                <button
                                                    className="rating-clear-btn border-0 rounded-pill"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newFilters = { ...selectedFilters };
                                                        if (newFilters.filter) {
                                                            delete newFilters.filter.rating;
                                                        }
                                                        setSelectedFilters(newFilters);
                                                        onHandleApplyFilter(newFilters)
                                                    }}
                                                >
                                                    <img src={Close} alt='close' height={13} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>}
                            {filterLoading ? <div className='mt-3 d-flex justify-content-center'><Loader /></div> :
                                visibleRestaurants?.length > 0 ? <div className='pd-horizontal mt-3'>
                                    {visibleRestaurants?.map((el, i) => {
                                        let openingDetails = getOpeningStatus(el);
                                        let offerData = {};
                                        let giftData = null;
                                        if (el?.campaigns && el?.campaigns?.length === 1) {
                                            let offer = el?.campaigns[0];
                                            if (offer?.promotion) {
                                                let res = promotionsData?.find(promotion => promotion?._id === offer?.promotion);
                                                offerData['name'] = res?.displayName;
                                                offerData['baseCode'] = res?.baseCode;
                                                offerData['startTime'] = offer?.startTime;
                                                offerData['endTime'] = offer?.endTime;
                                                if (offerData.baseCode === MAP_CAMPAIGN_TYPE.HAPPYHOURS) {
                                                    giftData = FireGif;
                                                } else if (offerData.baseCode === MAP_CAMPAIGN_TYPE.SPECIALDAY) {
                                                    giftData = StarGif;
                                                } else {
                                                    giftData = HatGif;
                                                }
                                            }
                                        }
                                        const animationClass = i % 2 === 0 ? 'slide-left' : 'slide-right';
                                        return (
                                            <div key={i} className={`section-4-card d-flex align-items-center justify-content-between mb-4 ${animationClass}`} onClick={() => handleMapModal(el?._id)}>
                                                <CardImage props={{
                                                    type: "all",
                                                    height: 155,
                                                    width: "56%",
                                                    img: el?.image,
                                                    isFavorite: el.isFavorite,
                                                    favoriteCount: el?.favoriteCount,
                                                    campaigns: el?.campaigns,
                                                    promotions: promotionsData,
                                                    notAvailable: !el?.isAvailable,
                                                    onFavoriteClick: () => handleToggleFavorite(el._id),
                                                    openingDetails: openingDetails,
                                                }} />
                                                <div className='card-content-4'>
                                                    <p className='l-fs bold-fw black-text text-ellipsis'>{el?.name}</p>
                                                    <div className='d-flex align-items-center my-1'>
                                                        <img className='star' src={Star} alt="star" />
                                                        {el?.reviewAverage && el?.reviewAverage > 0 ?
                                                            <div className='d-flex align-items-center ps-1'>
                                                                <p className='content-fontsize bold-fw black-text'>{ratingStructure(el?.reviewAverage) || 0}</p>
                                                                <p className='content-fontsize bold-fw black-text ms-1'>({numberToK(el?.reviewCount) || 0})</p>
                                                            </div> :
                                                            <div className='ps-1'>
                                                                <p className='content-fontsize bold-fw black-text'>{t("common.new")}</p>
                                                            </div>
                                                        }
                                                        <img className='dot mx-1' src={Dot} alt="dot" />
                                                        <p className='black-text bold-fw content-fontsize'>{metersToKilometers(el?.distanceInMeters)} {t("common.km")}</p>
                                                    </div>
                                                    <p className='heading s-fs normal-fw text-ellipsis mb-1'>{el?.address}</p>
                                                    <p className='black-text normal-fw s-fs text-ellipsis'>{el?.cuisines?.join(', ')}</p>
                                                    {(el?.campaigns && el?.campaigns?.length === 1) && (Object.keys(offerData)?.length > 0) &&
                                                        <div className='mt-2 campaign-container px-1'>
                                                            <img className='icon-size' src={giftData} alt="gif" />
                                                            <div className='ms-1' style={{ width: "75%" }}>
                                                                <p className='m-fs black-fw white-text text-ellipsis'>{offerData?.name}</p>
                                                                {offerData?.baseCode === MAP_CAMPAIGN_TYPE.HAPPYHOURS && <p className='medium-fw white-text' style={{ fontSize: 10, lineHeight: 1 }}>{offerData?.startTime} - {offerData?.endTime}</p>}
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div> : <p className='l-fs mt-3 text-center mt-4'>{t("common.noDataAvailable")}</p>}
                        </div>

                        {isModalVisible && <div className='bg-dull' />}
                        <div style={{ height: windowHeight * 0.1 }}></div>

                    </div> : <div className='noData' style={{ height: "80vh" }}><p className='m-fs bold-fw placeholder-text'>{t("common.noData")}</p></div>}
                </div>

                {/* Map View – Always rendered; visibility toggled via inline style */}
                <div style={{ display: isMapActive ? 'block' : 'none' }}>
                    {(!loading && !isMapLoader && selectedLocation) ? <OpenStreetMap
                        key={mapFilterLoading}
                        isloading={mapFilterLoading}
                        type={MAP_TYPES.HOME}
                        height={window?.innerHeight - 80}
                        handleMapModal={handleMapModal}
                        promotionsData={promotionsData}
                        isCampaignApplied={isMapFilterBounds}
                        bounds={mapBounds}
                        userDetails={[
                            {
                                coords: {
                                    lat: Number(selectedLocation?.latitude),
                                    lng: Number(selectedLocation?.longitude)
                                },
                                isUser: true,
                                restaurantInfo: null
                            }
                        ]}
                    /> : <div className="home-page-loader">
                        <LottieAnimation
                            animationData={LoaderAnimation}
                            width={250}
                            height={250}
                            autoplay={true}
                            loop={true}
                        />
                        <p className='xl-fs bold-fw text-black mt-2'>{t("mapfilters.Loading")}</p>
                    </div>}
                </div>

                {/* Map floating button */}
                {(!isModalVisible && !loading && !isMapLoader && !mapFilterLoading) && (
                    <div>
                        {!isMapActive ? (
                            <div className='map' onClick={() => setIsMapActive(prev => !prev)} style={{ bottom: cart?.length > 0 ? "25%" : "15%" }}>
                                <p className='white-text m-fs normal-fw text-nowrap'>{t("home.map")}</p>
                                <img className='icon-size ms-2' src={Map} alt="star" />
                            </div>
                        ) : (
                            <div>
                                <div className='map' style={{ bottom: "22%" }} onClick={() => { setMapSelectedOption(mapSelectedFilters?.mapFilter); setOpenMapSheet(true) }}>
                                    <p className='white-text m-fs normal-fw text-nowrap'>{t("home.filter")}</p>
                                    <img className='icon-size ms-1' src={FadersWhite} alt="homeIcon" />
                                </div>
                                <div className='map' style={{ backgroundColor: "#7839EF", bottom: "15%" }} onClick={() => setIsMapActive(prev => !prev)}>
                                    <p className='white-text m-fs normal-fw text-nowrap'>{t("home.home")}</p>
                                    <img className='icon-size ms-1' src={HomeIcon} alt="homeIcon" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isMapActive && (
                    <Footer />
                )}

                {isModalVisible && (
                    <div className={`restaurant-card-container`} style={{ display: isModalVisible ? 'block' : 'none' }}>
                        <MapRestaurantCard
                            isCancel={true}
                            navigateTo={routeName.RESTAURANT}
                            setIsModalVisible={setIsModalVisible}
                            data={mapModalData}
                            promotionsData={promotionsData}
                            route={"home"}
                        />
                    </div>
                )}

                {cart?.length > 0 && !isMapActive &&
                    <CartCarousel cart={cart} />
                }

                {/* Home filters */}
                <SortFilter cuisinesData={cuisinesData} onHandleApplyFilter={onHandleApplyFilter} setIsOpen={setOpenSheet} selectedOption={selectedOption} setSelectedOption={setSelectedOption} isOpen={openSheet} filterKey={type} setSelectedFilters={setSelectedFilters} />

                {/* Map filters */}
                <SortFilter onHandleApplyFilter={onHandleApplyMapFilter} setIsOpen={setOpenMapSheet} selectedOption={mapSelectedOption} setSelectedOption={setMapSelectedOption} isOpen={openMapSheet} filterKey={"mapFilter"} setSelectedFilters={setMapSelectedFilters} />

                {isCompliance && (
                    <div className={`popup-bg-home ${isCompliance ? 'fade-in' : 'fade-out'}`}>
                        <div className="popup-container-home" onClick={e => e.stopPropagation()}>
                            <p className='l-fs normal-fw black-text px-4 mt-3' style={{ lineHeight: 1.8 }}>{t("common.termsLine1")} {t("common.termsLine3")} <span className='text-primary' style={{ textDecorationLine: "underline" }} onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink } })}>{t("common.tnc")}</span> {t("onboarding.and")} <span className='text-primary' style={{ textDecorationLine: "underline" }} onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink } })}>{t("common.privacyPolicy")}</span>.</p>
                            <div className='d-flex justify-content-end'>
                                <div style={{ width: "10%" }} />
                                <div className="d-flex align-items-center justify-content-between mt-4">
                                    <div style={{ width: "10%" }} />
                                    <div className='btn-cancel p-2 px-3' onClick={handleAgree} >
                                        {btnLoader ? <Spinner color="#000" size="24px" /> : <p className='l-fs semiBold-fw black-text'>{t('common.agree')}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

export default Home;
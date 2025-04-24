import React, { useCallback, useContext, useMemo, useRef, useState } from "react"
import ResturantHeader from "../../Components/RestaurantLevelHeader"
import Following from "../../assets/svg/following.svg"
import Followers from "../../assets/svg/followersgrey.svg"
import './style.css'
import { useEffect } from "react"
import { CartContext, Context } from "../../Context/Context"
import ItemLevelHorizontalCard from "../../Components/ItemLevelHorizantalCards"
import ItemLevelVerticalCard from "../../Components/ItemLevelVerticalCards"
import { useTranslation } from 'react-i18next';
import { Sheet } from "react-modal-sheet"
import Addons from "../../Components/Addons"
import Variations from "../../Components/Variations"
import CartBottomSheet from "../../Components/CartBottomSheet"
import Map from '../../assets/svg/map.svg'
import CloseMaps from "../../assets/svg/closemaps.svg"
import Close from "../../assets/svg/closebottomsheet.svg"
import Search from "../../assets/svg/search.svg"
import Bell from '../../assets/svg/Bell.svg'
import BellSlash from '../../assets/svg/BellSlash.svg'
import ArrowDownBlack from '../../assets/svg/arrowDownBlack.svg'
import Offer from '../../assets/svg/offerBlue.svg'
import ComingSoon from '../../assets/PNG/comingSoon.png'
import useRestaurant from "../../hooks/restaurantApi"
import { useLocation, useParams } from "react-router-dom"
import UserContext from "../../Context/User"
import Increment from "../../assets/svg/increment.svg"
import Decrement from "../../assets/svg/decrement.svg"
import Dot from "../../assets/svg/dot.svg"
import { CurrentLocationStorage, formatToGermanNumber, numberToK, prefetchImages } from "../../Utils"
import CartCarousel from "../../Components/Caurosel"
import { gql, useMutation, useQuery } from "@apollo/client"
import { getCampaignsByRestaurant, getRestaurantNotificationStatus, toggleFavorite, toggleRestaurantNotification } from "../../apollo/server"
import Loader from "../../Components/Loader/Loader"
import Spinner from "../../Components/Spinner/Spinner"
import Crying from "../../assets/Lottie/Crying.json"
import LottieAnimation from "../../Components/LottieAnimation/LottieAnimation"
import { useCartLogic } from "../../Hooks/cart";
import CaretRight from "../../assets/svg/caretright.svg"
import { LOCALSTORAGE_NAME, OFFERS_TYPE } from "../../constants/enums"
import OpenStreetMap from "../../Components/OpenStreetMap/OpenStreetMap"
import CELERY from '../../assets/allergenSvg/celery.svg'
import CRUSTACEANS from '../../assets/allergenSvg/crustaceans.svg'
import EGGS from '../../assets/allergenSvg/eggs.svg'
import FISH from '../../assets/allergenSvg/fish.svg'
import GLUTEN from '../../assets/allergenSvg/gluten.svg'
import LUPIN from '../../assets/allergenSvg/lupin.svg'
import MILK from '../../assets/allergenSvg/milk.svg'
import MOLLUSCS from '../../assets/allergenSvg/molluscs.svg'
import MUSTARD from '../../assets/allergenSvg/mustard.svg'
import PEANUTS from '../../assets/allergenSvg/peanuts.svg'
import SESAME_SEEDS from '../../assets/allergenSvg/seeds.svg'
import SOYBEANS from '../../assets/allergenSvg/soybeans.svg'
import SULPHUR_DIOXIDE from '../../assets/allergenSvg/sulphurDioxide.svg'
import TREE_NUTS from '../../assets/allergenSvg/treeNuts.svg'
import { showSuccessToast, showErrorToast } from '../../Components/Toast';
import transformRestaurantData from "./transformRestaurantData"
import PlaceholderImage from '../../assets/PNG/dishPlaceholder.webp'
import { BootstrapContext } from "../../Context/Bootstrap";
import QrModal from "../../Components/QrModal/index"
import { AiOutlineQrcode } from "react-icons/ai";


const TOGGLEFAVORITE = gql`${toggleFavorite}`;
const CAMPAIGNS = gql`${getCampaignsByRestaurant}`;
const TOGGLE_NOTIFICATION = gql`${toggleRestaurantNotification}`;
const NOTIFICATION_STATUS = gql`${getRestaurantNotificationStatus}`;
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const allergenIcons = { CELERY, CRUSTACEANS, EGGS, FISH, GLUTEN, LUPIN, MILK, MOLLUSCS, MUSTARD, PEANUTS, SESAME_SEEDS, SOYBEANS, SULPHUR_DIOXIDE, TREE_NUTS };

export const OfferCarousel = ({ campaignsData, icon, symbol }) => {
    const { t } = useTranslation()
    const [activeIndex, setActiveIndex] = useState(0);

    if (!campaignsData?.length) return null;

    const handleScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const itemWidth = e.target.offsetWidth;
        const newIndex = Math.round(scrollPosition / itemWidth);
        setActiveIndex(newIndex);
    };

    return (
        <div className="container-fluid py-3">
            <div className="position-relative">
                <div
                    className="position-absolute end-0 top-50 translate-middle-y d-flex flex-column align-items-center p-2"
                    style={{ width: '60px', height: "100%", zIndex: 100, backgroundColor: "rgba(250, 250, 249, 1)" }}
                >
                    <p className="mb-1 fw-bold">{activeIndex + 1}/{campaignsData.length}</p>
                    <div className="d-flex gap-1">
                        {campaignsData?.map((_, dotIndex) => (
                            <div
                                key={dotIndex}
                                className={`rounded-circle ${dotIndex === activeIndex ? 'bg-dark' : 'bg-disabled'}`}
                                style={{
                                    width: '5px',
                                    height: '5px',
                                    transition: 'background-color 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div
                    className="overflow-auto"
                    onScroll={handleScroll}
                    style={{
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        scrollSnapType: 'x mandatory'
                    }}
                >
                    <div className="d-flex">
                        {campaignsData.map((campaign, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 w-100"
                                style={{ scrollSnapAlign: 'start' }}
                            >
                                <div
                                    className="d-flex align-items-center p-2 mx-1 rounded"
                                    style={{ backgroundColor: "rgba(250, 250, 249, 1)" }}
                                >
                                    <img
                                        width={32}
                                        height={32}
                                        src={icon}
                                        alt="offer"
                                        className="flex-shrink-0"
                                    />
                                    <div className="mx-2 flex-grow-1" style={{ width: "73%" }}>
                                        <p className="mb-0 fw-bold text-truncate">
                                            {t('common.use')} "{campaign?.couponCode}" {t('common.get')} {campaign?.campaignType === OFFERS_TYPE.FLAT
                                                ? `${formatToGermanNumber(campaign?.flatDiscount)} ${symbol}`
                                                : `${campaign?.percentageDiscount} %`} {t('common.off')}
                                        </p>
                                        <p className="mb-0 small text-truncate text-muted">{t("restaurant.orderAbove")} {formatToGermanNumber(campaign?.minimumOrderValue)} {symbol}</p>
                                    </div>

                                    <div style={{ width: '60px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>
                {`
                    .overflow-auto::-webkit-scrollbar {
                        display: none;
                    }
                `}
            </style>
        </div>
    );
};

export default function Restaurant(props) {
    let restaurantDetails = localStorage.getItem(LOCALSTORAGE_NAME.RESTAURANT_ID);
    // console.log(restaurantDetails, "restaurantDetails")
    // restaurantDetails=restaurantDetails?JSON.parse(restaurantDetails):null;
    // try {
    //     if (restaurantDetails) {
    //         restaurantDetails = restaurantDetails;
    //     } else {
    //         // Handle missing restaurant ID
    //         restaurantDetails = null;
    //     }
    // } catch (error) {
    //     console.error('Error parsing restaurant details:', error);
    //     // If parsing fails, it might be just the ID string
    //     if (typeof restaurantDetails === 'string') {
    //         restaurantDetails = { _id: restaurantDetails };
    //     } else {
    //         restaurantDetails = null;
    //     }
    // }
    restaurantDetails = JSON.parse(restaurantDetails);
    console.log(restaurantDetails, "restaurantDetails")
    const { userDetails } = useContext(Context);
    const response = useRestaurant(restaurantDetails?._id, restaurantDetails?.slug);
    const [bootstrapData, setBootstrapData] = useState(null)
    const [customizedBottomSheet, setCustomizedBottomSheet] = useState(false)
    const [infoBottomSheet, setInfoBottomSheet] = useState(false)
    const [info, setInfo] = useState({});
    const { t } = useTranslation()
    const [step, setStep] = useState(1)
    const [menuCategories, setMenuCategories] = useState([])
    const [showMap, setShowMap] = useState(false)
    const [bounds, setBounds] = useState([])
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [unfollowPopup, setUnfollowPopup] = useState(false)
    const [isFollow, setIsFollow] = useState(false)
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
    const [filterTags, setFilterTags] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { cart } = useContext(UserContext);
    const [restaurantData, setRestaurantData] = useState([])
    const [placeholderData, setPlaceholderData] = useState(null);
    const [campaignsData, setCampaignsData] = useState([])
    const [interactionLoader, setInteractionLoader] = useState(0);
    const [followCount, setFollowCount] = useState(0);
    const [isNotify, setIsNotify] = useState(false);
    const [timings, setTimings] = useState({});
    const [isLoading, setIsLoading] = useState(true)
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [toggleFavoriteMutation] = useMutation(TOGGLEFAVORITE);
    const [toggleNotificationMutation] = useMutation(TOGGLE_NOTIFICATION);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [allergensData, setAllergensData] = useState([]);
    const [symbol, setSymbol] = useState('');
    const { bootstrapData: BD } = useContext(BootstrapContext)
    const [showQr, setShowQr] = useState(false);

    useEffect(() => {
        if (BD) {
            setBootstrapData(BD);
            setFilterTags(BD?.dietaryOptions);
            setAllergensData(BD?.allergens)
        }
    }, [BD])

    const data = useMemo(() => {
        if (!response?.data || !bootstrapData) return null;
        return transformRestaurantData(response.data, bootstrapData);
    }, [response?.data, bootstrapData]);

    const {
        addFoodToCart,
        onSelectVariation,
        onSelectOption,
        onClickContinue,
        onClickIncrement,
        onClickDecrement,
        onClickShowPopupOrDecrement,
        selectedAddons,
        setSelectedAddons,
        selectedVariation,
        setSelectedVariation,
        updateItemsQuantity,
        setUpdateItemsQuantity,
        addonData,
        setAddonData,
        type,
        editid,
        setEditid,
    } = useCartLogic(data, setCustomizedBottomSheet, setStep, restaurantData);

    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    const { loading: campaignsLoading } = useQuery(CAMPAIGNS, {
        variables: {
            restaurantId: restaurantDetails?._id,
        },
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        skip: !restaurantDetails?._id,
        onCompleted: (data) => {
            if (data?.getCampaignsByRestaurant) {
                setCampaignsData(data?.getCampaignsByRestaurant);
            }
        }
    });

    const { loading: notificationLoading } = useQuery(NOTIFICATION_STATUS, {
        variables: {
            restaurantId: restaurantDetails?._id,
        },
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        skip: !restaurantDetails?._id,
        onCompleted: (data) => {
            if (data) {
                setIsNotificationEnabled(data?.getUserRestaurantSubscriptionStatus);
            }
        }
    });

    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setSelectedLocation(response)
        })();
    }, []);

    useEffect(() => {
        if (data && data?.quickSearchKeywords) {
            setPlaceholderData(data?.quickSearchKeywords)
        }
    }, [data?.quickSearchKeywords]);

    useEffect(() => {
        if (data && data?.favoriteCount) {
            setFollowCount(data?.favoriteCount)
        }
    }, [data?.favoriteCount]);

    useEffect(() => {
        if (!data) return;

        const imagesToPrefetch = [
            data.image,
            ...(data.categories?.flatMap(category =>
                category.foods?.map(food => food.image)
            ) || [])
        ].filter(Boolean);
        let isMounted = true;
        prefetchImages(imagesToPrefetch)
            .then(() => {
                if (isMounted) {
                    console.log('Images preloaded successfully');
                    setIsLoading(false);
                }
            })
            .catch(error => {
                if (isMounted) {
                    console.error('Error preloading images:', error);
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [data]);

    useEffect(() => {
        if (!data) {
            return
        }
        let newData = cart?.filter(cart => cart?.restaurantId == data?._id)
        setRestaurantData(newData)
    }, [cart, data?._id])

    useEffect(() => {
        if (!data?.categories) return;
        const menuCat = data.categories
            .map((categories) => {
                const foodCount = categories?.foods?.length;
                if (foodCount > 0) {
                    return {
                        id: categories?._id,
                        name: categories?.title,
                        count: foodCount
                    };
                }
                return null;
            })
            .filter(Boolean);
        setMenuCategories(menuCat);
    }, [data?.categories]);

    useEffect(() => {
        if (!data?.openingTimes) return;

        const getOpeningStatus = () => {
            const date = new Date();
            const currentTime = date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            const currentDay = DAYS[date.getDay()];
            let currentDayDetails = data?.openingTimes.find(el => el.day === currentDay);
            let result = {};
            if (!currentDayDetails?.isOpen) {
                result = {
                    isDataMissing: true,
                    currentStatus: "Closed",
                    upcomingStatus: null,
                    upcomingTime: null,
                };
            } else if (
                currentTime >= currentDayDetails?.times[0]?.startTime[0] &&
                currentTime <= currentDayDetails?.times[0]?.endTime[0]
            ) {
                result = {
                    isDataMissing: false,
                    currentStatus: "Open",
                    upcomingStatus: "Closes at",
                    upcomingTime: currentDayDetails?.times[0]?.endTime[0],
                };
            } else if (currentTime < currentDayDetails?.times[0]?.startTime[0]) {
                result = {
                    isDataMissing: false,
                    currentStatus: "Closed",
                    upcomingStatus: "Opens at",
                    upcomingTime: currentDayDetails?.times[0]?.startTime[0],
                };
            } else if (currentTime > currentDayDetails?.times[0]?.endTime[0]) {
                result = {
                    isDataMissing: true,
                    currentStatus: "Closed",
                    upcomingStatus: null,
                    upcomingTime: null,
                };
            }

            if (result?.currentStatus == "Open" && !data?.isAvailable) {
                result = {
                    isDataMissing: true,
                    currentStatus: "Closed",
                    upcomingStatus: null,
                    upcomingTime: null,
                };
            }
            return result;
        };
        const status = getOpeningStatus();
        setTimings(status);
    }, [data?.openingTimes]);

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleItemClick = (e, item) => {
        e.preventDefault();
        const element = document.getElementById(item?.id);
        if (element) {
            const topPosition = element.getBoundingClientRect().top + window.scrollY - 30;
            window.scrollTo({
                top: topPosition,
                behavior: 'smooth',
            });
        }
        toggleMenu()
    };
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        // Cleanup function to reset overflow when component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const onClickShowMaps = () => {
        if (!data?.location) {
            return
        }
        let bounds = [
            {
                coords: {
                    lat: Number(selectedLocation?.latitude),
                    lng: Number(selectedLocation?.longitude)
                },
                isUser: true
            }
        ];
        bounds.push({
            coords: {
                lat: Number(data?.location?.coordinates[1]),
                lng: Number(data?.location?.coordinates[0])
            },
            isUser: false
        })
        setBounds(bounds)
        setShowMap(true)
    }

    const handleClosePopup = () => {
        if (interactionLoader == 2) return;
        setUnfollowPopup(false);
    };

    const handleConfirmUnfollow = async () => {
        if (interactionLoader == 2) return;
        setInteractionLoader(2);
        try {
            const response = await toggleFavoriteMutation({
                variables: { toggleFavoriteId: data?._id }
            });

            if (!response?.data || !response?.data?.toggleFavorite?.favourite) {
                return;
            }
            setFollowCount(prev => prev - 1);
            setIsFollow(false);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
        setUnfollowPopup(false);
        setInteractionLoader(0);
    };

    useEffect(() => {
        if (userDetails && data) {
            const isInFavorites = userDetails?.favourite?.some(
                favouriteId => favouriteId === data?._id
            );
            setIsFollow(isInFavorites);
        }
        if (data && data?.enableNotification) {
            setIsNotificationEnabled(true);
        }
    }, [data])

    const handleFollow = async () => {
        if (interactionLoader == 1) return;
        setInteractionLoader(1);
        try {
            const response = await toggleFavoriteMutation({
                variables: { toggleFavoriteId: data?._id }
            });

            if (!response?.data || !response?.data?.toggleFavorite?.favourite) {
                setInteractionLoader(0);
                return;
            }
            setFollowCount(prevState => prevState + 1);
            setIsFollow(true);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
        setInteractionLoader(0);
    }

    const handleUnFollow = async () => {
        if (interactionLoader == 1) return;
        setInteractionLoader(1);
        try {
            const response = await toggleFavoriteMutation({
                variables: { toggleFavoriteId: data?._id }
            });

            if (!response?.data || !response?.data?.toggleFavorite?.favourite) {
                setInteractionLoader(0);
                return;
            }
            setFollowCount(prevState => prevState + 1);
            setIsFollow(true);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
        setInteractionLoader(0);
    }

    const handleFilterSelection = useCallback((filter) => {
        setSelectedFilters(prev => {
            if (prev.includes(filter)) {
                return prev.filter(item => item !== filter);
            }
            return [...prev, filter];
        });
    }, []);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        if (!data?.quickSearchKeywords?.length) return;

        const interval = setInterval(() => {
            setPlaceholderIndex(prevIndex =>
                prevIndex === data.quickSearchKeywords.length - 1 ? 0 : prevIndex + 1
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [data?.quickSearchKeywords?.length]);

    const filterCategories = (categories, searchQuery, selectedFilters) => {
        if (!categories) return categories;

        const matchesDietaryFilters = (food) => {
            if (!selectedFilters || selectedFilters.length === 0) {
                return true;
            }
            return selectedFilters.includes(food.dietaryType);
        };

        return categories?.map(category => ({
            ...category,
            foods: category.foods.filter(food =>
                (food.title.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery.trim()) &&
                matchesDietaryFilters(food)
            )
        })).filter(category => category.foods.length > 0);
    };


    const prepareHorizontalCardData = useCallback((data, searchQuery, bootstrapData, selectedFilters) => {
        const activeFoodTags = bootstrapData?.foodTags
            ?.filter(tag => tag.isActive)
            ?.map(tag => tag.enumVal) || [];
        const matchesDietaryFilters = (food) => {
            if (!selectedFilters || selectedFilters.length === 0) {
                return true;
            }
            return selectedFilters.includes(food.dietaryType);
        };
        const filteredCategories = filterCategories(data?.categories || [], searchQuery, selectedFilters);
        const taggedFoods = filteredCategories.flatMap(category =>
            category.foods.filter(food =>
                food.tags?.some(tag => activeFoodTags.includes(tag)) &&
                matchesDietaryFilters(food)
            ).map(food => ({
                ...food,
                categoryId: category._id
            }))
        );
        const groupedCategories = activeFoodTags
            .filter(tagEnum => taggedFoods.some(food => food.tags.includes(tagEnum)))
            .map(tagEnum => {
                const tagConfig = bootstrapData.foodTags.find(tag => tag.enumVal === tagEnum);
                const foodsWithTag = taggedFoods.filter(food => food.tags.includes(tagEnum));
                return {
                    _id: foodsWithTag[0].categoryId,
                    title: tagConfig.displayName,
                    foods: taggedFoods.filter(food => food.tags.includes(tagEnum))
                };
            });

        return {
            ...data,
            categories: groupedCategories
        };
    }, []);

    const onClickContinueToNextStep = () => {
        if (selectedVariation?.addons?.length == 0) {
            return onClickContinue()
        }
        setStep(2)
    }
    const scrollTimeoutRef = useRef(null);
    const handleScroll = () => {
        // Clear the previous timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Set a new timeout to close the sheet after scrolling ends
        scrollTimeoutRef.current = setTimeout(() => {
            setCustomizedBottomSheet(false);
            setStep(1); // Reset step if needed
        }, 300); // Adjust the timeout duration as needed
    };

    useEffect(() => {
        // Cleanup the timeout on unmount
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    if (!data || !userDetails || response?.loading || isLoading) {
        return <Loader />;
    }

    const onClickEdit = (key, quantity) => {
        setUpdateItemsQuantity([])
        setEditid({ key, quantity })
    }

    const handleViewInfo = (foodDetails) => {
        if (foodDetails?.allergenData && foodDetails?.allergenData?.length > 0) {
            const filteredAllergens = allergensData
                .filter(allergen => foodDetails?.allergenData?.includes(allergen.enumVal));
            setInfo({ ...foodDetails, allergenData: filteredAllergens });
        } else {
            setInfo(foodDetails);
        }
        setInfoBottomSheet(true);
    };

    const onOpenPopup = () => {
        document.body.style.overflow = "hidden";
        setIsPopupVisible(true);
    };

    const onClosePopup = () => {
        document.body.style.overflow = "auto";
        setIsPopupVisible(false);
    };

    const handleNotification = async () => {
        if (interactionLoader == 3) return;
        setInteractionLoader(3);
        try {
            const response = await toggleNotificationMutation({
                variables: {
                    "input": {
                        "restaurantId": data?._id,
                        "enabled": !isNotificationEnabled
                    }
                }
            });

            if (!response?.data) {
                showErrorToast(t('common.failureMessage'))
                setInteractionLoader(0);
                return;
            }
            setIsNotificationEnabled(!isNotificationEnabled);
            showSuccessToast('Updated successfully')
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showErrorToast(t('common.failureMessage'))
        }
        setInteractionLoader(0);
    }

    console.log(data, "---------")

    return (
        <div>
            <ResturantHeader data={data} />
            <div className="restaurant-details">
                <div className="d-flex justify-content-between align-items-start flex-wrap">
                    {/* Left: Name and Address */}
                    <div style={{ width: "30%" }} className="flex-grow-1 me-3">
                        <h1 className={`bold-fw xxl-fs m-0 p-0 ${data?.onboarded ? "text-nowrap text-ellipsis" : ""}`}>
                            {data?.name}
                        </h1>
                        <h1 className={`normal-fw s-fs m-0 p-0 ${data?.onboarded ? "text-nowrap text-ellipsis" : ""}`}>
                            {data?.address}
                        </h1>
                    </div>

                    {/* Right: QR, Bell, Follow */}
                    <div className="d-flex align-items-center gap-2  px-2 py-1 rounded-3">
                        <AiOutlineQrcode
                            size={24}
                            style={{ cursor: "pointer", flexShrink: 0 }}
                            onClick={() => setShowQr(true)}
                        />

                        {isFollow && (
                            <div className="" onClick={() => { interactionLoader != 3 && handleNotification() }}>
                                {interactionLoader == 3 ? (
                                    <Spinner color="#000" size="24px" />
                                ) : (
                                    <img className="icon-size" src={isNotificationEnabled ? Bell : BellSlash} alt="bell-icon" />
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => { isFollow ? setUnfollowPopup(true) : handleFollow() }}
                            className="rounded-3 follow-btn px-3"
                        >
                            {interactionLoader == 1 ? (
                                <Spinner color="#000" size="24px" />
                            ) : (
                                <div>
                                    {isFollow ? t('following.following') : t('following.follow')}
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {<div className="l-fs normal-fw d-flex align-items-center followers-count mt-1" >
                    <img alt="followers" src={Followers} />
                    <p className="ms-2" >{numberToK(followCount)}<span className="ms-2">{t("restaurant.followers")}</span></p>
                </div>}
                {!data?.isAvailable && <div className="mt-3 p-2" style={{ backgroundColor: "rgba(211, 47, 47, 0.24)", borderRadius: 8 }}>
                    <p style={{ color: "#D32F2F" }}>{t("restaurant.notAvailable")}</p>
                </div>}
                {(data?.openingTimes?.length > 0 && timings?.currentStatus) &&
                    <div className="d-inline-flex align-items-center mt-2" onClick={onOpenPopup}>
                        <p className="m-fs semiBold-fw black-text">{t("restaurant.hours")}:</p>
                        <p className="m-fs normal-fw ms-1" style={{ color: "#16B364" }}>{timings?.currentStatus}</p>
                        {!timings?.isDataMissing && <img className='dot mx-1' src={Dot} alt="dot" />}
                        {!timings?.isDataMissing && <p className="m-fs normal-fw placeholder-text">{timings?.upcomingStatus}</p>}
                        {!timings?.isDataMissing && <p className="m-fs normal-fw placeholder-text ms-1">{timings?.upcomingTime}</p>}
                        <div className="pe-2 ps-1 py-1">
                            <img width={12} height={12} src={ArrowDownBlack} alt="arrow" />
                        </div>
                    </div>
                }
                {/* {showMap && <div className="d-flex overflow-auto">
                    {["Burgers", "Burritos", "Burgers"]?.map((item) => <p className="normal-fw followers-count m-fs  me-2">{item}</p>)}
                    </div>} */}
                {/* QrModal triggered by icon click */}
                <QrModal
                    isOpen={showQr}
                    onClose={() => setShowQr(false)}
                    restaurantId={data?._id}
                />
            </div>

            <OfferCarousel campaignsData={campaignsData} icon={Offer} symbol={symbol} />

            {!showMap ? <>
                {/* search-sticky */}
                {data?.onboarded && <div className="pd-horizontal">
                    <div className='input-container'>
                        <input
                            className='m-fs placeholder-text medium-fw w-100'
                            type="text"
                            placeholder={`Search for "${placeholderData?.length ? placeholderData[placeholderIndex] : "kebab"}"`}
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        <img className='search-icon-size' src={Search} alt="search" />
                    </div>
                </div>}
                {data?.onboarded && <div className="pd-horizontal d-flex overflow-scroll py-4">
                    {filterTags?.map((el, i) => {
                        return (
                            <div key={i} className={`${selectedFilters.includes(el?.enumVal) ? "filter-selected" : "filter-unselected"} d-flex align-items-center justify-content-center px-3 py-2 me-2`} onClick={() => handleFilterSelection(el?.enumVal)}>
                                <p className={`${selectedFilters.includes(el?.enumVal) ? "white-text" : "black-text"} m-fs normal-fw text-nowrap`}>{el?.displayName}</p>
                            </div>
                        )
                    })}
                </div>}
                {prepareHorizontalCardData(data, searchQuery, bootstrapData, selectedFilters)?.categories?.length > 0 && <div className=" special-dish-container pb-4" >
                    <ItemLevelHorizontalCard
                        data={prepareHorizontalCardData(data, searchQuery, bootstrapData, selectedFilters)}
                        onClickDecrement={(food) => onClickShowPopupOrDecrement(food)}
                        onClick={(data, categoryId, isCustomized) => addFoodToCart(data, categoryId, isCustomized)}
                    />
                </div>}
                <div>
                    <ItemLevelVerticalCard
                        data={{
                            ...data,
                            categories: filterCategories(data?.categories, searchQuery, selectedFilters)
                        }}
                        onClickDecrement={(food) => onClickShowPopupOrDecrement(food)}
                        onClick={(data, categoryId, isCustomized) => addFoodToCart(data, categoryId, isCustomized)}
                        onViewInfo={handleViewInfo}
                    />
                </div>

                {!data?.onboarded && <div className="pd-horizontal my-4">
                    <div className="d-flex flex-column justify-content-between align-items-center pb-4">
                        <img className="mb-3" width={250} height={250} src={ComingSoon} alt="soon" />
                        <p className="l-fs normal-fw black-text text-center"><span className="l-fs bold-fw">"{data?.name}"</span> {t("restaurant.info")}.</p>
                    </div>
                </div>}

                {data?.onboarded && <div className="pd-horizontal my-4">
                    <p className="xl-fs semiBold-fw black-text mb-3">{t("restaurant.otherInfo")}</p>
                    {/* <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="l-fs normal-fw placeholder-text">Email:</p>
                        <p className="l-fs semiBold-fw black-text">contact@gmail.com</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="l-fs normal-fw placeholder-text">Contact Us:</p>
                        <p className="l-fs semiBold-fw black-text">0324526985</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="l-fs normal-fw placeholder-text">Company Register:</p>
                        <p className="l-fs semiBold-fw black-text">Vijay</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="l-fs normal-fw placeholder-text">Company Register No:</p>
                        <p className="l-fs semiBold-fw black-text">VJ 24 8976</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <p className="l-fs normal-fw placeholder-text">VAT Number:</p>
                        <p className="l-fs semiBold-fw black-text">VAT123456</p>
                    </div> */}
                    <p className="m-fs normal-fw black-text mt-2">{data?.address}</p>
                </div>}
                {data?.onboarded && <p className="m-fs normal-fw pd-horizontal pt-4" style={{ color: "#A8A29E" }}>{t('common.screenInfo')}</p>}

                {!showMap && <div style={{ height: 100 }} />}

                <div onClick={onClickShowMaps} className='maps'>
                    <p className='white-text m-fs normal-fw text-nowrap'>{t('restaurant.map')}</p>
                    {/* <img className='icon-size ms-2' src={Map} alt="star" /> */}
                </div>
                <div className="menu-container">
                    {data?.onboarded && <button className="open-button" onClick={toggleMenu}>
                        <p className='white-text m-fs normal-fw text-nowrap'>{t('restaurant.menu')}</p>
                    </button>}
                    <div onClick={toggleMenu} onTouchStart={toggleMenu} className="position-fixed "
                        style={{ display: isOpen ? 'block' : 'none', background: 'rgba(0,0,0,0.3)', zIndex: 101, top: 0, bottom: 0, left: 0, right: 0 }}> </div>
                    <div className={`menu ${isOpen ? 'open' : 'close'}`} >
                        <div className="menu-items">
                            {menuCategories?.length > 0 && menuCategories?.map((item, index) => (
                                <div key={index} className="menu-card" onClick={(e) => handleItemClick(e, item)}>
                                    <h3 className="item-name m-fs semiBold-fw">{item?.name}</h3>
                                    <p className="item-count">{item?.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {unfollowPopup && (
                    <div className="popup-bg" >
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
                                Do you want to unfollow {data?.name} ?
                            </p>
                            <div className="d-flex align-items-center justify-content-between mt-4">
                                <div className='popup-btn-confirm' onClick={handleConfirmUnfollow}>
                                    {interactionLoader == 2 ? <Spinner color="#000" size="24px" /> : <p className='l-fs semiBold-fw black-text'>{t('restaurant.confirm')}</p>}
                                </div>
                                <div className='popup-btn-cancel' onClick={handleClosePopup}>
                                    <p className='l-fs semiBold-fw black-text'>{t('restaurant.cancel')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <CartBottomSheet data={data} />

                <Sheet
                    key={step}
                    detent="content-height"
                    isOpen={customizedBottomSheet}
                    onClose={() => {
                        setSelectedVariation(null)
                        setAddonData(null)
                        setSelectedAddons([])
                        setCustomizedBottomSheet(false)
                        setUpdateItemsQuantity([])
                        setStep(1)
                    }}
                >
                    <Sheet.Container >
                        <Sheet.Content
                            key={step}
                            className="pd-horizontal py-3"
                            style={{
                                maxHeight: '90vh',
                            }}>

                            <div className="border-1 pb-2 border-bottom">
                                <p className="xl-fs bold-fw">Step 0{step}/02</p>

                            </div>
                            <div className="pt-2">
                                <h1 className="xxl-fs bold-fw m-0">{t('restaurant.customizeAsPerYourTaste')}</h1>
                                {/* <h1 className="bottom-sheet-restaurant-name mt-1  l-fs">{data?.name}</h1> */}
                                {updateItemsQuantity?.length > 0 ?
                                    <>
                                        {updateItemsQuantity?.map((item, index) => {
                                            const { titles, total } = item?.addons?.reduce((acc, addon) => {
                                                const optionTitles = addon.options.map(option => option.title).join(", ");
                                                acc.titles += optionTitles + " ";
                                                const addonPrice = addon.options.reduce((sum, option) => sum + option.price, 0);
                                                acc.total += addonPrice;
                                                return acc;
                                            }, { titles: "", total: 0 });
                                            return (
                                                <div key={index} className="d-flex align-items-center justify-content-between mt-3" >
                                                    <div className="pe-3 w-50">
                                                        <p className="semiBold-fw m-fs tetxt-nowrap text-ellipsis"> {item?.name}</p>
                                                        <div className="d-flex s-fs flex-wrap">
                                                            <p>{item?.variation?.title}{titles && ','}</p>
                                                            {titles && <p className="text-wrap"> {titles} </p>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="d-flex align-items-center justify-content-end me-3 ">
                                                            <p onClick={() => onClickEdit(item?.key, item.quantity)} className="m-fs m-0 p-0 me-1 semiBold-fw text-end">Edit</p>
                                                            <img src={CaretRight} height={10} />
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between" >
                                                            <p className="text-nowrap me-2 m-fs semiBold-fw">{symbol} {formatToGermanNumber(Number(item?.quantity * (item?.variation?.price + total))?.toFixed(2))}</p>
                                                            <div className="add-btn text-black d-flex justify-content-between rounded-3  py-1 bg-white tertiary-color m-fs bold-fw">
                                                                <img onClick={() => onClickDecrement(item, index)} src={Decrement} alt="decrement" className='px-2' />
                                                                <p>{item?.quantity}</p>
                                                                <img onClick={() => onClickIncrement(item, index)} src={Increment} alt="increment" className='px-2' />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            )
                                        })}
                                        {type == "inc" ? <div className="d-flex align-items-center justify-content-center mt-3" >
                                            <p onClick={() => { setUpdateItemsQuantity([]); setEditid('') }} className="secondary-color semiBold-fw l-fs">{t('restaurant.addMoreItems')}</p>
                                        </div> : null}
                                    </>
                                    : step == 1 ?
                                        <Variations
                                            data={addonData}
                                            setSelectedVariation={setSelectedVariation}
                                            selectedVariation={selectedVariation}
                                            onSelectVariation={(data, id, qty) => onSelectVariation(data, id, qty)}
                                            onClickContinue={() => onClickContinueToNextStep()}
                                            setSelectedAddons={setSelectedAddons}
                                            editid={editid}
                                            setEditid={setEditid}
                                        /> :
                                        <Sheet.Scroller className="hide-scroll-bar" onScroll={handleScroll} style={{ maxHeight: '70vh' }}>
                                            <Addons
                                                step={step}
                                                data={addonData}
                                                selectedVariation={selectedVariation}
                                                setSelectedVariation={setSelectedVariation}
                                                setSelectedAddons={setSelectedAddons}
                                                selectedAddons={selectedAddons}
                                                setStep={setStep}
                                                onSelectOption={(addon, option) => onSelectOption(addon, option)}
                                                onClickContinue={onClickContinue}
                                                editid={editid}
                                                setEditid={setEditid}
                                            />
                                        </Sheet.Scroller>
                                }
                            </div>

                        </Sheet.Content>
                    </Sheet.Container>
                    <Sheet.Backdrop
                        onTap={() => {
                            setSelectedVariation(null)
                            setAddonData(null)
                            setSelectedAddons([])
                            setCustomizedBottomSheet(false)
                            setUpdateItemsQuantity([])
                            setStep(1)
                        }}
                        style={{
                            zindex: 100,
                            position: "absolute",
                        }}
                    />
                </Sheet>

                {isPopupVisible && <div className="rest-popup-bg" onClick={onClosePopup}>
                    <div className="rest-popup-container" onClick={e => e.stopPropagation()}>
                        <div className="d-flex align-items-center justify-content-between">
                            <p className="xxl-fs semiBold-fw black-text">{t('restaurant.operatingHours')}</p>
                            <div className='ps-1 py-1' onClick={onClosePopup}>
                                <img src={Close} height={24} />
                            </div>
                        </div>
                        <p className="m-fs semiBold-fw black-text mb-3">{data?.name}</p>
                        {data?.openingTimes?.length > 0 && data?.openingTimes?.map((el, i) => {
                            const date = new Date();
                            const currentDay = DAYS[date.getDay()];
                            return (
                                <div key={i} className={`d-flex align-items-center justify-content-between py-3 ${data?.openingTimes?.length != i + 1 ? "border-bottom" : ""}`}>
                                    <p className="m-fs semiBold-fw black-text">{el?.day}</p>
                                    {el?.isOpen ? <p className={`${currentDay == el?.day ? "secondary-color" : "black-text"}`}>{el?.times[0]?.startTime[0]} - {el?.times[0]?.endTime[0]}</p> : <p>-</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>}

                <Sheet
                    detent="content-height"
                    isOpen={infoBottomSheet}
                    onClose={() => {
                        setInfo({});
                        setInfoBottomSheet(false)
                    }}
                >
                    <Sheet.Container >
                        <Sheet.Content
                            className="pd-horizontal py-4"
                            style={{
                                maxHeight: '75vh',
                            }}>
                            <Sheet.Scroller className="hide-scroll-bar">
                                <div className="">
                                    <img className="popup-food-image" src={info?.image || PlaceholderImage} alt='food' />
                                    <p className="xl-fs semiBold-fw black-text mt-4">{info?.title}</p>
                                    <p className="m-fs normal-fw placeholder-text">{info?.description}</p>
                                    {info?.allergenData?.length > 0 && <div className="mt-4">
                                        <p className="l-fs semiBold-fw black-text mb-3">{t('restaurant.dishInfo')}:</p>
                                        {info?.allergenData?.map((el, i) => {
                                            return (
                                                <div key={i} className="d-flex mt-3">
                                                    <img height={40} width={40} src={allergenIcons[el?.enumVal]} alt='food' />
                                                    <p className="m-fs normal-fw black-text ms-3">{el?.description}</p>
                                                </div>
                                            )
                                        })}
                                    </div>}
                                </div>
                            </Sheet.Scroller>
                            <div className="dish-popup-close mt-4" onClick={() => {
                                setInfo({});
                                setInfoBottomSheet(false)
                            }}>
                                <p className="l-fs semiBold-fw black-text">{t('restaurant.close')}</p>
                            </div>
                        </Sheet.Content>
                    </Sheet.Container>
                    <Sheet.Backdrop
                        onTap={() => {
                            setInfo({});
                            setInfoBottomSheet(false)
                        }}
                        style={{
                            zindex: 100,
                            position: "absolute",
                        }}
                    />
                </Sheet>

            </> : <div className="position-relative">
                {bounds && <OpenStreetMap height={window?.innerHeight - 170} bounds={bounds} type={"restaurant"} />}
                <div onClick={() => setShowMap(false)} className="position-absolute p-2 primary-bgcolor d-flex rounded-3 d-flex align-items-center" style={{ bottom: 130, right: 20, zIndex: 1000 }}>
                    <h1 className="l-fs text-white normal-fw m-0 p-0 me-1">{t('restaurant.close')}</h1>
                    <img src={CloseMaps} height={20} />
                </div>
            </div>}
        </div>
    )
}
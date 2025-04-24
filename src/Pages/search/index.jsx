import React, { useContext, useEffect, useState } from 'react';
import './style.css';
import { useTranslation } from 'react-i18next';
import Faders from "../../assets/svg/fadershorizontal.svg"
import Faders1 from "../../assets/svg/searchpagekebab.svg"
import { useNavigate } from 'react-router-dom';
import CardImage from '../../Components/CardImage';
import { gql, useApolloClient, useMutation, useQuery } from '@apollo/client';
import { restaurantList, toggleFavorite, profile } from '../../apollo/server';
import { HOME_API_PARAMETERS, LOCALSTORAGE_NAME, MAP_CAMPAIGN_TYPE, SORTING_FILTER_ENUMS } from '../../constants/enums';
import { CurrentLocationStorage, enhancedImageCache, metersToKilometers, numberToK, ratingStructure } from '../../Utils';
import Dot from '../../assets/svg/dot.svg'
import Star from '../../assets/svg/rating.svg'
import { Sheet } from 'react-modal-sheet';
import SortFilter from "../../Components/Filters"
import { routeName } from '../../Router/RouteName';
import { Context } from '../../Context/Context';
import Close from "../../assets/svg/close.svg"
import Loader from '../../Components/Loader/Loader';
import FireGif from "../../assets/gif/fire.gif"
import HatGif from "../../assets/gif/hat.gif"
import StarGif from "../../assets/gif/star.gif"
import { BootstrapContext } from '../../Context/Bootstrap';
import MapRestaurantCard from '../../Components/MapRestaurantCard';
import { set } from 'lodash';

const RESTAURANTS = gql`${restaurantList}`;
const TOGGLEFAVORITE = gql`${toggleFavorite}`;
const PROFILE = gql`${profile}`;

const Search = () => {
    const { t } = useTranslation()
    const { userDetails, setUserDetails, identifier } = useContext(Context);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([])
    const navigate = useNavigate()
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [openSheet, setOpenSheet] = useState(false)
    const [selectedOption, setSelectedOption] = useState({})
    const [toggleFavoriteMutation] = useMutation(TOGGLEFAVORITE);
    const [ratingFilter, setRatingFilter] = useState('')
    const [selectedFilters, setSelectedFilters] = useState({});
    const [filterLoading, setFilterLoading] = useState(false)
    const [noData, setNodata] = useState(false)
    const [promotionsData, setPromotionsData] = useState([])
    const client = useApolloClient()
    const { bootstrapData } = useContext(BootstrapContext)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [mapModalData, setMapModalData] = useState({});

    useEffect(() => {
        if (!identifier) {
            navigate(routeName.HOME, { replace: true })
        }
    }, [identifier])

    useEffect(() => {
        if (openSheet || isModalVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [openSheet, isModalVisible]);

    useEffect(() => {
        if (bootstrapData) {
            setPromotionsData(bootstrapData?.promotions)
        }

    }, [bootstrapData])

    const { loading } = useQuery(PROFILE, {
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        onCompleted: (data) => {
            setUserDetails(data?.profile || {});
        },
        skip: userDetails
    });

    const handleToggleFavorite = async (id) => {
        try {
            const { data } = await toggleFavoriteMutation({
                variables: { toggleFavoriteId: id }
            });
            if (!data || !data?.toggleFavorite?.favourite) {
                return;
            }
            const updateRestaurantList = (restaurants) => {
                return restaurants.map(restaurant => {
                    if (restaurant._id === id) {
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
            setSearchResults(prevState => {
                return updateRestaurantList(prevState)
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setSelectedLocation(response)
        })();
    }, []);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            onHandleApplyFilter(selectedFilters, ratingFilter)
        }
    };

    const navigateToSingleRestaurant = (restaurant) => {
        localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({
            _id: restaurant._id,
            slug: restaurant.slug
        }));
        navigate(routeName.RESTAURANT);
    };
    const onHandleApplyFilter = async (filters, rating) => {
        try {
            if (!query) {
                return
            }
            let payload = {
                "searchTerm": query,
                "distance": HOME_API_PARAMETERS.DISTANCE,
                "limit": HOME_API_PARAMETERS.LIMIT,
                // "longitude": Number(selectedLocation?.longitude),
                // "latitude": Number(selectedLocation?.latitude),
                // "zoneIdentifier": identifier,
                "location":[Number(selectedLocation?.longitude), Number(selectedLocation?.latitude)],

            }
            if (rating) {
                let key = SORTING_FILTER_ENUMS['RATING']
                payload[key] = rating
            }
            for (const key in filters) {
                if (filters[key]) {
                    if (typeof filters[key] == 'object' && key != 'cuisines') {
                        let new_key = filters[key]
                        for (const subKey in new_key) {
                            if (new_key[subKey] == "reviewAverage") {
                                payload['sortOrder'] = "desc"
                            }
                            payload[subKey] = new_key[subKey]
                        }
                    }
                    else {
                        payload[key] = filters[key]
                    }
                }
            }
            setFilterLoading(true)
            setNodata(false)
            let Apiquery = await client.query(
                {
                    query: RESTAURANTS,
                    variables: {
                        ...payload
                    },
                    fetchPolicy: 'network-only'
                })
            if (Apiquery?.loading) {
                return
            }
            setFilterLoading(false)
            if (!Apiquery?.data?.nearByRestaurantsNewV2?.restaurants?.length) {
                setSearchResults([])
                setNodata(true)
                return
            }
            let restaurantList = Apiquery?.data?.nearByRestaurantsNewV2?.restaurants;
            restaurantList = await matchCampaignsWithRestaurants(restaurantList, Apiquery?.data?.nearByRestaurantsNewV2?.campaigns);
            restaurantList = await updateRestaurantFavoriteStatus(restaurantList);
            enhancedImageCache.prefetchImages(
                restaurantList.map(restaurant => restaurant.image).filter(Boolean)
            ).catch(error => {
                console.error('Error prefetching all restaurant images:', error);
            });
            setSearchResults(restaurantList)
        }
        catch (e) {
            setFilterLoading(false)
        }
    }

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
    }

    const onClickSort = () => {
        let key = SORTING_FILTER_ENUMS['SORT']
        setSelectedOption(selectedFilters[key] || {})
        setOpenSheet(true)
    }

    const onChangeQuery = (text) => {
        setQuery(text)
        if (text) {
            return
        }
        setRatingFilter('')
        setSelectedFilters({})
        setSelectedOption({})
        setNodata(false)
        setSearchResults([])
    }

    const updateRestaurantFavoriteStatus = (restaurants) => {
        return restaurants.map(restaurant => ({
            ...restaurant,
            isFavorite: userDetails?.favourite?.includes(restaurant._id)
        }));
    };

    return (
        <div className='pd-horizontal py-3 bg-white search-page' style={{ height: window.innerHeight }}>
            <div>
                <div className="d-flex ">
                    <div className='w-75 border p-2 me-2 rounded-3 d-flex'>
                        <input
                            inputMode='search'
                            value={query}
                            onChange={(e) => onChangeQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('searchPage.searchhere')}
                            className="searchInput normal-fw l-fs"
                            enterKeyHint="search"
                            autoComplete='true'
                        />
                        {query && (
                            <button
                                className=" fs-6 bg-white border-0"
                                onClick={() => onChangeQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button disabled={filterLoading} className='border-0 secondary-bgcolor px-3 l-fs semiBold-fw rounded-3' onClick={() => onHandleApplyFilter(selectedFilters, ratingFilter)}>{t('searchPage.search')}</button>
                </div>
                {query && <div className='pt-4 pb-3 d-flex'>
                    <div onClick={() => onClickSort()} className={`${selectedFilters?.sortBy ? "filter-pill-selected1" : "filter-pill1"} d-flex  justify-content-center align-items-center p-2  me-3 filter-btn`}>
                        {selectedFilters?.sortBy ? <div
                            style={{ height: 17, width: 17 }}
                            className="d-flex align-items-center justify-content-center secondary-bgcolor rounded-pill me-1 text-white fw-semiBold"
                        >
                            <p style={{ fontSize: 10 }}>1</p>
                        </div> : null}
                        <h1 className=' m-fs normal-fw m-0 me-1 p-0'>{t('searchPage.sort')}</h1>

                        <img src={Faders} height={15} alt="faders" />
                    </div>
                    <div className={`${ratingFilter ? "filter-pill-selected1" : "filter-pill1"} d-flex  align-items-center p-2 justify-content-center filter-btn`}>
                        <h1 onClick={() => {
                            onHandleApplyFilter(selectedFilters, 4)
                            setRatingFilter(4)
                        }} className={`m-fs normal-fw m-0 p-0`}>{t('searchPage.ratings')} 4.0+</h1>
                        {ratingFilter && (
                            <button
                                className=" ms-1 bg-white rating-clear-btn border-0 rounded-pill"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRatingFilter('')
                                    onHandleApplyFilter(selectedFilters, '')
                                }}
                            >
                                <img src={Close} alt='close' height={13} />
                            </button>
                        )}
                    </div>
                </div>}
            </div>
            <div className='items-container overflow-auto'>
                {filterLoading ? <Loader /> : null}

                {searchResults?.length == 0 ? <div className='empty-search-container'>
                    <img src={Faders1} height={100} alt="faders" />
                    {!noData ? <p className='m-fs w-75 text-wrap normal-fw text-center'>{t('searchPage.searchKebabText')}</p>
                        : <div className='d-flex flex-column justify-content-center align-items-center'>
                            <p className='xl-fs w-75 text-wrap normal-fw text-center mb-2 fw-bold'>{t('searchPage.noKebab')}</p>
                            <p className='m-fs w-75 text-wrap normal-fw text-center'>{t('searchPage.noKebabText')}</p>
                        </div>}
                </div> :
                    searchResults?.map((el, i) => {
                        let offerData = {};
                        let giftData = null;
                        if (el?.campaigns && el?.campaigns?.length == 1) {
                            let offer = el?.campaigns[0];
                            if (offer?.promotion) {
                                let res = promotionsData?.find(promotion => promotion?._id == offer?.promotion);
                                offerData['name'] = res?.displayName;
                                offerData['baseCode'] = res?.baseCode;
                            }
                            offerData['startTime'] = offer?.startTime;
                            offerData['endTime'] = offer?.endTime;
                        }
                        if (offerData.baseCode == MAP_CAMPAIGN_TYPE.HAPPYHOURS) {
                            giftData = FireGif;
                        } else if (offerData.baseCode == MAP_CAMPAIGN_TYPE.SPECIALDAY) {
                            giftData = StarGif;
                        } else {
                            giftData = HatGif;
                        }
                        return (
                            <div key={i} className='section-4-card d-flex align-items-center justify-content-between mb-4'
                                onClick={() => {
                                    setIsModalVisible(true)
                                    setMapModalData(el)
                                }}
                            >
                                <CardImage props={{
                                    type: "all",
                                    height: 150,
                                    width: "48%",
                                    img: el?.image,
                                    isFavorite: el?.isFavorite,
                                    favoriteCount: el?.favoriteCount,
                                    campaigns: el?.campaigns,
                                    promotions: promotionsData,
                                    // onFavoriteClick: () => handleToggleFavorite(el._id)
                                }} />
                                <div className='search-card-content'>
                                    <p className='l-fs bold-fw black-text text-ellipsis'>{el?.name}</p>
                                    <div className='d-flex align-items-center my-1'>
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
                                    <p className='heading s-fs normal-fw text-ellipsis mb-1'>{el?.address}</p>
                                    <p className='black-text normal-fw s-fs text-ellipsis'>{el?.cuisines?.join(', ')}</p>
                                    {(el?.campaigns && el?.campaigns?.length == 1) && <div className='mt-2 campaign-container px-1'>
                                        <img className='icon-size' src={giftData} alt="gif" />
                                        <div className='ms-1' style={{ width: "75%" }}>
                                            <p className='m-fs black-fw white-text text-ellipsis'>{offerData?.name}</p>
                                            {offerData?.baseCode == MAP_CAMPAIGN_TYPE.HAPPYHOURS && <p className='medium-fw white-text' style={{ fontSize: 10, lineHeight: 1 }}>{offerData?.startTime} - {offerData?.endTime}</p>}
                                        </div>
                                    </div>}
                                </div>
                            </div>
                        )
                    })}
                {isModalVisible && (
                    <div className={`restaurant-card-container`} style={{ display: isModalVisible ? 'block' : 'none' }}>
                        <MapRestaurantCard
                            isCancel={true}
                            setIsModalVisible={setIsModalVisible}
                            data={mapModalData}
                            promotionsData={promotionsData}
                            route={"home"}
                        />
                    </div>
                )}
            </div>
            <SortFilter setIsOpen={setOpenSheet} onHandleApplyFilter={(filter) => onHandleApplyFilter(filter, ratingFilter)} setSelectedFilters={setSelectedFilters} selectedOption={selectedOption} setSelectedOption={setSelectedOption} isOpen={openSheet} filterKey={SORTING_FILTER_ENUMS['SORT']} />
        </div>
    );
};

export default Search;
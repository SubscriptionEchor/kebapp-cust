import React, { useContext, useEffect, useState } from 'react'
import "./style.css"
import Star from "../../assets/svg/rating.svg"
import Fire from "../../assets/gif/fire.gif"
import Hat from "../../assets/gif/hat.gif"
import StarGif from "../../assets/gif/star.gif"
import Offer from "../../assets/gif/offer.gif"
import Followers from "../../assets/svg/followersgrey.svg"
import Dot from "../../assets/svg/dot.svg"
import Close from "../../assets/svg/crossWhite.svg"
import Verified from "../../assets/svg/verified.svg"
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routeName } from '../../Router/RouteName'
import { Context } from '../../Context/Context'
import { LOCALSTORAGE_NAME, MAP_CAMPAIGN_TYPE } from '../../constants/enums'
import { CurrentLocationStorage, metersToKilometers, numberToK, ratingStructure } from '../../Utils'
import Placeholder from '../../assets/PNG/dishPlaceholder.webp'
import { OfferCarousel } from '../../Pages/Restaurant'
import ImagePlaceholder from "../../assets/svg/kebabPlaceholder.svg"

const MapRestaurantCard = (props) => {
    // console.log(props);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [symbol, setSymbol] = useState('');

    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setSelectedLocation(response)
        })();
    }, []);

    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, []);

    const handleClose = (e) => {
        e.stopPropagation();
        props?.setIsModalVisible(false);
    };

    const navigateToSingleRestaurant = () => {
        localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({
            _id: props?.data?._id,
            slug: props?.data?.slug
        }));
        navigate(routeName.RESTAURANT);
    };

    const onClickViewDirections = () => {
        let cords = {
            user_lat: Number(selectedLocation?.latitude),
            user_lng: Number(selectedLocation?.longitude),
            rest_lat: Number(props?.data?.location?.coordinates[1]),
            rest_lng: Number(props?.data?.location?.coordinates[0])
        }
        let url = `https://www.google.com/maps/dir/?api=1&origin=${cords?.user_lat},${cords?.user_lng}&destination=${cords?.rest_lat},${cords?.rest_lng}`
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            webApp.openLink(url, { try_instant_view: false });
        } else {
            window.open(url, '_blank');
        }
    }

    const getGif = () => {
        if (offerData?.baseCode == MAP_CAMPAIGN_TYPE.HAPPYHOURS) {
            return Fire;
        } else if (offerData?.baseCode == MAP_CAMPAIGN_TYPE.SPECIALDAY) {
            return StarGif;
        } else if (offerData?.baseCode == MAP_CAMPAIGN_TYPE.CHEFSPECIAL) {
            return Hat;
        }
    };

    let offerData = {};
    if (props?.data?.campaigns && props?.data?.campaigns?.length == 1) {
        let offer = props?.data?.campaigns[0];
        if (offer?.promotion) {
            let res = props?.promotionsData?.find(promotion => promotion?._id == offer?.promotion);
            offerData['description'] = res?.description;
            offerData['baseCode'] = res?.baseCode;
        }
        offerData['description'] = offer?.description;
    }

    return (
        <div className='map-restaurant-card'>
            <div className='map-close-container' onClick={handleClose}>
                <img width={10} height={10} src={Close} alt="close" />
            </div>
            <div className='d-flex justify-content-between pd-horizontal' style={{ width: "100%", marginTop: 25 }}>
                {props?.data?.image ? <img className='restaurant-card-img' style={{ objectFit: 'contain' }} src={props?.data?.image} alt="star" /> :
                    <div className='p-2 me-2 d-flex justify-content-center align-items-center' style={{ background: 'rgba(229, 229, 229, 0.5)' }}>
                        <img src={ImagePlaceholder} />
                    </div>}
                <div style={{ width: "61%" }}>
                    <div className='d-flex align-items-center'>
                        <p className='l-fs bold-fw black-text text-ellipsis me-1' style={{ maxWidth: "75%" }}>{props?.data?.name}</p>
                        {props?.data?.onboarded && <img className='icon-size' src={Verified} alt="star" />}
                    </div>
                    <div className='d-flex align-items-center mt-1'>
                        <div className='d-flex align-items-center'>
                            <img className='star' src={Star} alt="star" />
                            {props?.data?.reviewAverage && props?.data?.reviewAverage > 0 ?
                                <div className='d-flex align-items-center ps-1'>
                                    <p className='s-fs bold-fw black-text'>{ratingStructure(props?.data?.reviewAverage) || 0}</p>
                                    <p className='s-fs bold-fw black-text ms-1'>({numberToK(props?.data?.reviewCount) || 0})</p>
                                </div> :
                                <div className='ps-1'>
                                    <p className='s-fs bold-fw black-text'>{t("common.new")}</p>
                                </div>
                            }
                            <img className='dot mx-1' src={Dot} alt="dot" />
                            <p className='black-text bold-fw s-fs'>{metersToKilometers(props?.data?.distanceInMeters)} {t("common.km")}</p>
                        </div>
                        {false && <div className='d-flex align-items-center ms-3'>
                            <img className='star' src={Followers} alt="star" />
                            <p className='s-fs bold-fw black-text ms-1'>{numberToK(props?.data?.favoriteCount) || 0}</p>
                        </div>}
                    </div>
                    <p className='heading s-fs normal-fw my-1 mt-2'>{props?.data?.address}</p>
                </div>
            </div>
            {/* {(props?.data?.campaigns && props?.data?.campaigns?.length > 0) && <div className='off-section mx-3 mt-3'>
                <img className='icon-size' src={Object.keys(offerData).length > 0 ? getGif() : Offer} alt="star" />
                <p className='m-fs medium-fw black-text ms-2'>{Object.keys(offerData).length > 0 ? offerData?.description : `${props?.data?.campaigns?.length} offers available`}</p>
            </div>} */}
            {(props?.data?.campaigns && props?.data?.campaigns?.length > 0) && <OfferCarousel campaignsData={props?.data?.campaigns} icon={Offer} symbol={symbol} />}
            {/* Action Buttons */}
            <div className='my-3 d-flex justify-content-center align-items-center gap-2' style={{ width: "100%" }}>
                {/* Get Directions */}
                <div onClick={onClickViewDirections} className='visit-button' style={{ cursor: 'pointer' }}>
                    <p className='l-fs semiBold-fw black-text'>{t('mapfilters.getdirections')}</p>
                </div>

                {/* Visit Shop */}
                <div onClick={navigateToSingleRestaurant} className='visit-button' style={{ cursor: 'pointer', backgroundColor: 'black' }}>
                    <p className='l-fs semiBold-fw white-text'>{t("restaurant.visit")}</p>
                </div>
            </div>

        </div>
    )
}

export default MapRestaurantCard;
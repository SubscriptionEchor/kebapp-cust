import React, { useEffect, useState } from 'react'
import "./style.css"
import HeartWhite from "../../assets/svg/heart.svg"
import HeartRed from "../../assets/svg/heartRed.svg"
import Followers from "../../assets/svg/followers.svg"
import Offer from "../../assets/gif/offer.gif"
import NewBackground from "../../assets/svg/newBg.svg"
import Placeholder from "../../assets/PNG/dishPlaceholder.webp"
import { useTranslation } from 'react-i18next'
import Spinner from '../Spinner/Spinner'
import { formatToGermanNumber, numberToK } from '../../Utils'
import heart from "../../assets/Lottie/heart.json"
import Loading from "../../assets/Lottie/circleloading.json"
import LottieAnimation from '../LottieAnimation/LottieAnimation'
import ImagePlaceholder from "../../assets/svg/kebabPlaceholder.svg"
import Lottie from 'lottie-react'
import { LOCALSTORAGE_NAME, MAP_CAMPAIGN_TYPE, OFFERS_TYPE } from '../../constants/enums'

const CardImage = ({ props }) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    const getBackgroundStyle = (props) => {
        const hasActiveCampaigns = props?.campaigns && props?.campaigns?.length > 0;
        const imageUrl = props?.img || Placeholder;

        if (hasActiveCampaigns) {
            const gradientOverlay = `
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.00) 68.5%, rgba(0, 0, 0, 0.45) 99.71%),
            url(${imageUrl})
          `;

            return {
                height: "100%",
                width: "100%",
                borderRadius: "12px",
                background: gradientOverlay,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                opacity: props?.openingDetails ? 0.5 : 1,
            };
        }

        return {
            height: "100%",
            width: "100%",
            borderRadius: "12px",
            background: `url(${imageUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            opacity: props?.openingDetails ? 0.5 : 1,
        };
    };

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();
        setIsLoading(true);
        try {
            await props.onFavoriteClick();
        } finally {
            setIsLoading(false);
        }
    };

    let offerData = {};
    if (props?.campaigns && props?.campaigns?.length == 1) {
        let offer = props?.campaigns[0];
        if (offer?.promotion) {
            let res = props?.promotions?.find(promotion => promotion?._id == offer?.promotion);
            offerData['name'] = res?.displayName;
            offerData['type'] = "promotion";
            offerData['baseCode'] = res?.baseCode;
        } else {
            offerData['name'] = offer?.name;
            offerData['type'] = "campaign";
        }
        offerData['offerType'] = offer?.campaignType;
        offerData['minimumOrderValue'] = offer?.minimumOrderValue;
        offerData['startTime'] = offer?.startTime;
        offerData['endTime'] = offer?.endTime;
        if (offer?.campaignType == OFFERS_TYPE.FLAT) {
            offerData['discount'] = offer?.flatDiscount;
        } else {
            offerData['discount'] = offer?.percentageDiscount;
        }
    }


    // ---------------------------------------------------------------------------------------------------

    // search for (false &&) to revert to previous v1 changes

    // ---------------------------------------------------------------------------------------------------

    return (
        <div className='home-card' style={{ height: props?.height, width: props?.width }}>
            {/* <div style={getBackgroundStyle(props)} /> */}
            {props?.image ?
                <img style={{ width: '100%', height: '100%' }} src={props?.image} />
                : <div className='w-100 d-flex justify-content-center align-items-center' style={{ background: 'rgba(229, 229, 229, 0.5)' }}>
                    <img src={ImagePlaceholder} />
                </div>}
            <div>
                {/* {props?.isNew && <div className='newly-added d-flex align-items-center justify-content-center'>
                    <img className='newBackground' src={NewBackground} alt="newBg" />
                    <p className='new-text normal-fw s-fs black-text mb-2'>{t("home.newlyAdded")}</p>
                </div>} */}
                <div className='like-container ' onClick={handleFavoriteClick}>
                    {isLoading ? (
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            top: -5,
                            right: -5
                        }}>
                            <Lottie
                                style={{ height: 35, width: 35 }}
                                loop={true}
                                autoPlay={true}
                                animationData={Loading}
                            />
                        </div>
                    ) :
                        !props?.isFavorite ? <img
                            className='like'
                            src={HeartWhite}
                            alt="heart"
                        /> :
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                top: -28,
                                right: -28
                            }}>
                                <Lottie
                                    style={{ height: 80, width: 80 }}
                                    loop={true}
                                    autoPlay={true}
                                    animationData={heart}
                                />
                            </div>
                    }
                </div>
                <div className='follower-content px-2'>
                    <img className='follower-icon-size' src={Followers} alt="followers" />
                    <p className='normal-fw l-fs black-text ms-1'>{numberToK(props?.favoriteCount) || 0}</p>
                </div>
                {props?.openingDetails && props?.type == 'all' && (<div className='not-available'>
                    <p className='semiBold-fw black-text' style={{ fontSize: 10 }}>{props?.openingDetails?.message}</p>
                </div>)}
                {(props?.campaigns && props?.campaigns?.length > 1) &&
                    <div className='promo-content-row'>
                        {(props?.type != "favorite" && props?.type != "custom" && props?.type != "recent") ? <img className='icon-size' src={Offer} alt="offer" /> : null}
                        <p className={`black-fw ${(props?.type != "favorite" && props?.type != "custom") ? "m-fs" : "s-fs"} white-text text-ellipsis ms-1`}>{props?.campaigns?.length} {t('home.offerAvailable')}</p>
                    </div>}
                {(props?.campaigns && props?.campaigns?.length == 1) && <div className='promo-content'>
                    {offerData?.type == 'promotion' && !props?.type ? <>
                        <p className='black-fw m-fs white-text text-ellipsis'>{offerData?.name}</p>
                        {offerData?.baseCode == MAP_CAMPAIGN_TYPE.HAPPYHOURS && <p className='bold-fw s-fs white-text text-ellipsis' style={{ fontSize: 10 }}>{offerData?.startTime} - {offerData?.endTime}</p>}
                    </> :
                        <>
                            <p className='black-fw m-fs white-text text-ellipsis'>{offerData?.discount} {offerData?.offerType == OFFERS_TYPE.FLAT ? symbol : "%"} Off</p>
                            <p className='medium-fw white-text text-ellipsis' style={{ fontSize: 10 }}>{t('home.above')} {formatToGermanNumber(offerData?.minimumOrderValue)} {symbol}</p>
                        </>}
                </div>}
            </div>
        </div>
    )
}

export default CardImage

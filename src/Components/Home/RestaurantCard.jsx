// components/Home/components/RestaurantCard.jsx
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { metersToKilometers, ratingStructure, numberToK } from '../../Utils';
import { MAP_CAMPAIGN_TYPE } from '../../constants/enums';

// Assets
import Star from '../../assets/svg/rating.svg';
import Dot from '../../assets/svg/dot.svg';
import FireGif from "../../assets/gif/fire.gif";
import HatGif from "../../assets/gif/hat.gif";
import StarGif from "../../assets/gif/star.gif";

// Get appropriate gif based on campaign type
const getGiftData = (baseCode) => {
    if (baseCode === MAP_CAMPAIGN_TYPE.HAPPYHOURS) return FireGif;
    if (baseCode === MAP_CAMPAIGN_TYPE.SPECIALDAY) return StarGif;
    return HatGif;
};

const RestaurantCard = ({ restaurant, type, promotionsData }) => {
    const { t } = useTranslation();

    // Process offer data if available (for full restaurant cards)
    const offerData = useMemo(() => {
        if (!restaurant?.campaigns || restaurant.campaigns.length !== 1 || !promotionsData || type !== 'full') {
            return null;
        }

        const offer = restaurant.campaigns[0];
        if (!offer?.promotion) return null;

        const promotion = promotionsData.find(p => p?._id === offer.promotion);
        if (!promotion) return null;

        return {
            name: promotion.displayName,
            baseCode: promotion.baseCode,
            startTime: offer.startTime,
            endTime: offer.endTime,
            giftData: getGiftData(promotion.baseCode)
        };
    }, [restaurant?.campaigns, promotionsData, type]);

    // Render rating and reviews section
    const renderRating = () => {
        if (!restaurant?.reviewAverage && !restaurant?.reviewCount) {
            return (
                <div className='ps-1'>
                    <p className={type === 'full' ? 'content-fontsize bold-fw black-text' : 's-fs bold-fw black-text'}>
                        {t("common.new")}
                    </p>
                </div>
            );
        }

        return (
            <div className='d-flex align-items-center ps-1'>
                <p className={type === 'full' ? 'content-fontsize bold-fw black-text' : 's-fs bold-fw black-text'}>
                    {ratingStructure(restaurant?.reviewAverage) || 0}
                </p>
                <p className={type === 'full' ? 'content-fontsize bold-fw black-text ms-1' : 's-fs bold-fw black-text ms-1'}>
                    ({numberToK(restaurant?.reviewCount) || 0})
                </p>
            </div>
        );
    };

    // For section cards (compact view)
    if (type === 'section') {
        return (
            <div className='card-content-1'>
                <p className='l-fs bold-fw black-text text-ellipsis'>{restaurant?.name}</p>
                <div className='d-flex align-items-center my-1'>
                    <img className='star' src={Star} alt="star" />
                    {renderRating()}
                    <img className='dot mx-1' src={Dot} alt="dot" />
                    <p className='black-text bold-fw content-fontsize'>
                        {metersToKilometers(restaurant?.distanceInMeters)} {t("common.km")}
                    </p>
                </div>
                <p className='black-text normal-fw s-fs text-ellipsis'>
                    {restaurant?.cuisines?.join(', ')}
                </p>
            </div>
        );
    }

    // For full restaurant cards (detailed view)
    return (
        <div className='card-content-4'>
            <p className='l-fs bold-fw black-text text-ellipsis'>{restaurant?.name}</p>
            <div className='d-flex align-items-center my-1'>
                <img className='star' src={Star} alt="star" />
                {renderRating()}
                <img className='dot mx-1' src={Dot} alt="dot" />
                <p className='black-text bold-fw content-fontsize'>
                    {metersToKilometers(restaurant?.distanceInMeters)} {t("common.km")}
                </p>
            </div>
            <p className='heading s-fs normal-fw text-ellipsis mb-1'>{restaurant?.address}</p>
            <p className='black-text normal-fw s-fs text-ellipsis'>{restaurant?.cuisines?.join(', ')}</p>

            {/* Campaign display */}
            {offerData && (
                <div className='mt-2 campaign-container px-1'>
                    <img className='icon-size' src={offerData.giftData} alt="offer" />
                    <div className='ms-1' style={{ width: "75%" }}>
                        <p className='m-fs black-fw white-text text-ellipsis'>{offerData.name}</p>
                        {offerData.baseCode === MAP_CAMPAIGN_TYPE.HAPPYHOURS && (
                            <p className='medium-fw white-text' style={{ fontSize: 10, lineHeight: 1 }}>
                                {offerData.startTime} - {offerData.endTime}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(RestaurantCard);
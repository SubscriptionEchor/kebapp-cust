import React, { useEffect, useState } from 'react';
import "./style.css"
import PageTitle from '../../Components/PageTitle';
import { useTranslation } from 'react-i18next';
import { gql, useQuery } from '@apollo/client';
import Loader from '../../Components/Loader/Loader';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import CouponCard from '../../assets/svg/couponCard.svg'
import couponCardImg from '../../assets/PNG/couponCardImg.png'
import { getCampaignsByRestaurant } from '../../apollo/server';

const CAMPAIGNS = gql`${getCampaignsByRestaurant}`;

const Coupons = () => {
    const { t } = useTranslation();
    let restaurantDetails = localStorage.getItem(LOCALSTORAGE_NAME.RESTAURANT_ID);
    restaurantDetails = JSON.parse(restaurantDetails);
    const [campaignsData, setCampaignsData] = useState([]);


    const { loading } = useQuery(CAMPAIGNS, {
        variables: {
            restaurantId: restaurantDetails?._id,
        },
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        skip: !restaurantDetails?._id,
        onCompleted: (data) => {
            if (data?.getCampaignsByRestaurant, "campaigns") {
                setCampaignsData(data?.getCampaignsByRestaurant);
            }
        }
    });

    const handleBack = (id) => {
        if (window.handleCustomBack) {
            localStorage.setItem(LOCALSTORAGE_NAME.COUPON_DETAIL, JSON.stringify({
                restaurantId: restaurantDetails?._id,
                couponId: id
            }));
            window.handleCustomBack();
        }
    };

    if (loading) {
        return <Loader />
    }

    return (
        <div className="coupons-component">
            <PageTitle title={t("screenTitle.coupons")} />
            <div className='pd-horizontal mt-3 position-relative'>
                {campaignsData?.length > 0 && campaignsData?.map((el, i) => {
                    return (
                        <div key={i}
                            className='coupon-card-bg mb-3'
                            style={{ backgroundImage: `url(${CouponCard})` }}
                        >
                            <img className='coupon-card-icon' src={couponCardImg} alt="card" />
                            <div className='coupon-card-content py-3'>
                                <p className='xl-fs bold-fw black-text text-ellipsis' style={{ width: "95%" }}>{el?.name} </p>
                                <p className='l-fs normal-fw black-text text-ellipsis' style={{ width: "95%" }}>{el?.description}</p>
                                <div className='d-flex align-items-center justify-content-between' style={{ width: "95%" }}>
                                    <div className='coupon-code-place px-2'>
                                        <p className='m-fs semiBold-fw black-text text-ellipsis' style={{ letterSpacing: 3 }}>{el?.couponCode}</p>
                                    </div>
                                    <div className='coupon-apply' onClick={() => handleBack(el?._id)}>
                                        <p className='m-fs semiBold-fw'>Apply</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {campaignsData?.length == 0 && <div className='w-100 d-flex flex-column align-items-center justify-content-center' style={{ height: "90vh" }}><p className='m-fs semiBold-fw placeholder-text'>{t('common.noData')}</p></div>}
            </div>
        </div>
    );
};

export default Coupons;
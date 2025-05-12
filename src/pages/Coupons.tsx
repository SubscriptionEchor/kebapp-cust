import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GET_CAMPAIGNS_BY_RESTAURANT } from '../graphql/queries';
import { useQuery } from '@apollo/client';
import { useBootstrap } from '../context/BootstrapContext';
import CouponCard from '../assets/svg/couponCard.svg'
import couponCardImg from '../assets/PNG/couponCardImg.png'
import { useAuth } from '../context/AuthContext';


const Coupons: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [campaignsData, setCampaignsData] = useState([]);
  const { bootstrapData } = useBootstrap()
  const state = useLocation()
  const { couponCodeId, setCouponCodeId } = useAuth()

  const { loading } = useQuery(GET_CAMPAIGNS_BY_RESTAURANT, {
    variables: {
      restaurantId: state?.state?.restaurantId,
    },
    fetchPolicy: "network-only",
    // nextFetchPolicy: 'cache-only',
    skip: !state?.state?.restaurantId,
    onCompleted: (data) => {
      if (data?.getCampaignsByRestaurant, "campaigns") {
        setCampaignsData(data?.getCampaignsByRestaurant);
      }
    }
  });

  const restaurantCampaigns = (campaignsData) => {
    return campaignsData?.map(campaign => {
      const promotion = bootstrapData?.promotions?.find(
        (p: any) => p._id === campaign.promotion
      );
      if (promotion) {
        return {
          ...campaign,
          displayName: promotion.displayName,
          baseCode: promotion.baseCode,
          promotionType: promotion.promotionType,
          minPercentageDiscount: promotion.minPercentageDiscount,
          maxPercentageDiscount: promotion.maxPercentageDiscount,
          minFlatDiscount: promotion.minFlatDiscount,
          maxFlatDiscount: promotion.maxFlatDiscount
        };
      }

      return campaign;
    });
  };

  const campaignsWithDetails = restaurantCampaigns(campaignsData);

  console.log(campaignsWithDetails, "ss")
  return (
    <div className="h-full">

      {/* Coupons List */}
      <div className="p-4 space-y-4 h-full">
        {campaignsWithDetails.map((coupon, index) => (
          <div
            key={index}
            className=" shadow-sm bg-transparent "
            style={{ backgroundImage: `url(${CouponCard})` }}
          >
            <div className="flex p-4">
              <img className='rounded' style={{ width: 130 }} src={couponCardImg} alt="card" />
              <div className="flex-1 ml-4">
                <h3 className="text-md font-bold text-gray-900 ">
                  {/* Weekend Deal 20% Off */}
                  {/* {coupon?.} */}
                  {coupon?.percentageDiscount ? coupon?.percentageDiscount + "%" : coupon?.faltDiscount + "flat"} OFF
                </h3>
                <div className=''>
                  {coupon?.minimumOrderValue && <p className="text-[13px] py-0.5 text-gray-600 ">
                    On orders above {coupon?.minimumOrderValue} {bootstrapData?.currencyConfig?.currencySymbol} {coupon?.maxDiscount ? ". Max discount " + coupon?.maxDiscount + bootstrapData?.currencyConfig?.currencySymbol : ""}
                  </p>}
                  <div className="flex items-center gap-3">
                    <div className="text-[13px] font-medium w-[48%] text-gray-900 bg-gray-50 px-3 py-2 rounded">
                      {coupon.couponCode}
                    </div>
                    <button
                      onClick={() => {
                        if (coupon.isActive) {
                          if (couponCodeId == coupon?.couponCode) {
                            setCouponCodeId("")
                            return
                          }
                          setCouponCodeId(coupon?.couponCode);
                          navigate(-1);
                        }
                      }}
                      className={`px-6 py-2 w-[48%] text-[13px] font-medium border rounded transition-colors ${couponCodeId === coupon?.couponCode
                        ? "bg-secondary text-black border-secondary"
                        : "bg-white text-secondary border-secondary "
                        }`}
                    >
                      {couponCodeId === coupon?.couponCode ? "Applied" : "Apply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div >
  );
};

export default Coupons;
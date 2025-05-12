import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GET_CAMPAIGNS_BY_RESTAURANT } from '../graphql/queries';
import { useQuery } from '@apollo/client';
import { useBootstrap } from '../context/BootstrapContext';


const coupons = [

];

const Coupons: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [campaignsData, setCampaignsData] = useState([]);
  const { bootstrapData } = useBootstrap()
  const state = useLocation()

  console.log(state, "sss")
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


  return (
    <div className="min-h-screen bg-gray-50">

      {/* Coupons List */}
      <div className="p-4 space-y-4">
        {campaignsWithDetails.map((coupon, index) => (
          <div
            key={index}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
          >
            <div className="flex p-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={coupon.image}
                  alt={coupon.code}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 ml-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Weekend Deal 20% Off
                </h3>
                <p className="text-[13px] text-gray-600 mb-4">
                  {coupon.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-[13px] font-medium w-[48%] text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {coupon.code}
                  </div>
                  <button
                    onClick={() => {
                      if (coupon.isActive) {
                        navigate(-1);
                      }
                    }}
                    className="px-6 py-2 bg-white w-[48%] text-secondary border border-secondary rounded text-[13px] font-medium hover:bg-secondary hover:text-black transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coupons;
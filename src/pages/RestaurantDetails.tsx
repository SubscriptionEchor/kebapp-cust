import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { SINGLE_RESTAURANT_QUERY } from '../graphql/queries';
import { BadgePercent, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import LoadingAnimation from '../components/LoadingAnimation';
import RestaurantHeader from '../components/Restaurant/RestaurantHeader';
import SearchBar from '../components/Restaurant/SearchBar';
import { useBootstrap } from '../context/BootstrapContext';
import CartSummary from '../components/Restaurant/CartSummary';
import MenuSection from '../components/Restaurant/MenuSection';
import { RestaurantDetailMap } from '../components/Map/OpenStreetMap';
import { UseLocationDetails } from '../context/LocationContext';


const RestaurantDetails: React.FC = () => {
  const { id } = useParams();
  const { bootstrapData } = useBootstrap();
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isNonVegOnly, setIsNonVegOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [promotions, setPromotions] = useState([])
  const [isMapview, setIsMapView] = useState(false)
  const { temporaryLocation } = UseLocationDetails()
  const [dietary, setDietary] = useState('')
  console.log(temporaryLocation)

  // Auto-rotate promotions
  useEffect(() => {
    if (!promotions?.length) return;

    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % promotions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [promotions?.length]);

  const { loading, error, data } = useQuery(SINGLE_RESTAURANT_QUERY, {
    variables: {
      id,
      restaurantId: id
    },
    skip: !id
  });
  console.log(data)

  useEffect(() => {
    if (!data?.campaigns) {
      return
    }
    setPromotions(data?.campaigns?.map(campaign => {
      if (campaign?.promotion) {
        // Convert string timestamps to Date objects


        const promotion = bootstrapData?.promotions?.find(
          (p: any) => p._id === campaign.promotion
        );
        if (promotion) {
          return {
            ...campaign,
            displayName: promotion.couponName,
            baseCode: promotion.baseCode,
            promotionType: promotion.promotionType,
            minPercentageDiscount: promotion.minPercentageDiscount,
            maxPercentageDiscount: promotion.maxPercentageDiscount,
            minFlatDiscount: promotion.minFlatDiscount,
            maxFlatDiscount: promotion.maxFlatDiscount
          };
        }
      }
      return campaign;
    }) || [])
  }, [data?.campaigns])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }


  // Process promotions similar to home page


  // Auto-rotate promotions
  // useEffect(() => {
  //   if (!campdata?.getCampaignsByRestaurant?.length) return;

  //   const interval = setInterval(() => {
  //     setCurrentPromoIndex(prev => 
  //       (prev + 1) % data.restaurant.campaigns.length
  //     );
  //   }, 3000);

  //   return () => clearInterval(interval);
  // }, [campdata?.getCampaignsByRestaurant?.length]);

  const filterMenuItems = (items: any[]) => {
    if (!items) return [];

    return items.filter(item => {
      // Search query filter
      const matchesSearch = searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.internalName.toLowerCase().includes(searchQuery.toLowerCase());

      // Veg/Non-veg filter
      const MatchesDietray = dietary ? item.dietaryType?.includes(dietary) : true;


      // Tags filter - show if any selected tag matches
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => item.tags?.includes(tag));

      return matchesSearch && MatchesDietray && matchesTags;
    });
  };



  if (error || !data?.restaurant) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load restaurant details</p>
        </div>
      </div>
    );
  }

  // const handleTouchStart = (e: React.TouchEvent) => {
  //   setTouchStart(e.touches[0].clientX);
  // };

  // const handleTouchMove = (e: React.TouchEvent) => {
  //   if (!touchStart) return;

  //   const currentTouch = e.touches[0].clientX;
  //   const diff = touchStart - currentTouch;

  //   if (Math.abs(diff) > 50) {
  //     if (diff > 0) {
  //       setCurrentPromoIndex(prev => (prev + 1) % promotions.length);
  //     } else {
  //       setCurrentPromoIndex(prev => (prev - 1 + promotions.length) % promotions.length);
  //     }
  //     setTouchStart(null);
  //   }
  // };

  // const handleTouchEnd = () => {
  //   setTouchStart(null);
  // };
  console.log(promotions)
  return (
    <div className="min-h-screen bg-white">

      <RestaurantHeader
        id={data.restaurant._id}
        name={data.restaurant.name}
        rating={data.restaurant.reviewAverage || 0}
        reviews={data.restaurant.reviewCount || 0}
        owner={data.restaurant.owner}
        username={data.restaurant.username}
        phone={data.restaurant.phone}
        openingTimes={data.restaurant.openingTimes}
        distance={data.restaurant.distanceInMeters}
        address={data.restaurant.address}
        initialLikeCount={data.restaurant.favoriteCount || 0}
        setIsMapView={setIsMapView}
        isMapView={isMapview}
      />
      {!isMapview ?
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            dietary={dietary}
            onToggle={(value) => {
              if (value == dietary) {
                setDietary('')
                return
              }
              setDietary(value)
            }}

            selectedTags={selectedTags}
            onTagSelect={(tag) => {
              setSelectedTags(prev =>
                prev.includes(tag)
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              );
            }}
          />
          {/* Promotions Carousel */}
          {promotions?.length > 0 && (
            <div className="px-4 py-3 relative">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FFF3D0] to-[#FFE4B5] shadow-sm">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentPromoIndex * 100}%)` }}
                >
                  {promotions.map((promo, index) => (
                    <div
                      key={promo._id}
                      className="min-w-full p-5 flex items-center justify-between relative overflow-hidden"
                    >
                      <div className="">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                              <BadgePercent className="text-secondary" size={20} />
                            </div>
                            <div>
                              <h3 className="text-[13px] font-semibold text-gray-900">
                                {promo.couponCode}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Clock size={12} className="text-gray-500" />
                                <div className="flex gap-1 text-[11px] text-gray-600">
                                  <span>{promo.startTime}</span>
                                  <span>-</span>
                                  <span>{promo.endTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock size={12} className="text-gray-500" />
                            <div className="flex gap-1 text-[11px] text-gray-600">
                              <span>{moment(parseInt(promo?.startDate)).format('DD MMM')}</span>
                              <span>-</span>
                              <span>{moment(parseInt(promo?.endDate)).format('DD MMM')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-secondary">
                            {promo.campaignType === "PERCENTAGE"
                              ? `${promo.percentageDiscount}% OFF`
                              : `€${promo.flatDiscount} OFF`}
                          </span>
                          <p className="text-[11px] text-gray-600 mt-1">
                            Min. order <span className="font-medium">€{promo.minimumOrderValue}</span>
                          </p>
                        </div>
                      </div>

                    </div>))}

                </div>

              </div>
              {/* Navigation Dots */}
              {promotions.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {promotions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPromoIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentPromoIndex
                        ? 'bg-secondary w-4'
                        : 'bg-gray-300'
                        }`}
                      aria-label={`Go to promotion ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!data?.menu && <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
              <BadgePercent size={36} className="text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Menu Items Available</h3>
          </div>}
          {/* Menu Sections */}
          <div className="mt-4">
            {data?.menu?.categoryData?.filter((category: any) => category.active)
              .every((category: any) => {
                const categoryItems = category.foodList
                  ?.map((foodId: string) => data?.menu?.food?.find((f: any) => f._id === foodId))
                  .filter(Boolean)
                  .filter(item => filterMenuItems([item]).length > 0);
                return categoryItems.length === 0;
              }) && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <BadgePercent size={36} className="text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Menu Items Available</h3>
                  <p className="text-sm text-gray-500 text-center">Try adjusting your filters or search criteria</p>
                </div>
              )}

            {data?.menu?.categoryData
              ?.filter((category: any) => category.active)
              .map((category: any, index: number) => {
                const categoryItems = category.foodList
                  ?.map((foodId: string) =>
                    data?.menu?.food?.find((f: any) => f._id === foodId)
                  )
                  .filter(Boolean)
                  .filter(item => filterMenuItems([item]).length > 0);

                if (categoryItems.length === 0) return null;

                return (
                  <MenuSection
                    key={category._id}
                    name={category.name}
                    items={categoryItems}
                    fallbackImage={data.restaurant.image}
                    layout={index === 0 ? 'horizontal' : 'vertical'}
                    categoryId={category._id}
                    restaurantId={data.restaurant._id}
                    restaurantName={data.restaurant.name}
                    optionSetList={data?.menu?.optionSetList?.map(item => ({
                      ...item,
                      optionData: item?.optionData?.map(od => ({
                        ...od,
                        name: data?.menu?.food?.find(food => food?._id == od?.foodId)?.name
                      }))
                    }))}
                  />
                );
              })}
          </div>
          <>
            <div className="h-24 " /> {/* Spacer for cart summary */}
            <CartSummary restaurantId={data.restaurant._id} />
          </>
        </> :
        <>
          {temporaryLocation?.latitude && data?.restaurant?.location?.coordinates && <RestaurantDetailMap
            userLocation={{
              lat: Number(temporaryLocation?.latitude),
              lng: Number(temporaryLocation?.longitude)
            }}

            restaurantLocation={{
              lat: Number(data?.restaurant?.location?.coordinates[1]),
              lng: Number(data?.restaurant?.location?.coordinates[0])
            }}
            height={"72vh"}

          />}
        </>
      }
    </div>

  );
};

export default RestaurantDetails;

import React, { memo, lazy, Suspense, useEffect, useRef } from 'react'; // Added useRef
import Loader from '../../Components/Loader/Loader';
import CardImage from '../CardImage';
import SectionHeader from './SectionHeader';
import RestaurantCard from './RestaurantCard';
import { verifyAllData } from './utils/helpers';

// Assets
import LeftLine from '../../assets/svg/lineLeft.svg';
import RightLine from '../../assets/svg/lineRight.svg';

// Lazy loaded components
const Banners = lazy(() => import('../../Components/Banners'));



// Common Restaurant Section Component
export const RestaurantSection = memo(
    ({ title, restaurants, handleMapModal, onFavoriteClick, promotionsData, index }) => {
        const animationClass = index % 2 === 0 ? 'slide-left' : 'slide-right';

        return (
            <div className={`mt-4 ${animationClass}`}>
                <SectionHeader title={title} leftLineImg={LeftLine} rightLineImg={RightLine} />
                <div className="d-flex overflow-auto hide-scroll-bar pd-horizontal mt-3">
                    {restaurants?.map((restaurant, i) => (
                        <div
                            key={`${restaurant._id}-${i}`}
                            className="card-spacing"
                            onClick={() => handleMapModal(restaurant?._id)}
                        >
                            <CardImage
                                props={{
                                    type: 'custom',
                                    height: 155,
                                    width: 131,
                                    img: restaurant?.image,
                                    isFavorite: restaurant.isFavorite,
                                    favoriteCount: restaurant?.favoriteCount,
                                    campaigns: restaurant?.campaigns,
                                    promotions: promotionsData,
                                    onFavoriteClick: () => onFavoriteClick(restaurant._id),
                                }}
                            />
                            <RestaurantCard restaurant={restaurant} type="section" />
                        </div>
                    ))}
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.title === nextProps.title &&
            prevProps.index === nextProps.index &&
            prevProps.restaurants === nextProps.restaurants
        );
    }
);

const RestaurantListView = ({
    checkAllApiStatusFailed,
    bannersData,
    organizedSections,
    allRestaurants,
    visibleRestaurants,
    filterLoading,
    windowHeight,
    isModalVisible,
    t,
    handleMapModal,
    handleToggleFavorite,
    promotionsData,
    getOpeningStatus,
    loadingFavorites,
    onBottomReached, // This prop will trigger the load more function
    pagination,
    setPagination,
    isLoadingMore,
}) => {
    const restaurantListRef = useRef(null); // Ref for the scrollable div
    // Update the scroll detection code in RestaurantListView.jsx
    // This fixes the useEffect that handles the scroll event

    useEffect(() => {
        const restElement = restaurantListRef.current;
        if (!restElement) return;

        // Flag to track if we're already loading more data
        let isLoading = false;
        // Flag to track if we've reached the end of the list
        let hasReachedEnd = false;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = restElement;

            // Only trigger when very close to the bottom (within 20px)
            // This prevents triggering when just scrolling normally
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                // Check if we're already loading or if we've reached the end
                if (!isLoading && !hasReachedEnd && onBottomReached) {
                    isLoading = true;
                    onBottomReached();

                    // Reset the loading flag after a short delay
                    setTimeout(() => {
                        isLoading = false;
                    }, 1000); // Debounce period to prevent multiple triggers
                }
            }

            // If user scrolls back up, we can reset the end flag
            if (scrollTop < scrollHeight - clientHeight - 100) {
                hasReachedEnd = false;
            }
        };

        // Use a debounced version of the scroll handler to improve performance
        let scrollTimeout;
        const debouncedHandleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 100);
        };

        restElement.addEventListener('scroll', debouncedHandleScroll);

        // Update flags when the loading state changes
        if (isLoadingMore) {
            isLoading = true;
        } else {
            isLoading = false;
        }

        // Update flags when pagination changes
        if (!pagination?.hasNextPage) {
            hasReachedEnd = true;
        }

        // Cleanup the event listener on unmount
        return () => {
            restElement.removeEventListener('scroll', debouncedHandleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [onBottomReached, isLoadingMore, pagination?.hasNextPage]); // Added pagination.hasNextPage dependency

    return (
        <>
            {!verifyAllData(checkAllApiStatusFailed) ? (
                <div>
                    {/* Banner section */}
                    {bannersData?.length > 0 && (
                        <div className="slide-down-banner" style={{ width: '100%' }}>
                            <Suspense fallback={<div className="banner-placeholder" />} >
                                <Banners data={bannersData} />
                            </Suspense>
                        </div>
                    )}

                    {/* Section with organized data */}
                    {organizedSections?.map((section, index) => (
                        <RestaurantSection
                            key={section.sectionName || index}
                            index={index}
                            title={section.sectionName}
                            restaurants={section.restaurants}
                            handleMapModal={handleMapModal}
                            onFavoriteClick={handleToggleFavorite}
                            promotionsData={promotionsData}
                        />
                    ))}

                    {/* Section 4 - All restaurants */}
                    <div className="mt-4">
                        <SectionHeader
                            title={`${allRestaurants.length} ${t('home.restaurantsNearYou')}`}
                            leftLineImg={LeftLine}
                            rightLineImg={RightLine}
                        />

                        {/* Filter loading state */}
                        {filterLoading ? (
                            <div className="mt-3 d-flex justify-content-center">
                                <Loader />
                            </div>
                        ) : allRestaurants?.length > 0 ? (
                            <div

                                ref={restaurantListRef} // Attach the ref to the scrollable div
                                className="pd-horizontal mt-3"
                                style={{ overflowY: 'auto', maxHeight: windowHeight * 0.8 }} // Ensure the div is scrollable
                            >
                                {allRestaurants.map((restaurant, i) => {
                                    const openingDetails = getOpeningStatus(restaurant);
                                    const animationClass = i % 2 === 0 ? 'slide-left' : 'slide-right';

                                    return (
                                        <div
                                            key={restaurant._id || i}
                                            className={`section-4-card d-flex align-items-center justify-content-between mb-4 ${animationClass}`}
                                            onClick={() => handleMapModal(restaurant)}
                                        >
                                            <CardImage
                                                props={{
                                                    type: 'all',
                                                    height: 155,
                                                    width: '56%',
                                                    img: restaurant?.image,
                                                    isFavorite: restaurant.isFavorite,
                                                    favoriteCount: restaurant?.favoriteCount,
                                                    campaigns: restaurant?.campaigns,
                                                    promotions: promotionsData,
                                                    notAvailable: !restaurant?.isAvailable,
                                                    onFavoriteClick: () => handleToggleFavorite(restaurant._id),
                                                    openingDetails: openingDetails,
                                                    isLoading: loadingFavorites.has(restaurant._id),
                                                }}
                                            />
                                            <RestaurantCard
                                                restaurant={restaurant}
                                                type="full"
                                                promotionsData={promotionsData}
                                            />
                                        </div>
                                    );
                                })}
                                {/* Show a loader while loading more restaurants */}
                                {isLoadingMore && (
                                    <div className="d-flex justify-content-center my-3">
                                        <Loader />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="l-fs mt-3 text-center mt-4">{t('common.noDataAvailable')}</p>
                        )}
                    </div>

                    {/* Modal background */}
                    {isModalVisible && <div className="bg-dull" />}

                    {/* Bottom spacing */}
                    <div style={{ height: windowHeight * 0.1 }}></div>
                </div>
            ) : (
                <div className="noData" style={{ height: '80vh' }}>
                    <p className="m-fs bold-fw placeholder-text">{t('common.noData')}</p>
                </div>
            )}
        </>
    );
};

export default memo(RestaurantListView);
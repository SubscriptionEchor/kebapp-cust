import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './RestaurantDetailCard.css';
import { useTranslation } from 'react-i18next';

// SVG icons as React components for better styling control
const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const DirectionsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.43 10.593L13.415 1.578C12.633 0.796 11.367 0.796 10.585 1.578L1.57 10.593C0.788 11.375 0.788 12.641 1.57 13.423L10.585 22.438C11.367 23.22 12.633 23.22 13.415 22.438L22.43 13.423C23.212 12.641 23.212 11.375 22.43 10.593Z" fill="#000000" />
        <path d="M16 10L12 6M12 6L8 10M12 6V18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const OrderNowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H21M5 6V20H19V6M8 6V4H16V6M10 10H14M10 14H14M10 18H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const StarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LikeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 10V17M17.3333 8.2C17.3333 9.2667 16.4667 10.1333 15.4 10.1333C17.3333 10.1333 18.6667 12.2 18 14.2C19.3333 14.2 20.4 15.2667 20 16.3333L19.6667 17.8667C19.5333 18.4 19 18.8 18.3333 18.8H14.6667C13.6667 18.8 12.8 18.4 12 18L7 15.1333M7 10H4.2C3.5333 10 3 10.5333 3 11.2V15.8C3 16.4667 3.5333 17 4.2 17H7M7 10H10.3333L15.4 8.2C16.0667 8.06667 16.6667 8.6 16.6667 9.26667V9.8C16.6667 10.0667 16.5333 10.3333 16.3333 10.4667L14 12.2" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ReviewIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12H16M8 16H13.5M4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const LocationIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#6B7280" strokeWidth="2" />
        <path d="M12 21C16 17 20 13.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 13.4183 8 17 12 21Z" stroke="#6B7280" strokeWidth="2" />
    </svg>
);

const OfferIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 14L15 8M9.5 8.5H9.51M14.5 13.5H14.51M19 21L12 17L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="#6B7280" strokeWidth="2" />
        <path d="M12 7V12L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/**
 * Enhanced RestaurantDetailCard component
 * Displays restaurant information from map view with extended functionality
 */
const RestaurantDetailCard = ({ data, onClose, userLocation, onOrderNow, onLoadMore }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'offers'
    const [showOpeningHours, setShowOpeningHours] = useState(false);

    if (!data) return null;

    // Handle close - stop propagation to prevent interference
    const handleClose = (e) => {
        e.stopPropagation();
        if (onClose) onClose();
    };

    // Prevent closing when clicking inside the card
    const handleCardClick = (e) => {
        e.stopPropagation();
    };

    // Format distance in a user-friendly way
    const formatDistance = (distance) => {
        if (!distance) return 'Unknown distance';

        if (distance < 1) {
            return `${Math.round(distance * 1000)}m away`;
        }
        return `${distance.toFixed(1)}km away`;
    };

    // Get directions to restaurant
    const onClickViewDirections = () => {
        if (!data?.location?.coordinates) return;

        const [lng, lat] = data.location.coordinates;

        let cords = {
            rest_lat: parseFloat(lat),
            rest_lng: parseFloat(lng)
        };

        let url = `https://www.google.com/maps/dir/?api=1&destination=${cords.rest_lat},${cords.rest_lng}`;

        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            webApp.openLink(url, { try_instant_view: false });
        } else {
            window.open(url, '_blank');
        }
    };

    // Calculate distance if we have both points
    const calculateDistance = () => {
        if (!userLocation || !data.location || !data.location.coordinates) {
            return 'N/A';
        }

        const [lng, lat] = data.location.coordinates;
        const userLat = userLocation.lat;
        const userLng = userLocation.lng;

        // Simple distance calculation using Haversine formula
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat - userLat);
        const dLon = deg2rad(lng - userLng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km

        return formatDistance(distance);
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    // Handle opening hours display
    const toggleOpeningHours = (e) => {
        e.stopPropagation();
        setShowOpeningHours(!showOpeningHours);
    };

    // Format opening hours
    const formatOpeningHours = () => {
        if (!data.openingTimes) return [];

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        return days.map(day => {
            const dayData = data.openingTimes.find(t => t.day.toLowerCase() === day.toLowerCase());
            if (!dayData) return { day, hours: "Closed" };

            if (!dayData.isOpen) return { day, hours: "Closed" };

            return {
                day,
                hours: `${dayData.openTime || '00:00'} - ${dayData.closeTime || '00:00'}`
            };
        });
    };

    // Check if restaurant has any active offers
    const hasOffers = data.campaigns && data.campaigns.length > 0;

    return (
        <div className="restaurant-card-container" onClick={handleClose}>
            <div className="restaurant-card" onClick={handleCardClick}>
                {/* Restaurant image or placeholder */}
                <div className="restaurant-image-container">
                    {data.image ? (
                        <img src={data.image} alt={data.name} className="restaurant-image" />
                    ) : (
                        <div className="restaurant-image-placeholder">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                <path d="M4 18L14 18M9 14L9 6M4 6L14 6M4 10L14 10M17 6L20 12L17 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>No Image Available</span>
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        className="restaurant-close-btn"
                        onClick={handleClose}
                        type="button"
                        aria-label="Close restaurant card"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Tab Navigation */}
                {hasOffers && (
                    <div className="restaurant-tab-nav">
                        <button
                            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            {t('restaurant.details') || 'Details'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('offers')}
                        >
                            {t('restaurant.offers') || 'Offers'}
                            <span className="offer-count">{data.campaigns.length}</span>
                        </button>
                    </div>
                )}

                {/* Restaurant details - Main tab */}
                {activeTab === 'details' && (
                    <div className="restaurant-content">
                        <div className="restaurant-header">
                            <h2 className="restaurant-title">{data.name || "Restaurant"}</h2>

                            {/* Available badge */}
                            {data.isAvailable && (
                                <div className="restaurant-badge-container">
                                    <div className="restaurant-badge available">
                                        {t('restaurant.open') || 'Open'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rating and info */}
                        <div className="restaurant-stats-container">
                            {/* Rating */}
                            <div className="restaurant-stat">
                                <StarIcon />
                                <span>{data.reviewAverage || "4.0"}</span>
                            </div>

                            {/* Likes */}
                            <div className="restaurant-stat">
                                <LikeIcon />
                                <span>{data.favoriteCount || 0}</span>
                            </div>

                            {/* Reviews */}
                            <div className="restaurant-stat">
                                <ReviewIcon />
                                <span>{data.reviewCount || 0}</span>
                            </div>

                            {/* Opening hours toggle */}
                            {data.openingTimes && data.openingTimes.length > 0 && (
                                <div className="restaurant-stat clickable" onClick={toggleOpeningHours}>
                                    <ClockIcon />
                                    <span>{t('restaurant.hours') || 'Hours'}</span>
                                </div>
                            )}
                        </div>

                        {/* Opening Hours popover */}
                        {showOpeningHours && (
                            <div className="opening-hours-container">
                                <h4 className="opening-hours-title">
                                    {t('restaurant.openingHours') || 'Opening Hours'}
                                </h4>
                                <div className="opening-hours-list">
                                    {formatOpeningHours().map((item, index) => (
                                        <div key={index} className="opening-hours-item">
                                            <span className="day">{item.day}</span>
                                            <span className="hours">{item.hours}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cuisine and distance */}
                        <div className="restaurant-info-container">
                            {data.cuisines && data.cuisines.length > 0 && (
                                <div className="restaurant-cuisine">
                                    {data.cuisines.slice(0, 3).join(', ')}
                                </div>
                            )}

                            {/* Distance from user */}
                            <div className="restaurant-distance">
                                <LocationIcon />
                                <span>{calculateDistance()}</span>
                            </div>
                        </div>

                        {/* Restaurant address */}
                        {data.address && (
                            <div className="restaurant-address">
                                {data.address}
                            </div>
                        )}

                        {/* Load more details button - shown only if onLoadMore is provided */}
                        {onLoadMore && (
                            <button
                                className="load-more-btn"
                                onClick={onLoadMore}
                                type="button"
                            >
                                {t('restaurant.loadMoreDetails') || 'Load More Details'}
                            </button>
                        )}
                    </div>
                )}

                {/* Offers tab */}
                {activeTab === 'offers' && (
                    <div className="restaurant-offers-content">
                        <h3 className="offers-heading">
                            {t('restaurant.currentOffers') || 'Current Offers'}
                        </h3>

                        <div className="offers-list">
                            {data.campaigns.map((campaign, index) => (
                                <div key={index} className="offer-item">
                                    <div className="offer-icon">
                                        <OfferIcon />
                                    </div>
                                    <div className="offer-content">
                                        <h4 className="offer-title">
                                            {campaign.displayName || "Special Offer"}
                                        </h4>
                                        <p className="offer-description">
                                            {campaign.promotionType === 'PERCENTAGE'
                                                ? `${campaign.minPercentageDiscount}% off your order`
                                                : `${campaign.minFlatDiscount} off your order`}
                                        </p>
                                        {campaign.code && (
                                            <div className="offer-code">
                                                <span className="code-label">Code:</span>
                                                <span className="code-value">{campaign.code}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="restaurant-card-actions">
                    <button
                        className="restaurant-action-btn directions-btn"
                        onClick={onClickViewDirections}
                        type="button"
                    >
                        <DirectionsIcon />
                        <span>{t('restaurant.getDirections') || 'Get Directions'}</span>
                    </button>

                    <button
                        className="restaurant-action-btn order-btn"
                        onClick={onOrderNow}
                        type="button"
                    >
                        <OrderNowIcon />
                        <span>{t('restaurant.orderNow') || 'Order Now'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetailCard;
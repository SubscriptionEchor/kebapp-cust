import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import HorizontalCard from '../RestaurantCard/HorizontalCard';
import './style.css';

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

const StallsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6.5H21M3 12H21M3 17.5H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="2" />
        <path d="M3 10H21" stroke="#6B7280" strokeWidth="2" />
        <path d="M16 2L16 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 2L8 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const LocationIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#6B7280" strokeWidth="2" />
        <path d="M12 21C16 17 20 13.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 13.4183 8 17 12 21Z" stroke="#6B7280" strokeWidth="2" />
    </svg>
);

const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="#6B7280" strokeWidth="2" />
        <path d="M12 7V12L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const InfoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 11V17M12 7V7.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const StatusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#10B981" />
        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Mock data
const MOCK_STALLS = [
    {
        "_id": "681b61d62ee6803e5e0b7fcc",
        "name": "Test Stall 1",
        "address": "Lindenstraße 37a",
        "reviewAverage": 4.1,
        "reviewCount": 0,
        "favoriteCount": 0,
        "cuisines": ["Kebapp"],
        "onboarded": true
    },
    {
        "_id": "6821a072a57dd15e247ed333",
        "name": "Test Stall 2",
        "address": "Lindenstraße 37a",
        "reviewAverage": 4.1,
        "reviewCount": 0,
        "favoriteCount": 0,
        "cuisines": ["Kebapp"],
        "onboarded": true
    }
];

// Stalls Flyout component
const StallsFlyout = ({ stalls, onClose, isLoading }) => {
    // Fix: Explicit handler with stopPropagation
    const handleCloseClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClose) onClose();
    };

    return (
        <div className="stalls-flyout">
            <div className="stalls-flyout-header">
                <h3>Event Stalls ({stalls.length})</h3>
                <button
                    className="stalls-close-btn"
                    onClick={handleCloseClick}
                    type="button"
                >
                    <CloseIcon />
                </button>
            </div>

            <div className="stalls-flyout-content">
                {isLoading ? (
                    <div className="stalls-loading">
                        <div className="spinner"></div>
                        <p>Loading stalls...</p>
                    </div>
                ) : stalls?.length > 0 ? (
                    <div className="stalls-list">
                        {stalls.map((stall) => (
                            <div className="stall-card-wrapper" key={stall._id}>
                                <HorizontalCard
                                    id={stall._id}
                                    name={stall.name || "Stall"}
                                    image={stall.image || null}
                                    rating={stall.reviewAverage || 4.0}
                                    cuisine={stall.cuisines?.[0] || "Food"}
                                    distance={"At event"}
                                    description={stall.address || "Food stall"}
                                    likes={stall.favoriteCount || 0}
                                    reviews={stall.reviewCount || 0}
                                    onboarded={stall.onboarded || false}
                                    campaigns={[]}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="stalls-empty">
                        <p>No stalls found for this event.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MapEventCard = ({ data, onClose, onVisitStalls }) => {
    const { t } = useTranslation();
    const [showStallsFlyout, setShowStallsFlyout] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Format date from timestamp
    const formatEventDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(parseInt(timestamp));
            return format(date, 'MMMM d, yyyy');
        } catch (e) {
            return timestamp;
        }
    };

    // Format date range
    const formatDateRange = () => {
        if (!data?.startDate) return '';

        try {
            const startDate = new Date(parseInt(data.startDate));
            const endDate = data?.endDate ? new Date(parseInt(data.endDate)) : null;

            if (!endDate) return format(startDate, 'MMMM d, yyyy');

            if (startDate.getFullYear() === endDate.getFullYear()) {
                if (startDate.getMonth() === endDate.getMonth()) {
                    return `${format(startDate, 'MMMM d')} - ${format(endDate, 'd')}, ${format(startDate, 'yyyy')}`;
                }
                return `${format(startDate, 'MMMM d')} - ${format(endDate, 'MMMM d')}, ${format(startDate, 'yyyy')}`;
            }

            return `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`;
        } catch (e) {
            console.error("Error formatting date range", e);
            return '';
        }
    };

    // Fix: Enhanced close handler with preventDefault
    const handleClose = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClose) onClose();
    };

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

    // Simple stalls handler with mock data
    const handleVisitStalls = () => {
        setIsLoading(true);
        setShowStallsFlyout(true);

        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);
            if (onVisitStalls) onVisitStalls(data?._id);
        }, 1000);
    };

    // Fix: Added explicit function for closing stalls flyout
    const handleCloseStallsFlyout = () => {
        setShowStallsFlyout(false);
    };

    if (!data) return null;

    // Calculate active status
    const isEventActive = data?.isActive && data?.isAvailable;

    return (
        <div className="event-card-container">
            <div className="event-card">
                {/* Header with yellow background */}
                <div className="event-card-header">
                    <div className="event-badge">EVENT</div>

                    {/* Close button - Fixed with type and clear handler */}
                    <button
                        className="event-close-btn"
                        onClick={handleClose}
                        type="button"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="event-card-content">
                    <div className="event-main-content">
                        <h2 className="event-title">{data?.name || "Event"}</h2>

                        {/* Status indicator */}
                        {isEventActive && (
                            <div className="event-status-container">
                                <StatusIcon />
                                <span className="status-text active">Active & Available</span>
                            </div>
                        )}

                        {/* Event info with icons */}
                        <div className="event-info-container">
                            {/* Date range */}
                            {data?.startDate && (
                                <div className="event-info-item">
                                    <CalendarIcon />
                                    <span>{formatDateRange()}</span>
                                </div>
                            )}

                            {/* Time range */}
                            {(data?.startTime || data?.endTime) && (
                                <div className="event-info-item">
                                    <ClockIcon />
                                    <span>
                                        {data.startTime}
                                        {data.endTime && ` - ${data.endTime}`}
                                    </span>
                                </div>
                            )}

                            {/* Location */}
                            {data?.address && (
                                <div className="event-info-item">
                                    <LocationIcon />
                                    <span>{data.address}</span>
                                </div>
                            )}

                            {/* Coordinates */}
                            {data?.location?.coordinates && (
                                <div className="event-info-item">
                                    <InfoIcon />
                                    <span>Coordinates: {data.location.coordinates[1]}, {data.location.coordinates[0]}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Details */}
                    <div className="event-details-section">
                        <h3 className="details-heading">Event Details</h3>

                        <div className="details-container">
                            <div className="details-item">
                                <span className="details-label">Event ID:</span>
                                <span className="details-value">{data._id}</span>
                            </div>

                            <div className="details-item">
                                <span className="details-label">Created:</span>
                                <span className="details-value">{formatEventDate(data.createdAt)}</span>
                            </div>

                            <div className="details-item">
                                <span className="details-label">Updated:</span>
                                <span className="details-value">{formatEventDate(data.updatedAt)}</span>
                            </div>

                            <div className="details-item">
                                <span className="details-label">Restaurants:</span>
                                <span className="details-value">{data.restaurants?.length || 0} registered</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="event-card-actions">
                    <button
                        className="action-btn directions-btn"
                        onClick={onClickViewDirections}
                        type="button"
                    >
                        <DirectionsIcon />
                        <span>{t('mapfilters.getdirections') || 'Get Directions'}</span>
                    </button>

                    <button
                        className="action-btn stalls-btn"
                        onClick={handleVisitStalls}
                        disabled={isLoading}
                        type="button"
                    >
                        <StallsIcon />
                        <span>
                            {isLoading ? 'Loading...' : (t('events.visitStalls') || 'Visit Stalls')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Stalls Flyout with mock data - Fixed callback */}
            {showStallsFlyout && (
                <StallsFlyout
                    stalls={MOCK_STALLS}
                    onClose={handleCloseStallsFlyout}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default MapEventCard;
// components/Home/utils/helpers.js

/**
 * Verify if any data exists in the provided object
 * @param {Object} data - Object to check for values
 * @returns {boolean} - True if any key has a truthy value
 */
export const verifyAllData = (data) => {
    if (!data || typeof data !== 'object') return false;

    for (const key in data) {
        if (data[key]) {
            return true;
        }
    }
    return false;
};

/**
 * Format time to 12-hour format
 * @param {Array|String} timeInput - Time input in various formats
 * @returns {String} - Formatted time string
 */
export const formatTimeTo12Hour = (timeInput) => {
    if (!timeInput) return "";

    let hours, minutes;

    // Check for array format
    if (Array.isArray(timeInput)) {
        if (timeInput.length === 2) {
            hours = parseInt(timeInput[0]);
            minutes = parseInt(timeInput[1]);
        } else if (timeInput.length === 1 && timeInput[0].includes(':')) {
            const parts = timeInput[0].split(':');
            hours = parseInt(parts[0]);
            minutes = parseInt(parts[1] || "00");
        } else {
            return "";
        }
    } else {
        return "";
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${formattedHour}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Check if filter or sort is applied
 * @param {Object} data - Filters data
 * @param {Object} el - Filter element
 * @param {Object} SORTING_FILTER_ENUMS - Enum mapping
 * @returns {boolean|string} - False if not applied, 'rating' or true if applied
 */
export const checkFilterOrSortApplied = (data, el, SORTING_FILTER_ENUMS) => {
    const filterKey = SORTING_FILTER_ENUMS[el?.key];
    if (!data || !el || !filterKey) return false;

    if (filterKey === "rating") {
        return data?.filter?.rating === 4 ? 'rating' : false;
    }

    const filterValue = data[filterKey];
    if (!filterValue) return false;

    return typeof filterValue === 'object' && filterValue !== null
        ? Object.keys(filterValue).length
        : true;
};

/**
 * Get bounds from restaurants for map display
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Array} - Array of bound objects for map
 */
export const getBounds = (restaurants) => {
    if (!restaurants || restaurants.length === 0) return [];

    return restaurants.map(restaurant => ({
        coords: {
            lat: Number(restaurant?.location?.coordinates[1]),
            lng: Number(restaurant?.location?.coordinates[0])
        },
        isUser: false,
        restaurantInfo: {
            _id: restaurant._id,
            name: restaurant.name,
            slug: restaurant.slug,
            address: restaurant.address,
            distanceInMeters: restaurant?.distanceInMeters,
            onboarded: restaurant?.onboarded,
            isAvailable: restaurant?.isAvailable,
            campaigns: restaurant?.campaigns
        }
    }));
};
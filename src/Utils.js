
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}

export const fetchAddressFromCoordinates = async (latitude, longitude) => {
    if (!latitude || !longitude) {
        return
    }
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (response?.ok && response?.status == 200) {
            return {
                address: data?.display_name,
                place: data?.name || data?.address?.neighbourhood || "Current location"
            };
        } else {
            console.log('Geocoding error:', data.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching address:', error);
    }
};

//   fetchAddressFromCoordinates(37.7749, -122.4194); 

export function generateUniqueString() {
    return `${Date.now()}${Math.random().toString(36)}`
}


export const CurrentLocationStorage = {
    setCurrentLocation: (locationData) => {
        try {
            localStorage.setItem('currentLocation', JSON.stringify(locationData));
            return true;
        } catch (error) {
            console.error('Error saving location:', error);
            return false;
        }
    },

    getCurrentLocation: () => {
        try {
            const location = localStorage.getItem('currentLocation');
            return location ? JSON.parse(location) : null;
        } catch (error) {
            console.error('Error retrieving location:', error);
            return null;
        }
    },

    clearCurrentLocation: () => {
        localStorage.removeItem('currentLocation');
    }
};

export function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = degree => degree * (Math.PI / 180);

    const R = 6371000; // Radius of the Earth in meters
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    /*distance is in meters*/
    return distance;
}

export function numberToK(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(3).replace(/\.0+$/, '') + 'M';
    }
    if (num >= 1000) {
        const newValue = (num / 1000).toFixed(2);
        num = newValue != (num / 1000).toFixed(0) ? newValue : (num / 1000).toFixed(0);
        return num.replace(/\.0+$/, '') + 'k';
    }
    return num?.toString();
}

export const prefetchImages = (imageUrls) => {
    const promises = imageUrls.map(
        (url) =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = reject;
            })
    );
    return Promise.all(promises);
};

function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export const checkLocationAccess = async (retries = 3) => {
    if (!navigator.geolocation) {
        return {
            success: false,
            message: 'Geolocation is not supported by this browser.'
        };
    }

    const getLocationPromise = () => {
        return new Promise((resolve) => {
            const handleSuccess = (position) => {
                const { latitude, longitude } = position.coords;
                resolve({
                    success: true,
                    message: 'Location retrieved successfully',
                    data: { latitude, longitude }
                });
            };

            const handleError = (error) => {
                let message = '';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = isIOS() ? 'toasts.userdeniedIos' : 'toasts.userdenied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'toasts.Positionunavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'toasts.locationtimeout';
                        break;
                    default:
                        message = 'toasts.unknownerror';
                }
                resolve({ success: false, message });
            };

            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
                timeout: 10000,
                maximumAge: 0,
                enableHighAccuracy: true
            });
        });
    };

    let attempt = 0;
    while (attempt < retries) {
        const result = await getLocationPromise();

        // If successful or user explicitly denies, return immediately
        if (result.success || result.message === 'Location permission denied.') {
            return result;
        }

        // For other errors, retry if attempts remain
        attempt++;
        if (attempt === retries) {
            return {
                success: false,
                message: `Failed to get location after ${retries} attempts.`
            };
        }

        // Wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
};


export const metersToKilometers = (meters) => {
    let km = meters / 1000;
    let convertedKm = km.toFixed(1)
    if (convertedKm == km) {
        return km
    }
    return convertedKm
}

export const ratingStructure = (rating) => {
    let convertedRating = rating.toFixed(1)
    if (convertedRating == rating) {
        return rating
    }
    return convertedRating
}

export const formatToGermanNumber = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) {
        return 0;
    }
    const absNumber = Math.abs(number);
    const hasDecimals = absNumber % 1 !== 0;
    let formattedNumber = hasDecimals ? absNumber.toFixed(2) : absNumber.toString();
    if (hasDecimals) {
        formattedNumber = formattedNumber.replace('.', ',');
    }
    const parts = formattedNumber.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    formattedNumber = parts.join(',');
    return formattedNumber;
}

export const compareCoordinates = (coords1, locationObj, marginOfError = 0.01) => {
    if (!Array.isArray(coords1) || coords1.length !== 2) {
        return false;
    }

    if (!locationObj || typeof locationObj !== 'object') {
        return false;
    }

    if (!('latitude' in locationObj) || !('longitude' in locationObj)) {
        return false;
    }

    const coord1Long = Number(coords1[0]);
    const coord1Lat = Number(coords1[1]);

    if (isNaN(coord1Long) || isNaN(coord1Lat)) {
        return false;
    }

    const latDiff = Math.abs(coord1Lat - locationObj.latitude);
    const longDiff = Math.abs(coord1Long - locationObj.longitude);

    return latDiff <= marginOfError && longDiff <= marginOfError;
}

// ------------------------------------------------------------------------------

const CACHE_NAME = 'restaurant-images-cache-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const enhancedImageCache = {
    async prefetchImages(imageUrls) {
        if (!('caches' in window)) {
            return this.fallbackPrefetch(imageUrls);
        }

        try {
            const cache = await caches.open(CACHE_NAME);
            const concurrencyLimit = 12; // Adjust this number based on testing and needs
            let results = [];

            // Process URLs in chunks of "concurrencyLimit"
            for (let i = 0; i < imageUrls.length; i += concurrencyLimit) {
                const chunk = imageUrls
                    .slice(i, i + concurrencyLimit)
                    .filter(Boolean);

                // Map each URL in the chunk to a fetch promise
                const chunkPromises = chunk.map(async (url) => {
                    try {
                        // Check if the image is already in cache and still valid
                        const cachedResponse = await cache.match(url);
                        if (cachedResponse) {
                            const cachedDate = new Date(cachedResponse.headers.get('date'));
                            if (Date.now() - cachedDate.getTime() < CACHE_DURATION) {
                                return cachedResponse;
                            }
                        }

                        // Create a new request with proper CORS settings
                        const request = new Request(url, {
                            mode: 'cors',
                            credentials: 'omit',
                            headers: new Headers({
                                'Accept': 'image/*'
                            })
                        });

                        // Fetch the image
                        const response = await fetch(request);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        // Clone and cache the response
                        const responseToCache = response.clone();
                        await cache.put(url, responseToCache);

                        // Optionally load the image in the background
                        this.loadImageInBackground(url);

                        return response;
                    } catch (error) {
                        console.warn(`Failed to fetch image: ${url}`, error);
                        return null; // Continue without throwing to keep the batch processing alive
                    }
                });

                // Wait for all requests in the current chunk to settle before proceeding
                const chunkResults = await Promise.allSettled(chunkPromises);

                // Only add fulfilled results with non-null values
                results = results.concat(
                    chunkResults
                        .filter(result => result.status === 'fulfilled' && result.value)
                        .map(result => result.value)
                );
            }
            return results;
        } catch (error) {
            console.error('Error in enhanced image caching:', error);
            return this.fallbackPrefetch(imageUrls);
        }
    },

    fallbackPrefetch(imageUrls) {
        return Promise.allSettled(
            imageUrls.filter(Boolean).map(url =>
                new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(url);
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${url}`);
                        resolve(null);
                    };
                    img.src = url;
                })
            )
        ).then(results =>
            results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value)
        );
    },

    loadImageInBackground(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Resolve anyway to prevent hanging
        });
    },

    async cleanCache() {
        if (!('caches' in window)) return;
        try {
            const cache = await caches.open(CACHE_NAME);
            const requests = await cache.keys();
            const now = Date.now();

            await Promise.all(
                requests.map(async (request) => {
                    try {
                        const response = await cache.match(request);
                        if (!response) return;
                        const cachedDate = new Date(response.headers.get('date'));
                        if (now - cachedDate.getTime() > CACHE_DURATION) {
                            await cache.delete(request);
                        }
                    } catch (error) {
                        console.warn(`Failed to process cached item: ${request.url}`, error);
                    }
                })
            );
        } catch (error) {
            console.error('Error cleaning cache:', error);
        }
    }
};


// Create a new file: src/Utils/telegramHelper.js

/**
 * Extracts parameters from Telegram WebApp start param
 * @param {string} startParam - The start parameter from Telegram WebApp
 * @returns {Object} Extracted parameters as key-value pairs
 */
export const parseStartParam = (startParam) => {
    if (!startParam) return {};
    
    // If the startParam has key=value format
    if (startParam.includes('=')) {
        const [key, value] = startParam.split('=');
        return { [key]: value };
    }
    
    // If startParam is just a simple value
    return { action: startParam };
};

/**
 * Get restaurant ID from Telegram WebApp start parameters
 * @returns {string|null} Restaurant ID if found, null otherwise
 */
export const getRestaurantIdFromTelegram = () => {
    if (typeof window === "undefined" || !window.Telegram) {
        return null;
    }
    
    const telegram = window.Telegram.WebApp;
    console.log(telegram, "telegram", telegram.initDataUnsafe)
    const startParam = telegram.initDataUnsafe?.start_param;
    
    if (!startParam) return null;
    return startParam;
    
    const params = parseStartParam(startParam);
    
    // Check if direct restaurant ID or if using restaurant= format
    if (params.restaurant) {
        return params.restaurant;
    }
    
    return null;
};
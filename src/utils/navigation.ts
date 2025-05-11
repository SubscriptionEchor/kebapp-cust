import { NavigateFunction } from 'react-router-dom';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { CHECK_ZONE_RESTRICTIONS } from '../graphql/queries';

interface ZoneCheckInput {
    latitude: number;
    longitude: number;
}

const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const checkLocationAccess = async (retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const result = await new Promise<{ success: boolean; coords?: GeolocationCoordinates; message?: string }>(
                (resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve({ success: true, coords: position.coords }),
                        (error) => {
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
                        },
                        {
                            timeout: 10000,
                            maximumAge: 0,
                            enableHighAccuracy: true,
                        }
                    );
                }
            );

            if (result.success) {
                return { success: true, coords: result.coords };
            }

            if (result.message) {
                return { success: false, message: result.message };
            }
        } catch (err) {
            console.error('Error fetching location:', err);
        }

        attempt++;
        console.log(`Retrying... Attempt ${attempt} of ${retries}`);
        if (attempt === retries) {
            return {
                success: false,
                message: `Failed to get location after ${retries} attempts.`,
            };
        }

        // Wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
};

export const handleNavigationWithZoneCheck = async (
    navigate: NavigateFunction,
    apolloClient: ApolloClient<NormalizedCacheObject>, // Apollo Client instance
    setFallbackZoneDetails: (details: any) => void,
    setShowDefaultLocationPopup: (show: boolean) => void
) => {
    const locationResult = await checkLocationAccess();

    if (!locationResult?.success) {
        // console.error(locationResult?.message);
        return locationResult
    }

    const { latitude, longitude } = locationResult.coords!;

    try {
        const { data } = await apolloClient.query({
            query: CHECK_ZONE_RESTRICTIONS,
            variables: {
                inputValues: {
                    latitude,
                    longitude,
                },
            },
        });

        if (data?.checkZoneRestrictions) {
            const { selectedZoneDetails, fallbackZoneDetails } = data.checkZoneRestrictions;

            if (!selectedZoneDetails && fallbackZoneDetails) {
                setFallbackZoneDetails(fallbackZoneDetails);
                setShowDefaultLocationPopup(true);
            } else {
                setFallbackZoneDetails(fallbackZoneDetails);
            }

            return { success: true };
        }
    } catch (err) {
        console.error('Error checking zone restrictions:', err);
    }
};
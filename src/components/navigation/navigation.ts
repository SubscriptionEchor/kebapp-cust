type LocationResponse = {
    coords: {
        latitude: number;
        longitude: number;
    } | null;
    error: string | null;
};
export const getCurrentLocation = (): Promise<LocationResponse> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({
                coords: null,
                error: 'Geolocation is not supported by your browser.',
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    },
                    error: null,
                });
            },
            (error) => {
                resolve({
                    coords: null,
                    error: 'Failed to get location. Please enable location services.',
                });
            }
        );
    });
};
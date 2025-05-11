export const getLocationFromCoordinates = async (latitude: number, longitude: number) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&lang=en`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch location details');
        }

        const data = await response.json();
        const area = data?.address?.borough || data?.address?.city || data?.address?.state || '';
        const address = data?.display_name || '';

        return {
            latitude,
            longitude,
            area,
            address,
        };
    } catch (error) {
        console.error('Error fetching location details:', error);
        throw error;
    }
};
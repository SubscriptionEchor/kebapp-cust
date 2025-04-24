import { t } from 'i18next';
import { useState, useEffect } from 'react';

// Helper to detect iOS devices
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

const useGeolocation = (onLocationSuccess, onLocationError) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState(null);

    useEffect(() => {
        const storedPermission = localStorage.getItem('locationPermission');
        if (storedPermission) {
            setPermissionStatus(storedPermission);
        }
    }, []);

    const requestLocation = async (type, selectedPlace = null) => {
        let locationData;
        if (type === 'AddAddress' && Object.keys(selectedPlace).length > 0) {
            locationData = {
                ...selectedPlace,
                type
            };
            handleLocationSuccess(locationData);
        } else if (type === 'EditAddress' && Object.keys(selectedPlace).length > 0) {
            locationData = {
                latitude: selectedPlace.location.coordinates[1],
                longitude: selectedPlace.location.coordinates[0],
                ...selectedPlace,
                type
            };
            handleLocationSuccess(locationData);
        } else if (type === 'SearchAddress' && Object.keys(selectedPlace).length > 0) {
            locationData = {
                latitude: selectedPlace.coordinates[1],
                longitude: selectedPlace.coordinates[0],
                ...selectedPlace,
                type: 'AddAddress'
            };
            handleLocationSuccess(locationData);
        } else if (type === 'CurrentLocation') {
            // iOS devices won't always show the permission prompt repeatedly.
            // if (isIOS() && permissionStatus !== 'granted') {
            //     alert(
            //         'On iOS, once you have set location permissions, the prompt may not appear again. ' +
            //         'If you need to update your permission, please go to your device settings.'
            //     );
            // }
            if (permissionStatus === 'granted') {
                getCurrentPosition();
            } else {
                try {
                    const permission = await navigator.permissions.query({ name: 'geolocation' });
                    setPermissionStatus(permission.state);
                    localStorage.setItem('locationPermission', permission.state);
                    if (permission.state === 'granted') {
                        getCurrentPosition();
                    } else if (permission.state === 'prompt') {
                        alert('Please enable your mobile location and grant access to use your current location.');
                        getCurrentPosition();
                    } else {
                        alert('Please enable location services on your device to access your current location.');
                        getCurrentPosition();
                    }
                    permission.addEventListener('change', () => {
                        setPermissionStatus(permission.state);
                        localStorage.setItem('locationPermission', permission.state);
                    });
                } catch (err) {
                    // Fallback in case permissions API is not available.
                    getCurrentPosition();
                }
            }
        }
    };

    const getCurrentPosition = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        type: 'CurrentLocation'
                    };
                    handleLocationSuccess(locationData);
                },
                handleLocationError,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            handleLocationError({ code: -1 });
        }
    };

    const handleLocationSuccess = (locationData) => {
        setLocation(locationData);
        setError(null);
        if (onLocationSuccess) {
            localStorage.setItem('locationPermission', "granted");
            onLocationSuccess(locationData);
        }
    };

    const handleLocationError = (err) => {
        let errorMessage;
        switch (err?.code) {
            case 1:
                errorMessage = t('toasts.locationdenied') ;
                break;
            case 2:
                errorMessage = t('toasts.locationunavailablepleasetryagain') ;
                break;
            case 3:
                errorMessage = t('toasts.locationrequesttimedoutpleasetryagain') ;
                break;
            case -1:
                errorMessage = t('toasts.geolocationisnotsupportedbythisbrowser') ;
                break;
            default:
                errorMessage = t('toasts.unabletoretrievelocationpleasetryagain') ; 
        }
        if (onLocationError) {
            onLocationError(errorMessage);
        }
    };

    return { location, error, requestLocation, permissionStatus };
};

export default useGeolocation;
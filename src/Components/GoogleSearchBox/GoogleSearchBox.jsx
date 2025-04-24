import React, { useState, useRef } from 'react';
import { LoadScript, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import './styles.css';
import { config } from '../../config';
import Loader from '../Loader/Loader';
import { useTranslation } from 'react-i18next';

const GoogleSearchBox = ({ onPlacesChanged }) => {
    const { t } = useTranslation();
    const searchBoxRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { isLoaded } = useJsApiLoader({
        // googleMapsApiKey: config.GOOGLE_MAPS_API_KEY,
        // libraries: config.libraries,
    });

    const handlePlacesChanged = () => {
        const places = searchBoxRef.current.getPlaces();
        if (places && places.length > 0) {
            onPlacesChanged && onPlacesChanged(places)
        }
    };

    if (!isLoaded) {
        return <Loader />
    }

    return (
        <StandaloneSearchBox
            onLoad={(ref) => (searchBoxRef.current = ref)}
            onPlacesChanged={handlePlacesChanged}
        >
            <input
                type="text"
                placeholder={t('googleSearchBox.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pac-target-input my-2'
            />
        </StandaloneSearchBox>
    );
};

export default GoogleSearchBox;

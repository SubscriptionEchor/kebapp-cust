import React, { useEffect, useState } from 'react'
import "./style.css"
import Profile from "../../assets/svg/profile.svg"
import Location from "../../assets/svg/location.svg"
import Search from "../../assets/svg/search.svg"
import ArrowDownWhite from "../../assets/svg/arrowDownWhite.svg"
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { routeName } from '../../Router/RouteName'
import { CurrentLocationStorage } from '../../Utils'

const Header = ({ searchPlaceholders, isMapActive, height }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [selectedLocation, setSelectedLocation] = useState(null);


    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setSelectedLocation(response)
        })();
    }, []);

    useEffect(() => {
        if (!searchPlaceholders || searchPlaceholders?.length === 0) {
            return;
        }
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders?.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);


    // ---------------------------------------------------------------------------------------------------

    // search hidden for v1

    // ---------------------------------------------------------------------------------------------------
    return (
        <div className="header-component pd-horizontal py-3" style={{ height: height }}>
            <div className='d-flex align-items-center justify-content-between'>
                <div onClick={() => navigate(routeName.SELECT_LOCATION)} className='header-content'>
                    <div className='d-flex align-items-center'>
                        <img className='location-icon-size' src={Location} alt="location" />
                        <p className='white-text bold-fw xl-fs address-name text-ellipsis'>{selectedLocation?.label || selectedLocation?.place || 'Current Location'}</p>
                        <img className='arrow-icon-size' src={ArrowDownWhite} alt="arrow" />
                    </div>
                    <p className='white-text normal-fw m-fs text-ellipsis'>{selectedLocation?.address || ''}</p>
                </div>
                <div onClick={() => navigate(routeName.PROFILE)}>
                    <img className='profile-icon-size' src={Profile} alt="profile" />
                </div>
            </div>
            {!isMapActive && <div className='input-container' onClick={() => navigate(routeName.SEARCH)}>
                <p className='placeholder-text normal-fw l-fs ms-2'>{`${t("home.searchPlaceholder")} "${(!searchPlaceholders || searchPlaceholders?.length === 0) ? t("restaurantName") : searchPlaceholders[placeholderIndex]}"`}</p>
                <img className='search-icon-size' src={Search} alt="search" />
            </div>}
        </div>
    )
}

export default Header
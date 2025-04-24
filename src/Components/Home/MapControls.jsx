// components/Home/MapControls.jsx
import React, { useCallback, memo } from 'react';

// Assets
import Map from '../../assets/svg/map.svg';
import HomeIcon from '../../assets/svg/home.svg';
import FadersWhite from "../../assets/svg/fadershorizontalWhite.svg";

const MapControls = ({
    isModalVisible,
    loading,
    isMapLoader,
    mapFilterLoading,
    isMapActive,
    setIsMapActive,
    cart,
    mapSelectedFilters,
    setMapSelectedOption,
    setOpenMapSheet,
    t
}) => {
    // Prefetch map component when user hovers over map button
    const prefetchMapComponent = useCallback(() => {
        import('../../Components/OpenStreetMap/OpenStreetMap');
    }, []);

    if (isModalVisible || loading || isMapLoader || mapFilterLoading) {
        return null;
    }

    return (
        <div>
            {!isMapActive ? (
                <div
                    className='map'
                    onClick={() => setIsMapActive(true)}
                    onMouseEnter={prefetchMapComponent}
                    style={{ bottom: cart?.length > 0 ? "25%" : "15%" }}
                >
                    <p className='white-text m-fs normal-fw text-nowrap'>{t("home.map")}</p>
                    <img className='icon-size ms-2' src={Map} alt="map" />
                </div>
            ) : (
                <div>
                    <div
                        className='map'
                        style={{ bottom: "22%" }}
                        onClick={() => {
                            setMapSelectedOption(mapSelectedFilters?.mapFilter);
                            setOpenMapSheet(true);
                        }}
                    >
                        <p className='white-text m-fs normal-fw text-nowrap'>{t("home.filter")}</p>
                        <img className='icon-size ms-1' src={FadersWhite} alt="filter" />
                    </div>
                    <div
                        className='map'
                        style={{ backgroundColor: "#7839EF", bottom: "15%" }}
                        onClick={() => setIsMapActive(false)}
                    >
                        <p className='white-text m-fs normal-fw text-nowrap'>{t("home.home")}</p>
                        <img className='icon-size ms-1' src={HomeIcon} alt="home" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(MapControls);
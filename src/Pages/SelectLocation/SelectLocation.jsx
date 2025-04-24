import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import MapPinPlus from "../../assets/svg/MapPinPlus.svg";
import Gps from "../../assets/svg/GPS.svg";
import RightArrow from "../../assets/svg/caretright.svg";
import useGeolocation from '../../Hooks/useGeolocation/useGeolocation';
import { useNavigate } from 'react-router-dom';
import { routeName } from '../../Router/RouteName';
import { checkLocationAccess, compareCoordinates, CurrentLocationStorage, fetchAddressFromCoordinates } from '../../Utils';
import Spinner from '../../Components/Spinner/Spinner';
import { Context } from '../../Context/Context';
import Hut from "../../assets/svg/Hut.svg";
import DotsThreeVertical from "../../assets/svg/DotsThreeVertical.svg";
import Popup from '../../Components/PopUp/PopUp';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { deleteAddress, selectAddress, getUserData, zoneCheck } from '../../apollo/server';
import { ConfigurableValues } from '../../constants/constants';
import Close from "../../assets/svg/close.svg"
import { showErrorToast, showSuccessToast } from '../../Components/Toast';
import SearchResults from '../../Components/SearchResults';
import { BootstrapContext } from '../../Context/Bootstrap';
import CitiesList from '../../Components/SearchResults/citiesList';
import { config } from '../../config';

const ZONECHECK = gql`${zoneCheck}`;

const SelectLocation = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { userDetails, setUserDetails, setZoneData, setIdentifier } = useContext(Context);
    const [loader, setLoader] = useState(false);
    const [type, setType] = useState('');
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [selectedDeleteIndex, setSelectedDeleteIndex] = useState(null);
    const [deleteAddressMutation, { loading: deleteAddressLoading }] = useMutation(deleteAddress);
    const [selectAddressMutation, { loading: selectAddressLoading }] = useMutation(selectAddress);
    const [selectAddressPopUp, setSelectAddressPopUp] = useState(false);
    const [defaultAddress, setDefaultAddress] = useState({});
    const [reversedAddresses, setReversedAddresses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [operationalZones, setOperationalZones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUnavailable, setIsUnavailable] = useState(false);
    const [closeCondition, setCloseCondition] = useState("home");
    const [closeConditionParams, setCloseConditionParams] = useState(null);
    const timeoutRef = useRef(null);
    const { bootstrapData } = useContext(BootstrapContext)

    const [dynamicHeight, setDynamicHeight] = useState(0);

    const calculateHeight = () => {
        const newHeight = window.innerHeight - 245;
        setDynamicHeight(newHeight);
    };

    useEffect(() => {
        calculateHeight();
        window.addEventListener('resize', calculateHeight);

        return () => {
            window.removeEventListener('resize', calculateHeight);
        };
    }, []);

    useQuery(getUserData, {
        onCompleted: (data) => {
            if (data?.profile) {
                setUserDetails(data?.profile);
            }
        },
        onError: (error) => {
            console.error('Error fetching user data:', error);
        }
    });



    useEffect(() => {
        if (userDetails?.addresses?.length > 0) {
            setReversedAddresses([...userDetails.addresses].reverse());
        }
    }, [userDetails]);

    useEffect(() => {
        if (showDeletePopup) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [showDeletePopup]);

    const toggleMenu = (index) => {
        setOpenMenuIndex(openMenuIndex === index ? null : index);
    };

    const handleLocationData = async (location) => {
        try {
            let coords = {
                latitude: Number(location?.latitude),
                longitude: Number(location?.longitude)
            }
            const response = await checkZone({
                variables: {
                    inputValues: coords
                }
            });
            if (!response?.data || !response?.data?.checkZoneRestrictions) {
                showErrorToast(t('toasts.locationnotinservicezone'));
                return;
            }
            let zoneData = response?.data?.checkZoneRestrictions?.selectedZoneDetails?.coordinates[0]
            let identifier = response?.data?.checkZoneRestrictions?.selectedZoneDetails?.identifier
            if (response?.data?.checkZoneRestrictions?.fallbackZoneDetails && response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates) {
                coords['latitude'] = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates[1]
                coords['longitude'] = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates[0]
                zoneData = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.coordinates[0]
                identifier = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.identifier
            }
            const formattedAddress = await fetchAddressFromCoordinates(coords?.latitude, coords?.longitude);
            if (formattedAddress) {
                setZoneData(zoneData)
                setIdentifier(identifier)
                CurrentLocationStorage.setCurrentLocation({ ...formattedAddress, ...coords });
            }
        } catch (error) {
            console.error('Error', error);
        }
    };

    const handleDelete = async () => {
        if (selectedDeleteIndex !== null) {
            const addressToDelete = reversedAddresses[selectedDeleteIndex];
            const addressId = addressToDelete?._id;

            if (addressId) {
                try {
                    const { data } = await deleteAddressMutation({ variables: { id: addressId } });

                    if (data?.deleteAddress?._id) {

                        const updatedAddresses = userDetails.addresses.filter(address => address._id !== addressId);
                        setUserDetails({
                            ...userDetails,
                            addresses: updatedAddresses
                        });
                        setReversedAddresses(updatedAddresses.reverse());
                        if (addressToDelete?.selected) {
                            let res = await checkLocationAccess();
                            if (res?.success && res?.data?.latitude && res?.data?.longitude) {
                                await handleLocationData(res?.data);
                            } else {
                                showErrorToast(t(res?.message) || t("errorfetching"));
                                let payload = { ...config.FALLBACK_LOCATION };
                                payload['type'] = "CurrentLocation"
                                CurrentLocationStorage.setCurrentLocation(payload);
                            }
                        }
                    } else {
                        console.error(data.deleteAddress.message);
                    }
                } catch (error) {
                    console.error('Error deleting address:', error);
                } finally {
                    setShowDeletePopup(false);
                    setSelectedDeleteIndex(null);
                }
            }
        }
    };

    const selectPreferredAddress = async () => {
        if (defaultAddress?.selected) {
            return
        }
        if (!defaultAddress?._id) {
            return
        }
        console.log(`Selected address: `, defaultAddress);
        try {
            let { data } = await selectAddressMutation({
                variables: { id: defaultAddress._id },
            });
            if (data?.selectAddress?.addresses.length > 0) {
                setUserDetails({ ...userDetails, addresses: data?.selectAddress?.addresses });
                setReversedAddresses([...data?.selectAddress?.addresses].reverse());
                let locationObj = {
                    label: defaultAddress?.label,
                    address: defaultAddress?.deliveryAddress,
                    place: defaultAddress?.deliveryAddress,
                    latitude: defaultAddress?.location?.coordinates[1],
                    longitude: defaultAddress?.location?.coordinates[0],
                    type: "CurrentLocation"
                }
                CurrentLocationStorage.setCurrentLocation(locationObj);
                setSelectAddressPopUp(false);
                navigate(routeName.HOME);
            }
        } catch (error) {
            console.error('Error selecting address:', error);
        }
    };

    const [checkZone] = useLazyQuery(ZONECHECK, {
        fetchPolicy: "network-only"
    });

    const handleLocationSuccess = async (location) => {
        console.log(location, "sfyvsvsdfvysyd");

        if (location) {
            try {
                if (!location?.latitude || !location?.longitude) return showErrorToast(t('common.failureMessage'))

                let coords = {
                    latitude: Number(location?.latitude),
                    longitude: Number(location?.longitude)
                }
                const response = await checkZone({
                    variables: {
                        inputValues: coords
                    }
                });
                coords['fallback'] = false;
                if (!response?.data || !response?.data?.checkZoneRestrictions) {
                    showErrorToast(t('toasts.somethingwentwrongwiththelocationcheck'));
                    return;
                }
                let unavailable = false;
                let zoneData = response?.data?.checkZoneRestrictions?.selectedZoneDetails?.coordinates[0]
                let identifier = response?.data?.checkZoneRestrictions?.selectedZoneDetails?.identifier
                if (response?.data?.checkZoneRestrictions?.fallbackZoneDetails && response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates) {
                    coords['latitude'] = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates[1]
                    coords['longitude'] = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.defaultLocation?.coordinates[0]
                    zoneData = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.coordinates[0]
                    identifier = response?.data?.checkZoneRestrictions?.fallbackZoneDetails?.identifier
                    unavailable = true;
                }
                setZoneData(zoneData)
                setIdentifier(identifier)
                if (location?.type === 'AddAddress') {
                    const formattedAddress = await fetchAddressFromCoordinates(coords.latitude, coords.longitude);
                    let fullAddress = { ...formattedAddress, longitude: coords.latitude, latitude: coords.longitude }
                    fullAddress.type = "AddAddress"
                    if (formattedAddress?.place == "Current location" && location?.name) {
                        fullAddress.place = location.name
                    }
                    if (!unavailable) {
                        navigate(routeName.FETCH_LOCATION, { state: { fullAddress } });
                        return;
                    }
                    setCloseConditionParams(fullAddress);
                    setCloseCondition("fetchLocation");
                    setIsUnavailable(true);
                    return;
                }
                const formattedAddress = await fetchAddressFromCoordinates(coords.latitude, coords.longitude);
                if (formattedAddress) {
                    const fullAddress = { ...formattedAddress, ...coords };
                    if (location?.type === 'CurrentLocation') {
                        CurrentLocationStorage.setCurrentLocation(fullAddress);

                        if (!unavailable) {
                            navigate(routeName.HOME);
                            return;
                        }
                        setCloseCondition("home");
                        setIsUnavailable(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching address:', error);
            } finally {
                setLoader(false);
            }
        }
    };

    const handleLocationError = (error) => {
        showErrorToast(error || "Error fetching coordinates");
        setLoader(false);
        console.error('Error retrieving location:', error);
    };

    const { location, error, requestLocation } = useGeolocation(handleLocationSuccess, handleLocationError);

    const handleDeleteClick = (index) => {
        setOpenMenuIndex(null);
        setSelectedDeleteIndex(index);
        setShowDeletePopup(true);
    };

    const searchLocation = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${ConfigurableValues().OSM_SEARCH_URL}api?q=${encodeURIComponent(query)}&limit=10`
            );


            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const formattedResults = data.features.map(feature => ({
                id: feature.properties.osm_id,
                name: feature.properties.name,
                city: feature.properties.city,
                state: feature.properties.state,
                country: feature.properties.country,
                coordinates: feature.geometry.coordinates, // [longitude, latitude]
                type: feature.properties.type,
                street: feature.properties.street
            }));

            setSearchResults(formattedResults);
        } catch (error) {
            console.error('Error fetching locations:', error);
            setSearchResults([]);
            // Optionally, set an error message in the UI
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setLoading(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            searchLocation(value);
        }, 300);
    }, [searchLocation]);


    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleLocationSelect = (location) => {
        setSearchQuery(location.name);
        setType('AddAddress');
        requestLocation('SearchAddress', location);
        setSearchResults([]);
    };

    const handleCloseUnavailable = () => {
        if (closeCondition == "home") {
            navigate(routeName.HOME)
        }
        if (closeCondition == "fetchLocation") {
            navigate(routeName.FETCH_LOCATION, { state: { fullAddress: closeConditionParams } });
        }
        setIsUnavailable(false);
    };


    return (
        <div className="p-4 " onClick={() => setOpenMenuIndex(null)}>


            <p className="location-title bold-fw" style={{ height: 65 }}>
                {t('selectLocation.title')}
            </p>
            <div className="location-search" style={{ height: 60 }}>
                <div className="search-input-container d-flex mt-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleInputChange}
                        placeholder={t('placeholdertext.searchforlocation')} // "Search for a location..."
                        className="search-input"
                    />
                    {searchQuery ? loading ? <div className="search-loader" ></div> :
                        <img onClick={() => { setSearchQuery(''); searchLocation('') }} src={Close} height={18} alt='close' /> : null}
                </div>

                {/* {searchResults.length > 0 && (
                    <ul className="search-results">
                        {searchResults.map((result, index) => {
                            return (
                                <li
                                    key={index}
                                    onClick={() => handleLocationSelect(result)}
                                    className="search-result-item"
                                >
                                    <div className="location-name">{result.name}</div>
                                    <div className="location-details">
                                        {[
                                            result.street,
                                            result.city,
                                            result.state,
                                            result.country
                                        ].filter(Boolean).join(', ')}
                                    </div>
                                </li>
                            )
                        }
                        )}
                    </ul>
                )} */}
            </div>

            {searchQuery ?
                <SearchResults cities={bootstrapData?.zonesDetails || []} loading={loading} searchValue={searchQuery} searchList={searchResults} /> :
                <div className='position-relative'>
                    <div className="location-options d-flex " style={{}}>

                        <button onClick={() => {
                            setLoader(true);
                            setType('CurrentLocation');
                            requestLocation('CurrentLocation', []);
                        }} className="location-button mt-2" style={{ height: 50 }}>
                            {(type === 'CurrentLocation' && loader) ? <Spinner color="#4D7C0F" size="24px" /> :
                                (<>
                                    <img src={Gps} alt={t('selectLocation.currentLocation')} />
                                    <span className='location-option l-fs normal-fw ms-2'>
                                        {t('selectLocation.currentLocation')}
                                    </span>
                                    <img src={RightArrow} alt="right arrow" />
                                </>)}
                        </button>

                        <button style={{ height: 50 }} onClick={async () => {
                            setLoader(true)
                            setType('AddAddress')
                            let res = await checkLocationAccess();
                            if (!res?.success) {
                                showErrorToast(res?.message || t("locationerror"));
                                setLoader(false)
                                return
                            }
                            await handleLocationSuccess({ ...res?.data, type: 'AddAddress' });
                        }} className="location-button">
                            {(type === 'AddAddress' && loader) ? <Spinner color="#4D7C0F" size="24px" /> : (<>
                                <img src={MapPinPlus} alt="pin" />
                                <span className='location-option l-fs normal-fw ms-2'>
                                    {t('selectLocation.addNewAddress')}
                                </span>
                            </>)}
                        </button>


                        {reversedAddresses?.length > 0 ? <p style={{ height: 20 }} className='l-fs semiBold-fw '>{t('selectLocation.savedAddresses')}</p> : null}

                        <div className='overflow-scroll' style={{ flex: 1, maxHeight: dynamicHeight - 86 }}>
                            {reversedAddresses?.length > 0 && reversedAddresses?.slice(0, 3)?.map((address, index) => {
                                let isSelected = false;
                                if (address?.selected) {
                                    let coords = CurrentLocationStorage.getCurrentLocation();
                                    isSelected = compareCoordinates(address?.location?.coordinates, coords);
                                }
                                return (
                                    <div key={index} onClick={() => {
                                        console.log("erjj", address)
                                        if (!address?.selected) {
                                            setSelectAddressPopUp(true);
                                            setDefaultAddress(address);
                                        } else {
                                            console.log("yaaar")
                                            setDefaultAddress(address);
                                            let locationObj = {
                                                label: address?.label,
                                                address: address?.deliveryAddress,
                                                place: address?.deliveryAddress,
                                                latitude: address?.location?.coordinates[1],
                                                longitude: address?.location?.coordinates[0],
                                                type: "CurrentLocation"
                                            }
                                            CurrentLocationStorage.setCurrentLocation(locationObj);
                                            showSuccessToast(t("toasts.addressselected"))
                                            navigate(routeName.HOME);
                                        }
                                    }} className="address-card mb-2">
                                        <div className='address-icon'>
                                            <img src={Hut} alt={'address-icon'} />
                                        </div>
                                        <div className='address-details'>
                                            <p className='bold-fw m-fs py-1'>{address?.label?.slice(0, 30)} {isSelected ? <span className='selected'>{t('selectLocation.selected')}</span> : null}</p>
                                            <p className='m-fs normal-fw short-address'>{address?.deliveryAddress}</p>
                                        </div>
                                        <div className='position-relative '>
                                            <img
                                                src={DotsThreeVertical}
                                                alt='menu-icon'
                                                className='cursor-pointer'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMenu(index)
                                                }}
                                            />
                                            {openMenuIndex === index && (
                                                <ul className='dropdown-menu show text-center  position-absolute' style={{ top: -2, right: 20 }}>
                                                    {/* <li><button className='dropdown-item l-fs border-bottom semiBold-fw text-dark' onClick={(e) => {
                                            e?.preventDefault();
                                            e?.stopPropagation()
                                            handleEdit(address, index)
                                        }}>Edit</button></li> */}
                                                    <li><button className='dropdown-item l-fs semiBold-fw text-danger' onClick={(e) => {
                                                        e?.preventDefault();
                                                        e?.stopPropagation()
                                                        handleDeleteClick(index)
                                                    }}>{t('selectLocation.delete')}</button></li>
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Popup
                        isOpen={showDeletePopup}
                        onClose={() => {
                            setShowDeletePopup(false);
                            setSelectedDeleteIndex(null);
                        }}
                        onConfirm={handleDelete}
                        title={reversedAddresses[selectedDeleteIndex]?.label}
                        message={reversedAddresses[selectedDeleteIndex]?.deliveryAddress}
                        confirmText={deleteAddressLoading ? <Spinner color="white" size="24px" /> : t('selectLocation.delete')}
                        cancelText={t('common.cancel')}
                    />

                    <Popup
                        isOpen={selectAddressPopUp}
                        onClose={() => {
                            setSelectAddressPopUp(false);
                            setDefaultAddress({})
                        }}
                        onConfirm={selectPreferredAddress}
                        title={`${t('selectLocation.warningText1')} "${defaultAddress?.label || t('selectLocation.thisaddress')}" ${t('selectLocation.warningText2')} `}
                        message={''}
                        confirmText={selectAddressLoading ? <Spinner color="white" size="24px" /> : t('selectLocation.select')}
                        cancelText={t('common.cancel')}
                    />
                    {isUnavailable && (
                        <div className={`popup-bg ${isUnavailable ? 'fade-in' : 'fade-out'}`}>
                            <div className="popup-container" onClick={e => e.stopPropagation()}>
                                <p className="xl-fs semiBold-fw black-text text-center mt-2">
                                    {t('common.unavailableInfo')}
                                </p>
                                <div className='d-flex justify-content-end ' >
                                    {/* <div className="d-flex align-items-center justify-content-between mt-4 me-3">
                                        <div style={{ width: "10%" }} />
                                        <div className='p-2 px-3 border border-2 rounded' onClick={() => setIsUnavailable(false)} >
                                            <p className='l-fs semiBold-fw black-text'>{t('common.cancel')}</p>
                                        </div>
                                    </div> */}
                                    <div className="d-flex align-items-center justify-content-between mt-4">
                                        <div style={{ width: "10%" }} />
                                        <div className='btn-cancel py-2 px-3' onClick={handleCloseUnavailable} >
                                            <p className='l-fs semiBold-fw black-text text-nowrap'>{t('common.ok')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <CitiesList filteredCities={bootstrapData?.zonesDetails || []} />
                </div>}
        </div>

    );
};


export default SelectLocation;
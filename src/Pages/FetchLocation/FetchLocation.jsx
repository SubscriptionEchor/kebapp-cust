import React, { useState, useEffect, useRef, useContext } from 'react';
import './styles.css';
import Search from "../../assets/svg/search.svg";
import BlackPin from "../../assets/svg/blackpin.svg";
import Gps from "../../assets/svg/GPS.svg";
import Close from "../../assets/svg/close.svg";
import { useLocation, useNavigate } from 'react-router-dom';
import Hut from "../../assets/svg/Hut.svg";
import Buildings from "../../assets/svg/Buildings.svg";
import Briefcase from "../../assets/svg/Briefcase.svg";
import Other from "../../assets/svg/Other.svg";
import XCircle from "../../assets/svg/XCircle.svg";
import { routeName } from '../../Router/RouteName';
import { createAddress, editAddress, zoneCheck } from '../../apollo/server';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { checkLocationAccess, CurrentLocationStorage, fetchAddressFromCoordinates, generateUniqueString } from '../../Utils';
import Spinner from '../../Components/Spinner/Spinner';
import { Context } from '../../Context/Context';
import OpenStreetMap from '../../Components/OpenStreetMap/OpenStreetMap';
import { MAP_TYPES } from '../../constants/enums';
import { useTranslation } from "react-i18next"
import { showErrorToast } from '../../Components/Toast';
import { t } from 'i18next';
const ZONECHECK = gql`${zoneCheck}`;

// const options = [
//     { image: Hut, name: t('fetchLocation.home') },
//     { image: Briefcase, name: t('fetchLocation.work') },
//     { image: Buildings, name: t('fetchLocation.hotel') },
//     { image: Other, name: t('fetchLocation.other') },
// ]
const options = [
    { image: Hut, name: 'Home' },
    { image: Briefcase, name: 'Work' },
    { image: Buildings, name: 'Hotel' },
    { image: Other, name: 'Other' },
]
const LocationCard = ({ iconSrc, address, city, isAddAddress }) => {
    return (
        <div className={`d-flex flex-row justify-content-between ${isAddAddress ? 'mb-3' : ''}`}>
            <div className='address-pin'>
                <img src={iconSrc} alt="Pin" />
            </div>
            <div className='address-content'>
                <p style={{ color: '#000000' }} className='l-fs normal-fw text-nowrap text-ellipsis'>{address}</p>
                <p style={{ color: '#59574E' }} className='m-fs my-2 normal-fw text-ellipsis'>{city}</p>
            </div>
        </div>
    );
};

const FetchLocation = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation();
    const { state } = location;
    const { userDetails, setUserDetails } = useContext(Context)
    const divRef = useRef(null)
    const [divHeight, setDivHeight] = useState(0)
    const [addAddress, setAddAddress] = useState(false);
    const [address, setAddress] = useState(null);
    const [label, setLabel] = useState('Home');
    const [houseDetails, setHouseDetails] = useState('');
    const [apartmentDetails, setApartmentDetails] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [specialLabel, setSpecialLabel] = useState('')
    const [createUserAddress, { loading }] = useMutation(createAddress);
    const [editUserAddress, { loading: editLoading }] = useMutation(editAddress);
    const [error, setError] = useState(null);
    const mapContainerRef = useRef(null);

    // State to store the height of the bottom div
    const [bottomDivHeight, setBottomDivHeight] = useState(0);

    useEffect(() => {
        if (divRef.current) {
            const div = divRef.current;
            const style = window.getComputedStyle(div);
            const marginTop = parseFloat(style.marginTop);
            const marginBottom = parseFloat(style.marginBottom);
            const totalHeight = div.offsetHeight + marginTop + marginBottom;
            setDivHeight(totalHeight);
        }
    }, [address])

    useEffect(() => {
        if (state) {
            setAddress(state.fullAddress);
            setHouseDetails(state?.fullAddress?.type === 'EditAddress' ? state?.fullAddress?.details : '');
            options.some(item => item.name === state?.fullAddress?.label) ? setLabel(state?.fullAddress?.label) : (setLabel('Other'), setSpecialLabel(state?.fullAddress?.label));
        } else {
            console.log('No location data received');
            setAddress(null)
        }
    }, [state]);

    const [checkZone] = useLazyQuery(ZONECHECK, {
        fetchPolicy: "network-only"
    });

    const handleAddAddress = async () => {
        // if (apartmentDetails.length < 5) {
        //     setError('Please enter at least 5 characters')
        //     return
        // }
        try {
            const res = await checkZone({
                variables: {
                    inputValues: {
                        longitude: Number(address?.latitude),
                        latitude: Number(address?.longitude)
                    }
                }
            });
            if (!res?.data || !res?.data?.checkZoneRestrictions) {
                showErrorToast(t('toasts.Locationnotin service zone'));
                return;
            }
            if (res?.data?.checkZoneRestrictions?.fallbackZone) {
                showErrorToast(t('toasts.locationnotinservicezone'));
                return;
            }
            const addressInput = {
                _id: generateUniqueString(),
                deliveryAddress: address?.address || address?.place,
                details: address?.type === 'CurrentLocation' ? address?.place : houseDetails,
                label: address?.type === 'CurrentLocation' ? address?.details : label !== 'Other' ? label : specialLabel,
                longitude: address?.latitude.toString(), // reversing due to OSM
                latitude: address?.longitude.toString() // reversing due to OSM
            };

            let response = await createUserAddress({ variables: { addressInput } });
            CurrentLocationStorage.setCurrentLocation({
                label: addressInput?.label,
                address: address?.address || address?.place,
                place: addressInput?.details,
                latitude: addressInput?.latitude,
                longitude: addressInput?.longitude,
                type: "CurrentLocation"
            })
            if (response) {
                return navigate(routeName.HOME);
            } else {
                console.error('Unexpected response:', response);
                alert('Failed to add address. Please try again.');
            }
        } catch (error) {
            console.error('Error adding address:', error);
        }
    };

    const handleEditAddress = async () => {
        if (address?.type !== 'EditAddress') {
            return
        }
        if (!houseDetails) {
            return showErrorToast("Please enter a house details")
        }
        try {
            const res = await checkZone({
                variables: {
                    inputValues: {
                        longitude: Number(address?.latitude),
                        latitude: Number(address?.longitude)
                    }
                }
            });
            if (!res?.data || !res?.data?.checkZoneRestrictions) {
                showErrorToast(t('toasts.locationnotinservicezone'));
                return;
            }
            if (res?.data?.checkZoneRestrictions?.fallbackZone) {
                showErrorToast(t('toasts.locationnotinservicezone'));
                return;
            }
            const addressInput = {
                _id: address._id,
                deliveryAddress: address?.address || address?.deliveryAddress,
                details: houseDetails || address?.details || address?.place,
                label: label !== 'Other' ? label : specialLabel || address?.label,
                longitude: address?.latitude.toString(), // reversing due to OSM
                latitude: address?.longitude.toString() // reversing due to OSM
            };
            const response = await editUserAddress({ variables: { addressInput } });

            if (response && response?.data?.editAddress?.addresses.length > 0) {
                setUserDetails({ ...userDetails, addresses: response?.data?.addresses });
                if (address?.isSelected) {
                    CurrentLocationStorage.setCurrentLocation({
                        label: addressInput?.label,
                        address: addressInput?.deliveryAddress,
                        place: addressInput?.details,
                        latitude: addressInput?.latitude,
                        longitude: addressInput?.longitude,
                        type: "CurrentLocation"
                    })
                }
                if (window.handleCustomBack) {
                    window.handleCustomBack();
                }
                // return navigate(routeName.HOME)
            }
        } catch (err) {
            console.error('Error updating address:', err);
        }
    }

    useEffect(() => {
        const updateBottomDivHeight = () => {
            if (divRef.current) {
                const height = divRef.current.offsetHeight;
                setBottomDivHeight(height);
            }
        };

        // Initial measurement
        updateBottomDivHeight();

        // Remeasure on content changes and window resize
        const resizeObserver = new ResizeObserver(updateBottomDivHeight);
        if (divRef.current) {
            resizeObserver.observe(divRef.current);
        }

        // Clean up
        return () => {
            if (divRef.current) {
                resizeObserver.unobserve(divRef.current);
            }
        };
    }, [addAddress])
    const calculateMapHeight = () => {
        return `calc(100vh - ${bottomDivHeight}px - 20px)`;
    };

    const onClickFetchLoaction = async () => {
        let res = await checkLocationAccess();
        if (!res?.success) {
            showErrorToast(t(res?.message) ||  t("locationerror"));
            return
        }
        let { latitude, longitude } = res?.data
        getAddressWithCoordinates(latitude, longitude)
    }

    const getAddressWithCoordinates = async (latitude, longitude) => {
        let res = await fetchAddressFromCoordinates(longitude, latitude)
        if (res) {
            setAddress(prev => ({ ...prev, ...res, latitude, longitude }))
        }
    }

    const handleBack = () => {
        if (window.handleCustomBack) {
            window.handleCustomBack();
        }
    };

    return (
        <div>
            {
                (address?.latitude && address?.longitude) &&
                <div className='position-relative '>
                    <OpenStreetMap
                        key={calculateMapHeight() || address}
                        height={calculateMapHeight()}
                        getAddressWithCoordinates={addAddress ? null : getAddressWithCoordinates}
                        bounds={[{
                            coords: {
                                lng: address.latitude,
                                lat: address.longitude
                            },
                            isUser: true,
                        }]}
                        type={MAP_TYPES.LOCATION}
                        isDisabled={addAddress}
                    />
                </div>
            }

            <div ref={divRef} style={{ zIndex: 100, bottom: 0, left: 0, right: 0, width: '100%', padding: '1.5rem', backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                {addAddress ?
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <div className="address-header mb-2">
                                <p className="semiBold-fw l-fs">{t("fetchLocation.yourCurrentLocation")}</p>
                                <img onClick={() => setAddAddress(false)} src={Close} alt="close" height={20} width={20} />
                            </div>
                            <LocationCard
                                isAddAddress={false}
                                iconSrc={BlackPin}
                                address={address?.place || address?.deliveryAddress}
                                city={address?.address}
                            />
                            <p className='semiBold-fw l-fs '>{t("fetchLocation.enterAddress")}*</p>
                            <input
                                type="text"
                                placeholder={t('fetchLocation.addressplaceholder')}
                                value={houseDetails}
                                onChange={(e) => setHouseDetails(e.target.value)}
                                className="address-input"
                            />
                            {/* <input
                                type="text"
                                placeholder="Apartment / Road / Area"
                                value={apartmentDetails}
                                onChange={(e) => setApartmentDetails(e.target.value)}
                                className="address-input"
                            /> */}
                            <p className='m-fs normal-fw   mb-2 text-danger'>{error}</p>
                            <p className='m-fs normal-fw  mt-3 mb-2'>{t("fetchLocation.saveAddressAs")} *</p>
                            <div className='mb-2' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <React.Fragment>
                                    {
                                        options.map((option, index) => {
                                            return (
                                                <button
                                                    className='m-fs normal-fw d-flex'
                                                    key={index}
                                                    onClick={() => setLabel(option?.name)}
                                                    style={{
                                                        color: '#111C18',
                                                        padding: '5px 5px',
                                                        borderRadius: '5px',
                                                        border: '1px solid #ccc',
                                                        backgroundColor: label?.toLowerCase() === option?.name?.toLowerCase() ? '#f0c040' : '#fff',
                                                    }}
                                                >
                                                    <img
                                                        src={option?.image}
                                                        alt="icon"
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            marginRight: '5px',
                                                        }}
                                                    />
                                                    {t(`fetchLocation.${option?.name?.toLowerCase()}`)}
                                                </button>
                                            )
                                        })
                                    }
                                </React.Fragment>
                            </div>
                            {label == "Other" && <div className='mb-2' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <React.Fragment>
                                    <div style={{
                                        width: '35%',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: "space-evenly",
                                    }}>
                                        <img
                                            src={Other}
                                            alt="icon"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '5px',
                                            }}
                                        />
                                        <p className='m-fs text-black text-nowrap'>{t("fetchLocation.saveas")} :</p>
                                    </div>
                                    <div className='d-flex mx-2 w-100' >
                                        <input
                                            type="text"
                                            placeholder={t('fetchLocation.customlabel')}
                                            value={specialLabel}
                                            onChange={(e) => setSpecialLabel(e.target.value)}
                                            style={{
                                                padding: '5px 25px 5px 5px',
                                                border: 'none',
                                                borderBottom: '1px solid #ccc',
                                                outline: 'none',
                                            }}
                                        />
                                        {specialLabel && (
                                            <img onClick={() => setSpecialLabel('')} src={XCircle} />
                                        )}
                                    </div>
                                </React.Fragment>
                            </div>}
                        </div>
                        {address?.type !== 'EditAddress' ? <button
                            className="enable-location-button w-100 l-fs semiBold-fw"
                            style={{
                                opacity: address && houseDetails && !(label === 'Other' && !specialLabel) ? 1 : 0.5
                            }}
                            disabled={!address || !houseDetails || (label === 'Other' && !specialLabel)}
                            onClick={() => { !loading && handleAddAddress() }}
                        >
                            {loading ? <Spinner color="white" size="24px" /> : t("fetchLocation.saveAddress")}
                        </button> :
                            <button
                                className="enable-location-button w-100 l-fs semiBold-fw"
                                disabled={editLoading}
                                onClick={() => { !editLoading && handleEditAddress() }}
                            >
                                {editLoading ? <Spinner color="white" size="24px" /> : t("fetchLocation.saveAddress")}
                            </button>
                        }
                    </>
                    :
                    <>
                        <div className='d-flex flex-row align-items-center justify-content-between mb-3'>
                            <p className='current-location l-fs normal-fw'>{t("fetchLocation.yourCurrentLocation")}</p>
                            <button onClick={handleBack} className='change-button bold-fw m-fs'>
                                {t("fetchLocation.change")}
                            </button>
                        </div>
                        <LocationCard
                            isAddAddress={true}
                            iconSrc={BlackPin}
                            address={address?.place || address?.deliveryAddress}
                            city={address?.address || address?.details}
                        />
                        <div className='d-flex justify-content-between'>
                            {address?.type !== 'EditAddress' && <button
                                className="border-0 rounded w-100 l-fs semiBold-fw me-5"
                                onClick={() => {
                                    CurrentLocationStorage.setCurrentLocation({
                                        address: address?.address || address?.place,
                                        place: address?.place,
                                        latitude: address?.longitude,
                                        longitude: address?.latitude,
                                        type: "CurrentLocation"
                                    })
                                    navigate(routeName.HOME)
                                }}
                            >
                                {loading ? <Spinner color="white" size="24px" /> : `${t("fetchLocation.continue")}`}
                            </button>}

                            <button
                                className="enable-location-button w-100 l-fs semiBold-fw"
                                onClick={() => {
                                    if (address?.type === 'CurrentLocation') {
                                        CurrentLocationStorage?.setCurrentLocation({ ...address, label: address?.place })
                                        return navigate(routeName.HOME)
                                    }
                                    if (address?.type === 'AddAddress' || address?.type === 'EditAddress') {
                                        setAddAddress(true)
                                    }
                                }}
                            >
                                {loading ? <Spinner color="white" size="24px" /> : `${address?.type === 'EditAddress' ? t("fetchLocation.edit") : t("fetchLocation.confirm")}`}
                            </button>
                        </div>
                    </>}
            </div>
        </div >
    );
};

export default FetchLocation;
import React, { useContext, useEffect, useState } from 'react';
import './style.css';
import Plus from '../../assets/svg/plus.svg';
import Edit from '../../assets/svg/edit.svg';
import Delete from '../../assets/svg/delete.svg';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'
import { routeName } from '../../Router/RouteName'
import { Context } from '../../Context/Context';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import Loader from '../../Components/Loader/Loader'
import Crying from "../../assets/Lottie/Crying.json"
import LottieAnimation from '../../Components/LottieAnimation/LottieAnimation'
import { profile, deleteAddress, zoneCheck } from '../../apollo/server'
import Spinner from '../../Components/Spinner/Spinner';
import { checkLocationAccess, compareCoordinates, CurrentLocationStorage, fetchAddressFromCoordinates } from '../../Utils';
import { showErrorToast, showSuccessToast } from '../../Components/Toast';
import { config } from '../../config';

const PROFILE = gql`${profile}`;
const ZONECHECK = gql`${zoneCheck}`;
const DELETEADDRESS = gql`${deleteAddress}`;

const SavedAddress = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const windowHeight = window.innerHeight;
    const { userDetails, setUserDetails, setZoneData, setIdentifier } = useContext(Context);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loader, setLoader] = useState(false);

    const [deleteAddressMutation] = useMutation(DELETEADDRESS);

    const [dynamicHeight, setDynamicHeight] = useState(0);

    const calculateHeight = () => {
        const newHeight = window.innerHeight - 70;
        setDynamicHeight(newHeight);
    };

    useEffect(() => {
        calculateHeight();
        window.addEventListener('resize', calculateHeight);

        return () => {
            window.removeEventListener('resize', calculateHeight);
        };
    }, []);

    // GET user details
    const { loading } = useQuery(PROFILE, {
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        onCompleted: (data) => {
            setUserDetails(data?.profile || {});
        }
    });


    const handleOpenPopup = (address) => {
        document.body.style.overflow = "hidden";
        setSelectedAddress(address);
    };

    const handleClosePopup = () => {
        document.body.style.overflow = "auto";
        setSelectedAddress(null);
    };

    const handleDelete = async () => {
        setLoader(true);
        document.body.style.overflow = "auto";
        try {
            const { data } = await deleteAddressMutation({
                variables: { id: selectedAddress?._id }
            });
            if (!data || !data?.deleteAddress?.addresses) {
                return setLoader(false);
            }
            setUserDetails(prevState => ({
                ...prevState,
                addresses: prevState?.addresses?.filter(address => address._id !== selectedAddress?._id)
            }));
            if (selectedAddress?.selected) {
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
            showSuccessToast(t("fetchLocation.deletedsuccessfully"));
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showErrorToast(t('common.failureMessage'))
        }
        setSelectedAddress(null);
        setLoader(false);
    };

    const [checkZone] = useLazyQuery(ZONECHECK, {
        fetchPolicy: "network-only"
    });

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

    if (loading) {
        return <Loader />
    }

    return (
        <div className='profileComponent pd-horizontal py-4 d-flex '>
            <div className=''>
                <p className='xl-fs bold-fw black-text' style={{ height: 20 }}>{t("profile.addresses")}</p>
                <div style={{ height: 50 }} onClick={() => navigate(routeName.SELECT_LOCATION)} className='add-address d-flex align-items-center justify-content-between p-3 mt-4 mb-4'>
                    <p className='l-fs semiBold-fw text-black'>{t("profile.newAddress")}</p>
                    <img className='icon-size' src={Plus} alt="edit" />
                </div>
                <div
                    style={{ height: dynamicHeight }}
                >
                    {userDetails?.addresses?.length > 0 && userDetails?.addresses?.map((el, i) => {
                        let isSelected = false;
                        if (el?.selected) {
                            let coords = CurrentLocationStorage.getCurrentLocation();
                            isSelected = compareCoordinates(el?.location?.coordinates, coords);
                        }
                        return (
                            <div key={i} className='main-content p-3 mt-3'>
                                <p className='l-fs semiBold-fw black-text'>{el?.label}</p>
                                <p className='m-fs normal-fw content-text-color pt-3 pb-1'>{el?.details}</p>
                                <p className='border-bottom m-fs normal-fw content-text-color pb-3'>{el?.deliveryAddress}</p>
                                <div className='d-flex align-items-center justify-content-between mt-3'>
                                    <div className='d-flex align-items-center'>
                                        <div onClick={() => {
                                            navigate(routeName.FETCH_LOCATION, {
                                                state: {
                                                    fullAddress: {
                                                        _id: el?._id,
                                                        deliveryAddress: el?.deliveryAddress,
                                                        label: el?.label,
                                                        latitude: el?.location?.coordinates?.[0],
                                                        longitude: el?.location?.coordinates?.[1],
                                                        type: "EditAddress",
                                                        details: el?.details,
                                                        isSelected: el?.selected
                                                    }
                                                }
                                            })
                                        }} className='action-btn'>
                                            <img className='icon-size' src={Edit} alt="edit" />
                                        </div>
                                        <div className='action-btn ms-3' onClick={() => handleOpenPopup(el)}>
                                            <img className='icon-size' src={Delete} alt="edit" />
                                        </div>
                                    </div>
                                    {isSelected && <div className='selected-address'>
                                        <p className='m-fs semiBold-fw'>{t("selectLocation.selected")}</p>
                                    </div>}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div style={{ height: windowHeight * 0.08 }} />
            </div>
            {selectedAddress && (
                <div className="popup-overlay" onClick={handleClosePopup}>
                    <div className="popup-container" onClick={e => e.stopPropagation()}>
                        <div className='popup-img  d-flex align-items-center justify-content-center'>
                            <LottieAnimation
                                animationData={Crying}
                                width={120}
                                height={120}
                                autoplay={true}
                                loop={true}
                            />
                        </div>
                        <p className="xl-fs semiBold-fw black-text text-center mt-4">

                            {t('fetchLocation.doyouwanattodelete') + selectedAddress?.label}
                        </p>
                        <div className="d-flex align-items-center justify-content-between mt-4">
                            <div className='btn-confirm' onClick={() => { !loader && handleDelete() }}>
                                {loader ? <Spinner color="black" size={24} /> : <p className='l-fs semiBold-fw black-text'>{t('fetchLocation.confirm')}</p>}
                            </div>
                            <div className='btn-cancel px-3 py-2 d-flex justify-content-center' onClick={() => { !loader && handleClosePopup() }} style={{ width: "44%" }}>
                                <p className='l-fs semiBold-fw black-text'>{t('common.cancel')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedAddress;
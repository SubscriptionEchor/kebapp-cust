import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UseLocationDetails } from '../context/LocationContext';

import { useLocation, useNavigate } from 'react-router-dom';
// import { LocationPinIcon } from '../components/icons';
import { Briefcase, Home, Hotel, MapPin, PinIcon, X } from 'lucide-react';
import { LocationSelectorMap } from '../components/Map/OpenStreetMap';
import { CREATE_ADDRESS, EDIT_ADDRESS } from '../graphql/queries';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import { getLocationFromCoordinates } from '../utils/locationUtils';
import TelegramBackButton from '../components/TelegramBackButton';
import { AppRoutes } from '../routeenums';

const SaveAddress: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [currentUserLocation, setCurrentUserLocation] = useState<any>({})
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [isOtherInput, setIsOtherInput] = useState(false)
    const [type, setType] = useState('')
    const [otherType, setOtherType] = useState('')
    const [addressInput, setAddressInput] = useState('')
    const userLocation = useLocation()
    const [loading, setLoading] = useState(false)
    const { setProfile } = useUser()
    const { storeTemporaryLocation } = UseLocationDetails()
    const [isMapDragged, setIsMapDragged] = useState(false)
    const addressTypes = {
        Home: t('fetchLocation.home'),
        Work: t('fetchLocation.work'),
        Hotel: t('fetchLocation.hotel'),
        Other: t('fetchLocation.other')
    }

    const [createAddressMutation] = useMutation(CREATE_ADDRESS);
    const [editAddressMutation] = useMutation(EDIT_ADDRESS);


    useEffect(() => {
        if (userLocation?.state?.location) {
            if (userLocation?.state?.location?.isEdit) {
                console.log({
                    _id: userLocation?.state?.location?._id,
                    latitude: userLocation?.state?.location?.location?.coordinates[0],
                    longitude: userLocation?.state?.location?.location?.coordinates[1],
                    area: userLocation?.state?.location?.label,
                    address: userLocation?.state?.location?.deliveryAddress
                })
                setCurrentUserLocation({
                    _id: userLocation?.state?.location?._id,
                    latitude: userLocation?.state?.location?.location?.coordinates[0],
                    longitude: userLocation?.state?.location?.location?.coordinates[1],
                    area: userLocation?.state?.location?.label,
                    address: userLocation?.state?.location?.deliveryAddress
                })

                return
            }
            setCurrentUserLocation(userLocation?.state?.location)
        }
    }, [userLocation?.state?.location])

    console.log('Current User Location:', userLocation, currentUserLocation);



    const handleSaveAddress = async () => {
        try {
            if (!currentUserLocation?.latitude || !currentUserLocation?.longitude) {
                toast.error(t('fetchLocation.coordinatesunavailable'));
                return;
            }
            if (!addressInput) {
                toast.error(t('fetchLocation.addressinputrequired'));
                return;
            }
            if (!type) {
                toast.error(t('fetchLocation.addressinputinvalid'));
                return;
            }
            if (type === 'Other' && !otherType) {
                toast.error(t('fetchLocation.customlabelinputrequired'));
                return;
            }
            setLoading(true)

            const addressInputObj = {
                ...(userLocation?.state?.location?.isEdit && { _id: userLocation.state.location._id }),
                deliveryAddress: currentUserLocation?.address || currentUserLocation?.place,
                details: addressInput,
                label: type === 'Other' ? otherType : type,
                longitude: currentUserLocation?.latitude.toString(), // reversing due to OSM
                latitude: currentUserLocation?.longitude.toString() // reversing due to OSM
            };

            const mutation = userLocation?.state?.location?.isEdit
                ? editAddressMutation
                : createAddressMutation;

            const response = await mutation({
                variables: { addressInput: addressInputObj }
            });

            setLoading(false);

            if (response.data) {
                const responseData = userLocation?.state?.location?.isEdit
                    ? response.data.editAddress
                    : response.data.createAddress;

                setProfile((prevProfile: any) => ({
                    ...prevProfile,
                    addresses: responseData.addresses
                }));

                if (!userLocation?.state?.location?.isEdit) {
                    storeTemporaryLocation({
                        latitude: currentUserLocation?.latitude,
                        longitude: currentUserLocation?.longitude,
                        address: currentUserLocation?.address || currentUserLocation?.place,
                        details: addressInput,
                        label: type === 'Other' ? otherType : type
                    });
                }

                toast.success(t('fetchLocation.addresssaved'));
                setIsBottomSheetOpen(false);
                navigate(
                    userLocation?.state?.location?.isEdit ? '/profile/addresses' : '/home',
                    { replace: true }
                );
            }
        } catch (error) {
            setLoading(false)
            toast.error(t('fetchLocation.errorsavingaddress'));
            console.error('Error saving address:', error);
        }
    }

    const onClickContinue = () => {
        storeTemporaryLocation({
            latitude: currentUserLocation?.latitude,
            longitude: currentUserLocation?.longitude,
            address: currentUserLocation?.address,
            area: currentUserLocation?.area,
        })
        return navigate(AppRoutes.HOME, { replace: true });
    }

    const onLocationChanged = async (location: any) => {
        setIsMapDragged(true)
        const locationDetails = await getLocationFromCoordinates(location?.lat, location?.lng);
        setIsMapDragged(false)
        setCurrentUserLocation({
            latitude: location?.lat,
            longitude: location?.lng,
            area: locationDetails.area,
            address: locationDetails.address
        })

    }

    return (
        <div className="flex flex-col h-screen">
            <TelegramBackButton />
            {isBottomSheetOpen && (
                <div style={{ zIndex: 100000 }} className="fixed inset-0 bg-black bg-opacity-50 h-[75vh]">

                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 animate-slide-up">
                        <button
                            onClick={() => {
                                setIsBottomSheetOpen(false)
                                setAddressInput('')
                                setOtherType('')
                                setType('')
                                setIsOtherInput(false)
                            }}
                            className="p-3 absolute -top-14 bg-black left-[44%] hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-100" />
                        </button>

                        <div className="my-4">
                            <div className=''>
                                <p className="font-medium text-md ">{t('address.currentLocation')}</p>
                                <p className="text-lg font-bold text-gray-600">{currentUserLocation?.area}</p>

                                <p className="text-sm text-gray-500 ">
                                    {currentUserLocation?.address}
                                </p>
                            </div>
                        </div>
                        <h2 className="text-lg font-semibold mb-4">{t('fetchLocation.enterAddress')}</h2>

                        <div className="space-y-6">
                            <input
                                type="text"
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                                placeholder={t('fetchLocation.addressplaceholder')}
                                className="w-full p-3 border hover:border-secondary rounded-lg"
                            />


                            <div className="mb-4">
                                <label className="text-lg block font-semibold  mb-4">{t('fetchLocation.saveAddress')}</label>
                                <div className="flex gap-2 overflow-x-auto">

                                    {Object.keys(addressTypes).map((key) => (
                                        <button
                                            key={key}
                                            disabled={loading}
                                            onClick={() => {
                                                setType(key)
                                                setOtherType('')
                                                setIsOtherInput(key === 'Other')
                                            }}
                                            className={`
                                        ${type == key ? 'bg-secondary text-white' : 'text-gray-900'}
                                        px-4 py-2 border rounded-lg flex items-center gap-2`}>
                                            {key === 'Home' && <Home />}
                                            {key === 'Work' && <Briefcase />}
                                            {key === 'Hotel' && <Hotel />}
                                            {key === 'Other' && <MapPin />}
                                            {t(`fetchLocation.${key?.toLowerCase()}`)}
                                        </button>
                                    ))}
                                    {/* <button
                                        disabled={loading}
                                        onClick={() => {
                                            setType('home')
                                            setOtherType('')
                                            setIsOtherInput(false)
                                        }}
                                        className={`
                                        ${type == "home" ? 'bg-secondary text-white' : 'text-gray-900'}
                                        px-4 py-2 border rounded-lg flex items-center gap-2`}>

                                        <Home />
                                        {t('fetchLocation.home')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setType('work')
                                            setOtherType('')
                                            setIsOtherInput(false)
                                        }}
                                        className={`
                                            ${type == "work" ? 'bg-secondary text-white' : 'text-gray-900'}
                                            px-4 py-2 border rounded-lg flex items-center gap-2`}>
                                        <Briefcase />
                                        {t('fetchLocation.work')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setType('hotel')
                                            setOtherType('')
                                            setIsOtherInput(false)
                                        }}
                                        className={`
                                            ${type == "hotel" ? 'bg-secondary text-white' : 'text-gray-900'}
                                            px-4 py-2 border rounded-lg flex items-center gap-2`}>
                                        <Hotel />
                                        {t('fetchLocation.hotel')}
                                    </button>*/}
                                    {/* <button onClick={() => {
                                        setIsOtherInput(true);
                                        setType('other')
                                    }} className={` ${type == "other" ? 'bg-secondary text-white' : 'text-gray-900'} px-4 py-2 border rounded-lg flex items-center gap-2`}>
                                        <MapPin />
                                        {t('fetchLocation.other')}
                                    </button>  */}
                                </div>
                            </div>
                            {isOtherInput ? <input
                                type="text"
                                value={otherType}
                                onChange={(e) => setOtherType(e.target.value)}
                                placeholder={t('fetchLocation.customlabel')}
                                className="w-full p-3 border hover:border-secondary rounded-lg"
                            /> : null}

                            <div className="flex gap-4">

                                <button
                                    disabled={loading}
                                    className="flex-1 p-3 bg-secondary text-white rounded-lg flex items-center justify-center"
                                    onClick={() => {
                                        handleSaveAddress()
                                    }}
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        t('fetchLocation.saveAddress')
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Map Component */}

            <div className="flex-1 relative">
                {currentUserLocation?.latitude && <LocationSelectorMap
                    // key={currentUserLocation?.latitude}
                    initialLocation={{
                        lat: currentUserLocation?.latitude,
                        lng: currentUserLocation?.longitude
                    }}
                    onLocationSelected={(location) => {
                        console.log('Location selected:', location);
                        onLocationChanged(location)
                    }}
                />}

                <div className="relative  h-[45%] p-4 shadow-top">
                    <div className="my-4">
                        {!userLocation?.state?.location?.isEdit && <div className='flex items-center justify-end'>
                            <button onClick={() => navigate(AppRoutes.LOCATION_SEARCH)} className='text-gray-900 p-2 rounded bg-gray-200'>{t('fetchLocation.change')}</button>
                        </div>}
                        <div className=''>
                            <div className="flex items-start mb-2">
                                <PinIcon className="w-5 h-5 mr-2 text-gray-600" />
                                <div>
                                    <p className="font-medium text-md ">{t('address.currentLocation')}</p>
                                    <p className="text-md text-gray-600">{currentUserLocation?.area}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 ml-7">
                                {currentUserLocation?.address}
                            </p>
                        </div>
                    </div>

                    <div className='w-full py-3 absolute bottom-5 left-0 right-0  rounded-lg font-medium'>
                        <div className='flex  mx-2 justify-between '>
                            {!userLocation?.state?.location?.isEdit && <button
                                onClick={onClickContinue}
                                className="w-[45%] py-2 px-4 border border-secondary text-secondary text-center rounded"
                            >
                                {t('fetchLocation.continue')}
                            </button>}
                            <button
                                onClick={() => {
                                    if (userLocation?.state?.location?.isEdit) {
                                        setAddressInput(userLocation?.state?.location?.details)
                                        const label = userLocation?.state?.location?.label;
                                        const isLabelInAddressTypes = Object.keys(addressTypes).includes(label);
                                        if (isLabelInAddressTypes && label !== "Other") {
                                            setType(label);
                                        } else {
                                            setType("Other");
                                            setOtherType(label);
                                            setIsOtherInput(true);
                                        }
                                    }
                                    setIsBottomSheetOpen(true)
                                }
                                }
                                className={`${!userLocation?.state?.location?.isEdit ? 'w-[45%]' : 'w-full'} py-2 px-4 bg-secondary text-white text-center flex items-center justify-center rounded`}
                            >
                                {isMapDragged ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) :
                                    userLocation?.state?.location?.isEdit ? t('fetchLocation.editaddress') : t('address.addAddress')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveAddress;
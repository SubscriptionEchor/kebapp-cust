import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles.css";
import LocationMap from "../../assets/svg/LocationMap.svg";
import useGeolocation from "../../Hooks/useGeolocation/useGeolocation";
import { useNavigate } from "react-router-dom";
import { routeName } from "../../Router/RouteName";
import { fetchAddressFromCoordinates, CurrentLocationStorage, checkLocationAccess, getRestaurantIdFromTelegram } from "../../Utils";
import Spinner from "../../Components/Spinner/Spinner";
import { gql, useLazyQuery, useQuery } from "@apollo/client";

import { showErrorToast, showSuccessToast } from "../../Components/Toast";
import { config } from "../../config";
import { BootstrapContext } from "../../Context/Bootstrap";
import { zoneCheck } from "../../apollo/server";
import { Context } from "../../Context/Context";
import { LOCALSTORAGE_NAME } from "../../constants/enums";


const ZONECHECK = gql`${zoneCheck}`;

const Location = () => {
	const { bootstrapData } = useContext(BootstrapContext);
	const { t } = useTranslation();
	const navigate = useNavigate()
	const [loading, setLoading] = useState(0);
	const [isGPSDisabled, setIsGPSDisabled] = useState(false);
	const [isUnavailable, setIsUnavailable] = useState(false);
	const [closeCondition, setCloseCondition] = useState("home");
	const { setZoneData, setIdentifier } = useContext(Context)

	const [checkZone] = useLazyQuery(ZONECHECK, {
		fetchPolicy: "network-only"
	});

	const handleLocationData = async (location) => {
		if (location) {
			try {
				if (!location?.latitude || !location?.longitude) return showErrorToast("Error fetching coordinates");
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
				const formattedAddress = await fetchAddressFromCoordinates(coords?.latitude, coords?.longitude);
				setZoneData(zoneData)
				setIdentifier(identifier)
				if (formattedAddress) {
					CurrentLocationStorage.setCurrentLocation({ ...formattedAddress, ...coords });
					showSuccessToast(t('location.locationfetchedsuccessfully'));
					if (!unavailable) {
						const restaurantId = getRestaurantIdFromTelegram();
					console.log(restaurantId, "restaurantId");
					if (restaurantId) {
						// Save restaurant ID to localStorage for use in Restaurant component
						localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({ _id: restaurantId }));
						console.log('Navigating to Restaurant page with ID:', restaurantId);
						navigate(routeName.RESTAURANT);
						return;
					}
		
						navigate(routeName.HOME);
						return;
					}
					setCloseCondition("home");
					setIsUnavailable(true);
				}
			} catch (error) {
				showErrorToast('Error fetching address');
				console.error('Error fetching address:', error);
			} finally {
				setLoading(0)
			}
		}
	};

	const handleLocationFn = async () => {
		if (loading !== 0) return;
		setLoading(1);
		let res = await checkLocationAccess();
		if (!res?.success) {
			showErrorToast(t(res?.message) || t("locationerror"));
			setIsGPSDisabled(true);
			setLoading(0);
			return
		}
		setIsGPSDisabled(false);
		await handleLocationData(res?.data);
	};

	const handleManualLocationAccess = async () => {
		if (loading !== 0) return;
		setLoading(2);
		// let res = await checkLocationAccess();
		// if (!res?.success) {
		// 	showErrorToast(res?.message || "Location Error");
		// 	setIsGPSDisabled(true);
		// 	setLoading(0);
		// 	return
		// }
		setIsGPSDisabled(false);

		// Fetch location manually
		let coords = {}
		if (bootstrapData?.operationalZones[0]?.fallBackCoordinates) {
			coords = bootstrapData?.operationalZones[0]?.fallBackCoordinates;
		} else {
			coords = config.FALLBACK_LOCATION;
		}
		const formattedAddress = await fetchAddressFromCoordinates(coords.latitude, coords.longitude);
		if (!formattedAddress) {
			return showErrorToast(t('toasts.somethingwentwrongwiththelocationcheck'));
		}
		const fullAddress = { ...formattedAddress, ...coords };
		CurrentLocationStorage.setCurrentLocation(fullAddress);
		setLoading(0);
		const restaurantId = getRestaurantIdFromTelegram();
					console.log(restaurantId, "restaurantId");
					if (restaurantId) {
						// Save restaurant ID to localStorage for use in Restaurant component
						localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({ _id: restaurantId }));
						console.log('Navigating to Restaurant page with ID:', restaurantId);
						navigate(routeName.RESTAURANT);
						return;
					}
		
		navigate(routeName.HOME);
		return;

		// ------------------------------------------

		// let coords = {
		// 	latitude: Number(res?.data?.latitude),
		// 	longitude: Number(res?.data?.longitude)
		// }
		// const response = await checkZone({
		// 	variables: {
		// 		inputValues: coords
		// 	}
		// });
		// if (!response?.data || !response?.data?.checkZoneRestrictions) {
		// 	showErrorToast('Location not in service zone');
		// 	setLoading(0);
		// 	return;
		// }
		// let unavailable = false;
		// if (response?.data && response?.data?.checkZoneRestrictions && response?.data?.checkZoneRestrictions?.fallbackZone) {
		// 	let coordinates;
		// 	if (operationalZones && operationalZones?.length === 0) {
		// 		return showErrorToast('Something went wrong with the location check');
		// 	}
		// 	coordinates = operationalZones?.find(e =>
		// 		e?.identifier?.toLowerCase().trim() === response?.data?.checkZoneRestrictions?.fallbackZone?.toLowerCase().trim()
		// 	);
		// 	if (!coordinates?.fallBackCoordinates?.latitude || !coordinates?.fallBackCoordinates?.longitude) {
		// 		return showErrorToast('Something went wrong with the location check');
		// 	}
		// 	coords['latitude'] = coordinates?.fallBackCoordinates?.latitude;
		// 	coords['longitude'] = coordinates?.fallBackCoordinates?.longitude;
		// 	unavailable = true;
		// }
		// if (!unavailable) {
		// 	navigate(routeName.SELECT_LOCATION);
		// 	setLoading(0);
		// 	return;
		// }
		// setCloseCondition("selectLocation");
		// setIsUnavailable(true);
		// setLoading(0);
	}

	const handleCloseUnavailable = () => {
		if (closeCondition == "home") {
			const restaurantId = getRestaurantIdFromTelegram();
						console.log(restaurantId, "restaurantId");
						if (restaurantId) {
							// Save restaurant ID to localStorage for use in Restaurant component
							localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({ _id: restaurantId }));
							console.log('Navigating to Restaurant page with ID:', restaurantId);
							navigate(routeName.RESTAURANT);
							return;
						}
			
			navigate(routeName.HOME)
		}
		if (closeCondition == "selectLocation") {
			navigate(routeName.SELECT_LOCATION);
		}
		setIsUnavailable(false);
	};

	return (
		<div className="location-component p-4">
			<div style={{ height: "65vh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
				<div>
					<img
						src={LocationMap}
						alt={t('location.title')}
						width='90%'
					/>
					<p className="text-center location-title bold-fw">
						{t('location.title')}
					</p>
					<p className="text-center my-2 normal-fw">
						{t('location.description')}
					</p>
				</div>
			</div>
			<div style={{ position: 'fixed', bottom: 10, left: 0, width: '100%', padding: '1rem' }}>
				{isGPSDisabled && <p className="m-fs normal-fw px-2 mb-3" style={{ color: "red" }}>
					{t('location.note')} : {t('location.gpsAlert')}
				</p>}
				<button
					disabled={loading > 0}
					className="enable-location-button w-100 l-fs semiBold-fw"
					onClick={() => handleLocationFn()}
				>
					{loading == 1 ? <Spinner color="white" size="24px" /> : t('location.enableLocation')}
				</button>
				<button disabled={loading > 0} onClick={() => handleManualLocationAccess()} className="manual-location-button w-100 l-fs semiBold-fw mt-3">
					{loading == 2 ? <Spinner color="#000" size="24px" /> : t('location.enterManually')}
				</button>
			</div>
			{isUnavailable && (
				<div className={`popup-bg ${isUnavailable ? 'fade-in' : 'fade-out'}`}>
					<div className="popup-container" onClick={e => e.stopPropagation()}>
						<p className="xl-fs semiBold-fw black-text text-center mt-2">
							{t('common.unavailableInfo')}
						</p>
						<div className='d-flex justify-content-end ' >
							{/* <div className="d-flex align-items-center justify-content-between mt-4 me-3">
								<div className='p-2 px-3 border border-2 rounded' onClick={() => setIsUnavailable(false)} >
									<p className='l-fs semiBold-fw black-text'>{t('common.cancel')}</p>
								</div>
							</div> */}
							<div className="d-flex align-items-center justify-content-between mt-4">
								<div className='p-2 px-3 border border-2 rounded btn-cancel' onClick={handleCloseUnavailable}  >
									<p className='l-fs semiBold-fw black-text'>{t('common.ok')}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Location;
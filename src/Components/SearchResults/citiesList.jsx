import './style.css'
import React, { useContext, useState } from 'react';
import Location from "../../assets/svg/location.svg"
import { zoneCheck } from '../../apollo/server';
import { gql, useLazyQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { routeName } from '../../Router/RouteName';
import { Context } from '../../Context/Context';
import { useTranslation } from 'react-i18next';
import { CurrentLocationStorage, fetchAddressFromCoordinates } from '../../Utils';
const CHECKZONE = gql`${zoneCheck}`



const CitiesList = ({ filteredCities }) => {
    const { setZoneData, setIdentifier } = useContext(Context)
    const { t } = useTranslation();
    const [checkZone] = useLazyQuery(CHECKZONE)
    const [loader, setLoader] = useState(null)
    const navigate = useNavigate()

    const OnClickCity = async (city) => {
        setLoader(city?.title)
        let { data, loading, error } = await checkZone({
            variables: {
                inputValues: {
                    longitude: Number(city?.defaultLocation?.coordinates[0]),
                    latitude: Number(city?.defaultLocation?.coordinates[1])
                }
            }
        })

        if (data && data?.checkZoneRestrictions) {
            setZoneData(data?.checkZoneRestrictions?.selectedZoneDetails?.coordinates[0])
            setIdentifier(data?.checkZoneRestrictions?.selectedZoneDetails?.identifier)
            let formattedAddress = await fetchAddressFromCoordinates(city?.defaultLocation?.coordinates[1], city?.defaultLocation?.coordinates[0]);
            CurrentLocationStorage.setCurrentLocation({
                ...formattedAddress,
                place: city?.title,
                longitude: Number(city?.defaultLocation?.coordinates[0]),
                latitude: Number(city?.defaultLocation?.coordinates[1])
            })
            navigate(routeName.HOME)
        }
        setLoader(null)
    }
    return (
        <div className=''>
            <h3 className='fw-bold l-fs mt-3'>{t('common.operationalAreas')}</h3>
            {filteredCities.length > 0 ? (
                <div className='px-2 '>
                    {filteredCities.map(city => (
                        <div onClick={() => {
                            if (loader) {
                                return
                            }
                            OnClickCity(city)
                        }} className='position-relative fw-bold d-flex xl-fs border-bottom border-1 py-3  align-items-center' key={city.identifier}>
                            <div style={{ background: 'lightgrey', height: 35, width: 35 }} className='d-flex me-2 justify-content-center align-items-center rounded-pill'>
                                <img style={{ height: 20, width: 20 }} src={Location} alt="location" />
                            </div>
                            <p className='fw-bold s-fs'>{city.title}</p>
                            {loader == city?.title ? <div key={loader} className="d-flex align-items-center justify-content-end" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}>
                                <div className='search-loader'></div>
                            </div> : null}
                        </div>
                    ))}
                </div>
            ) : <p className='s-fs text-center '>{t('common.Nocitiesavailable')}</p>
            }

        </div >
    );
};

export default CitiesList;
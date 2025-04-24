import './style.css'
import React, { useContext, useState } from 'react';
import Location from "../../assets/svg/location.svg"
import CitiesList from './citiesList';
import { useNavigate } from 'react-router-dom';
import { zoneCheck } from '../../apollo/server';
import { gql, useLazyQuery } from '@apollo/client';
import { Context } from '../../Context/Context';
import { routeName } from '../../Router/RouteName';
import { useTranslation } from 'react-i18next';
import { CurrentLocationStorage } from '../../Utils';
const CHECKZONE = gql`${zoneCheck}`

const AreasList = ({ filteredSearchList }) => {
    const { setZoneData, setIdentifier } = useContext(Context)
    const [checkZone] = useLazyQuery(CHECKZONE)
    const navigate = useNavigate()
    const [loader, setLoader] = useState(null)

    const { t } = useTranslation();

    const OnClickArea = async (area) => {
        setLoader(area?.id)
        let { data } = await checkZone({
            variables: {
                inputValues: {
                    longitude: Number(area?.coordinates[0]),
                    latitude: Number(area?.coordinates[1])
                }
            }
        })
        if (!data || !data?.checkZoneRestrictions || data?.checkZoneRestrictions?.fallbackZoneDetails) {
            navigate(routeName.NOTFOUND)
        }
        else if (data?.checkZoneRestrictions?.selectedZoneDetails) {
            let nestedData = data?.checkZoneRestrictions?.selectedZoneDetails
            setZoneData(nestedData?.coordinates[0])
            setIdentifier(nestedData?.identifier)
            let fullAddress = {
                address: [area?.street, area?.city, area?.state, area?.country]?.filter(Boolean).join(','),
                place: area?.name,
                longitude: Number(area?.coordinates[1]),
                latitude: Number(area?.coordinates[0]),
                type: 'AddAddress'
            }
            navigate(routeName.FETCH_LOCATION, { state: { fullAddress } });
        }
        setLoader(null)
    }

    return (
        <div className=''>
            <h3 className='fw-bold l-fs mt-3'>{t('common.areas')}</h3>
            {filteredSearchList.length > 0 && (
                <div className='px-2'>
                    {filteredSearchList.map((item, index) => (
                        <div onClick={() => {
                            if (loader) {
                                return
                            }
                            OnClickArea(item)
                        }} key={index} className='position-relative border-bottom border-2 d-flex py-2'>
                            <div style={{ background: 'lightgrey', height: 35, width: 35 }} className='me-2 d-flex justify-content-center align-items-center rounded-pill'>
                                <img style={{ height: 20, width: 20 }} src={Location} alt="location" />
                            </div>
                            <div style={{ flex: 1 }} >
                                <p className='fw-bold s-fs'>{item.name}</p>
                                <div className="s-fs normal-fw mt-1">
                                    {[
                                        item.street,
                                        item.city,
                                        item.state,
                                        item.country
                                    ].filter(Boolean).join(', ')}
                                </div>
                            </div>
                            {loader && loader == item?.id ? <div key={loader} className="d-flex align-items-center justify-content-end" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}>
                                <div className='search-loader'></div>
                            </div> : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AreasList;
import React from "react"
import { useTranslation } from 'react-i18next';
import Star from "../../assets/svg/star.svg"
import Dot from "../../assets/svg/dot.svg"
import "./style.css"
import { metersToKilometers } from "../../Utils";

export default function ResturantHeader({ data }) {
    const { t } = useTranslation()
    return (
        <div className="mb-2 pd-horizontal bg-white bottom-shadow sticky-position" style={{ zIndex: 1500 }}>
            <div className="d-flex restaurant-name primary-font l-fs normal-fw py-2  align-items-center">
                <p className="text-nowrap text-ellipsis" style={{ maxWidth: '50%' }}>{data?.name}</p>
                <img src={Dot} height={5} width={5} className="mx-2" />
                <p>{metersToKilometers(data?.distanceInMeters)} {t("common.km")}</p>
                <img src={Dot} height={5} width={5} className="mx-2" />
                <div className="restaurant-rating px-2 d-flex justify-content-center rounded-1 align-items-center">
                    <p className="pe-1 white-text">{data?.reviewAverage > 0 ? data?.reviewAverage : t("common.new")}</p>
                    {data?.reviewAverage > 0 && <img src={Star} height={10} width={10} />}
                </div>
                {data?.reviewCount > 0 && <p className="ms-2 s-fs">{data?.reviewCount} {t("restaurant.ratings")}</p>}
            </div>
        </div>
    )
}
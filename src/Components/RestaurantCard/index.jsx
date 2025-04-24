import React, { useContext } from 'react'
import "./style.css"
import Star from "../../assets/svg/star.svg"
import Close from "../../assets/svg/close.svg"
import Tick from "../../assets/svg/tick.svg"
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routeName } from '../../Router/RouteName'
import { Context } from '../../Context/Context'
import { LOCALSTORAGE_NAME } from '../../constants/enums'
import { metersToKilometers } from '../../Utils'
import Bell from '../../assets/svg/Bell.svg'
import BellSlash from '../../assets/svg/BellSlash.svg'
import Spinner from '../Spinner/Spinner'

const RestaurantCard = (props) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleClose = (e) => {
        e.stopPropagation();
        props?.setIsModalVisible(false);
    };

    const handleFollowing = (e) => {
        e.stopPropagation();
        props?.handleFollow();
    };

    const handleNotification = (e) => {
        e.stopPropagation();
        props?.handleNotification();
    };

    const navigateToSingleRestaurant = () => {
        localStorage.setItem(LOCALSTORAGE_NAME.RESTAURANT_ID, JSON.stringify({
            _id: props?.data?._id,
            slug: props?.data?.slug
        }));
        navigate(routeName.RESTAURANT);
    };

    return (
        <div className='restaurant-card' onClick={navigateToSingleRestaurant}>
            <div style={{
                height: 155,
                width: "100%",
                objectFit: "cover",
                position: 'relative',
                borderRadius: '12px 12px 0px 0px',
                background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               linear-gradient(180deg, rgba(0, 0, 0, 0.00) 59.3%, rgba(0, 0, 0, 0.20) 99.71%),
               url(${props?.data?.image}) lightgray 50% / cover no-repeat`
            }}>
                <div className='image-overlay-items'>
                    <span className="me-2 px-2 bg-white" style={{ height: 40, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleNotification}>
                        {(props?.isLoadingId && (props?.isLoadingId == props?.data?._id)) ? <Spinner color="#000" size="24px" /> : <img className='icon-size' src={props?.data?.isNotify ? Bell : BellSlash} alt="star" />}
                    </span>
                    <div className='following-container-style px-2' onClick={handleFollowing}>
                        <p className='black-text normal-fw l-fs'>{true ? t("following.following") : t("following.follow")}</p>
                        <img className='tick-size ms-1' src={Tick} alt="tick" />
                    </div>
                    {/* {props?.isCancel ? <div className='close-container' onClick={handleClose}>
                        <img className='icon-size' src={Close} alt="close" />
                    </div> :
                        <div className='following-container' onClick={handleFollowing}>
                            <p className='black-text normal-fw l-fs'>{true ? t("following.following") : t("following.follow")}</p>
                            <img className='tick-size ms-1' src={Tick} alt="tick" />
                        </div>} */}
                </div>
            </div>
            <div className='card-content p-3'>
                <div className='d-flex align-items-center justify-content-between'>
                    <p className='l-fs bold-fw black-text text-ellipsis' style={{ width: "65%" }}>{props?.data?.name}</p>
                    {props?.data?.reviewAverage && props?.data?.reviewAverage > 0 ?
                        <div className='new d-flex align-items-center px-2 tertiary-bgcolor'>
                            <p className='l-fs semiBold-fw white-text'>{props?.data?.reviewAverage || 0}</p>
                            <img className='star ms-1' src={Star} alt="star" />
                        </div> :
                        <div className='new px-2'>
                            <p className='l-fs semiBold-fw tertiary-color'>{t("common.new")}</p>
                        </div>
                    }
                </div>
                <p className='heading s-fs normal-fw text-ellipsis my-1 mt-2'>{props?.data?.address}</p>
                <p className='black-text normal-fw s-fs text-ellipsis'>{props?.data?.cuisines?.join(', ')}</p>
                <div className='d-flex align-items-center mt-2'>
                    <p className='black-text normal-fw m-fs'>{t("following.distance")}:</p>
                    <p className='black-text semiBold-fw l-fs ms-2'>{metersToKilometers(props?.data?.distanceInMeters)} {t("common.km")}</p>
                </div>
            </div>
        </div>
    )
}

export default RestaurantCard;
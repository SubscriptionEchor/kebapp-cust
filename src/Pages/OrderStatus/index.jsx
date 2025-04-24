import ResturantHeader from "../../Components/RestaurantLevelHeader"
import './style.css'
import Refresh from "../../assets/svg/refresh.svg"
import { useTranslation } from "react-i18next"
import Check from "../../assets/svg/check.svg"
import Uncheck from "../../assets/svg/uncheck.svg"
import { LOCALSTORAGE_NAME, MAP_TYPES, ORDER_STATUS, ORDER_STATUS_ENUMS } from "../../constants/enums"
import { useContext, useEffect, useState } from "react"
import Line from "../../assets/svg/line.svg"
import Paid from "../../assets/svg/paid.svg"
import Exclamation from "../../assets/svg/exclamation.svg"
import { useQuery, useSubscription } from "@apollo/client";
import { getMenu, subscriptionOrder } from "../../apollo/server";
import gql from "graphql-tag";
import { useLocation } from "react-router-dom"
import UserContext from "../../Context/User"
import Loader from "../../Components/Loader/Loader"
import Cancel from "../../assets/svg/cancel.svg"
import OpenStreetMap from "../../Components/OpenStreetMap/OpenStreetMap"
import { formatToGermanNumber } from "../../Utils"

const GETMENU = gql`${getMenu}`;

export default function OrderStatus() {
    const orderId = localStorage.getItem(LOCALSTORAGE_NAME.ORDER_STATUS_ID);
    const { t } = useTranslation()
    const [orderStatus, setOrderStatus] = useState(0)
    const status = Object.keys(ORDER_STATUS)
    const [showWarning, setShowWarning] = useState(false)
    const [menu, setMenu] = useState(null)
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    useSubscription(
        gql`
      ${subscriptionOrder}
    `,
        { variables: { id: orderId } }
    );

    const { loadingOrders, errorOrders, orders, clearCart } = useContext(UserContext);

    const order = orders.find((o) => o._id === orderId);

    useEffect(() => {
        let res = status.findIndex((item, ind) => item == order?.orderStatus)
        setOrderStatus(res)
    }, [order])

    // console.log(order?.restaurant?._id);

    const { loading } = useQuery(GETMENU, {
        variables: {
            restaurantId: order?.restaurant?._id
        },
        skip: !order?.restaurant?._id,
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if (data && data?.getMenu) {
                setMenu(data?.getMenu);
            }
        }
    });

    const details = {
        "totalItem": Number(order?.orderAmount - order?.tipping - order?.taxationAmount)?.toFixed(2) || 0,
        "restaurantTip": Number(order?.tipping)?.toFixed(2) || 0,
        "serviceCharges": Number(order?.taxationAmount)?.toFixed(2) || 0
    }

    const [seconds, setSeconds] = useState(60 * 60 * 2);
    const [time, setTime] = useState({
        hours: 0,
        minutes: 0,
        remainingSeconds: 0
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;

            setTime({
                hours,
                minutes,
                remainingSeconds
            });

            if (seconds > 0) {
                setSeconds(prev => prev - 1);
            }
        }, 1000);

        // Cleanup
        return () => clearTimeout(timer);
    }, [seconds]);

    const onClickShowWarning = () => {
        setShowWarning(true)
        document.body.style.overflowY = 'hidden'
    }
    const onClickClose = () => {
        setShowWarning(false)
        document.body.style.overflowY = 'auto'
    }

    const onClickViewDirections = () => {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            let cords = {
                user_lat: Number(order?.deliveryAddress?.location?.coordinates[1]),
                user_lng: Number(order?.deliveryAddress?.location?.coordinates[0]),
                rest_lat: Number(order?.restaurant?.location?.coordinates[1]),
                rest_lng: Number(order?.restaurant?.location?.coordinates[0])
            }
            let url = `https://www.google.com/maps/dir/?api=1&origin=${cords?.user_lat},${cords?.user_lng}&destination=${cords?.rest_lat},${cords?.rest_lng}`
            webApp.openLink(url, { try_instant_view: false });
        } else {
            window.open(url, '_blank');
        }
    }

    useEffect(() => {
        if (order?.preparedAt) {
            const sec = getTimeRemainingInSeconds(order?.preparedAt);
            setSeconds(sec);
        }
    }, [order?.preparedAt])

    const getTimeRemainingInSeconds = (preparedTime) => {
        const waitingDateTime = new Date(preparedTime);
        waitingDateTime.setHours(waitingDateTime.getHours() + 2);  // Added 2 hours
        const currentTime = new Date();
        const difference = waitingDateTime - currentTime;
        const secondsRemaining = Math.floor(difference / 1000);
        return secondsRemaining;
    }

    if (loadingOrders || !order) {
        return <Loader />
    }

    return (
        <div className="bg-white position-relative">
            <ResturantHeader data={order?.restaurant} />
            {order?.deliveryAddress && <OpenStreetMap bounds={[{
                coords: {
                    lat: Number(order?.deliveryAddress?.location?.coordinates[1]),
                    lng: Number(order?.deliveryAddress?.location?.coordinates[0])
                }, isUser: true
            }, {
                coords: {
                    lat: Number(order?.restaurant?.location?.coordinates[1]),
                    lng: Number(order?.restaurant?.location?.coordinates[0])
                }, isUser: false,
                distanceInMeters: order?.restaurant?.distanceInMeters || 0
            }]} type={MAP_TYPES.ORDERSTATUS} height={200} />}
            <div className="pd-horizontal py-4">
                <div className="otp-orderid rounded-3 mb-4">
                    {/* <h1 className="semiBold-fw px-3 py-2 rounded-3 xl-fs m-0 p-0 qrText">{t('orderStatus.qrText')}</h1> */}
                    <div className="d-flex align-items-center justify-content-between mt-3">
                        <div className="w-75">
                            <h1 className="restaurant-name bold-fw xl-fs mt-2 m-0 p-0 text-ellipsis ">{order?.restaurant?.name}</h1>
                            <h1 className="address s-fs normal-fw m-0 p-0 text-wrap">{order?.restaurant?.address}</h1>
                        </div>
                        <button onClick={onClickViewDirections} className="secondary-bgcolor border-0 rounded-3 p-2 semiBold-fw view-directions-button" >{t("orderStatus.viewDirections")}</button>
                    </div>
                    <h1 className="mt-2 normal-fw l-fs order-id">{t('orderStatus.orderId')} : <span className="semiBold-fw">{order?.orderId}</span></h1>
                    {/* <h1 className="mt-2 normal-fw xxl-fs normal-fw">{t('orderStatus.otp')} : <span className="semiBold-fw ">2567</span></h1> */}
                </div>
                {/* <div className="my-4 refresh rounded-3 d-flex align-items-center justify-content-center">
                    <img src={Refresh} />
                    <h1 className="m-fs ps-2 order-placed-text">{t('orderStatus.orderPlacedText')}</h1>
                </div> */}
                <p className="xxl-fs bold-fw">{t('orderStatus.orderStatus')}</p>
                <div className="mt-2 mb-4 order-status-container rounded-3 py-4">
                    <div>
                        {ORDER_STATUS["CANCELLED"] == order?.orderStatus ? <div >
                            <div className={`d-flex`} >
                                <div>
                                    <div className={`d-flex justify-content-center align-items-center rounded-3 order-status order-status-cancelled`}>
                                        <img src={Cancel} />

                                    </div>
                                    {/* {status != "delivered" && <img src={Line} height={40} width={50} />} */}
                                </div>
                                <div className="ms-3 order-status-text " >
                                    <h1 className="bold-fw xl-fs m-0">{t(`orderStatus.cancelled`)}</h1>
                                    <h1 className="m-fs normal-fw mt-1">{t(`orderStatus.orderStatusText.cancelled`)}</h1>
                                </div>
                            </div>
                        </div> : Object.keys(ORDER_STATUS).map((item, index) => {
                            let isStatusUpdated = 0
                            if (orderStatus > -1) {
                                isStatusUpdated = index <= orderStatus
                            }
                            let status = ORDER_STATUS[item]?.toLowerCase()
                            if (item == ORDER_STATUS["CANCELLED"]) {
                                return
                            }
                            return (
                                <div key={index} >
                                    <div className={`d-flex`} >
                                        <div>
                                            <div className={`d-flex justify-content-center align-items-center rounded-3 order-status ${isStatusUpdated ? 'order-status-updated' : 'border order-status-notupadted'}`}>
                                                <img src={isStatusUpdated ? Check : Uncheck} />

                                            </div>
                                            {status != "delivered" && <img src={Line} height={40} width={50} />}
                                        </div>
                                        <div className="ms-3 order-status-text " >
                                            <h1 className="bold-fw xl-fs m-0">{t(`orderStatus.${status}`)}</h1>
                                            <h1 className="m-fs normal-fw mt-1">{t(`orderStatus.orderStatusText.${status}`)}</h1>
                                            {(item == ORDER_STATUS["PREPARED"] && order?.orderStatus !== ORDER_STATUS["DELIVERED"] && isStatusUpdated) && <div className="d-flex">
                                                <p className="timer normal-fw me-2"><span className="bold-fw">{time?.hours}</span> {t(`orderStatus.hr`)} <span className="bold-fw">{time?.minutes} </span>{t(`orderStatus.min`)} <span className="bold-fw">{time?.remainingSeconds}</span> {t(`orderStatus.sec`)}</p>
                                                <img onClick={onClickShowWarning} className="cursor-pointer" src={Exclamation} />
                                            </div>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <p className="xxl-fs bold-fw">{t('orderStatus.orderDetails')}</p>
                <div className="cart-items location mt-2">
                    {order?.items?.map((item, index) => {
                        let { titles, total } = item?.addons?.reduce((acc, addon) => {
                            const optionNames = addon.options.reduce((names, option) => {
                                const matchedFood = menu?.food?.find(food => food._id === option.foodId);
                                if (matchedFood) {
                                    names.push(matchedFood.name);
                                }
                                return names;
                            }, []);

                            if (optionNames.length > 0) {
                                acc.titles += (acc.titles ? ", " : "") + optionNames.join(", ");
                            }

                            const addonPrice = addon.options.reduce((sum, option) => sum + option.price, 0);
                            acc.total += addonPrice;

                            return acc;
                        }, { titles: "", total: 0 });

                        total += item?.variation?.price

                        return (
                            <div key={index} className={`d-flex justify-content-between align-items-center  ${index !== 0 ? 'mt-2' : 'mt-0'}`}>
                                <div className=" d-flex flex-column justify-content-between w-75 " >
                                    <h1 className="m-0 p-0 text-ellipsis semiBold-fw m-fs">{item?.title}</h1>
                                    <p className="m-0 p-0 normal-fw m-fs ">{titles}</p>
                                </div>
                                <div className="d-flex flex-column justify-content-between ">
                                    {/* <h1 className="m-0 p-0 text-nowrap s-fs discount-price">{symbol} {item?.discountPrice}</h1> */}
                                    <h1 className="m-0 p-0 text-nowrap s-fs">{symbol} {formatToGermanNumber(item?.quantity * total)}</h1>
                                </div>
                            </div>
                        )
                    })}

                    <div className=" mt-3 border-top pt-3 position-relative">
                        {Object.keys(details).map((item, ind) => {
                            return (
                                <div className=" d-flex justify-content-between mb-2" key={ind}>
                                    <p className="normal-fw m-fs text-nowrap">{t(`checkout.${item}`)}</p>
                                    <p className={`normal-fw m-fs text-nowrap ${item == "extraDiscount" ? 'text-success' : 'text-black'}`}> {symbol} {formatToGermanNumber(details[item])}</p>
                                </div>
                            )
                        })}
                        <div className="d-flex justify-content-between border-top pt-2">
                            <p className="normal-fw l-fs">{t(`checkout.toPay`)}</p>
                            <p className="normal-fw m-fs">{symbol} {formatToGermanNumber(order?.orderAmount)}</p>
                        </div>
                        {/* <div className="position-absolute" style={{ bottom: 100, right: 50 }}>
                            <img src={Paid} />
                        </div> */}
                    </div>

                </div>
            </div>
            {showWarning && <div onClick={onClickClose} className="position-fixed warning-data d-flex justify-content-center align-items-center" >
                <div className="bg-white p-3 rounded-3" style={{ width: '90%' }} >
                    <h1 className="normal-fw l-fs">{t('orderStatus.warningText1')}</h1>
                    <h1 className="normal-fw l-fs mt-3">{t('orderStatus.warningText2')}</h1>
                    <button onClick={onClickClose} className="border-0 rounded-3 w-100 py-2 mt-2 secondary-bgcolor semiBold-fw">{t('orderStatus.okButton')}</button>
                </div>
            </div>}
        </div >
    )
}
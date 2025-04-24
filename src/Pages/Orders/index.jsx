import React, { useContext, useEffect, useState } from 'react';
import "./style.css"
import { Rating } from 'react-simple-star-rating'
import Close from '../../assets/svg/close.svg'
import Tick from '../../assets/svg/tickCircle.svg'
import Add from '../../assets/svg/add.svg'
import Offer from '../../assets/svg/offer.svg'
import PageTitle from '../../Components/PageTitle';
import { useTranslation } from 'react-i18next';
import { LOCALSTORAGE_NAME, ORDER_STATUS } from '../../constants/enums';
import moment from 'moment';
import { routeName } from '../../Router/RouteName';
import { useNavigate } from 'react-router-dom';
import UserContext from '../../Context/User'
import Loader from '../../Components/Loader/Loader';
import { Context } from '../../Context/Context';
import { prefetchImages } from '../../Utils';

const Orders = () => {
    const { t } = useTranslation();
    const windowHeight = window.innerHeight;
    const navigate = useNavigate();
    const [rating, setRating] = useState(0)
    const [orderData, setOrderData] = useState([])
    // const [selectedFilters, setSelectedFilters] = useState([]);
    const { loadingOrders, errorOrders, orders, clearCart } = useContext(UserContext);
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])
    useEffect(() => {
        prefetchImages(orders.map(r => r.restaurant.image).filter(Boolean))
            .catch(error => {
                console.error('Error prefetching images:', error);
            });
        if (orders && orders?.length > 0) {
            setOrderData(orders)
        }
    }, [orders])

    const handleRating = (e, el) => {
        e.stopPropagation();
        if (el?.review && el?.review?.rating) return;
        localStorage.setItem(LOCALSTORAGE_NAME.RATING_ID, JSON.stringify({
            orderId: el?._id,
            restaurantName: el?.restaurant?.name
        }));
        navigate(routeName.RATINGS);
    }

    // Determining the header color based on order status
    const handleHeadColor = (val) => {
        if (val == ORDER_STATUS.ACCEPTED) {
            return "#DFF3DF"
        } else if (val == ORDER_STATUS.DELIVERED) {
            return "#EDEDED"
        } else if (val == ORDER_STATUS.CANCELLED) {
            return "#FFE8D7"
        } else {
            return "#DFF3DF"
        }
    }

    const navigateToSingleRestaurant = (data) => {
        localStorage.setItem(LOCALSTORAGE_NAME.ORDER_STATUS_ID, data._id);
        navigate(routeName.ORDERSTATUS);
    };

    // const handleFilterSelection = (filter) => {
    //     setSelectedFilters(prev => {
    //         if (prev.includes(filter)) {
    //             return prev.filter(item => item !== filter);
    //         }
    //         return [...prev, filter];
    //     });
    // }

    if (loadingOrders) {
        return <Loader />;
    }

    if (!orderData || orderData?.length === 0) {
        return <div className='noData'><p className='m-fs bold-fw placeholder-text'>{t('common.noData')}</p></div>;
    }

    return (
        <div className="orders">
            <PageTitle title={t("screenTitle.orderHistory")} />
            {/* <div className='d-flex align-items-center overflow-auto hide-scroll-bar pd-horizontal mt-4'>
                {filters.map((el, i) => {
                    return (
                        <div key={i} className='filter-pill d-flex align-items-center justify-content-center px-3 py-1 me-2' onClick={() => handleFilterSelection(el)} style={{ borderColor: selectedFilters.includes(el) && "#000" }}>
                            <p className='m-fs normal-fw black-text text-nowrap'>{el}</p>
                            {selectedFilters.includes(el) && <img className="close ms-1" src={Close} alt="crying" />}
                        </div>
                    )
                })}
            </div> */}
            <div className='pd-horizontal'>
                {orderData?.length > 0 && orderData?.map((el, i) => {
                    return (
                        <div key={i} className='order-card mt-4' onClick={() => navigateToSingleRestaurant(el)}>
                            <div className='order-head pd-horizontal' style={{ backgroundColor: handleHeadColor(el?.orderStatus) }}>
                                <div className='d-flex align-items-center'>
                                    <div className='p-1 icon-bg'>
                                        <img className='icon-size' src={Tick} alt="tick" />
                                    </div>
                                    <p className='l-fs normal-fw black-text ms-2 text-capitalize'>{t("orders.order")} {el?.orderStatus}</p>
                                </div>
                                <p className='m-fs normal-fw black-text ms-2'>{moment(el?.orderDate).format("DD MMM YYYY")}</p>
                            </div>
                            <div className='d-flex justify-content-between py-3 pd-horizontal ps-2'>
                                <img className='image' src={el?.restaurant?.image} alt="img" />
                                <div className='order-content'>
                                    <p className='l-fs bold-fw black-text text-ellipsis mb-2'>{t("orders.ref")} {el?.orderId}</p>
                                    <p className='l-fs bold-fw placeholder-text text-ellipsis'>{el?.restaurant?.name}</p>
                                    <p className='m-fs normal-fw placeholder-text mb-2'>{el?.deliveryAddress?.deliveryAddress}</p>
                                    {false && <div className='d-flex align-items-center my-2'>
                                        <img className='icon-size' src={Offer} alt="offer" />
                                        <p className='m-fs semiBold-fw tertiary-color ms-1 text-ellipsis'>{t("orders.youSaved")}  20 {t("orders.onThisOrder")}</p>
                                    </div>}
                                    {/* <div className='d-flex justify-content-between mb-2'>
                                        <div style={{ width: "80%" }}>
                                            {el?.items && el?.items?.map((item, index) => {
                                                return (
                                                    <p key={index} className='m-fs normal-fw black-text'>{item?.title} x {item?.quantity}  ${item?.variation?.price}</p>
                                                )
                                            })}
                                        </div>
                                        <img className='add-icon' src={Add} alt="add" />
                                    </div> */}
                                    <div className='mb-1'>
                                        {el?.items && el?.items?.map((item, index) => {
                                            return (
                                                <p key={index} className='m-fs normal-fw black-text'>{item?.title} x {item?.quantity}  {symbol}{item?.variation?.price}</p>
                                            )
                                        })}
                                    </div>
                                    <p className='m-fs semiBold-fw black-text'>{t("orders.total")}: {symbol}{el?.orderAmount}</p>
                                    {el?.orderStatus == ORDER_STATUS.DELIVERED &&
                                        <div className='mt-2' onClick={(e) => handleRating(e, el)}>
                                            <Rating
                                                readonly={true}
                                                initialValue={el?.review ? el?.review?.rating : 0}
                                                size={38}
                                                fillColor='#FFCB45'
                                                emptyColor='#E5E7EB'
                                                allowFraction={true}
                                            />
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div style={{ height: windowHeight * 0.08 }} />
        </div>
    );
};

export default Orders;
import ResturantHeader from "../../Components/RestaurantLevelHeader"
import CheckOutOffer from "../../assets/svg/checkoutoffer.svg"
import "./style.css"
import { useTranslation } from "react-i18next"
import CheckOutIncrement from "../../assets/svg/checkoutincrement.svg"
import CheckOutDecrement from "../../assets/svg/checkoutdecrement.svg"
import ArrowRight from "../../assets/svg/arrowRight.svg"
import { CurrentLocationStorage, formatToGermanNumber } from "../../Utils"
import AddMore from "../../assets/svg/addmore.svg"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { routeName } from "../../Router/RouteName"
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import UserContext from "../../Context/User"
import { Sheet } from "react-modal-sheet"
import Variations from "../../Components/Variations"
import Addons from "../../Components/Addons"
import Increment from "../../assets/svg/increment.svg"
import Decrement from "../../assets/svg/decrement.svg"
import Coupon from "../../assets/svg/offerYellow.svg"
import Tick from "../../assets/svg/tickYellow.svg"
import useRestaurant from "../../hooks/restaurantApi"
import GetTips from "../../hooks/tips"
import { getCampaignsByRestaurant, myOrders, placeOrder } from "../../apollo/server";
import { gql, useMutation, useQuery } from "@apollo/client";
import { LOCALSTORAGE_NAME, MAP_TYPES, OFFERS_TYPE, PAYMENT_METHODS } from "../../constants/enums"
import Loader from "../../Components/Loader/Loader"
import { Context } from "../../Context/Context"
import Spinner from "../../Components/Spinner/Spinner"
import useCartLogic from "../../Hooks/cart"
import CaretRight from "../../assets/svg/caretright.svg"
import OpenStreetMap from "../../Components/OpenStreetMap/OpenStreetMap"
import transformRestaurantData from "../Restaurant/transformRestaurantData"

const CAMPAIGNS = gql`${getCampaignsByRestaurant}`;

export default function Checkout() {
    const checkoutId = localStorage.getItem(LOCALSTORAGE_NAME.CHECKOUT_ID);
    let couponDetail = localStorage.getItem(LOCALSTORAGE_NAME.COUPON_DETAIL);
    couponDetail = JSON.parse(couponDetail);
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [amount, setAmount] = useState({})
    const [customizedBottomSheet, setCustomizedBottomSheet] = useState(false)
    const [step, setStep] = useState(1)
    const { cart, deleteRestaurantFromCart, updateCart } = useContext(UserContext);
    const [checkoutData, setCheckoutData] = useState([])
    const tipsData = GetTips()
    const response = useRestaurant(checkoutId)
    const [selectedTip, setSelectedTip] = useState(0)
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [couponPopupData, setCouponPopupData] = useState(null);
    const [campaignsData, setCampaignsData] = useState([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const ORDERS = gql`${myOrders}`;
    const PLACEORDER = gql`${placeOrder}`;
    const [mutateOrder, { loading: loadingOrderMutation }] = useMutation(
        PLACEORDER,
        {
            onCompleted,
            onError,
            update,
        }
    );
    const [currentLocation, setCurrentLocation] = useState(null);

    const data = useMemo(() => {
        if (!response?.data) return null;
        return transformRestaurantData(response.data, null);
    }, [response?.data]);

    const {
        addFoodToCart,
        onSelectVariation,
        onSelectOption,
        onClickContinue,
        onClickIncrement,
        onClickDecrement,
        onClickShowPopupOrDecrement,
        selectedAddons,
        setSelectedAddons,
        selectedVariation,
        setSelectedVariation,
        updateItemsQuantity,
        setUpdateItemsQuantity,
        addonData,
        setAddonData,
        type,
        editid,
        setEditid,
    } = useCartLogic(data, setCustomizedBottomSheet, setStep, checkoutData);
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    useEffect(() => {
        (async () => {
            const response = await CurrentLocationStorage.getCurrentLocation();
            setCurrentLocation(response)
        })();
    }, []);

    const { loading: campaignsLoading } = useQuery(CAMPAIGNS, {
        variables: {
            restaurantId: data?._id,
        },
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        skip: !data?._id,
        onCompleted: (data) => {
            if (data?.getCampaignsByRestaurant) {
                setCampaignsData(data?.getCampaignsByRestaurant);
            }
        }
    });

    useEffect(() => {
        if (!data || !couponDetail) {
            return;
        }
        if (data?._id != couponDetail?.restaurantId) {
            return localStorage.removeItem(LOCALSTORAGE_NAME.COUPON_DETAIL);
        }
        let campaign = campaignsData?.find(campaign => campaign?._id === couponDetail?.couponId)
        if (!campaign?.minimumOrderValue || !amount?.price) return;
        if (campaign?.minimumOrderValue && amount?.price && amount?.price < campaign?.minimumOrderValue) {
            setCouponPopupData(campaign);
            return setIsPopupVisible(true);
        }
        setSelectedCoupon(campaign);
    }, [data, amount?.price, couponDetail]);

    useEffect(() => {
        if (!data) {
            return
        }
        let newData = cart?.filter(cart => cart?.restaurantId === data?._id)
        if (newData?.length == 0) {
            if (window.handleCustomBack) {
                window.handleCustomBack();
            }
            return
        }
        setCheckoutData(newData)
    }, [cart, data])

    useEffect(() => {
        const { discount, totalPrice, price, quantity } = checkoutData?.reduce((acc, item) => {
            if (!item?.variation) {
                return acc;
            }
            let res = 0
            if (item?.addons?.length > 0) {
                item?.addons?.map(option => {
                    res += option.options?.reduce((acc, item) => {
                        acc += (item.price || 0); return acc
                    }, 0)
                })
            }
            // console.log(item.variation.price, res)
            acc.discount += item.quantity * item.variation.discounted
            acc.totalPrice += item.quantity * (item.variation.discounted + item.variation.price + res)
            acc.price += item.quantity * (item.variation.price + res);
            acc.quantity += item.quantity;
            return acc;
        }, { discount: 0, totalPrice: 0, price: 0, quantity: 0 }) || { totalPrice: 0, price: 0 };
        setAmount({ discount, totalPrice, price, quantity })
    }, [checkoutData]);

    const details = {
        "totalItem": amount?.price,
        "restaurantTip": selectedTip > 0 ? Number((selectedTip / 100) * (amount?.price))?.toFixed(2) : 0,
        "serviceCharges": Number((data?.tax / 100) * (amount?.price))?.toFixed(2),
    }

    if (selectedCoupon && details) {
        let discount = 0;
        if (selectedCoupon?.campaignType == OFFERS_TYPE.FLAT) {
            discount = Number(selectedCoupon?.flatDiscount);
        } else {
            discount = (Number(selectedCoupon?.percentageDiscount) / 100) * Number(details?.totalItem);
        }
        details["extraDiscount"] = discount;
    }

    const extraData = {
        totalItem: amount?.totalPrice,
    }

    const onClickGetDataIncrement = (item) => {
        let findFood = data?.categories?.find(cat => cat?._id == item?.categoryId)
        if (!findFood) {
            return
        }
        findFood = findFood?.foods?.find(food => food?._id == item?._id)
        if (!find) {
            return
        }

        addFoodToCart(findFood, item?.categoryId, item?.customized, item.key)
    }

    const onClickGetDataDecrement = (item) => {
        let find = data?.categories?.find(cat => cat?._id == item?.categoryId)
        if (!find) {
            return
        }
        find = find?.foods?.find(food => food?._id == item?._id)
        if (!find) {
            return
        }
        onClickShowPopupOrDecrement(find, item?.key)
    }

    // const priceCalculation = () => {
    //     return Object.keys(details).reduce((acc, item) => {
    //         acc += Number(details[item])
    //         return acc
    //     }, 0)
    // }

    const priceCalculation = () => {
        return Object.keys(details).reduce((acc, item) => {
            if (item !== "extraDiscount") {
                acc += Number(details[item]);
            }
            return acc;
        }, 0) - (details.extraDiscount ? Number(details.extraDiscount) : 0);
    };

    function transformOrder(cartData) {
        return cartData.map((food) => {
            return {
                food: food._id,
                quantity: food.quantity,
                variation: food.variation.title,
                addons: food.addons
                    ? food.addons.map(({ _id, options }) => ({
                        _id,
                        options: options.map(({ optionId }) => optionId),
                    }))
                    : [],
                specialInstructions: food.specialInstructions,
            };
        });
    }

    const onClickPayment = () => {
        const items = transformOrder(checkoutData);
        mutateOrder({
            variables: {
                restaurant: checkoutId,
                orderInput: items,
                paymentMethod: PAYMENT_METHODS.COD,
                couponCode: selectedCoupon ? selectedCoupon?.couponCode : "",
                tipping: parseFloat(details?.restaurantTip),
                taxationAmount: parseFloat(details?.serviceCharges),
                address: {
                    label: currentLocation?.label || "Current Location",
                    deliveryAddress: currentLocation?.address,
                    // details: location.details,
                    longitude: String(currentLocation?.longitude),
                    latitude: String(currentLocation?.latitude),
                },
                orderDate: new Date(),
                isPickedUp: true,
                deliveryCharges: 0,
                // longitude: 78.55911254882812,
                // latitude: 78.55911254882812,
            },
        });

    }

    function onCompleted(data) {
        if (data && data?.placeOrder?._id) {
            deleteRestaurantFromCart(checkoutId)
            localStorage.setItem(LOCALSTORAGE_NAME.ORDER_STATUS_ID, data?.placeOrder._id);
            localStorage.removeItem(LOCALSTORAGE_NAME.COUPON_DETAIL)
            navigate(routeName.ORDERSTATUS);
        }
    }

    function update(cache, { data: { placeOrder } }) {
        // console.log(placeOrder, "placeOrder")
        if (placeOrder && placeOrder.paymentMethod === "COD") {
            const data = cache.readQuery({ query: ORDERS });
            if (data) {
                cache.writeQuery({
                    query: ORDERS,
                    data: { orders: [placeOrder, ...data.orders] },
                });
            }
        }
    }

    function onError(error) {
        console.log("Check-out Error", error);
    }

    const onClickViewDirections = () => {
        let cords = {
            user_lat: Number(currentLocation?.latitude),
            user_lng: Number(currentLocation?.longitude),
            rest_lat: Number(data?.location?.coordinates[1]),
            rest_lng: Number(data?.location?.coordinates[0])
        }
        let url = `https://www.google.com/maps/dir/?api=1&origin=${cords?.user_lat},${cords?.user_lng}&destination=${cords?.rest_lat},${cords?.rest_lng}`
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            webApp.openLink(url, { try_instant_view: false });
        } else {
            window.open(url, '_blank');
        }
    }

    const onClickEdit = (key, quantity) => {
        setUpdateItemsQuantity([])
        setEditid({ key, quantity })

    }
    const onClickContinueToNextStep = () => {
        if (selectedVariation?.addons?.length == 0) {
            return onClickContinue()
        }
        setStep(2)
    }

    const handleClosePopup = () => {
        localStorage.removeItem(LOCALSTORAGE_NAME.COUPON_DETAIL);
        setSelectedCoupon(null);
        setIsPopupVisible(false)
    };

    const handleBack = () => {
        if (window.handleCustomBack) {
            window.handleCustomBack();
        }
    };

    if (response?.loading) {
        return <Loader />
    }

    return (
        <div style={{ paddingBottom: 90 }}>
            <ResturantHeader data={data} />
            {(currentLocation && data?.location?.coordinates?.length > 0) && <OpenStreetMap
                type={MAP_TYPES.CHECKOUT}
                bounds={[{
                    coords: {
                        lat: Number(currentLocation?.latitude),
                        lng: Number(currentLocation?.longitude),
                    }, isUser: true
                }, {
                    coords: {
                        lat: Number(data?.location?.coordinates[1]),
                        lng: Number(data?.location?.coordinates[0])
                    },
                    isUser: false,
                    distanceInMeters: data?.distanceInMeters || 0
                }]}
                height={200} />}
            <div className="pd-horizontal py-4">
                {amount?.discount > 0 && <div className="d-flex align-items-center offer rounded-3 mb-4 ">
                    <img src={CheckOutOffer} />
                    <p className="ms-2 offer-text semiBold-fw">{symbol} {formatToGermanNumber(amount?.discount)} {t('checkout.saved')}<span className="semiBold-fw m-fs"> {t('checkout.orderText')}</span></p>
                </div>}
                <div className="location pd-horizontal mb-4 d-flex justify-content-between align-items-center">
                    <div className="w-50">
                        <h1 className="normal-fw l-fs pick-up-location p-0 m-0">{t('checkout.pikcUpLocation')}</h1>
                        <h1 className="restaurant-name bold-fw xl-fs mt-2 m-0 p-0 text-ellipsis">{data?.name}</h1>
                        <h1 className="address s-fs normal-fw m-0 p-0 text-ellipsis">{data?.address}</h1>
                    </div>
                    <button className="secondary-bgcolor border-0 rounded-3 p-2 semiBold-fw view-directions-button" onClick={onClickViewDirections}>{t("checkout.viewDirections")}</button>
                </div>
                <div className="cart-items location my-4 ">
                    {checkoutData?.map((item, index) => {
                        let { titles, total } = item?.addons?.reduce((acc, addon, index, array) => {
                            const optionTitles = addon.options.map(option => option.title).join(",");
                            acc.titles += optionTitles + (index < array.length - 1 ? ", " : "");
                            const addonPrice = addon.options.reduce((sum, option) => sum + option.price, 0);
                            acc.total += addonPrice;
                            return acc;
                        }, { titles: "", total: 0 });

                        total += item?.variation?.price
                        return (
                            <div key={index} style={{ flex: 1 }} className={`row align-items-center m-0 ${index !== 0 ? 'mt-2' : 'mt-0'}`}>
                                <div className="col-4 m-0 p-0" >
                                    <h1 className="m-0 p-0 text-ellipsis semiBold-fw m-fs w-100 " style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}>{item?.foodtitle}</h1>
                                    <p className="d-flex flex-wrap s-fs w-100" style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}>
                                        <p>{item?.variation?.title}{titles && ','}</p>
                                        {titles && <p className="text-wrap">{titles} </p>}
                                    </p>
                                </div>
                                {/* {item?.customized ? <h1 className="m-0 p-0 semiBold-fw m-fs customized">{t("checkout.customized")}<img className="ms-1" height={8} src={CaretDown} /></h1> : null} */}
                                {/* </div> */}
                                <div className="col-5">
                                    <div className=" mx-2 d-flex checkout-item-btn align-items-center justify-content-between w-100 rounded-3" >
                                        <img onClick={() => onClickGetDataDecrement(item)} src={CheckOutDecrement} className="pe-4 " />
                                        <p className="m-fs semiBold-fw count">{item?.quantity}</p>
                                        <img onClick={() => onClickGetDataIncrement(item)} src={CheckOutIncrement} className="ps-4 " />
                                    </div>
                                </div>
                                <div className="d-flex p-0 flex-column justify-content-center  col-3 align-items-end" >
                                    {item?.variation?.discounted > 0 ? <h1 className="m-0 p-0 text-nowrap s-fs discount-price">{symbol} {formatToGermanNumber(Number(item?.quantity * (item?.variation?.discounted + total)).toFixed(2))}</h1> : null}
                                    <h1 className="m-0 p-0 text-nowrap s-fs">{symbol} {formatToGermanNumber(Number(item?.quantity * total)?.toFixed(2))}</h1>
                                </div>
                            </div>
                        )
                    })}
                    <div onClick={handleBack} className="d-flex justify-content-between border-top align-items-center mt-3 pt-3">
                        <p className="normal-fw l-fs">{t("checkout.addMoreItems")}</p>
                        <img src={AddMore} />
                    </div>
                    {/* <div className="d-flex flex-column justify-content-between border-top mt-3 pt-3">
                        <p className="normal-fw l-fs">{t("checkout.addCookingRequests")}</p>
                        <img src={AddMore} />
                        <div className="mt-2">
                            <textarea placeholder="Add your requests here ..." onChange={(e) => onChangeCookingRequest(e?.target?.value)} className="border-0 p-2" style={{
                                width: '100%', resize: 'none'
                            }} rows="3"></textarea>
                        </div>
                    </div> */}

                </div>
                <div key={selectedCoupon} className="mb-4">
                    <p className="bold-fw xl-fs">{t("checkout.offersAndBenefits")}</p>
                    {selectedCoupon ? <div key={selectedCoupon} className="border rounded-3 my-3 p-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                                <img width={32} height={32} src={Coupon} />
                                <p className="bold-fw xl-fs black-text ms-2">{t("checkout.coupons")}</p>
                            </div>
                            <div className="d-flex align-items-center">
                                <img className="icon-size" src={Tick} />
                                <p className="semiBold-fw m-fs ms-1" style={{ color: "#CCAD11" }}>{t("checkout.applied")}</p>
                            </div>
                        </div>
                        <p className="normal-fw m-fs black-text my-2">{selectedCoupon?.couponCode} {t("checkout.appliedCouponSentenceContinuation1")} {selectedCoupon?.campaignType == OFFERS_TYPE.FLAT ? `${formatToGermanNumber(selectedCoupon?.flatDiscount)} ${symbol}` : `${selectedCoupon?.percentageDiscount} %`} {t("checkout.appliedCouponSentenceContinuation2")}.</p>
                        <div className="d-inline-flex align-items-center" onClick={() => navigate(routeName.COUPONS)}>
                            <p className="semiBold-fw l-fs black-text">{t("checkout.viewAll")}</p>
                            <img width={12} height={12} className="ms-1" src={ArrowRight} />
                        </div>
                    </div> :
                        <div className="d-flex justify-content-between border rounded-3 align-items-center my-3 p-3" onClick={() => navigate(routeName.COUPONS)}>
                            <p className="normal-fw l-fs">{t("checkout.applyCoupon")}</p>
                            <img src={AddMore} />
                        </div>}
                </div>
                <div >
                    <p className="bold-fw xl-fs">{t("checkout.sayThanksWithTips")}</p>
                    <div className="p-3 border rounded-3 mt-3">
                        <p className="m-fs semiBold-fw tips-content">{t("checkout.tipsContent")}</p>
                        <div className="d-flex justify-content-between mt-3">
                            {tipsData ? tipsData?.data?.tips?.tipVariations.map((item, ind) => {
                                return (
                                    <div onClick={() => {
                                        setSelectedTip(prev => (item == prev ? 0 : item))
                                    }} style={{ background: item == selectedTip ? 'rgba(237, 204, 39, 0.5)' : 'transparent', width: '30%', height: 60, borderRadius: 12 }} className="border flex-column position-relative d-flex justify-content-center align-items-center" key={ind}>
                                        <p className="semiBold-fw l-fs ">{item} %</p>
                                        {/* {item?.isMostTipped ? <div className="position-absolute w-100 secondary-bgcolor" style={{ bottom: 0, borderBottomLeftRadius: 11, borderBottomRightRadius: 11 }}>
                                            <p className="semiBold-fw s-fs text-center ">{t("checkout.mostTipped")}</p>
                                        </div> : null} */}
                                    </div>
                                )
                            }) : null}
                        </div>
                    </div>
                </div>
                <div className="my-3">
                    <p className="bold-fw xl-fs">{t("checkout.paymentDetails")}</p>
                    <div className=" mt-3 border rounded-3 p-3">
                        {Object.keys(details).map((item, ind) => {
                            return (
                                <div className=" d-flex justify-content-between mb-2" key={ind}>
                                    <p className="normal-fw m-fs text-nowrap">{t(`checkout.${item}`)}</p>
                                    <p className={`m-fs text-nowrap ${item == "extraDiscount" ? 'extra-text' : 'text-black'}`}>{extraData[item] > details[item] && <span className="extra-data">{symbol} {formatToGermanNumber(Number(extraData[item])?.toFixed(2))}</span>} {symbol} {formatToGermanNumber(Number(details[item])?.toFixed(2))}</p>
                                </div>
                            )
                        })}
                        <div className="d-flex justify-content-between border-top pt-2">
                            <p className="normal-fw l-fs">{t(`checkout.toPay`)}</p>
                            <p className="normal-fw m-fs">{symbol} {formatToGermanNumber(Number(priceCalculation())?.toFixed(2))}</p>
                        </div>
                    </div>
                </div>
                <div className="position-fixed pd-horizontal order-bottom-sheet bg-white py-3">
                    <p className="text-center">{t("checkout.total")} {symbol} {formatToGermanNumber(Number(priceCalculation())?.toFixed(2))}</p>
                    <button disabled={loadingOrderMutation} onClick={onClickPayment} className=" l-fs mt-2 border-0 w-100 py-3 rounded-4 secondary-bgcolor">
                        {!loadingOrderMutation ? <h1 className="semiBold-fw l-fs m-0 p-0">{t("checkout.placeOrder")}</h1> : <Spinner color="white" size={18} />}
                    </button>
                </div>
            </div>
            <Sheet key={step} detent="content-height" isOpen={customizedBottomSheet} onClose={() => {
                setSelectedVariation(null)
                setAddonData(null)
                setSelectedAddons([])
                setCustomizedBottomSheet(false)
                setUpdateItemsQuantity([])
                setStep(1)
            }}>
                <Sheet.Container >
                    <Sheet.Content
                        key={step}
                        className="pd-horizontal py-3"
                        style={{
                            maxHeight: '90vh',
                        }}>

                        <div className="border-1 pb-2 border-bottom">
                            <p className="xl-fs bold-fw">{t('checkout.stepProgress', { step: step })}</p>

                        </div>
                        <div className="pt-2">
                            <h1 className="xxl-fs bold-fw m-0">{t('restaurant.customizeAsPerYourTaste')}</h1>
                            {/* <h1 className="bottom-sheet-restaurant-name mt-1  l-fs">{data?.name}</h1> */}
                            {updateItemsQuantity?.length > 0 ?
                                <>
                                    {updateItemsQuantity?.map((item, index) => {
                                        const { titles, total } = item?.addons?.reduce((acc, addon) => {
                                            const optionTitles = addon.options.map(option => option.title).join(", ");
                                            acc.titles += optionTitles + " ";
                                            const addonPrice = addon.options.reduce((sum, option) => sum + option.price, 0);
                                            acc.total += addonPrice;
                                            return acc;
                                        }, { titles: "", total: 0 });
                                        return (
                                            <div key={index} className="d-flex align-items-center justify-content-between mt-3" >
                                                <div className="pe-3 w-50">
                                                    <p className="semiBold-fw m-fs tetxt-nowrap text-ellipsis"> {item?.name}</p>
                                                    <div className="d-flex s-fs flex-wrap">
                                                        <p>{item?.variation?.title}{titles && ','}</p>
                                                        {titles && <p className="text-wrap"> {titles} </p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center justify-content-end me-3">
                                                        <p onClick={() => onClickEdit(item?.key, item.quantity)} className="m-fs m-0 p-0 me-1 semiBold-fw text-end">{t('checkout.edit')}</p>
                                                        <img src={CaretRight} height={10} />
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between" >
                                                        <p className="text-nowrap me-2 m-fs semiBold-fw">{symbol} {formatToGermanNumber(Number(item?.quantity * (item?.variation?.price + total))?.toFixed(2))}</p>
                                                        <div className="add-btn text-black d-flex justify-content-between rounded-3  py-1 bg-white tertiary-color m-fs bold-fw">
                                                            <img onClick={() => onClickDecrement(item, index)} src={Decrement} alt="decrement" className='px-2' />
                                                            <p>{item?.quantity}</p>
                                                            <img onClick={() => onClickIncrement(item, index)} src={Increment} alt="increment" className='px-2' />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {type == "inc" ? <div className="d-flex align-items-center justify-content-center mt-3" >
                                        <p onClick={() => { setUpdateItemsQuantity([]); setEditid('') }} className="secondary-color semiBold-fw l-fs">{t('checkout.addMoreItems')}</p>
                                    </div> : null}
                                </>
                                : step == 1 ?
                                    <Variations
                                        data={addonData}
                                        setSelectedVariation={setSelectedVariation}
                                        selectedVariation={selectedVariation}
                                        onSelectVariation={(data, id, qty) => onSelectVariation(data, id, qty)}
                                        onClickContinue={() => onClickContinueToNextStep()}
                                        setSelectedAddons={setSelectedAddons}
                                        editid={editid}
                                        setEditid={setEditid}
                                    /> :
                                    <Sheet.Scroller style={{ maxHeight: '70vh' }}>

                                        <Addons
                                            step={step}
                                            data={addonData}
                                            selectedVariation={selectedVariation}
                                            setSelectedVariation={setSelectedVariation}
                                            setSelectedAddons={setSelectedAddons}
                                            selectedAddons={selectedAddons}
                                            setStep={setStep}
                                            onSelectOption={(addon, option) => onSelectOption(addon, option)}
                                            onClickContinue={onClickContinue}
                                            editid={editid}
                                            setEditid={setEditid}
                                        />
                                    </Sheet.Scroller>
                            }
                        </div>

                    </Sheet.Content>
                </Sheet.Container>
                <Sheet.Backdrop
                    onTap={() => {
                        setSelectedVariation(null)
                        setAddonData(null)
                        setSelectedAddons([])
                        setCustomizedBottomSheet(false)
                        setUpdateItemsQuantity([])
                        setStep(1)
                    }}
                    style={{
                        zindex: 100,
                        position: "absolute",
                    }}
                />
            </Sheet>
            {isPopupVisible && (
                <div className="checkout-popup-bg" onClick={() => handleClosePopup()}>
                    <div className="checkout-popup-container" onClick={e => e.stopPropagation()}>
                        <p className="xl-fs semiBold-fw black-text">{t('checkout.couponAlert')}</p>
                        <p className="m-fs normal-fw black-text mt-2">
                            {t('checkout.couponMessage1')} {formatToGermanNumber(couponPopupData?.minimumOrderValue)} {symbol}. {t('checkout.couponMessage2')}.
                        </p>
                        <div className="d-flex align-items-center justify-content-between mt-4">
                            <div className='btn-cancel' style={{ width: "100%" }} onClick={() => handleClosePopup()}>
                                <p className='l-fs semiBold-fw black-text'>{t('checkout.ok')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

    )
}
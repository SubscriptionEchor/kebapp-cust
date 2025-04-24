import { useTranslation } from "react-i18next"
import AddButton from "../Buttons"
import './style.css'
import React, { useContext, useEffect, useState } from 'react';
import UserContext from "../../Context/User";
import DishPlaceholder from "../../assets/PNG/dishPlaceholder.webp"
import { LOCALSTORAGE_NAME } from "../../constants/enums";
import Info from "../../assets/svg/Info.svg"
import { formatToGermanNumber } from "../../Utils";

export default function ItemLevelVerticalCard({ onClickDecrement, data, onClick, onViewInfo }) {
    const { t } = useTranslation()
    const { cart, cartCount } = useContext(UserContext)
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    return (
        <div>
            {data?.categories?.length > 0 && data?.categories?.map((category, i) => {
                let showItems = category?.foods?.length > 0
                return (
                    <div id={category?._id} key={i} style={{ display: showItems ? "block" : "none", background: i % 2 == 0 ? 'white' : 'rgba(239, 239, 239, 1)' }} className="pd-horizontal py-3 bold-fw xxl-fs">
                        <p>{category?.title}</p>
                        {category?.foods.map((food, index) => {
                            let quantity = 0
                            if (cart?.length > 0) {
                                quantity = cart?.reduce((acc, item) => {
                                    if (item?._id == food?._id) {
                                        return acc + item?.quantity
                                    }
                                    return acc
                                }, 0)
                            }
                            let isCustomized = food?.variations?.length > 1 || food?.variations[0]?.addons?.length > 0
                            if (food?.isActive && !food?.isActive) {
                                return
                            }
                            let foodDetails = {
                                _id: food?._id,
                                title: food?.title,
                                description: food?.description,
                                image: food?.image || DishPlaceholder,
                                allergenData: food?.allergen || []
                            };

                            return (
                                <div className="vertical-item-card pt-3 d-flex" key={index} style={{ opacity: (data?.isAvailable && food?.isActive) ? 1 : 0.5 }}>
                                    {/* <img className="rounded-4 vertical-item-card-image"
                                        src={food?.image || DishPlaceholder} alt="item image" /> */}
                                    <div style={{
                                        height: "170px",
                                        width: "140px",
                                        borderRadius: "12px",
                                        background: `url(${food?.image || DishPlaceholder})`,
                                        backgroundPosition: "center",
                                        backgroundSize: "cover",
                                        backgroundRepeat: "no-repeat",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}>
                                        {food?.outOfStock && <div style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: "linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7))",  // White overlay
                                            // background: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))",  // Dark overlay
                                        }} />}

                                        {food?.outOfStock && <div className="vertical-item-card-text py-1">
                                            <p className="normal-fw m-fs text-black text-center">Out of stock</p>
                                        </div>}
                                    </div>
                                    <div className="py-2 ps-3 vertical-item-card-content">
                                        <p className="xl-fs bold-fw text-nowrap text-ellipsis">{food?.title}</p>
                                        <p className="normal-fw  mt-1  s-fs vertical-item-card-description">{food?.description}</p>
                                        <div className="d-flex align-items-center justify-content-between mt-2">
                                            <p className="normal-fw l-fs primary-color vertical-item-card-price">{symbol} {formatToGermanNumber(food?.variations[0]?.price)}{food?.variations[0]?.discounted > 0 ? <span className="vertical-item-card-total-price ms-2 m-fs">{symbol} {formatToGermanNumber(food?.variations[0]?.price + food?.variations[0]?.discounted)}</span> : null}</p>
                                            <span className="i-icon" style={{ backgroundColor: i % 2 == 0 ? "#EFEFEF" : "#FFF" }} onClick={() => onViewInfo(foodDetails)}>
                                                <img width={22} height={22} src={Info} alt="i" />
                                            </span>
                                        </div>
                                        {isCustomized && <p className="s-fs normal-fw mt-1">{t("customize")}</p>}
                                        <div >
                                            <AddButton
                                                onClickDecrement={() => { (data?.isAvailable && food?.isActive && !food?.outOfStock) && onClickDecrement(food) }}
                                                quantity={quantity}
                                                onClick={() => { (data?.isAvailable && food?.isActive && !food?.outOfStock) && onClick(food, category?._id, isCustomized) }} />
                                        </div>

                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}
import { useTranslation } from "react-i18next"
import AddButton from "../Buttons"
import "./style.css"
import { useContext, useEffect, useState } from "react"
import React from 'react';
import UserContext from "../../Context/User"
import DishPlaceholder from "../../assets/PNG/dishPlaceholder.webp"
import { LOCALSTORAGE_NAME } from "../../constants/enums"
import { formatToGermanNumber } from "../../Utils";

export default function ItemLevelHorizontalCard({ data, onClick, onClickDecrement }) {
    const { t } = useTranslation()
    const { cart } = useContext(UserContext)
    const [symbol, setSymbol] = useState('');

    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    const handleCardClick = (e, food, categoryId, isCustomized) => {
        // Only trigger if click is not on the AddButton
        if (!e.target.closest('.add-button-container')) {
            (data?.isAvailable && food?.isActive && !food?.outOfStock) && onClick(food, categoryId, isCustomized);
        }
    };

    return (
        <div className="">
            {data?.categories?.length > 0 && data?.categories?.map((category, index) => {
                return (
                    <div key={index} className="pt-4">
                        <h1 className="xxl-fs bold-fw pd-horizontal">{category?.title}</h1>
                        <div className="d-flex overflow-scroll pd-horizontal">
                            {category?.foods?.length > 0 && category?.foods?.map((food, index) => {
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
                                return (
                                    <div
                                        onClick={(e) => handleCardClick(e, food, category?._id, isCustomized)}
                                        key={index}
                                        className="me-3 rounded-4 dish-card position-relative p-3"
                                        style={{
                                            backgroundImage: `linear-gradient(180deg, 
                                        rgba(147, 201, 38, 1) 0%, 
                                        rgba(147, 201, 38, 0.2) 25%, 
                                        rgba(0, 0, 0, 0.2) 70%, 
                                        rgba(0, 0, 0, 1) 100%),
                                        url(${food?.image || DishPlaceholder})`,
                                            opacity: (data?.isAvailable && food?.isActive) ? 1 : 0.5,
                                            overflow: "hidden"
                                        }}
                                    >
                                        {food?.outOfStock && <div style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: "linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7))",  // White overlay
                                            // background: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))",  // Dark overlay
                                        }} />}

                                        {food?.outOfStock && <div className="horizontal-item-card-text py-2">
                                            <p className="normal-fw m-fs text-black text-center">Out of stock</p>
                                        </div>}

                                        <p className="text-nowrap bold-fw text-white text-ellipsis" style={{ width: "90%" }}>{food?.title}</p>
                                        <div className="w-100 d-flex justify-content-between align-items-center">
                                            <div>
                                                {food?.variations[0]?.discounted > 0 &&
                                                    <span className="horizontal-item-card-total-price m-fs">
                                                        {symbol} {formatToGermanNumber(food?.variations[0]?.price + food?.variations[0]?.discounted)}
                                                    </span>
                                                }
                                                <p className="text-nowrap bold-fw text-white normal-fw l-fs">
                                                    {symbol} {formatToGermanNumber(food?.variations[0]?.price)}
                                                </p>
                                            </div>
                                            <div className="add-button-container">
                                                {isCustomized &&
                                                    <p className="s-fs text-center normal-fw mt-1 white-text">
                                                        {t("customize")}
                                                    </p>
                                                }
                                                <AddButton
                                                    onClickDecrement={(e) => {
                                                        e?.stopPropagation();
                                                        if (!(data?.isAvailable && food?.isActive && !food?.outOfStock)) {
                                                            return;
                                                        }
                                                        onClickDecrement(food);
                                                    }}
                                                    quantity={quantity}
                                                    onClick={(e) => {
                                                        e?.stopPropagation();
                                                        (data?.isAvailable && food?.isActive && !food?.outOfStock) && onClick(food, category?._id, isCustomized);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
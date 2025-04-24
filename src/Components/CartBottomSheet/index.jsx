import { useContext, useEffect, useState } from "react";
import CaretRight from "../../assets/svg/caretright.svg"
import './style.css'
import { useNavigate } from "react-router-dom";
import { routeName } from "../../Router/RouteName";
import React from 'react';
import UserContext from "../../Context/User";
import { LOCALSTORAGE_NAME } from "../../constants/enums";
import { useTranslation } from 'react-i18next';

export default function CartBottomSheet({ data }) {
    const { t } = useTranslation();
    const { cart } = useContext(UserContext)
    const [totalQuantity, setTotalQuanity] = useState(0)
    const navigate = useNavigate()
    useEffect(() => {
        if (!data) {
            return
        }
        let newData = cart?.filter(cart => cart?.restaurantId === data?._id)
        if (!newData?.length) {
            setTotalQuanity(0)
            return
        }
        setTotalQuanity(newData?.reduce((acc, curr) => acc + curr.quantity, 0))
    }, [cart, data])

    const handleNavigate = () => {
        localStorage.setItem(LOCALSTORAGE_NAME.CHECKOUT_ID, data?._id)
        navigate(routeName.CHECKOUT, {
            state: {
                id: data?._id,
            }
        });
    };

    return (
        <>
            {totalQuantity > 0 ? <div className="p-4 position-fixed bg-white bottom-sheet-cart" style={{ bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                <div onClick={() => handleNavigate()} className="secondary-bgcolor p-2 rounded-3 d-flex justify-content-between align-items-center">
                    <p className="primary-color l-fs bold-fw"> {totalQuantity} {t('cartBottomSheet.itemsAdded')}</p>
                    <div className="l-fs semiBold-fw m">
                        <p>{t('cartBottomSheet.viewCart')}<img className="ms-2" src={CaretRight} /></p>
                    </div>
                </div>
            </div> : null}
        </>

    )
}
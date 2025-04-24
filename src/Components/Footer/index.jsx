import React, { useEffect } from 'react'
import './style.css'
import Home from '../../assets/svg/house.svg'
import Order from '../../assets/svg/cart.svg'
import Profile from '../../assets/svg/profileBlack.svg'
import Following from '../../assets/svg/heartBlack.svg'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routeName } from '../../Router/RouteName'


const Footer = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const routes = [
        {
            name: `${t("footer.home")}`,
            path: routeName.HOME,
            icon: Home
        },
        {
            name: `${t("footer.following")}`,
            path: routeName.FOLLOWING,
            icon: Following
        },
        // {
        //     name: `${t("footer.orders")}`,
        //     path: routeName.ORDERS,
        //     icon: Order
        // },
        {
            name: `${t("footer.profile")}`,
            path: routeName.PROFILE,
            icon: Profile
        },
    ]

    return (
        <div className='footer px-4'>
            {routes.map((el, i) => {
                return (
                    <div key={i} className='footer-item' onClick={() => navigate(el?.path)}>
                        <img className='icon-size' src={el?.icon} alt="icon" />
                        <p className='bold-fw m-fs placeholder-text' style={{ color: el?.name == `${t("footer.home")}` && "#FAC515" }}>{el?.name}</p>
                    </div>
                )
            })}
        </div >
    )
}

export default Footer
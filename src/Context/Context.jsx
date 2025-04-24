import { createContext, useState } from "react"
import React from 'react';
export const Context = createContext()
export function CommonProvider({ children }) {
    const [userDetails, setUserDetails] = useState(null);
    const [zoneData, setZoneData] = useState([])
    const [identifier, setIdentifier] = useState('')
    const [restId,  setRestId] = useState('')

    return (
        <Context.Provider value={{
            userDetails, setUserDetails,
            zoneData, setZoneData,
            identifier, setIdentifier,
            restId, setRestId
        }}>
            {children}
        </Context.Provider>
    )
}

export const CartContext = createContext()
export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([])
    return (
        <CartContext.Provider value={{
            cartItems, setCartItems
        }}>
            {children}
        </CartContext.Provider>
    )
}
/*
userDetails
{
    "__typename": "User",
        "_id": "671b62dfdc9d599dd69de718",
            "addresses": [
                {
                    "__typename": "Address",
                    "_id": "67262803147fda23a8a9bd78",
                    "deliveryAddress": "5-10, Saraswathi Nagar, Karimnagar, Telangana 505001, India",
                    "details": "Karimnagar",
                    "label": "Red Sea",
                    "location": {
                        "__typename": "Point",
                        "coordinates": [
                            "79.1288412",
                            "18.4385553"
                        ]
                    },
                    "selected": false
                },
                {
                    "__typename": "Address",
                    "_id": "67262888147fda23a8a9bd93",
                    "deliveryAddress": "12-4-32, Himachalnagar, Gajuwaka, Visakhapatnam, Andhra Pradesh 530026, India",
                    "details": "Visakhapatnam",
                    "label": "Ready?",
                    "location": {
                        "__typename": "Point",
                        "coordinates": [
                            "83.2184815",
                            "17.6868159"
                        ]
                    },
                    "selected": true
                }
            ],
                "email": "",
                    "emailIsVerified": false,
                        "favourite": [
                            "6708f43045fee7d3e32e3798",
                            "6725e8a0f1ee0b7a39c0c3f5",
                            "6712488a45fee7d3e3431720",
                            "67176a0045fee7d3e3459eae",
                            "670d5e8d45fee7d3e32e8926"
                        ],
                            "isActive": true,
                                "isOfferNotification": false,
                                    "isOrderNotification": false,
                                        "name": "its_veneno",
                                            "notificationToken": "",
                                                "password": null,
                                                    "phone": "+917339143226",
                                                        "phoneIsVerified": true,
                                                            "updatedAt": "1730553992150",
                                                                "userType": "telegram"
}*/
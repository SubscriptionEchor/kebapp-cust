export const ORDER_STATUS_ENUMS = {
    ORDER_CONFIRMED: 'OrderConfirmed',
    ACCEPTED: "accepted",
    PREPARING: "preparing",
    READY_FOR_PICKUP: "readyForPickup",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}


export const ORDER_STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: "ACCEPTED",
    PREPARED: 'PREPARED',
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
}


export const MAP_TYPES = {
    HOME: 'home',
    RESTAURANT: "restaurant",
    CHECKOUT: "checkout",
    ORDERSTATUS: 'orderStatus',
    LOCATION: 'location'
}

export const PAYMENT_METHODS = {
    COD: "COD",
    STRIPE: "STRIPE",
    PAYPAL: "PAYPAL"
}
export const HOME_API_PARAMETERS = {
    DISTANCE: 40,
    LIMIT: 50,
    POPULAR: "reviewCount",
    FAVORITE: "favoriteCount",
    RECENT: "reviewAverage",
}

export const LOCALSTORAGE_NAME = {
    CHECKOUT_ID: "checkoutId",
    RESTAURANT_ID: "restaurantId",
    ORDER_STATUS_ID: "orderStatus",
    RATING_ID: "ratingId",
    COUPON_DETAIL: "couponDetail",
    CURRENCY_SYMBOL: "currencySymbol",
    ONBOARDING_DATA: "onboardingData",
}

export const TEMPLATE_IDS = {
    ADS: "ads",
    OFFERS: "offers",
}

export const SORTING_FILTER_ENUMS = {
    FILTER: "filter",
    SORT: "sortBy",
    CUISINES: "cuisines",
    RATING: "rating",
    MAP_FILTER: "mapFilter",
    CAMPAIGN: "campaign",
}

export const MAP_CAMPAIGN_TYPE = {
    HAPPYHOURS: "HAPPYHOUR",
    SPECIALDAY: "TODAY",
    CHEFSPECIAL: "CHEF",
}

export const OFFERS_TYPE = {
    FLAT: "FLAT",
    PERCENTAGE: "PERCENTAGE",
}
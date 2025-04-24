import { gql } from '@apollo/client';

export const loginViaTelegram = gql`
  mutation LoginViaTelegram($initData: String!) {
    loginViaTelegram(initData: $initData) {
      addresses {
        deliveryAddress
        location {
          coordinates
        }
      }
      email
      emailIsVerified
      isActive
      isNewUser
      name
      phone
      phoneIsVerified
      picture
      token
      userId
    }
  }
`;

export const sendOtpToPhoneNumber = gql`
mutation SendOtpToPhoneNumber($phone: String!) {
  sendOtpToPhoneNumber(phone: $phone) {
    result
    message
    retryAfter
  }
}
`
export const ValidatePhoneOtp = gql`
mutation ValidatePhoneOtp($validatePhoneOtpOtp2: String!) {
  validatePhoneOtp(otp: $validatePhoneOtpOtp2) {
    message
    result
    retryAfter
  }
}
`
export const sendOtpToEmail = gql`
mutation SendOtpToEmail($email: String!) {
  sendOtpToEmail(email: $email) {
    message
    result
    retryAfter
  }
}
`

export const ValidateEmailOtp = gql`
mutation ValidateEmailOtp($otp: String!) {
  validateEmailOtp(otp: $otp) {
    message
    result
    retryAfter
  }
}
`
export const createAddress = gql`
mutation CreateAddress($addressInput: AddressInput!) {
  createAddress(addressInput: $addressInput) {
    _id
    addresses {
      _id
      deliveryAddress
      details
      label
      location {
        coordinates
      }
      selected
    }
  }
}
`

export const editAddress = gql`mutation EditAddress($addressInput:AddressInput!){
  editAddress(addressInput:$addressInput){
    _id
    addresses{
      _id
      label
      deliveryAddress
      details
      location{coordinates}
      selected
    }
  }
}`;

export const getUserData = gql`
query Profile {
  profile {
    _id
    addresses {
      _id
      deliveryAddress
      details
      label
      location {
        coordinates
      }
      selected
    }
    email
    emailIsVerified
    favourite
    isActive
    isOfferNotification
    isOrderNotification
    name
    notificationToken
    password
    phone
    phoneIsVerified
    updatedAt
    userType
    consentInfo {
      docVersionId
      consentTime
    }
  }
}
`

export const deleteAddress = gql`mutation DeleteAddress($id:ID!){
  deleteAddress(id:$id){
    _id
     addresses{
      _id
      label
      deliveryAddress
      details
      location{coordinates}
    }
  }
}`

export const selectAddress = gql`mutation SelectAddress($id:String!){
  selectAddress(id:$id){
    _id
    addresses{
      _id
      label
      deliveryAddress
      details
      location{coordinates}
      selected
    }
  }
}`;

export const sendChatMessage = `mutation SendChatMessage($orderId: ID!, $messageInput: ChatMessageInput!) {
  sendChatMessage(message: $messageInput, orderId: $orderId) {
    success
    message
    data {
      id
      message
      user {
        id
        name
      }
      createdAt
    }
  }
}
`;
export const login = `
mutation Login($email:String,$password:String,$type:String!,$appleId:String,$name:String,$notificationToken:String){
  login(email:$email,password:$password,type:$type,appleId:$appleId,name:$name,notificationToken:$notificationToken){
   userId
   token
   tokenExpiration
   name
   email
   phone
 }
}
`;

export const emailExist = `
  mutation EmailExist($email:String!){
    emailExist(email:$email){
      _id
    }
  }`;

export const phoneExist = `
mutation PhoneExist($phone:String!){
  phoneExist(phone:$phone){
    _id
  }
}`;

/*export const sendOtpToEmail = `
  mutation SendOtpToEmail($email: String!, $otp: String!) {
    sendOtpToEmail(email: $email, otp: $otp) {
      result
    }
  }
  `;
export const sendOtpToPhoneNumber = `
mutation SendOtpToPhoneNumber($phone: String!, $otp: String!) {
  sendOtpToPhoneNumber(phone: $phone, otp: $otp) {
    result
  }
}
`;*/
export const resetPassword = `mutation ResetPassword($password:String!,$email:String!){
  resetPassword(password:$password,email:$email){
    result
  }
}`;
export const createUser = `
  mutation CreateUser($phone:String,$email:String,$password:String,$name:String,$notificationToken:String,$appleId:String){
      createUser(userInput:{
          phone:$phone,
          email:$email,
          password:$password,
          name:$name,
          notificationToken:$notificationToken,
          appleId:$appleId
      }){
          userId
          token
          tokenExpiration
          name
          email
          phone
      }
    }`;

export const updateUser = `
    mutation UpdateUser($name:String!,$phone:String,$phoneIsVerified:Boolean,$emailIsVerified:Boolean){
        updateUser(updateUserInput:{name:$name,phone:$phone,phoneIsVerified:$phoneIsVerified,emailIsVerified:$emailIsVerified}){
          _id
          name
          phone
          phoneIsVerified
          emailIsVerified
        }
      }`;

export const updateUserName = `
    mutation UpdateUser($name:String!){
        updateUser(updateUserInput:{name:$name}){
          _id
          name
        }
      }`;

export const updateNotificationStatus = `
        mutation UpdateNotificationStatus($offerNotification:Boolean!,$orderNotification:Boolean!){
          updateNotificationStatus(offerNotification:$offerNotification,orderNotification:$orderNotification){
            _id
            notificationToken
            isOrderNotification
            isOfferNotification
          }
        }`;

export const profile = `
        query{
          profile{
            _id
            name
            phone
            phoneIsVerified
            email
            emailIsVerified
            notificationToken
            notificationEnabled
            isOrderNotification
            isOfferNotification
            addresses{
              _id
              label
              deliveryAddress
              details
              location{coordinates}
              selected
            }
            favourite
            consentInfo {
              docVersionId
              consentTime
            }
          }
        }`;

export const order = `query Order($id:String!){
  order(id:$id){
    _id
    orderId
    deliveryAddress{
      location{coordinates}
      deliveryAddress
      details
      label
    }
    items{
      title
      food
      description
      image
      quantity
      variation{
        title
        price
        discounted
      }
      addons{
        title
        options{
          title
          description
          price
        }
      }
    }
    user{
      _id
      name
      email
    }
    paymentMethod
    orderAmount
    orderDate
    expectedTime
    isPickedUp
    preparationTime
  }
}
`;
export const orderPaypal = `query OrderPaypal($id:String!){
  orderPaypal(id:$id){
    _id
    restaurant{
      _id
      name
      image
      slug
      address
      location {
        coordinates
      }
    }
    deliveryAddress{
      location{coordinates}
      deliveryAddress
      details
      label
    }
    deliveryCharges
    orderId
    user{
      _id
      phone
      email
      name
    }
    items{
      _id
      food
      variation{
        _id
        title
        price
      }
      addons{
        _id
        title
        description
        quantityMinimum
        quantityMaximum
        options{
          _id
          title
          description
          price
        }
      }
      quantity
    }
    taxationAmount
    tipping
    paymentStatus
    paymentMethod
    orderAmount
    paidAmount
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    createdAt
    preparationTime
  }
}
`;

export const orderStripe = `query OrderStripe($id:String!){
  orderStripe(id:$id){
    _id
    restaurant{
      _id
      name
      image
      slug
      address
      location {
        coordinates
      }
    }
    deliveryAddress{
      location{coordinates}
      deliveryAddress
      details
      label
    }
    deliveryCharges
    orderId
    user{
      _id
      phone
      email
      name
    }
    items{
      _id
      food
      variation{
        _id
        title
        price
      }
      addons{
        _id
        title
        description
        quantityMinimum
        quantityMaximum
        options{
          _id
          title
          description
          price
        }
      }
      quantity
    }
    taxationAmount
    tipping
    paymentStatus
    paymentMethod
    orderAmount
    paidAmount
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    createdAt
    preparationTime
  }
}
`;

export const orderStatusChanged = `subscription OrderStatusChanged($userId:String!){
  orderStatusChanged(userId:$userId){
    userId
    origin
    order{
      _id
    orderId
    restaurant{
      _id
      name
      image
      slug
      address
      location {
        coordinates
      }
    }
    deliveryAddress{
      location{coordinates}
      deliveryAddress
    }
    items{
      _id
      title
      food
      description
      quantity
      variation{
        _id
        title
        price
        discounted
      }
      addons{
        _id
        options{
          _id
          title
          description
          price
        }
        title
        description
        quantityMinimum
        quantityMaximum
      }
    }
    user{
      _id
      name
      phone
    }
    review{
      _id
    }
    paymentMethod
    paidAmount
    orderAmount
    orderStatus
    deliveryCharges
    tipping
    taxationAmount
    orderDate
    expectedTime
    isPickedUp
    createdAt
    cancelledAt
    assignedAt
    deliveredAt
    acceptedAt
    pickedAt
    preparedAt
    completionTime
    preparationTime
    }
  }
}`;

export const myOrders = `query Orders($offset:Int){
  orders(offset:$offset){
    _id
    orderId
    restaurant{
      _id
      name
      image
      slug
      address
      distanceInMeters
      location {
        coordinates
      }
    }
    deliveryAddress{
      location{coordinates}
      deliveryAddress
    }
    items{
      _id
      title
      food
      description
      quantity
      variation{
        title
        price
        discountedPrice
      }
      addons{
        _id
        options{
          _id
          foodId
          price
        }
        title
        description
        minQty
        maxQty
      }
      specialInstructions
    }
    user{
      _id
      name
      phone
    }
    review{
      _id
      rating
      description
    }
    paymentMethod
    paidAmount
    orderAmount
    orderStatus
    deliveryCharges
    tipping
    taxationAmount
    orderDate
    expectedTime
    isPickedUp
    createdAt
    completionTime
    cancelledAt
    assignedAt
    deliveredAt
    acceptedAt
    pickedAt
    preparedAt
    preparationTime
  }
}
`;

export const placeOrder = `
mutation PlaceOrder($restaurant:String!,$orderInput:[OrderInput!]!,$paymentMethod:String!,$couponCode:String,$tipping:Float!, $taxationAmount: Float!,$address:AddressInput!, $orderDate: String!,$isPickedUp: Boolean!, $deliveryCharges: Float!){
  placeOrder(restaurant:$restaurant,orderInput: $orderInput,paymentMethod:$paymentMethod,couponCode:$couponCode,tipping:$tipping, taxationAmount: $taxationAmount, address:$address, orderDate: $orderDate, isPickedUp: $isPickedUp, deliveryCharges: $deliveryCharges) {
    _id
    orderId
    restaurant{
      _id
      name
      image
      slug
      address
      location{coordinates}
    }
    deliveryAddress{
      location{coordinates}
      deliveryAddress
    }
    items{
      _id
      title
      food
      description
      quantity
      variation{
        title
        price
        discountedPrice
      }
      addons{
        _id
        options{
          _id
          price
        }
        title
        description
        minQty
        maxQty
      }
      specialInstructions
    }
    user{
      _id
      name
      phone
    }
    review{
      _id
    }
    paymentMethod
    paidAmount
    orderAmount
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    deliveryCharges
    tipping
    taxationAmount
    createdAt
    completionTime
    preparationTime
  }
}`;

export const pushToken = `mutation PushToken($token:String){
  pushToken(token:$token){
    _id
    notificationToken
  }
}`;

export const forgotPassword = `mutation ForgotPassword($email:String!, $otp:String!){
  forgotPassword(email:$email,otp:$otp){
    result
  }
}`;

export const toggleFavorite = `mutation ToggleFavorite($toggleFavoriteId: String!) {
  toggleFavorite(id: $toggleFavoriteId) {
    _id
    favourite
    name
    updatedAt
  }
}`;

export const getConfiguration = `query Configuration{
  configuration{
    _id
    currency
    currencySymbol
    deliveryRate
    twilioEnabled
    webClientID
    googleApiKey
    webAmplitudeApiKey
    googleMapLibraries
    googleColor
    webSentryUrl
    publishableKey
    clientId
    skipEmailVerification
    skipMobileVerification
    costType
    vapidKey
  }
}`;

export const getConfigurationSpecific = `query Configuration{
  configuration{
    webAmplitudeApiKey
  }
}`;

export const getCoupon = `mutation Coupon($coupon:String!){
  coupon(coupon:$coupon){
    _id
    title
    discount
    enabled
  }
}`;

/*export const deleteAddress = `mutation DeleteAddress($id:ID!){
  deleteAddress(id:$id){
    _id
    addresses{
      _id
      label
      deliveryAddress
      details
      location{coordinates}
    }
  }
}`;*/
/*
export const createAddress = `mutation CreateAddress($addressInput:AddressInput!){
  createAddress(addressInput:$addressInput){
    _id
    addresses{
      _id
      label
      deliveryAddress
      details
      location{coordinates}
      selected
    }
  }
}`;*/

/*export const editAddress = `mutation EditAddress($addressInput:AddressInput!){
  editAddress(addressInput:$addressInput){
    _id
    addresses{
      _id
      label
      deliveryAddress
      details
      location{coordinates}
      selected
    }
  }
}`;*/

export const changePassword = `mutation ChangePassword($oldPassword:String!,$newPassword:String!){
  changePassword(oldPassword:$oldPassword,newPassword:$newPassword)
}`;

export const restaurantList = `query Restaurants(
  $searchTerm: String,
  $latitude: Float,
  $longitude: Float,
  $limit: Int,
  $distance: Float,
  $sortBy: String,
  $sortOrder: String,
  $rating: Float,
  $cuisines: [String],
  $location: [Float!]!
) {
  nearByRestaurantsNewV2(
    searchTerm: $searchTerm,
    distance: $distance,
    limit: $limit,
    latitude: $latitude,
    longitude: $longitude,
    sortBy: $sortBy,
    sortOrder: $sortOrder,
    rating: $rating,
    cuisines: $cuisines,
    location: $location
  ) {
    offers {
      _id
      name
      tag
      restaurants
      __typename
    }
    sections {
      _id
      name
      restaurants
      __typename
    }
    restaurants {
      _id
      name
      image
      slug
      address
      cuisines
      onboarded
      location {
        coordinates
        __typename
      }
      deliveryTime
      minimumOrder
      reviewData {
        total
        ratings
        reviews {
          _id
          __typename
        }
        __typename
      }
      favoriteCount
      rating
      reviewAverage
      distanceInMeters
      reviewCount
      isAvailable
      openingTimes {
        day
        times {
          startTime
          endTime
          __typename
        }
        isOpen
        __typename
      }
      __typename
    }
    campaigns {
      _id
      restaurant
      name
      description
      couponCode
      campaignType
      promotion
      isActive
      startDate
      endDate
      startTime
      endTime
      percentageDiscount
      flatDiscount
      maxDiscount
      minimumOrderValue
    }
    __typename
  }
}`;

export const restaurant = `query Restaurant($id: String, $slug: String) {
  restaurant(id: $id, slug: $slug) {
    _id
    orderId
    orderPrefix
    cuisines
    name
    image
    slug
    address
    distanceInMeters
    onboarded
    enableNotification
    location {
      coordinates
      __typename
    }
    deliveryTime
    minimumOrder
    tax
    reviewData {
      total
      ratings
      reviews {
        _id
        rating
        description
        createdAt
        __typename
      }
      __typename
    }
    categories {
      _id
      title
      foods {
        _id
        title
        image
        description
        dietaryType
        tags
        variations {
          _id
          title
          price
          discounted
          addons
          __typename
        }
        __typename
      }
      __typename
    }
    options {
      _id
      title
      description
      price
      __typename
    }
    addons {
      _id
      options
      title
      description
      quantityMinimum
      quantityMaximum
      __typename
    }
    zone {
      _id
      title
      tax
      __typename
    }
    rating
    isAvailable
    quickSearchKeywords
    tags
    username
    reviewAverage
    reviewCount
    favoriteCount
    deliveryBounds{
      coordinates
    }
    openingTimes {
      day
      times {
        startTime
        endTime
        __typename
      }
      isOpen
      __typename
    }
    __typename
  }
}
`;

export const singleRestaurant = `query SingleRestaurant($id: String, $slug: String, $restaurantId: ID!) {
  restaurant(id: $id, slug: $slug) {
    _id
    orderId
    orderPrefix
    cuisines
    name
    image
    slug
    address
    distanceInMeters
    onboarded
    enableNotification
    location {
      coordinates
      __typename
    }
    deliveryTime
    minimumOrder
    tax
    reviewData {
      total
      ratings
      reviews {
        _id
        rating
        description
        createdAt
        __typename
      }
      __typename
    }
    rating
    isAvailable
    quickSearchKeywords
    tags
    username
    reviewAverage
    reviewCount
    favoriteCount
    openingTimes {
      day
      times {
        startTime
        endTime
        __typename
      }
      isOpen
      __typename
    }
    __typename
  }
  menu: getMenu(restaurantId: $restaurantId) {
    _id
    restaurantId
    categoryData {
      _id
      name
      active
      foodList
      createdAt
      updatedAt
      __typename
    }
    food {
      _id
      name
      hasVariation
      variationList {
        _id
        type
        title
        optionSetList
        price
        discountedPrice
        outOfStock
        createdAt
        updatedAt
        __typename
      }
      internalName
      dietaryType
      imageData {
        images {
          _id
          url
          type
          createdAt
          updatedAt
          __typename
        }
        createdAt
        updatedAt
        __typename
      }
      active
      outOfStock
      hiddenFromMenu
      allergen
      tags
      createdAt
      updatedAt
      __typename
    }
    optionSetList {
      _id
      title
      minQty
      maxQty
      optionData {
        _id
        foodId
        price
        active
        displayPrice
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}`;


export const reviewOrder = `mutation ReviewOrder(
  $order:String!,
  $rating:Int!,
  $description:String,
){
  reviewOrder(reviewInput:{
    order:$order,
    rating:$rating,
    description:$description,
  }){
    _id
    orderId
  }
}`;

export const subscriptionOrder = `subscription SubscriptionOrder($id:String!){
  subscriptionOrder(id:$id){
      _id
      orderStatus
      completionTime
  }
}`;

export const getTaxation = `query Taxes{
  taxes {
    _id
    taxationCharges
    enabled
    }
  }`;

export const getTipping = `query Tips{
    tips {
      _id
      tipVariations
      enabled
    }
  }`;

export const FavouriteRestaurant = `query UserFavourite ($latitude:Float,$longitude:Float){
    userFavourite(latitude:$latitude,longitude:$longitude) {
      _id
      name
      image
      slug
      address
      enableNotification
      distanceInMeters
      location{coordinates}
      minimumOrder
      reviewData{
        total
        ratings
      }
      cuisines
      rating
      reviewAverage
      isAvailable
     }
  }`;

export const addFavouriteRestaurant = `mutation AddFavourite($id:String!){
    addFavourite(id:$id){
      _id
      addresses{
        _id
        label
        deliveryAddress
        details
        location{coordinates}
        selected
      }
    }
  }`;

export const saveNotificationTokenWeb = `mutation SaveNotificationTokenWeb($token:String!){
  saveNotificationTokenWeb(token:$token){
    success
    message
  }
}`;
export const chat = `query Chat($order: ID!) {
  chat(order: $order) {
    id
    message
    user {
      id
      name
    }
    createdAt
  }
}`;

export const subscriptionNewMessage = `subscription SubscriptionNewMessage($order:ID!){
  subscriptionNewMessage(order:$order){
    id
    message
    user {
      id
      name
    }
    createdAt
  }
}`;


export const Cusines = `query Cuisines {
  cuisines {
    name
  }
}`

export const customerBootstrap = `query CustomerBootstrap {
  customerBootstrap {
    dietaryOptions {
      enumVal
      displayName
      isActive
    }
    foodTags {
      enumVal
      displayName
      isActive
      restaurantDetailHandlingType
    }
    homeSearchPlaceholder
    cuisines {
      name
    }
    banners {
      _id
      templateId
      elements {
        key
        text
        color
        image
        gradient
      }
      priority
      isActive
    }
    promotions {
      _id
      displayName
      description
      baseCode
      promotionType
      minPercentageDiscount
      maxPercentageDiscount
      minimumMaxDiscount
      minFlatDiscount
      maxFlatDiscount
      minimumOrderValue
      isActive
    }
    currencyConfig {
      currency
      currencySymbol
    }
    allergens {
      enumVal
      displayName
      description
    }
    operationalZones
    zonesDetails
    activeConsentDocData
  }
}
`;

export const getCampaignsByRestaurant = `query GetCampaignsByRestaurant($restaurantId: ID!) {
  getCampaignsByRestaurant(restaurantId: $restaurantId) {
    _id
    restaurant
    name
    description
    couponCode
    campaignType
    promotion
    minimumOrderValue
    percentageDiscount
    maxDiscount
    flatDiscount
    startDate
    endDate
    startTime
    endTime
    isActive
  }
}`

export const toggleRestaurantNotification = `mutation SetUserRestaurantNotification($input: SetUserRestaurantNotificationInput!) {
  setUserRestaurantNotification(input: $input)
}`

export const toggleUserNotifications = `mutation Mutation {
  toggleUserNotifications
}`

export const getRestaurantNotificationStatus = `query Query($restaurantId: String!) {
  getUserRestaurantSubscriptionStatus(restaurantId: $restaurantId)
}`

export const getRestaurantNotificationIds = `query Query {
  getSubscribedRestaurantIdsByUser
}`

export const getMenu = `query GetMenu($restaurantId: ID!) {
  getMenu(restaurantId: $restaurantId) {
    _id
    food {
      _id
      name
      hasVariation
      variationList {
        _id
        type
        title
        optionSetList
        price
        discountedPrice
        outOfStock
        createdAt
        updatedAt
      }
      internalName
      dietaryType
      imageData {
        images {
          _id
          url
          type
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
      active
      outOfStock
      hiddenFromMenu
      allergen
      tags
      createdAt
      updatedAt
    }
  }
}`

export const zoneCheck = `query CheckZoneRestrictions($inputValues: LocationPoint!) {
  checkZoneRestrictions(inputValues: $inputValues) {
    selectedZone
    fallbackZone
    fallbackZoneDetails {
      title
      identifier
      defaultLocation
      coordinates
      order
    }
    selectedZoneDetails {
      title
      identifier
      defaultLocation
      coordinates
      order
    }
    selectedZone
    fallbackZone
  }
}`

export const deleteAccount = `mutation Mutation {
  deleteUserAccount
}`

export const recordConsent = `mutation RecordUserConsent($docVersionId: String!) {
  recordUserConsent(docVersionId: $docVersionId)
}`
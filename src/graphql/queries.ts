import { gql } from '@apollo/client';

export const LOGIN_VIA_TELEGRAM = gql`
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

export const GET_ORDER = gql`
  query GetOrder($orderId: String!) {
    order(id: $orderId) {
      _id
      orderId
      restaurant {
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
      deliveryAddress {
        deliveryAddress
      }
      items {
        _id
        title
        food
        quantity
        variation {
          title
          price
          discountedPrice
        }
        addons {
          _id
          options {
            _id
            price
          }
          title
          minQty
          maxQty
        }
        specialInstructions
      }
      user {
        _id
        name
        phone
      }
      review {
        _id
        rating
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
  }
`;

export const CUSTOMER_BOOTSTRAP = gql`
  query CustomerBootstrap {
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

export const GET_RESTAURANT_CLUSTERS = gql`
  query RestaurantClustersV1($input: RestaurantClusterInput!) {
    restaurantClusters(input: $input) {
      clusters {
        location {
          type
          coordinates
        }
        count
        cellId {
          lonCell
          latCell
        }
        bounds
      }
    }
  }
`;

export const GET_RESTAURANTS_MAP_API = gql`
  query RestaurantsMapApi($userLocation: [Float!], $limit: Int, $location: [Float!]!, $distance: Float!) {
    restaurantsMapApi(userLocation: $userLocation, limit: $limit, location: $location, distance: $distance) {
      restaurants {
        _id
        name
        image
        address
        isActive
        slug
        isAvailable
        onboarded
        distanceInMeters
        location {
          coordinates
        }
      }
      campaigns {
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
        deleted
        createdBy
        modifiedBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const COMBINED_RESTAURANTS_QUERY = gql`
  query CombinedRestaurants(
    $distance: Float!,
    $limit: Int!,
    $location: [Float!]!
    $lastRestaurant: LastRestaurantInput
  ) {
    allRestaurants: nearByRestaurantsNewV2(
      distance: $distance,
      limit: $limit,
      location: $location,
      lastRestaurant: $lastRestaurant
    ) {
      sections {
        _id
        name
        restaurants
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
        }
        favoriteCount
        reviewAverage
        distanceInMeters
        reviewCount
        isAvailable
        openingTimes {
          day
          times {
            startTime
            endTime
          }
          isOpen
        }
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
      pagination
    }
  }
`;

export const SINGLE_RESTAURANT_QUERY = gql`
  query SingleRestaurant($id: String, $slug: String, $restaurantId: ID!) {
    restaurant(id: $id, slug: $slug) {
      _id
      orderId
      orderPrefix
      cuisines
      name
      image
      slug
      owner {
      email
    }
      phone
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
    campaigns:getCampaignsByRestaurant(restaurantId: $restaurantId) {
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
        description
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
  }
`;

export const FAVORITES = gql`
  query GetUserFavorites($longitude: Float!, $latitude: Float!) {
    userFavourite(longitude: $longitude, latitude: $latitude) {
      _id
      name
      image
      slug
      address
      cuisines
      onboarded
      location {
        coordinates
      }
      favoriteCount
      reviewAverage
      distanceInMeters
      reviewCount
      isAvailable
    }
  }
`;

export const TOGGLE_FAVORITE = gql`
  mutation ToggleFavorite($toggleFavoriteId: String!) {
    toggleFavorite(id: $toggleFavoriteId) {
      _id
      favourite
    }
  }
`;

export const SET_RESTAURANT_NOTIFICATION = gql`
  mutation SetUserRestaurantNotification($input: SetUserRestaurantNotificationInput!) {
    setUserRestaurantNotification(input: $input)
  }
`;

export const GET_ORDERS = gql`
  query Orders {
    orders {
      _id
      orderId
      restaurant {
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
      deliveryAddress {
        deliveryAddress
      }
      items {
        _id
        title
        food
        quantity
        addons {
          _id
          options {
            _id
            price
          }
          title
          minQty
          maxQty
        }
        specialInstructions
      }
      user {
        _id
        name
        phone
      }
      review {
        _id
        rating
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

export const PROFILE = gql`
  query {
    profile {
      _id
      name
      phone
      phoneIsVerified
      email
      notificationEnabled
      emailIsVerified
      notificationToken
      notificationEnabled
      isOrderNotification
      isOfferNotification
      addresses {
        _id
        label
        deliveryAddress
        details
        location {
          coordinates
        }
        selected
      }
      favourite
      consentInfo {
        docVersionId
        consentTime
      }
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
`;

export const ValidatePhoneOtp = gql`
  mutation ValidatePhoneOtp($validatePhoneOtpOtp2: String!) {
    validatePhoneOtp(otp: $validatePhoneOtpOtp2) {
      message
      result
      retryAfter
    }
  }
`;

export const sendOtpToEmail = gql`
  mutation SendOtpToEmail($email: String!) {
    sendOtpToEmail(email: $email) {
      message
      result
      retryAfter
    }
  }
`;

export const ValidateEmailOtp = gql`
  mutation ValidateEmailOtp($otp: String!) {
    validateEmailOtp(otp: $otp) {
      message
      result
      retryAfter
    }
  }
`;

export const PLACE_ORDER = gql`
  mutation PlaceOrder(
    $restaurant: String!,
    $orderInput: [OrderInput!]!,
    $paymentMethod: String!,
    $couponCode: String,
    $tipping: Float!,
    $taxationAmount: Float!,
    $address: AddressInput!,
    $orderDate: String!,
    $isPickedUp: Boolean!,
    $deliveryCharges: Float!
    $specialInstructions:String!
  ) {
    placeOrder(
      restaurant: $restaurant
      orderInput: $orderInput
      paymentMethod: $paymentMethod
      couponCode: $couponCode
      tipping: $tipping
      taxationAmount: $taxationAmount
      address: $address
      orderDate: $orderDate
      isPickedUp: $isPickedUp
      deliveryCharges: $deliveryCharges,
      instructions:$specialInstructions
    ) {
      _id
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($name: String!) {
    updateUser(updateUserInput: { name: $name }) {
      _id
      name
    }
  }
`;

export const TOGGLE_USER_NOTIFICATIONS = gql`
  mutation ToggleUserNotifications {
    toggleUserNotifications
  }
`;

export const GET_RESTAURANT_NOTIFICATION_STATUS = gql`
  query GetRestaurantNotificationStatus($restaurantId: String!) {
    getUserRestaurantSubscriptionStatus(restaurantId: $restaurantId)
  }
`;

export const recordConsent = gql`
  mutation RecordUserConsent($docVersionId: String!) {
    recordUserConsent(docVersionId: $docVersionId)
  }
`;

export const CHECK_ZONE_RESTRICTIONS = gql`
  query CheckZoneRestrictions($inputValues: LocationPoint!) {
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
    }
  }
`;


export const CREATE_ADDRESS = gql`
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



export const EDIT_ADDRESS = gql`mutation EditAddress($addressInput:AddressInput!){
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


export const DELETE_ADDRESS = gql`mutation DeleteAddress($deleteAddressId:ID!){
  deleteAddress(id:$deleteAddressId){
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


export const GET_CAMPAIGNS_BY_RESTAURANT = gql`query GetCampaignsByRestaurant($restaurantId: ID!) {
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


export const REVIEW_ORDER = gql`mutation ReviewOrder($reviewInput: ReviewInput!) {
  reviewOrder(reviewInput: $reviewInput) {
    _id
  }
}`;
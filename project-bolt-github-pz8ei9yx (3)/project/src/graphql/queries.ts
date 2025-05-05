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

export const PROFILE = gql`
  query {
    profile {
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
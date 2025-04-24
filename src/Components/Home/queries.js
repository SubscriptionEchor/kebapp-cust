// components/Home/queries.js
import { gql } from '@apollo/client';

// export const COMBINED_RESTAURANTS_QUERY = gql`
//   query CombinedRestaurants(
//     $distance: Float!, 
//     $limit: Int!, 
//     $longitude: Float!, 
//     $latitude: Float!,
//     $zoneIdentifier: String!
//   ) {
//     allRestaurants: nearByRestaurantsNewV2(
//       distance: $distance,
//       limit: $limit,
//       longitude: $longitude,
//       latitude: $latitude
//       zoneIdentifier: $zoneIdentifier
//     ) {
//       sections {
//         _id
//         name
//         restaurants
//       }
//       restaurants {
//         _id
//         name
//         image
//         slug
//         address
//         cuisines
//         onboarded
//         location {
//           coordinates
//         }
//         favoriteCount
//         reviewAverage
//         distanceInMeters
//         reviewCount
//         isAvailable
//         openingTimes {
//           day
//           times {
//             startTime
//             endTime
//           }
//           isOpen
//         }
//       }
//       campaigns {
//         _id
//         restaurant
//         name
//         description
//         couponCode
//         campaignType
//         promotion
//         isActive
//         startDate
//         endDate
//         startTime
//         endTime
//         percentageDiscount
//         flatDiscount
//         maxDiscount
//         minimumOrderValue
//       }
//     }
//   }
// `;
export const COMBINED_RESTAURANTS_QUERY = gql`
  query CombinedRestaurants(
    $distance: Float!,
    $limit: Int!,
    $location: [Float!]!
    $lastRestaurant: LastRestaurantInput # Add this to support pagination
  ) {
    allRestaurants: nearByRestaurantsNewV2(
      distance: $distance,
      limit: $limit,
      location: $location,
      lastRestaurant: $lastRestaurant # Include lastRestaurant in the query
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
export const RESTAURANTS_QUERY = gql`
  query NearByRestaurants(
    $distance: Float!,
    $limit: Int!,
    $longitude: Float,
    $latitude: Float,
    $location: [Float!]!,
    $cuisines: [String],
    $sortBy: String,
    $sortOrder: String,
    $rating: Float
  ) {
    nearByRestaurantsNewV2(
      distance: $distance,
      limit: $limit,
      longitude: $longitude,
      latitude: $latitude,
      location: $location,
      cuisines: $cuisines,
      sortBy: $sortBy,
      sortOrder: $sortOrder,
      rating: $rating
    ) {
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
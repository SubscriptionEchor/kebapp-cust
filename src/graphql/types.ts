export interface RestaurantClusterInput {
  location: [number, number];
  radius: number;
}

export interface Cluster {
  location: {
    type: string;
    coordinates: [number, number];
  };
  count: number;
  cellId: {
    lonCell: number;
    latCell: number;
  };
  bounds: number[][];
}

export interface RestaurantClustersResponse {
  restaurantClusters: {
    clusters: Cluster[];
  };
}

export interface Restaurant {
  _id: string;
  name: string;
  image: string;
  address: string;
  isActive: boolean;
  slug: string;
  isAvailable: boolean;
  onboarded: boolean;
  distanceInMeters: number;
  location: {
    coordinates: [number, number];
  };
  cuisines?: string[];
  favoriteCount?: number;
  reviewAverage?: number;
  reviewCount?: number;
  openingTimes?: {
    day: string;
    times: {
      startTime: string;
      endTime: string;
    }[];
    isOpen: boolean;
  }[];
}

export interface Campaign {
  _id: string;
  restaurant: string;
  name: string;
  description: string;
  couponCode: string;
  campaignType: string;
  promotion: string;
  minimumOrderValue: number;
  percentageDiscount: number;
  maxDiscount: number;
  flatDiscount: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  deleted: boolean;
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantsMapApiResponse {
  restaurantsMapApi: {
    restaurants: Restaurant[];
    campaigns: Campaign[];
  };
}

export interface Section {
  _id: string;
  name: string;
  restaurants: string[];
}

export interface LastRestaurantInput {
  _id?: string;
  distance?: number;
}

export interface CombinedRestaurantsResponse {
  allRestaurants: {
    sections: Section[];
    restaurants: Restaurant[];
    campaigns: Campaign[];
    pagination: any;
  };
}
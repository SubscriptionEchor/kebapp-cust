import { gql, useQuery } from "@apollo/client";
import { singleRestaurant } from "../apollo/server";

const SINGLE_RESTAURANT = gql`
  ${singleRestaurant}
`;

export default function useRestaurant(id, slug) {
  const { data, refetch, networkStatus, loading, error } = useQuery(SINGLE_RESTAURANT, {
    variables: {
      id,
      slug,
      restaurantId: id
    },
    fetchPolicy: "network-only",
    // nextFetchPolicy: 'cache-only',
    skip: !id
  });
  return { data, refetch, networkStatus, loading, error };
}
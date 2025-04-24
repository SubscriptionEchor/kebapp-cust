import { gql, useQuery } from "@apollo/client";
import { getTipping } from "../apollo/server";

const TIPS = gql`
  ${getTipping}
`;

export default function GetTips(id, slug) {
    const { data, refetch, networkStatus, loading, error } = useQuery(TIPS);
    return { data, refetch, networkStatus, loading, error };
    // return { data: 'a', refetch: "b", networkStatus: "c", loading: "d", error: "e" }
}
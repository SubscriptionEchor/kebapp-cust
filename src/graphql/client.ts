import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { config } from '../config';
import { getAuthToken, getLangCode } from '../utils/auth';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const httpLink = createHttpLink({
  uri: config.api.baseUrl,
  // credentials: 'include',
  fetchOptions: {
    mode: 'cors',
  },
});

const authLink = new ApolloLink((operation, forward) => {
  const token = getAuthToken();
  const langCode = getLangCode();

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      lang: langCode,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
  }));

  return forward(operation);
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        profile: {
          merge: true,
        },
        userFavourite: {
          keyArgs: false,
          merge(existing = [], incoming = []) {
            return incoming;
          }
        },
        allRestaurants: {
          keyArgs: false,
          merge(existing = {}, incoming = {}) {
            if (!existing) return incoming;

            return {
              ...incoming,
              restaurants: [...(existing.restaurants || []), ...(incoming.restaurants || [])],
              pagination: incoming.pagination
            };
          }
        },
        restaurantClusters: {
          merge(existing, incoming) {
            return incoming;
          },
        },
        restaurantsMapApi: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
    Restaurant: {
      keyFields: ['_id'],
      fields: {
        favoriteCount: {
          read(existing) {
            return existing || 0;
          }
        },
        reviewCount: {
          read(existing) {
            return existing || 0;
          }
        },
        reviewAverage: {
          read(existing) {
            return existing || 0;
          }
        }
      }
    },
    User: {
      keyFields: ['_id'],
      fields: {
        favourite: {
          merge(existing = [], incoming = []) {
            return incoming;
          }
        }
      }
    }
  },
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first'
    },
    query: {
      fetchPolicy: 'cache-first',
    },
    mutate: {
      fetchPolicy: 'network-only',
    },
  },
  connectToDevTools: true,
});
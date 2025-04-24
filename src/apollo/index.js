// setupApollo.js
import {
  ApolloClient,
  ApolloLink,
  concat,
  InMemoryCache,
} from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { ConfigurableValues } from "../constants/constants";

const setupApollo = () => {
  const { SERVER_URL } = ConfigurableValues();

  const cache = new InMemoryCache();

  // Use BatchHttpLink for batching calls
  const httpLink = new BatchHttpLink({
    uri: `${SERVER_URL}graphql`,
    batchMax: 10,       // maximum number of operations per batch
    batchInterval: 20,  // wait 20ms before sending the batch
  });

  // Create an auth link that synchronously sets the token
  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem("token");

    // 2) Get the language code from localStorage (default to 'en' if not set)
  const langCode = localStorage.getItem('selectedLanguage') || 'en';


    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : "",
        lang: langCode, 
      },
    });
    return forward(operation);
  });

  // Create the Apollo client with the batched HTTP link
  const client = new ApolloClient({
    link: concat(authLink, httpLink),
    cache,
    resolvers: {},
    connectToDevTools: true,
  });

  return client;
};

export default setupApollo;
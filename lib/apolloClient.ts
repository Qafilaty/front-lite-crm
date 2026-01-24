import { ApolloClient, InMemoryCache, from, split } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/graphql';
const WS_URL = API_URL.replace(/^http/, 'ws');

// HTTP Link (Upload Link)
const uploadLink = createUploadLink({
  uri: API_URL,
  headers: {
    "apollo-require-preflight": "true",
  },
  credentials: 'include', // Important for cookies,
});

// Auth Link - Add Authorization header
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('authToken');

  return {
    headers: {
      ...headers,
      authorization: token ? token : '',
    }
  };
});

// Error Link - Handle errors globally
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle network errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  }
});

// WebSocket Link
const wsLink = new GraphQLWsLink(createClient({
  url: WS_URL,
  connectionParams: () => {
    const token = localStorage.getItem('authToken');
    return {
      authorization: token ? token : '',
    };
  }
}));

// Split Link
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([errorLink, authLink, uploadLink])
);

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          allOrder: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/graphql';

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

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, uploadLink]),
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

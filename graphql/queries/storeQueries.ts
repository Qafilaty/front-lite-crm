import { gql } from '@apollo/client';

/**
 * Store Queries
 * جميع استعلامات المتاجر
 */
export const GET_STORE = gql`
  query GetStore($id: ID!) {
    store(id: $id) {
      id
      name
      domain
      logo
      status
      url
      typeOrder
      typeStore
      company {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_STORES = gql`
  query GetAllStores {
    allStore {
      id
      name
      logo
      url
      domain
      status
      typeStore
      createdAt
    }
  }
`;

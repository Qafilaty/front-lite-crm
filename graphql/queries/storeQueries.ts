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
      type
      status
      url
      typeOrder
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
  query GetAllStores($idCompany: ID!) {
    allStore(idCompany: $idCompany) {
      id
      name
      logo
      url
      domain
      type
      status
      createdAt
    }
  }
`;

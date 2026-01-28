import { gql } from '@apollo/client';

/**
 * User Queries
 * جميع استعلامات المستخدمين
 */
export const LOGIN = gql`
  query Login($content: loginInfo) {
    logIn(content: $content) {
      token
      user {
        id
        name
        email
        phone
        role
        company {
          id
          name
          plans {
            name
            dateExpiry
            pointes
          }
        }
      }
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
      name
      email
      phone
      role
      activation
      emailVerify
      company {
        id
        name
        plans {
          name
          dateExpiry
          pointes
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    allUser {
      id
      name
      email
      phone
      role
      activation
      createdAt
      numberDeliveredOrder
      numberDeliveredOrderNotPaid
      orderPrice
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      phone
      role
      activation
      createdAt
    }
  }
`;

export const REFRESH_TOKEN = gql`
  query RefreshToken {
    refreshToken {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

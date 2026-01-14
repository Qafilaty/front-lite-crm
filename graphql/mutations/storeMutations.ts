import { gql } from '@apollo/client';

/**
 * Store Mutations
 * عمليات إدارة المتاجر (إنشاء، تحديث، حذف)
 */
export const CREATE_STORE = gql`
  mutation CreateStore($content: contentStore!) {
    createStore(content: $content) {
      id
      name
      domain
      logo
      type
      status
      url
      typeOrder
      createdAt
    }
  }
`;

export const UPDATE_STORE = gql`
  mutation UpdateStore($id: ID!, $content: contentStore!) {
    updateStore(id: $id, content: $content) {
      status
      data {
        id
        name
        domain
        logo
        type
        status
      }
    }
  }
`;

export const DELETE_STORE = gql`
  mutation DeleteStore($id: ID!) {
    deleteStore(id: $id) {
      status
    }
  }
`;

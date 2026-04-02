import { gql } from '@apollo/client';

export const UPDATE_USERS_STAFF_QUEUE = gql`
  mutation UpdateUsersStaffQueue($id: ID!, $content: contentUsersStaffQueue!) {
    updateUsersStaffQueue(id: $id, content: $content) {
      data {
        id
        users {
          id
          user {
            id
            name
          }
          blocked
          order
        }
      }
      status
    }
  }
`;

export const UPDATE_BLOCKED_USERS_STAFF_QUEUE = gql`
  mutation UpdateBlockedUsersStaffQueue($idUser: ID!, $blocked: Boolean!) {
    updateBlockedUsersStaffQueue(idUser: $idUser, blocked: $blocked) {
      status
    }
  }
`;

export const UPDATE_ORDER_USERS_STAFF_QUEUE = gql`
  mutation UpdateOrderUsersStaffQueue($content: [contentOrderUsersStaffQueue!]) {
    updateOrderUsersStaffQueue(content: $content) {
      data {
        id
        users {
          id
          order
        }
      }
      status
    }
  }
`;

export const UPDATE_PRODUCT_ASSIGNMENTS_STAFF_QUEUE = gql`
  mutation UpdateProductAssignmentsStaffQueue($content: [contentProductAssignmentStaffQueue!]) {
    updateProductAssignmentsStaffQueue(content: $content) {
      data {
        id
        productAssignments {
          id
          product {
            id
            name
            sku
          }
          user {
            id
            name
          }
        }
      }
      status
    }
  }
`;

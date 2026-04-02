import { gql } from '@apollo/client';

export const GET_ALL_STAFF_QUEUE = gql`
  query GetAllStaffQueue {
    allStaffQueue {
      id
      users {
        id
        user {
          id
          name
          email
          role
        }
        blocked
        order
        numberNewOrder
      }
      usersAbandoned {
        id
        user {
          id
          name
          email
          role
        }
        blocked
        order
        numberNewOrder
      }
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
  }
`;

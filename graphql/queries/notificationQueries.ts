import { gql } from '@apollo/client';

export const GET_ALL_NOTIFICATIONS = gql`
  query AllNotifications($pagination: Pagination) {
    allNotifications(pagination: $pagination) {
      id
      title
      msg
      icon
      type
      createdAt
      updatedAt
    }
  }
`;

import { gql } from '@apollo/client';

export const CREATE_DELIVERY_PRICE = gql`
  mutation CreateDeliveryPrice($content: contentDeliveryPrice!) {
    createDeliveryPrice(content: $content) {
      id
      name
      isDefault
      prices {
        name
        code
        desk
        home
      }
    }
  }
`;

export const UPDATE_DELIVERY_PRICE = gql`
  mutation UpdateDeliveryPrice($id: ID!, $content: contentDeliveryPrice!) {
    updateDeliveryPrice(id: $id, content: $content) {
      status
      data {
        id
        name
        updatedAt
      }
    }
  }
`;

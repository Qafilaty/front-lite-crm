import { gql } from '@apollo/client';

export const CREATE_COUPON = gql`
  mutation CreateCoupon($content: contentCoupon!) {
    createCoupon(content: $content) {
      id
      name
      code
      discount
    }
  }
`;

export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: ID!, $content: contentCoupon!) {
    updateCoupon(id: $id, content: $content) {
      status
      data {
        id
        name
        code
        discount
      }
    }
  }
`;

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id) {
      status
    }
  }
`;

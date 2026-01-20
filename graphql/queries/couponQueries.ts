import { gql } from '@apollo/client';

export const GET_COUPON = gql`
  query Coupon($id: ID) {
    coupon(id: $id) {
      id
      name
      code
      discount
      createdAt
    }
  }
`;

export const GET_COUPON_BY_CODE = gql`
  query CouponByCode($code: String) {
    couponByCode(code: $code) {
      id
      name
      code
      discount
    }
  }
`;

export const GET_ALL_COUPONS = gql`
  query AllCoupon($pagination: Pagination) {
    allCoupon(pagination: $pagination) {
      data {
        id
        name
        code
        discount
        createdAt
      }
      total
    }
  }
`;

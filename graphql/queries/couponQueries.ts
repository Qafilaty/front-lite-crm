import { gql } from '@apollo/client';

export const GET_COUPON_BY_CODE = gql`
  query CouponByCode($code: String!) {
    couponByCode(code: $code) {
      id
      name
      code
      discount
    }
  }
`;

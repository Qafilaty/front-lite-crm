import { gql } from '@apollo/client';

export const GET_ALL_DELIVERY_PRICE_COMPANY = gql`
  query AllDeliveryPriceCompany {
    allDeliveryPriceCompany {
      data {
        id
        name
        isDefault
        prices {
          name
          code
          desk
          home
          blocked
        }
        updatedAt
      }
      total
    }
  }
`;

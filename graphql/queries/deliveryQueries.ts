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

export const ZIMOU_DELIVERY_PRICE_COMPARATOR = gql`
  query ZimouDeliveryPriceComparator($orderId: ID, $communeId: String, $wilaya: String, $commune: String, $idDeliveryCompany: ID) {
    zimouDeliveryPriceComparator(
      orderId: $orderId
      communeId: $communeId
      wilaya: $wilaya
      commune: $commune
      idDeliveryCompany: $idDeliveryCompany
    ) {
      success
      message
      communeId
      communeName
      wilayaName
      wilayaCode
      prices {
        departure
        delivery_type
        delivery_price
        paid_by_promo
      }
    }
  }
`;

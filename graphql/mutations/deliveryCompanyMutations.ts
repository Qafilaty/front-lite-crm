import { gql } from '@apollo/client';

/**
 * Delivery Company Mutations
 * عمليات إدارة شركات التوصيل
 */
export const CREATE_DELIVERY_COMPANY = gql`
  mutation CreateDeliveryCompany($content: contentDeliveryCompany!) {
    createDeliveryCompany(content: $content) {
      id
      name
      originalName
      active
      createdAt
    }
  }
`;

export const UPDATE_DELIVERY_COMPANY = gql`
  mutation UpdateDeliveryCompany(
    $id: ID!
    $content: contentDeliveryCompany!
  ) {
    updateDeliveryCompany(id: $id, content: $content) {
      status
      data {
        id
        name
      }
    }
  }
`;

export const DELETE_DELIVERY_COMPANY = gql`
  mutation DeleteDeliveryCompany($id: ID!) {
    deleteDeliveryCompany(id: $id) {
      status
    }
  }
`;

export const ADD_ORDER_TO_DELIVERY_COMPANY = gql`
  mutation AddOrderToDeliveryCompany(
    $idCompany: ID
    $idDeliveryCompany: ID
    $ids: [ID]
  ) {
    addOrderToDeliveryCompany(
      idCompany: $idCompany
      idDeliveryCompany: $idDeliveryCompany
      ids: $ids
    ) {
      successOrder {
        id
        numberOrder
        deliveryCompany {
          trackingCode
        }
      }
      failedOrder {
        data {
          id
          numberOrder
          deliveryCompany {
            trackingCode
          }
        }
        errors
      }
    }
  }
`;

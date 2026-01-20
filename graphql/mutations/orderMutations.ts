import { gql } from '@apollo/client';

/**
 * Order Mutations
 * عمليات إدارة الطلبات (إنشاء، تحديث، حذف، تغيير الحالة)
 */
export const CREATE_ORDER = gql`
  mutation CreateOrder($content: contentOrder!) {
    createOrder(content: $content) {
      id
      numberOrder
      fullName
      phone
      totalPrice
      createdAt
    }
  }
`;

export const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: ID!, $content: contentOrder!) {
    updateOrder(id: $id, content: $content) {
      status
      data {
        id
        numberOrder
        fullName
        phone
        status {
          nameEN
          nameAR
          color
        }
        totalPrice
      }
    }
  }
`;

export const CHANGE_STATUS_ORDER = gql`
  mutation ChangeStatusOrder($id: ID!, $content: contentTimeLine!) {
    changeStatusOrder(id: $id, content: $content) {
      status
      data {
        id
        status {
          nameEN
          nameAR
          color
        }
        confirmationTimeLine {
          id
          status
          note
          createdAt
        }
        deliveryTimeLine {
          id
          status
          note
          createdAt
        }
      }
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: ID!) {
    deleteOrder(id: $id) {
      status
    }
  }
`;

export const DELETE_MULTI_ORDER = gql`
  mutation DeleteMultiOrder($id: [ID!]!) {
    deleteMultiOrder(id: $id) {
      status
    }
  }
`;

export const RETURNED_MULTI_ORDER = gql`
  mutation ReturnedMultiOrder($ids: [ID]!) {
    returnedMultiOrder(ids: $ids) {
      status
      data {
        id
        status
      }
    }
  }
`;

export const RETURNED_MULTI_ORDER_BY_TRACKING_CODE = gql`
  mutation ReturnedMultiOrderByTrackingCode(
    $trackingCodes: [String!]!
  ) {
    returnedMultiOrderByTrackingCode(
      trackingCodes: $trackingCodes
    ) {
      trackingCode
      status
    }
  }
`;

export const DELIVERED_MULTI_ORDER = gql`
  mutation DeliveredMultiOrder(
    $trackingCodes: [String]
  ) {
    delivredMultiOrder(
      trackingCodes: $trackingCodes
    ) {
      trackingCode
      status
    }
  }
`;

export const ADD_FEEDBACK_TO_ORDER = gql`
  mutation AddFeedbackToOrder($id: ID!, $content: contentFeedback!) {
    addFeedbackToOrder(id: $id, content: $content) {
      status
      data {
        id
      }
    }
  }
`;

export const UPDATE_FEEDBACK_TO_ORDER = gql`
  mutation UpdateFeedbackToOrder($id: ID!, $content: contentFeedback!) {
    updateFeedbackToOrder(id: $id, content: $content) {
      status
      data {
        id
      }
    }
  }
`;

export const CHANGE_DELIVERY_TYPE_ORDER = gql`
  mutation ChangeDeliveryTypeOrder(
    $id: ID!
    $deliveryType: String!
    $deliveryPrice: Float
  ) {
    changeDeliveryTypeOrder(
      id: $id
      deliveryType: $deliveryType
      deliveryPrice: $deliveryPrice
    ) {
      status
      data {
        id
        deliveryType
        deliveryPrice
      }
    }
  }
`;

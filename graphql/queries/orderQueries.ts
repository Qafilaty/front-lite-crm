import { gql } from '@apollo/client';

/**
 * Order Queries
 * جميع استعلامات الطلبات
 */
export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      numberOrder
      fullName
      phone
      phone2

      state {
        idState
        name
        code
      }
      city
      address
      note
      totalPrice
      subTotalPrice
      totalQuantity
      status {
        id
        nameAR
        nameFR
        nameEN
        color
        group
        style
        order
      }
      deliveryType
      deliveryPrice
      discount
      weight
      duplicatePhone
      store {
        store {
          id
          name
          logo
        }
        idOrderStore
      }
      deliveryCompany {
        deliveryCompany {
          id
          name
          availableDeliveryCompany {
            logo
          }
        }
        status
        trackingCode
        color
      }
      deliveryCompanyCenter {
        id
        name
        codeCenter
        address
        commune
        communeAr
      }
      products {
        product {
          id
          name
          sku
        }
        variantsProduct {
          id
          name
        }
        name
        sku
        price
        quantity
      }

      confirmationTimeLine {
        id
        status
        oreginalStatus {
          id
          nameAR
          nameFR
          nameEN
          color
          group
          style
          order
        }
        note
        user {
          id
          name
        }
        deleted
        createdAt
      }
      confirmed {
        id
        name
      }
      deliveryTimeLine {
        id
        status
        oreginalStatus {
          id
          nameAR
          nameFR
          nameEN
          color
          group
          style
          order
        }
        note
        user {
          id
          name
        }
        deleted
        createdAt
      }
      createdAt
      updatedAt
      updatedAtStatus
    }
  }
`;

export const GET_ALL_ORDERS = gql`
  query GetAllOrders(
    $pagination: Pagination
    $advancedFilter: JSON
    $advancedSort: JSON
  ) {
    allOrder(
      pagination: $pagination
      advancedFilter: $advancedFilter
      advancedSort: $advancedSort
    ) {
      data {
        id
        numberOrder
        fullName
        phone
        phone2

        state {
          idState
          name
          code
        }
        city
        address
        note
        totalPrice
        subTotalPrice
        totalQuantity
        status {
          id
          nameAR
          nameFR
          nameEN
          color
          group
          style
          order
        }
        deliveryType
        deliveryPrice
        discount
        weight
        duplicatePhone
        store {
          store {
            id
            name
            logo
          }
        }
        sheet {
          id
          nameSheet
          typeOrder
        }
        deliveryCompany {
          deliveryCompany {
            id
            name
            availableDeliveryCompany {
              logo
            }
          }
          status
          trackingCode
          color
        }
        deliveryCompanyCenter {
          id
          name
          codeCenter
          address
          commune
          communeAr
        }
        products {
          product {
            id
            name
            sku
          }
           variantsProduct {
            id
            name
          }
          name
          sku
          price
          quantity
        }
        createdAt
        updatedAt
        updatedAtStatus
        isAbandoned
        confirmed {
          id
          name
        }
        confirmationTimeLine {
          id
          user {
            id
            name
          }
          createdAt
        }
        isLocked
      }
      total
      numberDeferredOrder
    }
  }
`;

export const SEARCH_ORDER = gql`
  query SearchOrder($trackingCode: String!) {
    searchOrder(trackingCode: $trackingCode) {
      status
      data {
        id
        numberOrder
        fullName
        phone
        status {
          id
          nameAR
          nameFR
          nameEN
          color
          group
          style
          order
        }
        deliveryCompany {
          trackingCode
        }
        isLocked
      }
    }
  }
`;

export const SPOTLIGHT_SEARCH = gql`
  query SpotlightSearch(
    $pagination: Pagination
    $advancedFilter: JSON
  ) {
    allOrder(
      pagination: $pagination
      advancedFilter: $advancedFilter
    ) {
      data {
        id
        numberOrder
        fullName
        phone
        totalPrice
        status {
          id
          nameAR
          nameEN
          color
        }
        createdAt
      }
    }
  }
`;

export const GET_POSTPONED_COUNT = gql`
  query GetPostponedCount {
    allOrder(pagination: { page: 1, limit: 1 }) {
      numberDeferredOrder
    }
  }
`;

export const GET_ALL_ABANDONED_ORDERS = gql`
  query GetAllAbandonedOrders(
    $pagination: Pagination
    $advancedFilter: JSON
    $advancedSort: JSON
  ) {
    allAbandonedOrder(
      pagination: $pagination
      advancedFilter: $advancedFilter
      advancedSort: $advancedSort
    ) {
      data {
        id
        numberOrder
        fullName
        phone
        phone2

        state {
          idState
          name
          code
        }
        city
        address
        note
        totalPrice
        subTotalPrice
        totalQuantity
        status {
          id
          nameAR
          nameFR
          nameEN
          color
          group
          style
          order
        }
        deliveryType
        deliveryPrice
        discount
        weight
        duplicatePhone
        store {
          store {
            id
            name
            logo
          }
        }
        products {
          product {
            id
            name
            sku
          }
           variantsProduct {
            id
            name
          }
          name
          sku
          price
          quantity
        }
        createdAt
        updatedAt
        updatedAtStatus
        isAbandoned
        confirmed {
          id
          name
        }
      }
      total
    }
  }
`;

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
      trackingReplaced
      reasonReplaced
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
      lastTimeLine {
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
    $idCompany: ID!
    $pagination: Pagination
    $advancedFilter: JSON
    $advancedSort: JSON
  ) {
    allOrder(
      idCompany: $idCompany
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
        trackingReplaced
        duplicatePhone
        store {
          store {
            id
            name
            logo
          }
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
        products {
          product {
            id
            name
            sku
          }
          name
          sku
          price
          quantity
        }
        lastTimeLine {
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
          createdAt
        }
        createdAt
        updatedAt
        updatedAtStatus
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
      }
    }
  }
`;

export const SPOTLIGHT_SEARCH = gql`
  query SpotlightSearch(
    $idCompany: ID!
    $pagination: Pagination
    $advancedFilter: JSON
  ) {
    allOrder(
      idCompany: $idCompany
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

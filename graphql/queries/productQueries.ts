import { gql } from '@apollo/client';

/**
 * Product Queries
 * جميع استعلامات المنتجات
 */
export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      thumbnail
      name
      sku
      quantity
      price
      cost
      status
      note
      variants {
        id
        name
        type
        value {
          id
          name
          value
        }
      }
      variantsProbability {
        id
        name
        sku
        price
        cost
        quantity
      }
      company {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts(
    $advancedFilter: JSON
    $pagination: Pagination
  ) {
    allProduct(advancedFilter: $advancedFilter, pagination: $pagination) {
      data {
        id
        thumbnail
        name
        sku
        quantity
        price
        cost
        status
        note
        variants {
          id
          name
          type
          value {
            name
            value
          }
        }
        variantsProbability {
          id
          name
          sku
          price
          cost
          quantity
        }
        createdAt
        updatedAt
      }
      total
    }
  }
`;
export const GET_PRODUCTS_ANALYTICS = gql`
  query GetProductsAnalytics($advancedFilter: JSON, $pagination: Pagination) {
    allProduct(advancedFilter: $advancedFilter, pagination: $pagination) {
      data {
        id
        name
        variantsProbability {
          id
          name
          sku
          price
          cost
          isDefault
          quantity
          orderStatistic {
            totalQuantity
            status {
              id
              nameAR
              nameFR
              nameEN
              group
              color
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_LIST_LITE = gql`
  query GetProductsListLite($advancedFilter: JSON, $pagination: Pagination) {
    allProduct(advancedFilter: $advancedFilter, pagination: $pagination) {
      data {
        id
        name
        thumbnail
        sku
        price
        quantity
      }
      total
    }
  }
`;

export const GET_PRODUCT_ANALYTICS_SINGLE = gql`
  query GetProductAnalyticsSingle($id: ID!) {
    productAnalytics(id: $id) {
        id
        name
        cost
        ordinary {
            leads
            units
            confirmed
            confirmedUnits
            delivered
            deliveredUnits
            confirmationRate
            deliveryRate
        }
        abandoned {
            leads
            units
            confirmed
            confirmedUnits
            delivered
            deliveredUnits
            confirmationRate
            deliveryRate
        }
        variants {
            name
            sku
            sellingPrice
            cost
            revenue
            ordinary {
                leads
            }
            abandoned {
                leads
            }
        }
    }
  }
`;

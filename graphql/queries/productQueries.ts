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

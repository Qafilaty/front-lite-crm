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
      allQuantity
      quantityInStock
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
        allQuantity
        quantityInStock
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
    $filter: [Filter]
    $pagination: Pagination
  ) {
    allProduct(filter: $filter, pagination: $pagination) {
      data {
        id
        thumbnail
        name
        sku
        allQuantity
        quantityInStock
        status
        note
        variants {
          id
          name
          type
        }
        variantsProbability {
          id
          name
          sku
          price
          cost
          allQuantity
          quantityInStock
        }
        createdAt
        updatedAt
      }
      total
    }
  }
`;

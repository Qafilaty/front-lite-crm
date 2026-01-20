import { gql } from '@apollo/client';

/**
 * Product Mutations
 * عمليات إدارة المنتجات (إنشاء، تحديث، حذف)
 */
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($content: contentProduct!) {
    createProduct(content: $content) {
      id
      name
      sku
      thumbnail
      price
      cost
      status
      note
      allQuantity
      quantityInStock
      createdAt
      variantsProbability {
        id
        name
        sku
        price
        cost
        quantity: quantityInStock
        isDefault
      }
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $content: contentProduct!) {
    updateProduct(id: $id, content: $content) {
      status
      data {
        id
        name
        sku
        thumbnail
        price
        cost
        status
        note
        allQuantity
        quantityInStock
        variantsProbability {
          id
          name
          sku
          price
          cost
          quantity: quantityInStock
          isDefault
        }
      }
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      status
    }
  }
`;

export const DELETE_MULTI_PRODUCT = gql`
  mutation DeleteMultiProduct($id: [ID!]!) {
    deleteMultiProduct(id: $id) {
      status
    }
  }
`;

export const DELETE_VARIANTS_PROBABILITY_PRODUCT = gql`
  mutation DeleteVariantsProbabilityProduct(
    $idProduct: ID!
    $id: ID!
  ) {
    deleteVariantsProbabilityProduct(idProduct: $idProduct, id: $id) {
      status
    }
  }
`;

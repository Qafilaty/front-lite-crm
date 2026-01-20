import { gql } from '@apollo/client';

export const GET_INVOICE = gql`
  query Invoice($id: ID) {
    invoice(id: $id) {
      id
      plan
      price
      discount
      proof
      paymentMethod
      currency
      status
      dateExpiry
      createdAt
      updatedAt
      coupon {
        id
        code
        discount
      }
    }
  }
`;

export const GET_ALL_INVOICES = gql`
  query AllInvoice($filter: [Filter], $pagination: Pagination) {
    allInvoice(filter: $filter, pagination: $pagination) {
      data {
        id
        plan
        price
        discount
        proof
        paymentMethod
        currency
        status
        dateExpiry
        createdAt
        updatedAt
        coupon {
          id
          code
          discount
        }
      }
      total
    }
  }
`;

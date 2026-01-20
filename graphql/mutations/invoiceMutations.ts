import { gql } from '@apollo/client';

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($content: contentInvoice!) {
    createInvoice(content: $content) {
      id
      plan
      price
      status
      paymentMethod
      currency
      createdAt
    }
  }
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $content: contentInvoice!) {
    updateInvoice(id: $id, content: $content) {
      status
      data {
        id
        status
        proof
      }
    }
  }
`;

export const CHANGE_STATUS_INVOICE = gql`
  mutation ChangeStatusInvoice($id: ID!, $status: String!) {
    changeStatusInvoice(id: $id, status: $status) {
      status
      data {
        id
        status
      }
    }
  }
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id) {
      status
    }
  }
`;

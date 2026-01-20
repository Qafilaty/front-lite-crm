import { gql } from '@apollo/client';

export const CREATE_FINANCIAL_TRANSACTION = gql`
  mutation CreateFinancialTransaction($content: contentFinancialTransaction!) {
    createFinancialTransaction(content: $content) {
      id
      amount
      category
      note
      type
      createdAt
    }
  }
`;

export const UPDATE_FINANCIAL_TRANSACTION = gql`
  mutation UpdateFinancialTransaction($id: ID!, $content: contentFinancialTransaction!) {
    updateFinancialTransaction(id: $id, content: $content) {
      status
      data {
        id
        amount
        category
        note
        type
        updatedAt
      }
    }
  }
`;

export const DELETE_FINANCIAL_TRANSACTION = gql`
  mutation DeleteFinancialTransaction($id: ID!) {
    deleteFinancialTransaction(id: $id) {
      status
    }
  }
`;

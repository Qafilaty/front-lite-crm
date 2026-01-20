import { gql } from '@apollo/client';

export const GET_ALL_FINANCIAL_TRANSACTIONS = gql`
  query GetAllFinancialTransactions($idCompany: ID, $filter: [Filter], $pagination: Pagination) {
    allFinancialTransactions(idCompany: $idCompany, filter: $filter, pagination: $pagination) {
      data {
        id
        amount
        category
        note
        type
        company {
          id
          name
        }
        createdBy {
          id
          name
        }
        createdAt
        updatedAt
      }
      total
      totalIncome
      totalExpense
      balance
    }
  }
`;

export const GET_FINANCIAL_TRANSACTION = gql`
  query GetFinancialTransaction($id: ID!) {
    financialTransaction(id: $id) {
      id
      amount
      category
      note
      type
      company {
        id
        name
      }
      createdAt
    }
  }
`;

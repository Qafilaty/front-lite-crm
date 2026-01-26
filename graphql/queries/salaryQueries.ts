import { gql } from '@apollo/client';

export const GET_ALL_SALARIES = gql`
  query GetAllSalaries($filter: [Filter], $pagination: Pagination) {
    allSalaries(filter: $filter, pagination: $pagination) {
      data {
        id
        ordersCount
        orderPrice
        total
        note
        user {
          id
          name
        }
        date
        createdAt
      }
      total
      totalAmount
    }
  }
`;

export const GET_SALARY = gql`
  query GetSalary($id: ID!) {
    salary(id: $id) {
      id
      ordersCount
      orderPrice
      total
      note
      user {
        id
        name
      }
      date
      createdAt
    }
  }
`;


export const CREATE_SALARY = gql`
  mutation CreateSalary($content: contentSalary!) {
    createSalary(content: $content) {
      id
      ordersCount
      orderPrice
      total
      note
      user {
        id
        name
      }
      date
      createdAt
    }
  }
`;

export const UPDATE_SALARY = gql`
  mutation UpdateSalary($id: ID!, $content: contentSalary!) {
    updateSalary(id: $id, content: $content) {
      status
      data {
        id
        ordersCount
        orderPrice
        total
        note
        user {
          id
          name
        }
        date
        createdAt
      }
    }
  }
`;

export const DELETE_SALARY = gql`
  mutation DeleteSalary($id: ID!) {
    deleteSalary(id: $id) {
      status
    }
  }
`;

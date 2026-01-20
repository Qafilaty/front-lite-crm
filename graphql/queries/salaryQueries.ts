import { gql } from '@apollo/client';

export const GET_ALL_SALARIES = gql`
  query GetAllSalaries($idCompany: ID, $filter: [Filter], $pagination: Pagination) {
    allSalaries(idCompany: $idCompany, filter: $filter, pagination: $pagination) {
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

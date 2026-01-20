import { gql } from '@apollo/client';

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
        updatedAt
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

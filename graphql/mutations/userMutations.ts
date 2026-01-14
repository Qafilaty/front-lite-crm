import { gql } from '@apollo/client';

/**
 * User Mutations
 * عمليات إدارة المستخدمين (إنشاء، تحديث، حذف)
 */
export const CREATE_USER = gql`
  mutation CreateUser($content: contentUser!) {
    createUser(content: $content) {
      id
      name
      email
      phone
      role
      createdAt
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $content: contentProfile!) {
    updateUser(id: $id, content: $content) {
      status
      data {
        id
        name
        email
        phone
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      status
    }
  }
`;

export const UPDATE_MY_PASSWORD = gql`
  mutation UpdateMyPassword($id: ID!, $content: contentPassword!) {
    updateMyPassword(id: $id, content: $content) {
      status
    }
  }
`;

export const ACTIVE_USER = gql`
  mutation ActiveUser($id: ID!, $activation: Boolean!) {
    activeUser(id: $id, activation: $activation) {
      status
    }
  }
`;

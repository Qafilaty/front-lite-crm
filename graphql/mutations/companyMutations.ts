import { gql } from '@apollo/client';

/**
 * Company Mutations
 * عمليات إدارة الشركات
 */
export const CREATE_COMPANY_WITH_ADMIN = gql`
  mutation CreateCompanyWithAdmin($content: contentCompanyWithAdmin!) {
    createCompanyWithAdmin(content: $content) {
      company {
        id
        name
        activation
      }
      user {
        id
        name
        email
        role
        company {
          id
          name
        }
      }
      token
    }
  }
`;

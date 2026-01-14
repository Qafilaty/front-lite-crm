import { gql } from '@apollo/client';

/**
 * Authentication Mutations
 * عمليات المصادقة (تسجيل الخروج)
 * ملاحظة: 
 * - LOGIN موجود في queries/userQueries.ts لأنه Query وليس Mutation
 * - REFRESH_TOKEN موجود في queries/userQueries.ts لأنه Query وليس Mutation
 */
export const LOGOUT = gql`
  mutation Logout {
    logOut {
      status
    }
  }
`;

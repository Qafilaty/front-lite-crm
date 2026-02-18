import { gql } from '@apollo/client';

/**
 * Authentication Mutations
 * عمليات المصادقة (تسجيل الخروج)
 * ملاحظة: 
 * - LOGIN موجود في queries/userQueries.ts لأنه Query وليس Mutation
 * - REFRESH_TOKEN موجود في queries/userQueries.ts لأنه Query وليس Mutation
 */
// ... existing code ...
export const LOGOUT = gql`
  mutation Logout {
    logOut {
      status
    }
  }
`;

export const FORGET_PASSWORD = gql`
  mutation ForgetPassword($email: String!) {
    forgetPassword(email: $email) {
      status
    }
  }
`;

export const CHECK_OTP_PASSWORD = gql`
  mutation CheckOTPPassword($email: String!, $code: String!) {
    checkOTPPassword(email: $email, code: $code) {
      status
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($content: contentChangePassword!) {
    changePassword(content: $content) {
      status
    }
  }
`;

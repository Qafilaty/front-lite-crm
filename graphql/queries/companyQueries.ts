import { gql } from '@apollo/client';

export const GET_ALL_STATUS_COMPANY = gql`
  query AllStatusCompany {
    allStatusCompany {
      group
      listStatus {
        id
        nameAR
        nameFR
        nameEN
        color
        group
        style
        order
      }
    }
  }
`;

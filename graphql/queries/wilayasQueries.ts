import { gql } from '@apollo/client';

export const GET_ALL_WILAYAS = gql`
  query AllWilayas {
    allWilayas {
      id
      code
      name
      arName
      otherNames
      communes {
        id
        name
        arName
      }
    }
  }
`;

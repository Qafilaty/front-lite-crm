import { gql } from '@apollo/client';

/**
 * Delivery Company Queries
 * جميع استعلامات شركات التوصيل
 */
export const GET_DELIVERY_COMPANY = gql`
  query GetDeliveryCompany($id: ID!) {
    deliveryCompany(id: $id) {
      id
      name
      originalName
      logo
      active
      fromWilaya {
        idState
        name
        code
      }
      priceReturn
      company {
        id
        name
      }
      availableDeliveryCompany {
        id
        name
        logo
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_DELIVERY_COMPANIES = gql`
  query GetAllDeliveryCompanies($idCompany: ID!) {
    allDeliveryCompany(idCompany: $idCompany) {
      id
      name
      originalName
      logo
      active
      fromWilaya {
        idState
        name
        code
      }
      createdAt
    }
  }
`;

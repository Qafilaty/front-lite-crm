
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
      active
      fromWilaya {
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
        fields 
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_DELIVERY_COMPANIES = gql`
  query GetAllDeliveryCompanies {
    allDeliveryCompany {
      id
      name
      originalName
      active
      apiKey
      apiToken
      apiTenant
      apiUserGuid
      apiUrl
      availableDeliveryCompany {
        id
        name
        logo
        fields
      }
      fromWilaya {
        name
        code
      }
      createdAt
    }
  }
`;

export const GET_AVAILABLE_DELIVERY_COMPANIES = gql`
  query GetAvailableDeliveryCompanies {
    allAvailableDeliveryCompany {
       id
       name
       logo
       fields
    }
  }
`;

export const GET_DELIVERY_COMPANY_CENTER = gql`
  query GetDeliveryCompanyCenter($stateCode: String!, $idAvailableDeliveryCompany: ID!) {
    allDeliveryCompanyCenter(stateCode: $stateCode, idAvailableDeliveryCompany: $idAvailableDeliveryCompany) {
      id
      stateName
      stateCode
      communes {
        id
        name
        address
        commune
        codeCenter
      }
    }
  }
`;

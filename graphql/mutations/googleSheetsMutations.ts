import { gql } from '@apollo/client';

export const DELETE_GOOGLE_SHEETS = gql`
  mutation DeleteGoogleSheets($id: ID!) {
    deleteGoogleSheets(id: $id) {
      status
      data {
        id
      }
    }
  }
`;

export const CREATE_SHEETS_TO_GOOGLE_SHEETS = gql`
  mutation CreateSheetsToGoogleSheets($idGoogleSheets: ID!, $content: contentSheets!) {
    createSheetsToGoogleSheets(idGoogleSheets: $idGoogleSheets, content: $content) {
      status
      data {
        id
        sheets {
          id
          idFile
          nameSheet
          typeOrder
          autoSync
          lastRowSynced
          configWithOrderCollection {
            column
            field
          }
        }
      }
    }
  }
`;

export const UPDATE_SHEETS_TO_GOOGLE_SHEETS = gql`
  mutation UpdateSheetsToGoogleSheets($idGoogleSheets: ID!, $id: ID!, $content: contentSheets!) {
    updateSheetsToGoogleSheets(idGoogleSheets: $idGoogleSheets, id: $id, content: $content) {
      status
      data {
        id
        sheets {
          id
          idFile
          nameSheet
          typeOrder
          autoSync
          lastRowSynced
          configWithOrderCollection {
            column
            field
          }
        }
      }
    }
  }
`;

export const CREATE_SPREADSHEET_FILE = gql`
  mutation CreateSpreadsheetFile($idGoogleSheets: ID!, $title: String!) {
    createSpreadsheetFile(idGoogleSheets: $idGoogleSheets, title: $title) {
      id
      name
    }
  }
`;

export const DELETE_SHEETS_FROM_GOOGLE_SHEETS = gql`
  mutation DeleteSheetsFromGoogleSheets($idGoogleSheets: ID!, $id: ID!) {
    deleteSheetsFromGoogleSheets(idGoogleSheets: $idGoogleSheets, id: $id) {
       status
       data {
         id
         sheets {
            id
            idFile
            nameSheet
            typeOrder
         }
       }
    }
  }
`;

export const CREATE_MULTI_ORDER_FROM_SHEETS = gql`
  mutation CreateMultiOrderFromSheets($idGoogleSheets: ID!, $idSheets: ID!, $startRow: Int!) {
    createMultiOrderFromSheets(idGoogleSheets: $idGoogleSheets, idSheets: $idSheets, startRow: $startRow) {
      status
    }
  }
`;

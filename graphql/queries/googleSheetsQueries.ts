import { gql } from '@apollo/client';

export const GET_ALL_GOOGLE_SHEETS = gql`
  query GetAllGoogleSheets {
    allGoogleSheets {
      id
      accessToken
      refreshToken
      email
      name
      avatar
      sheets {
        id
        idFile
        nameSheet
        typeOrder
        autoSync
        lastRowSynced
        configWithOrderCollection {
          id
          column
          field
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_SHEETS_SPREADSHEET = gql`
  query GetAllSheetsSpreadsheet($idGoogleSheets: ID, $spreadsheetId: ID) {
    allSheetsSpreadsheet(idGoogleSheets: $idGoogleSheets, spreadsheetId: $spreadsheetId) {
      id
      name
    }
  }
`;

export const GET_FIRST_ROW_SHEETS = gql`
  query FirstRowSheets($idGoogleSheets: ID, $spreadsheetId: ID, $sheetName: String) {
    firstRowSheets(idGoogleSheets: $idGoogleSheets, spreadsheetId: $spreadsheetId, sheetName: $sheetName)
  }
`;

export const GET_ALL_ROWS_SHEETS_WITH_FIRST_ROW = gql`
  query AllRowsSheetsWithFirstRow($idGoogleSheets: ID!, $spreadsheetId: ID!, $sheetName: String!, $startRow: Int!) {
    allRowsSheetsWithFirstRow(idGoogleSheets: $idGoogleSheets, spreadsheetId: $spreadsheetId, sheetName: $sheetName, startRow: $startRow)
  }
`;

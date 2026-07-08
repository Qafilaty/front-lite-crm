import { gql } from '@apollo/client';

export const ASK_CRM_AGENT = gql`
  query AskCRMAgent($message: String!) {
    askCRMAgent(message: $message)
  }
`;

export const GET_CRM_AGENT_HISTORY = gql`
  query GetCRMAgentHistory {
    getCRMAgentHistory {
      role
      content
      timestamp
    }
  }
`;

export const CLEAR_CRM_AGENT_HISTORY = gql`
  mutation ClearCRMAgentHistory {
    clearCRMAgentHistory
  }
`;

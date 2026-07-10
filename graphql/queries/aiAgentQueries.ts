import { gql } from '@apollo/client';

export const ASK_CRM_AGENT = gql`
  query AskCRMAgent($message: String!, $model: String) {
    askCRMAgent(message: $message, model: $model)
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

export const GET_CRM_AGENT_SUGGESTIONS = gql`
  query GetCRMAgentSuggestions {
    getCRMAgentSuggestions
  }
`;

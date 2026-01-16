import { gql } from '@apollo/client';

export const SINGLE_UPLOAD = gql`
  mutation SingleUpload($file: Upload!) {
    singleUpload(file: $file) {
      filename
      url
    }
  }
`;

export const MULTI_UPLOAD = gql`
  mutation MultiUpload($files: [Upload!]!) {
    multiUpload(files: $files) {
      filename
      url
    }
  }
`;

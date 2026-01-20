/**
 * GraphQL Mutations Index
 * تصدير جميع عمليات GraphQL من مكان واحد
 */

// Auth Mutations
// ملاحظة: 
// - LOGIN موجود في queries/userQueries.ts لأنه Query وليس Mutation
// - REFRESH_TOKEN موجود في queries/userQueries.ts لأنه Query وليس Mutation
export {
  LOGOUT,
} from './authMutations';

// User Mutations
export {
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  UPDATE_MY_PASSWORD,
  ACTIVE_USER,
} from './userMutations';

// Order Mutations
export {
  CREATE_ORDER,
  UPDATE_ORDER,
  CHANGE_STATUS_ORDER,
  DELETE_ORDER,
  DELETE_MULTI_ORDER,
  RETURNED_MULTI_ORDER,
  RETURNED_MULTI_ORDER_BY_TRACKING_CODE,
  DELIVERED_MULTI_ORDER,
  ADD_FEEDBACK_TO_ORDER,
  UPDATE_FEEDBACK_TO_ORDER,
  CHANGE_DELIVERY_TYPE_ORDER,
} from './orderMutations';

// Product Mutations
export {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  DELETE_MULTI_PRODUCT,
  DELETE_VARIANTS_PROBABILITY_PRODUCT,
} from './productMutations';

// Store Mutations
export {
  CREATE_STORE,
  UPDATE_STORE,
  DELETE_STORE,
} from './storeMutations';

// Delivery Company Mutations
export {
  CREATE_DELIVERY_COMPANY,
  UPDATE_DELIVERY_COMPANY,
  DELETE_DELIVERY_COMPANY,
  ADD_ORDER_TO_DELIVERY_COMPANY,
} from './deliveryCompanyMutations';

// Invoice Mutations
export {
  CREATE_INVOICE,
  UPDATE_INVOICE,
  CHANGE_STATUS_INVOICE,
  DELETE_INVOICE,
} from './invoiceMutations';

// Coupon Mutations
export {
  CREATE_COUPON,
  UPDATE_COUPON,
  DELETE_COUPON,
} from './couponMutations';

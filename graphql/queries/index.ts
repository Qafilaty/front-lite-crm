/**
 * GraphQL Queries Index
 * تصدير جميع استعلامات GraphQL من مكان واحد
 */

// User Queries
export {
  LOGIN,
  GET_CURRENT_USER,
  GET_ALL_USERS,
  GET_USER,
  REFRESH_TOKEN,
} from './userQueries';

// Order Queries
export {
  GET_ORDER,
  GET_ALL_ORDERS,
  SEARCH_ORDER,
} from './orderQueries';

// Product Queries
export {
  GET_PRODUCT,
  GET_ALL_PRODUCTS,
} from './productQueries';

// Store Queries
export {
  GET_STORE,
  GET_ALL_STORES,
} from './storeQueries';

// Delivery Company Queries
export {
  GET_DELIVERY_COMPANY,
  GET_ALL_DELIVERY_COMPANIES,
} from './deliveryCompanyQueries';

// Wilayas Queries
export {
  GET_ALL_WILAYAS,
} from './wilayasQueries';

// Company Queries
export {
  GET_ALL_STATUS_COMPANY,
} from './companyQueries';

// Invoice Queries
export {
  GET_INVOICE,
  GET_ALL_INVOICES,
} from './invoiceQueries';

// Coupon Queries
export {
  GET_COUPON,
  GET_COUPON_BY_CODE,
  GET_ALL_COUPONS,
} from './couponQueries';

// General Queries
export {
  GET_BASIC_STATISTICS,
} from './generalQueries';

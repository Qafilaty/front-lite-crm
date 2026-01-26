import { apolloClient } from '../lib/apolloClient';
import {
  LOGIN,
  REFRESH_TOKEN,
  GET_CURRENT_USER,
  GET_ALL_USERS,
  GET_USER,
  GET_ORDER,
  GET_ALL_ORDERS,
  SEARCH_ORDER,
  GET_PRODUCT,
  GET_ALL_PRODUCTS,
  GET_STORE,
  GET_ALL_STORES,
  GET_DELIVERY_COMPANY,
  GET_ALL_DELIVERY_COMPANIES,
  GET_ALL_WILAYAS,
  GET_BASIC_STATISTICS,
} from '../graphql/queries';
import {
  GET_ALL_FINANCIAL_TRANSACTIONS,
  GET_FINANCIAL_TRANSACTION,
} from '../graphql/queries/financialTransactionQueries';
import {
  GET_ALL_SALARIES,
  GET_SALARY,
} from '../graphql/queries/salaryQueries';
import {
  GET_ALL_DELIVERY_PRICE_COMPANY,
} from '../graphql/queries/deliveryQueries';
import {
  LOGOUT,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  ACTIVE_USER,
  CREATE_ORDER,
  UPDATE_ORDER,
  CHANGE_STATUS_ORDER,
  DELETE_ORDER,
  DELETE_MULTI_ORDER,
  RETURNED_MULTI_ORDER,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  DELETE_MULTI_PRODUCT,
  CREATE_STORE,
  UPDATE_STORE,
  DELETE_STORE,
  CREATE_DELIVERY_COMPANY,
  UPDATE_DELIVERY_COMPANY,
  DELETE_DELIVERY_COMPANY,
  ADD_ORDER_TO_DELIVERY_COMPANY,
  CREATE_COMPANY_WITH_ADMIN,
} from '../graphql/mutations';
import {
  CREATE_FINANCIAL_TRANSACTION,
  UPDATE_FINANCIAL_TRANSACTION,
  DELETE_FINANCIAL_TRANSACTION,
} from '../graphql/mutations/financialTransactionMutations';
import {
  CREATE_SALARY,
  UPDATE_SALARY,
  DELETE_SALARY,
} from '../graphql/mutations/salaryMutations';
import {
  CREATE_DELIVERY_PRICE,
  UPDATE_DELIVERY_PRICE,
} from '../graphql/mutations/deliveryMutations';
import {
  GET_INVOICE,
  GET_ALL_INVOICES,
  GET_COUPON,
  GET_COUPON_BY_CODE,
  GET_ALL_COUPONS,
} from '../graphql/queries';
import {
  CREATE_INVOICE,
  UPDATE_INVOICE,
  CHANGE_STATUS_INVOICE,
  DELETE_INVOICE,
  CREATE_COUPON,
  UPDATE_COUPON,
  DELETE_COUPON,
} from '../graphql/mutations';
import type { User, Order, Product } from '../types';

// Auth Service
export const authService = {
  async login(email: string, password: string, firebaseToken?: string) {
    try {
      const { data } = await apolloClient.query({
        query: LOGIN,
        variables: {
          content: {
            email,
            password,
            firebaseToken,
          },
        },
      });

      if (data?.logIn?.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.logIn.token);
        return {
          success: true,
          user: data.logIn.user,
          token: data.logIn.token,
        };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  },

  async logout() {
    try {
      await apolloClient.mutate({
        mutation: LOGOUT,
      });
      localStorage.removeItem('authToken');
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      return { success: true }; // Always clear local storage
    }
  },

  async getCurrentUser() {
    try {
      const { data } = await apolloClient.query({
        query: GET_CURRENT_USER,
        fetchPolicy: 'network-only',
      });
      return { success: true, user: data?.currentUser };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message };
    }
  },

  async refreshToken() {
    try {
      const { data } = await apolloClient.query({
        query: REFRESH_TOKEN,

      });
      if (data?.refreshToken?.token) {
        localStorage.setItem('authToken', data.refreshToken.token);
        return { success: true, token: data.refreshToken.token };
      }
      return { success: false };
    } catch (error: any) {
      console.error('Refresh token error:', error);
      return { success: false, error: error.message };
    }
  },

  async signup(dataInput: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_COMPANY_WITH_ADMIN,
        variables: { content: dataInput },
      });

      if (data?.createCompanyWithAdmin?.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.createCompanyWithAdmin.token);
        return {
          success: true,
          user: data.createCompanyWithAdmin.user,
          company: data.createCompanyWithAdmin.company,
          token: data.createCompanyWithAdmin.token,
        };
      }

      return { success: false, error: 'Signup failed' };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Signup failed',
      };
    }
  },
};

// User Service
export const userService = {
  async getAllUsers() {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_USERS,
        fetchPolicy: 'network-only',
      });
      return { success: true, users: data?.allUser || [] };
    } catch (error: any) {
      console.error('Get all users error:', error);
      return { success: false, error: error.message, users: [] };
    }
  },

  async getUser(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER,
        variables: { id },

      });
      return { success: true, user: data?.user };
    } catch (error: any) {
      console.error('Get user error:', error);
      return { success: false, error: error.message };
    }
  },

  async createUser(userData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_USER,
        variables: { content: userData },
      });
      return { success: true, user: data?.createUser };
    } catch (error: any) {
      console.error('Create user error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateUser(id: string, userData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_USER,
        variables: { id, content: userData },
      });
      return { success: data?.updateUser?.status, user: data?.updateUser?.data };
    } catch (error: any) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteUser(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_USER,
        variables: { id },
      });
      return { success: data?.deleteUser?.status };
    } catch (error: any) {
      console.error('Delete user error:', error);
      return { success: false, error: error.message };
    }
  },

  async activeUser(id: string, activation: boolean) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: ACTIVE_USER,
        variables: { id, activation },
      });
      return { success: data?.activeUser?.status };
    } catch (error: any) {
      console.error('Active user error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Order Service
export const orderService = {
  async getAllOrders(
    options?: {
      filter?: any[];
      pagination?: { limit: number; page: number };
      advancedFilter?: any;
      advancedSort?: any;
    }
  ) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_ORDERS,
        variables: {
          ...options,
        },

      });
      return {
        success: true,
        orders: data?.allOrder?.data || [],
        total: data?.allOrder?.total || 0,
        numberDeferredOrder: data?.allOrder?.numberDeferredOrder || 0,
      };
    } catch (error: any) {
      console.error('Get all orders error:', error);
      return {
        success: false,
        error: error.message,
        orders: [],
        total: 0,
        numberDeferredOrder: 0,
      };
    }
  },

  async getOrder(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ORDER,
        variables: { id },

      });
      return { success: true, order: data?.order };
    } catch (error: any) {
      console.error('Get order error:', error);
      return { success: false, error: error.message };
    }
  },

  async searchOrder(trackingCode: string) {
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_ORDER,
        variables: { trackingCode },

      });
      return {
        success: data?.searchOrder?.status,
        order: data?.searchOrder?.data,
      };
    } catch (error: any) {
      console.error('Search order error:', error);
      return { success: false, error: error.message };
    }
  },

  async createOrder(orderData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_ORDER,
        variables: { content: orderData },
      });
      return { success: true, order: data?.createOrder };
    } catch (error: any) {
      console.error('Create order error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateOrder(id: string, orderData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ORDER,
        variables: { id, content: orderData },
      });
      return {
        success: data?.updateOrder?.status,
        order: data?.updateOrder?.data,
      };
    } catch (error: any) {
      console.error('Update order error:', error);
      return { success: false, error: error.message };
    }
  },

  async changeStatusOrder(id: string, statusData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CHANGE_STATUS_ORDER,
        variables: { id, content: statusData },
      });
      return {
        success: data?.changeStatusOrder?.status,
        order: data?.changeStatusOrder?.data,
      };
    } catch (error: any) {
      console.error('Change status order error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteOrder(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_ORDER,
        variables: { id },
      });
      return { success: data?.deleteOrder?.status };
    } catch (error: any) {
      console.error('Delete order error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteMultiOrder(ids: string[]) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_MULTI_ORDER,
        variables: { id: ids },
      });
      return { success: data?.deleteMultiOrder?.status };
    } catch (error: any) {
      console.error('Delete multi order error:', error);
      return { success: false, error: error.message };
    }
  },

  async returnedMultiOrder(ids: string[]) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: RETURNED_MULTI_ORDER,
        variables: { ids },
      });
      return { success: true, orders: data?.returnedMultiOrder || [] };
    } catch (error: any) {
      console.error('Returned multi order error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Product Service
export const productService = {
  async getAllProducts(
    options?: {
      advancedFilter?: any;
      pagination?: { limit: number; page: number };
    }
  ) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_PRODUCTS,
        variables: {
          ...options,
        },
        fetchPolicy: 'network-only',
      });
      return {
        success: true,
        products: data?.allProduct?.data || [],
        total: data?.allProduct?.total || 0,
      };
    } catch (error: any) {
      console.error('Get all products error:', error);
      return {
        success: false,
        error: error.message,
        products: [],
        total: 0,
      };
    }
  },

  async getProduct(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_PRODUCT,
        variables: { id },

      });
      return { success: true, product: data?.product };
    } catch (error: any) {
      console.error('Get product error:', error);
      return { success: false, error: error.message };
    }
  },

  async createProduct(productData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PRODUCT,
        variables: { content: productData },
      });
      return { success: true, product: data?.createProduct };
    } catch (error: any) {
      console.error('Create product error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateProduct(id: string, productData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PRODUCT,
        variables: { id, content: productData },
      });
      return {
        success: data?.updateProduct?.status,
        product: data?.updateProduct?.data,
      };
    } catch (error: any) {
      console.error('Update product error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteProduct(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_PRODUCT,
        variables: { id },
      });
      return { success: data?.deleteProduct?.status };
    } catch (error: any) {
      console.error('Delete product error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteMultiProduct(ids: string[]) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_MULTI_PRODUCT,
        variables: { id: ids },
      });
      return { success: data?.deleteMultiProduct?.status };
    } catch (error: any) {
      console.error('Delete multi product error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Store Service
export const storeService = {
  async getAllStores() {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_STORES,
        fetchPolicy: 'network-only',
      });
      return { success: true, stores: data?.allStore || [] };
    } catch (error: any) {
      console.error('Get all stores error:', error);
      return { success: false, error: error.message, stores: [] };
    }
  },

  async getStore(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_STORE,
        variables: { id },

      });
      return { success: true, store: data?.store };
    } catch (error: any) {
      console.error('Get store error:', error);
      return { success: false, error: error.message };
    }
  },

  async createStore(storeData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_STORE,
        variables: { content: storeData },
      });
      return { success: true, store: data?.createStore };
    } catch (error: any) {
      console.error('Create store error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateStore(id: string, storeData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_STORE,
        variables: { id, content: storeData },
      });
      return {
        success: data?.updateStore?.status,
        store: data?.updateStore?.data,
      };
    } catch (error: any) {
      console.error('Update store error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteStore(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_STORE,
        variables: { id },
      });
      return { success: data?.deleteStore?.status };
    } catch (error: any) {
      console.error('Delete store error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Delivery Company Service
export const deliveryCompanyService = {
  async getAllDeliveryCompanies() {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_DELIVERY_COMPANIES,
        fetchPolicy: 'network-only',
      });
      return { success: true, deliveryCompanies: data?.allDeliveryCompany || [] };
    } catch (error: any) {
      console.error('Get all delivery companies error:', error);
      return { success: false, error: error.message, deliveryCompanies: [] };
    }
  },

  async getDeliveryCompany(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_DELIVERY_COMPANY,
        variables: { id },

      });
      return { success: true, deliveryCompany: data?.deliveryCompany };
    } catch (error: any) {
      console.error('Get delivery company error:', error);
      return { success: false, error: error.message };
    }
  },

  async createDeliveryCompany(deliveryCompanyData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_DELIVERY_COMPANY,
        variables: { content: deliveryCompanyData },
      });
      return { success: true, deliveryCompany: data?.createDeliveryCompany };
    } catch (error: any) {
      console.error('Create delivery company error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateDeliveryCompany(id: string, deliveryCompanyData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_DELIVERY_COMPANY,
        variables: { id, content: deliveryCompanyData },
      });
      return {
        success: data?.updateDeliveryCompany?.status,
        deliveryCompany: data?.updateDeliveryCompany?.data,
      };
    } catch (error: any) {
      console.error('Update delivery company error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteDeliveryCompany(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_DELIVERY_COMPANY,
        variables: { id },
      });
      return { success: data?.deleteDeliveryCompany?.status };
    } catch (error: any) {
      console.error('Delete delivery company error:', error);
      return { success: false, error: error.message };
    }
  },

  async addOrderToDeliveryCompany(idDeliveryCompany: string, orderIds: string[]) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: ADD_ORDER_TO_DELIVERY_COMPANY,
        variables: {
          idDeliveryCompany,
          ids: orderIds
        }
      });
      return {
        success: true,
        data: data?.addOrderToDeliveryCompany
      };
    } catch (error: any) {
      console.error('Add order to delivery company error:', error);
      return { success: false, error: error.message };
    }
  },
};


// General Service
export const generalService = {
  async getBasicStatistics() {
    try {
      const { data } = await apolloClient.query({
        query: GET_BASIC_STATISTICS,
        fetchPolicy: 'network-only',
      });
      return { success: true, stats: data?.basicStatistics };
    } catch (error: any) {
      console.error('Get basic statistics error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Wilayas Service
export const wilayasService = {
  async getAllWilayas() {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_WILAYAS,
        fetchPolicy: 'cache-first',
      });
      return { success: true, wilayas: data?.allWilayas || [] };
    } catch (error: any) {
      console.error('Get all wilayas error:', error);
      return { success: false, error: error.message, wilayas: [] };
    }
  },
};

// Delivery Pricing Service
export const deliveryPricingService = {
  async getAllDeliveryPriceCompany() {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_DELIVERY_PRICE_COMPANY,

      });
      return { success: true, deliveryPrices: data?.allDeliveryPriceCompany?.data || [] };
    } catch (error: any) {
      console.error('Get all delivery prices error:', error);
      return { success: false, error: error.message, deliveryPrices: [] };
    }
  },

  async createDeliveryPrice(priceData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_DELIVERY_PRICE,
        variables: { content: priceData },
      });
      return { success: true, deliveryPrice: data?.createDeliveryPrice };
    } catch (error: any) {
      console.error('Create delivery price error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateDeliveryPrice(id: string, priceData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_DELIVERY_PRICE,
        variables: { id, content: priceData },
      });
      return {
        success: data?.updateDeliveryPrice?.status,
        deliveryPrice: data?.updateDeliveryPrice?.data,
      };
    } catch (error: any) {
      console.error('Update delivery price error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Financial Transaction Service
export const financialTransactionService = {
  async getAllFinancialTransactions(options?: { filter?: any[]; pagination?: { limit: number; page: number } }) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_FINANCIAL_TRANSACTIONS,
        variables: { ...options },
        fetchPolicy: 'network-only',
      });
      return {
        success: true,
        financialTransactions: data?.allFinancialTransactions?.data || [],
        total: data?.allFinancialTransactions?.total || 0,
        totalIncome: data?.allFinancialTransactions?.totalIncome || 0,
        totalExpense: data?.allFinancialTransactions?.totalExpense || 0,
        balance: data?.allFinancialTransactions?.balance || 0,
      };
    } catch (error: any) {
      console.error('Get all financial transactions error:', error);
      return { success: false, error: error.message, financialTransactions: [] };
    }
  },

  async createFinancialTransaction(transactionData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_FINANCIAL_TRANSACTION,
        variables: { content: transactionData },
      });
      return { success: true, financialTransaction: data?.createFinancialTransaction };
    } catch (error: any) {
      console.error('Create financial transaction error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateFinancialTransaction(id: string, transactionData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_FINANCIAL_TRANSACTION,
        variables: { id, content: transactionData },
      });
      return {
        success: data?.updateFinancialTransaction?.status,
        financialTransaction: data?.updateFinancialTransaction?.data,
      };
    } catch (error: any) {
      console.error('Update financial transaction error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteFinancialTransaction(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_FINANCIAL_TRANSACTION,
        variables: { id },
      });
      return { success: data?.deleteFinancialTransaction?.status };
    } catch (error: any) {
      console.error('Delete financial transaction error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Salary Service
export const salaryService = {
  async getAllSalaries(options?: { filter?: any[]; pagination?: { limit: number; page: number } }) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_SALARIES,
        variables: { ...options },
        fetchPolicy: 'network-only',
      });
      return {
        success: true,
        salaries: data?.allSalaries?.data || [],
        total: data?.allSalaries?.total || 0,
        totalAmount: data?.allSalaries?.totalAmount || 0,
      };
    } catch (error: any) {
      console.error('Get all salaries error:', error);
      return { success: false, error: error.message, salaries: [] };
    }
  },

  async createSalary(salaryData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_SALARY,
        variables: { content: salaryData },
      });
      return { success: !!data?.createSalary, salary: data?.createSalary };
    } catch (error: any) {
      console.error('Create salary error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateSalary(id: string, salaryData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_SALARY,
        variables: { id, content: salaryData },
      });
      return {
        success: data?.updateSalary?.status,
        salary: data?.updateSalary?.data,
      };
    } catch (error: any) {
      console.error('Update salary error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteSalary(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_SALARY,
        variables: { id },
      });
      return { success: data?.deleteSalary?.status };
    } catch (error: any) {
      console.error('Delete salary error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Invoice Service
export const invoiceService = {
  async getAllInvoices(options?: { filter?: any[]; pagination?: { limit: number; page: number } }) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_INVOICES,
        variables: { ...options },
        fetchPolicy: 'network-only',
      });
      return {
        success: true,
        invoices: data?.allInvoice?.data || [],
        total: data?.allInvoice?.total || 0,
      };
    } catch (error: any) {
      console.error('Get all invoices error:', error);
      return { success: false, error: error.message, invoices: [] };
    }
  },

  async getInvoice(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_INVOICE,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      return { success: true, invoice: data?.invoice };
    } catch (error: any) {
      console.error('Get invoice error:', error);
      return { success: false, error: error.message };
    }
  },

  async createInvoice(invoiceData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_INVOICE,
        variables: { content: invoiceData },
      });
      return { success: true, invoice: data?.createInvoice };
    } catch (error: any) {
      console.error('Create invoice error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateInvoice(id: string, invoiceData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_INVOICE,
        variables: { id, content: invoiceData },
      });
      return {
        success: data?.updateInvoice?.status,
        invoice: data?.updateInvoice?.data,
      };
    } catch (error: any) {
      console.error('Update invoice error:', error);
      return { success: false, error: error.message };
    }
  },

  async changeStatusInvoice(id: string, status: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CHANGE_STATUS_INVOICE,
        variables: { id, status },
      });
      return {
        success: data?.changeStatusInvoice?.status,
        invoice: data?.changeStatusInvoice?.data,
      };
    } catch (error: any) {
      console.error('Change status invoice error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteInvoice(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_INVOICE,
        variables: { id },
      });
      return { success: data?.deleteInvoice?.status };
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Coupon Service
export const couponService = {
  async getAllCoupons(options?: { pagination?: { limit: number; page: number } }) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_COUPONS,
        variables: { ...options },
        fetchPolicy: 'network-only',
      });
      return {
        success: true,
        coupons: data?.allCoupon?.data || [],
        total: data?.allCoupon?.total || 0,
      };
    } catch (error: any) {
      console.error('Get all coupons error:', error);
      return { success: false, error: error.message, coupons: [] };
    }
  },

  async getCoupon(id: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_COUPON,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      return { success: true, coupon: data?.coupon };
    } catch (error: any) {
      console.error('Get coupon error:', error);
      return { success: false, error: error.message };
    }
  },

  async getCouponByCode(code: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_COUPON_BY_CODE,
        variables: { code },
        fetchPolicy: 'network-only',
      });
      return { success: true, coupon: data?.couponByCode };
    } catch (error: any) {
      console.error('Get coupon by code error:', error);
      return { success: false, error: error.message };
    }
  },

  async createCoupon(couponData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_COUPON,
        variables: { content: couponData },
      });
      return { success: true, coupon: data?.createCoupon };
    } catch (error: any) {
      console.error('Create coupon error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateCoupon(id: string, couponData: any) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_COUPON,
        variables: { id, content: couponData },
      });
      return {
        success: data?.updateCoupon?.status,
        coupon: data?.updateCoupon?.data,
      };
    } catch (error: any) {
      console.error('Update coupon error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteCoupon(id: string) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_COUPON,
        variables: { id },
      });
      return { success: data?.deleteCoupon?.status };
    } catch (error: any) {
      console.error('Delete coupon error:', error);
      return { success: false, error: error.message };
    }
  },
};

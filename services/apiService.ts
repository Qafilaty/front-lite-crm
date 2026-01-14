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
} from '../graphql/queries';
import {
  LOGOUT,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
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
        fetchPolicy: 'network-only',
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
        fetchPolicy: 'network-only',
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
};

// Order Service
export const orderService = {
  async getAllOrders(
    idCompany: string,
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
          idCompany,
          ...options,
        },
        fetchPolicy: 'network-only',
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
        fetchPolicy: 'network-only',
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
        fetchPolicy: 'network-only',
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
    idCompany: string,
    options?: {
      filter?: any[];
      pagination?: { limit: number; page: number };
    }
  ) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_PRODUCTS,
        variables: {
          idCompany,
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
        fetchPolicy: 'network-only',
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
  async getAllStores(idCompany: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_STORES,
        variables: { idCompany },
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
        fetchPolicy: 'network-only',
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
  async getAllDeliveryCompanies(idCompany: string) {
    try {
      const { data } = await apolloClient.query({
        query: GET_ALL_DELIVERY_COMPANIES,
        variables: { idCompany },
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
        fetchPolicy: 'network-only',
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
};

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
} from '../graphql/mutations';
import type { User, Order } from '../types';

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

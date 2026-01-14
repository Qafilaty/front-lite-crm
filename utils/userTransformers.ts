import { User } from '../types';

/**
 * Transform backend user data to frontend User type
 */
export const transformBackendUser = (user: any): User => {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone,
    role: user.role === 'admin' || user.role === 'owner' || user.role === 'superAdmin' ? 'admin' : 'confirmed_orders',
    joinedDate: user.createdAt || new Date().toISOString(),
    ordersLocked: user.role === 'confirmed_orders' ? false : undefined,
  };
};

/**
 * Transform array of backend users
 */
export const transformBackendUsers = (users: any[]): User[] => {
  return users.map(transformBackendUser);
};

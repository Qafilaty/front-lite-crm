import { useState, useEffect, useMemo } from 'react';
import { orderService, userService } from '../../../services/apiService';
import { transformBackendOrders } from '../../../utils';
import { Order, Product, User, Stats } from '../../../types';

interface UseDashboardDataReturn {
  orders: Order[];
  users: User[];
  inventory: Product[];
  stats: Stats;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and manage dashboard data
 */
export const useDashboardData = (companyId: string | undefined): UseDashboardDataReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch orders
        const ordersResult = await orderService.getAllOrders(companyId, {
          pagination: { limit: 50, page: 1 }
        });
        
        if (ordersResult.success) {
          const transformedOrders = transformBackendOrders(ordersResult.orders);
          setOrders(transformedOrders);
        }

        // Fetch users
        const usersResult = await userService.getAllUsers();
        if (usersResult.success) {
          setUsers(usersResult.users || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalOrders: orders.length,
    revenue: orders.reduce((acc, curr) => acc + curr.amount, 0),
    lowStockItems: inventory.filter(p => p.stock < 10).length,
  }), [users, orders, inventory]);

  return {
    orders,
    users,
    inventory,
    stats,
    loading,
    error
  };
};

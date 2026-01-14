import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/apiService';
import { userService } from '../services/apiService';
import DashboardView from '../components/DashboardView';
import { SubscriptionTier, type Stats, type Order, type Product } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.PAY_AS_YOU_GO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.company?.id) return;

      try {
        setLoading(true);
        
        // جلب الطلبات
        const ordersResult = await orderService.getAllOrders(user.company.id, {
          pagination: { limit: 50, page: 1 }
        });
        if (ordersResult.success) {
          // تحويل البيانات من Backend إلى نوع Order
          const transformedOrders = ordersResult.orders.map((order: any) => ({
            id: order.id,
            customer: order.fullName || '',
            phone: order.phone || '',
            state: order.state?.name || '',
            municipality: order.city || '',
            address: order.address || '',
            deliveryType: order.deliveryType === 'home' ? 'home' : 'office',
            items: order.products?.map((p: any) => ({
              name: p.name || p.product?.name || '',
              variant: p.variantsProduct?.name || '',
              quantity: p.quantity || 0,
              price: p.price || 0,
            })) || [],
            shippingCost: order.deliveryPrice || 0,
            amount: order.totalPrice || 0,
            status: order.status || 'pending',
            storeName: order.store?.store?.name || '',
            notes: order.note,
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || new Date().toISOString(),
            lastStatusDate: order.updatedAtStatus || order.updatedAt || new Date().toISOString(),
            history: order.timeLine?.map((tl: any) => ({
              status: tl.status,
              date: tl.createdAt,
              note: tl.note,
              user: tl.user?.name || '',
            })) || [],
            trackingNumber: order.deliveryCompany?.trackingCode,
            carrier: order.deliveryCompany?.deliveryCompany?.name,
          }));
          setOrders(transformedOrders);
        }

        // جلب المستخدمين
        const usersResult = await userService.getAllUsers();
        if (usersResult.success) {
          setUsers(usersResult.users || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalOrders: orders.length,
    revenue: orders.reduce((acc, curr) => acc + curr.amount, 0),
    lowStockItems: inventory.filter(p => p.stock < 10).length,
  }), [users, orders, inventory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 font-bold">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardView
      stats={stats}
      orders={orders}
      inventory={inventory}
      subscriptionTier={subscriptionTier}
      onUpgrade={() => {
        // يمكن إضافة منطق الترقية هنا
        console.log('Upgrade clicked');
      }}
    />
  );
};

export default DashboardPage;

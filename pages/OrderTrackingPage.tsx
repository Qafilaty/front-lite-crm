import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/apiService';
import OrderTrackingView from '../components/OrderTrackingView';
import type { Order } from '../types';

const OrderTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.company?.id) return;

      try {
        setLoading(true);
        const result = await orderService.getAllOrders(user.company.id, {
          pagination: { limit: 100, page: 1 }
        });

        if (result.success) {
          // تحويل البيانات من Backend إلى نوع Order
          const transformedOrders = result.orders.map((order: any) => ({
            id: order.id,
            customer: order.fullName || '',
            phone: order.phone || '',
            state: order.state?.name || '',
            city: order.city || '',
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
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const handleSetOrders = async (newOrders: Order[]) => {
    setOrders(newOrders);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 font-bold">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return <OrderTrackingView orders={orders} setOrders={handleSetOrders} />;
};

export default OrderTrackingPage;

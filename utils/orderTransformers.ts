import { Order } from '../types';

/**
 * Transform backend order data to frontend Order type
 */
export const transformBackendOrder = (order: any): Order => {
  return {
    id: order.id,
    numberOrder: order.numberOrder,
    customer: order.fullName || '',
    fullName: order.fullName,
    phone: order.phone || '',
    phone2: order.phone2,
    state: order.state || '', // Changed to allow object if backend sends it
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
    deliveryPrice: order.deliveryPrice,
    amount: order.totalPrice || 0,
    totalPrice: order.totalPrice,
    subTotalPrice: order.subTotalPrice,
    totalQuantity: order.totalQuantity,
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
    deliveryCompany: order.deliveryCompany,
  };
};

/**
 * Transform array of backend orders
 */
export const transformBackendOrders = (orders: any[]): Order[] => {
  return orders.map(transformBackendOrder);
};


export enum SubscriptionTier {
  NONE = 'none',
  PAY_AS_YOU_GO = 'pay_as_you_go',
  PRO = 'pro',
  PREMIUM = 'premium'
}

export enum View {
  DASHBOARD = 'dashboard',
  USERS = 'users',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_TRACKING = 'order_tracking',
  INVENTORY = 'inventory',
  SHIPPING_CARRIERS = 'shipping_carriers',
  SHIPPING_PRICING = 'shipping_pricing',
  STORE_LINKING = 'store_linking',
  API_DOCS = 'api_docs',
  SUBSCRIPTIONS = 'subscriptions',
  LOGIN = 'login',
  REGISTER = 'register'
}

export interface OrderItem {
  name: string;
  variant: string;
  quantity: number;
  price: number;
}

export interface OrderLog {
  status: OrderStatus;
  date: string;
  note: string;
  user: string;
}

export type OrderStatus = 
  | 'pending' // معلقة
  | 'failed_01' // فاشلة 01
  | 'failed_02' // فاشلة 02
  | 'failed_03' // فاشلة 03
  | 'confirmed' // مؤكدة
  | 'cancelled' // ملغاة
  | 'postponed' // مؤجلة
  | 'duplicate' // مكررة
  | 'failed_04' // فاشلة 04
  | 'failed_05' // فاشلة 05
  | 'wrong_number' // رقم خاطئ
  | 'wrong_order' // طلب خاطئ
  | 'message_sent' // تم إرسال الرسالة
  | 'out_of_stock' // غير متوفر في المخزون
  | 'processing' // جاري التجهيز
  | 'en_preparation' // قيد التجهيز (تتبع)
  | 'ramasse' // تم الاستلام من المتجر
  | 'sorti_livraison' // خرج للتوصيل
  | 'delivered' // تم التوصيل
  | 'annule' // ملغى (تتبع)
  | 'tentative_01' // محاولة 01
  | 'tentative_02' // محاولة 02
  | 'tentative_03' // محاولة 03
  | 'reporte_01' // مؤجل 01
  | 'client_absent' // العميل غائب
  | 'wrong_address' // عنوان خاطئ
  | 'retour_vendeur' // في طريق العودة للبائع
  | 'retourne_vendeur' // تم الإرجاع للبائع
  | 'paid' // تم الدفع
  | 'shipped';

export interface Order {
  id: string;
  customer: string;
  phone: string;
  state: string;
  municipality: string;
  address: string;
  deliveryType: 'home' | 'office';
  items: OrderItem[];
  shippingCost: number;
  amount: number;
  status: OrderStatus;
  storeName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastStatusDate: string;
  history?: OrderLog[];
  trackingNumber?: string;
  carrier?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'confirmed_orders';
  joinedDate: string;
  ordersLocked?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  category: string;
  variants?: ProductVariant[];
}

export interface Stats {
  totalUsers: number;
  totalOrders: number;
  revenue: number;
  lowStockItems: number;
}

export interface StatePricing {
  id: number;
  name: string;
  homePrice: number;
  officePrice: number;
}

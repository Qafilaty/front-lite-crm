
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
  ORDER_ABANDONED = 'order_abandoned',
  INVENTORY = 'inventory',
  SHIPPING_CARRIERS = 'shipping_carriers',
  SHIPPING_PRICING = 'shipping_pricing',
  STORE_LINKING = 'store_linking',
  API_DOCS = 'api_docs',
  SUBSCRIPTIONS = 'subscriptions',
  LOGIN = 'login',
  REGISTER = 'register',
  FINANCES = 'finances',
  FINANCIAL_STATS = 'financial_stats',
  SALARIES = 'salaries',
  INTEGRATION_SETTINGS = 'integration_settings'
}

export interface OrderItem {
  id?: string;
  productId?: string;
  // Mapped from backend logic
  variantId?: string;
  idVariantsProduct?: string;
  sku?: string;

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

export interface StatusOrderObject {
  id?: string;
  nameAR?: string;
  nameEN?: string;
  nameFR?: string;
  color?: string;
  group?: string;
}

export interface Order {
  id: string;
  numberOrder?: string;
  customer: string; // derived from fullName
  fullName?: string; // backend field
  phone: string;
  phone2?: string;
  duplicatePhone?: number;
  state: string | { name: string; code?: string; idState?: string };
  city: string;
  address: string;
  deliveryType: 'home' | 'inDesk';
  items?: OrderItem[];
  products?: any[]; // Matches backend structure
  shippingCost: number; // deliveryPrice
  deliveryPrice?: number; // backend field
  amount: number; // totalPrice
  totalPrice?: number; // backend field
  subTotalPrice?: number;
  totalQuantity?: number;
  discount?: number;
  weight?: number;
  status: OrderStatus | StatusOrderObject;
  storeName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastStatusDate: string;
  history?: OrderLog[];
  confirmationTimeLine?: OrderLog[];
  deliveryTimeLine?: OrderLog[];
  trackingNumber?: string;
  postponementDate?: string;
  carrier?: string;
  deliveryCompany?: {
    deliveryCompany: DeliveryCompany;
    status?: string;
    trackingCode?: string;
  };
  confirmed?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'confirmed' | 'owner';
  joinedDate: string;
  ordersLocked?: boolean;
  activation?: boolean;
  numberDeliveredOrder?: number;
  orderPrice?: number;
  company?: {
    id: string;
    name: string;
    plans?: {
      name?: string;
      dateExpiry?: string;
      pointes?: number;
    };
  };
}

export interface VariantValue {
  name: string;
  value: string;
}

// Corresponds to 'VariantsProduct' in backend (e.g. Color, Size definitions)
export interface ProductVariantDefinition {
  id?: string;
  name: string;
  type: string;
  value: VariantValue[];
}

// Corresponds to 'VariantsProbabilityProduct' in backend (e.g. Red-XL)
export interface ProductVariantProbability {
  _id?: string; // Backend uses _id for input sometimes, check schema
  id?: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number; // Mapped to quantityInStock or allQuantity
  isDefault?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price?: number;
  cost?: number;
  pricePurchase?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity?: number;
  stock?: number; // Legacy, use quantity
  price: number;
  category: string;
  thumbnail?: string; // Added
  variants?: ProductVariantDefinition[]; // New structure
  variantsProbability?: ProductVariantProbability[]; // New structure
  // Legacy or simplified variants for list view if needed
  oldVariants?: ProductVariant[];
  cost?: number;
  pricePurchase?: number;
  description?: string;
  note?: string;
  status?: boolean;
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

export interface Commune {
  id: string;
  name: string;
  arName: string;
  postcode: number;
}

export interface Wilaya {
  id: string;
  code: string;
  name: string;
  arName: string;
  otherNames?: string[];
  communes?: Commune[];
}
export interface Store {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  status?: boolean;
  url?: string;
  typeOrder?: string;
  company?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
  typeStore?: string;
}

export interface AvailableDeliveryCompany {
  id: string;
  name: string;
  logo?: string;
  fields?: string[];
}

export interface DeliveryCompany {
  id: string;
  name: string;
  active: boolean;
  logo?: string;
  originalName?: string;
  availableDeliveryCompany?: AvailableDeliveryCompany;
  // Dynamic fields will be stored here or handled via a specific property
  [key: string]: any;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  note: string;
  user: string;
}

export interface Coupon {
  id: string;
  name: string;
  code: string;
  discount: number;
}

export interface Invoice {
  id: string;
  plan: string;
  price: number;
  discount: number;
  amount: number; // For UI display mostly
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string; // createdAt or dateExpiry? Usually createdAt for history
  createdAt: string;
  paymentMethod: string;
  proof?: string;
  coupon?: Coupon;
}

export interface Payout {
  id: string;
  amount: number;
  orders: number; // deliveredCount
  note?: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected' | 'cancelled';
  date: string; // createdAt
  userId?: string;
  user?: {
    id: string;
    name: string;
  };
  total?: number; // unpaidAmount or calculated total
}

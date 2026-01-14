# دليل Routing والمصادقة

## 📋 نظرة عامة

تم إضافة نظام Routing كامل مع فصل الصفحات وربطها بالـ API، بالإضافة إلى نظام إدارة الجلسة والمصادقة.

## 🏗️ البنية الجديدة

```
front/
├── contexts/
│   └── AuthContext.tsx          # Context لإدارة المصادقة والجلسة
├── pages/                        # جميع الصفحات
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── UsersPage.tsx
│   ├── OrdersPage.tsx
│   ├── OrderTrackingPage.tsx
│   ├── InventoryPage.tsx
│   ├── ShippingCarriersPage.tsx
│   ├── ShippingPricingPage.tsx
│   ├── StoreLinkingPage.tsx
│   ├── ApiDocsPage.tsx
│   └── SubscriptionsPage.tsx
├── components/
│   ├── Layout.tsx                # Layout component للصفحات المحمية
│   ├── ProtectedRoute.tsx        # Component لحماية الصفحات
│   └── ... (بقية المكونات)
└── App.tsx                       # Router configuration
```

## 🔐 نظام المصادقة

### AuthContext

يوفر `AuthContext` الوظائف التالية:

```typescript
const {
  user,              // المستخدم الحالي
  isAuthenticated,   // حالة المصادقة
  isLoading,         // حالة التحميل
  login,             // تسجيل الدخول
  logout,            // تسجيل الخروج
  refreshUser,       // تحديث بيانات المستخدم
} = useAuth();
```

### حفظ الجلسة

- **Token**: يتم حفظه في `localStorage` تلقائياً عند تسجيل الدخول
- **التحقق التلقائي**: عند تحميل التطبيق، يتم التحقق من Token تلقائياً
- **استرجاع الجلسة**: إذا كان Token موجود وصالح، يتم تحميل بيانات المستخدم تلقائياً

## 🛣️ Routes

### Public Routes
- `/login` - صفحة تسجيل الدخول

### Protected Routes
جميع الصفحات التالية محمية وتتطلب تسجيل الدخول:

- `/dashboard` - لوحة التحكم
- `/users` - إدارة المستخدمين
- `/orders` - تأكيد الطلبات
- `/tracking` - تتبع الطلبات
- `/inventory` - المخزون
- `/carriers` - شركات التوصيل
- `/pricing` - أسعار التوصيل
- `/stores` - ربط المتاجر
- `/api-docs` - وثائق API
- `/subscriptions` - الاشتراكات

## 📄 الصفحات

### كل صفحة:
1. **مستقلة**: كل صفحة في ملف منفصل
2. **مرتبطة بالـ API**: تستخدم `apiService` لجلب البيانات
3. **محمية**: محمية بـ `ProtectedRoute`
4. **تحميل تلقائي**: تحميل البيانات عند فتح الصفحة

### مثال: DashboardPage

```typescript
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.company?.id) return;
      
      const result = await orderService.getAllOrders(user.company.id);
      if (result.success) {
        setOrders(result.orders);
      }
      setLoading(false);
    };
    
    loadData();
  }, [user]);

  return <DashboardView orders={orders} ... />;
};
```

## 🔄 التدفق

### تسجيل الدخول:
1. المستخدم يدخل البريد وكلمة المرور
2. `LoginPage` يستدعي `authService.login()`
3. Token يتم حفظه في `localStorage`
4. بيانات المستخدم يتم حفظها في `AuthContext`
5. إعادة التوجيه للصفحة المطلوبة أو `/dashboard`

### الوصول لصفحة محمية:
1. `ProtectedRoute` يتحقق من `isAuthenticated`
2. إذا لم يكن مسجل دخول → إعادة توجيه لـ `/login`
3. إذا كان مسجل دخول → عرض الصفحة
4. الصفحة تحمل البيانات من API

### تسجيل الخروج:
1. `logout()` يتم استدعاؤه
2. Token يتم حذفه من `localStorage`
3. بيانات المستخدم يتم مسحها من Context
4. إعادة التوجيه لـ `/login`

## 🚀 الاستخدام

### في Component:

```typescript
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>مرحباً {user?.name}</p>
      ) : (
        <p>غير مسجل دخول</p>
      )}
    </div>
  );
};
```

### التنقل بين الصفحات:

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');
navigate('/users');
navigate(-1); // العودة للصفحة السابقة
```

## 📝 ملاحظات مهمة

1. **Token Management**: Token يتم إدارته تلقائياً في `apolloClient.ts`
2. **Auto Refresh**: يمكن إضافة منطق لتجديد Token تلقائياً
3. **Error Handling**: جميع الأخطاء يتم معالجتها في `apiService`
4. **Loading States**: كل صفحة تعرض حالة تحميل أثناء جلب البيانات

## 🔧 الإعدادات المطلوبة

1. **تثبيت Dependencies**:
```bash
cd front
npm install
```

2. **تأكد من وجود `.env.local`**:
```env
VITE_API_URL=http://localhost:8080/graphql
```

## ✅ المميزات

- ✅ Routing كامل مع React Router
- ✅ فصل الصفحات في ملفات منفصلة
- ✅ ربط كل صفحة بـ API
- ✅ حفظ واسترجاع الجلسة تلقائياً
- ✅ Protected Routes للمصادقة
- ✅ Auto-redirect بعد تسجيل الدخول
- ✅ Loading states في كل صفحة
- ✅ Error handling شامل

---

**تاريخ الإنشاء:** بعد إضافة Routing والمصادقة  
**الحالة:** ✅ مكتمل وجاهز للاستخدام

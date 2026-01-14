# هيكلة ربط الواجهة الأمامية مع الخلفية

## 📋 نظرة عامة

تم ربط الواجهة الأمامية (Frontend) مع الخلفية (Backend) بشكل كامل باستخدام **Apollo Client** و **GraphQL API**.

## 🏗️ البنية الهيكلية للملفات

```
front/
├── lib/
│   └── apolloClient.ts          # إعدادات Apollo Client
├── graphql/
│   ├── queries.ts               # جميع استعلامات GraphQL (GET)
│   └── mutations.ts             # جميع عمليات التعديل (POST, PUT, DELETE)
├── services/
│   ├── apiService.ts            # طبقة خدمات API منظمة
│   └── geminiService.ts         # خدمة Gemini AI (موجودة مسبقاً)
├── components/                  # مكونات React
├── App.tsx                      # المكون الرئيسي
├── index.tsx                    # نقطة الدخول (محدث)
└── vite.config.ts               # إعدادات Vite (محدث)
```

## 🔧 الملفات المُنشأة/المُحدثة

### 1. `lib/apolloClient.ts` ✨ جديد
**الوظيفة:** إعداد Apollo Client مع:
- HTTP Link للاتصال بـ GraphQL endpoint
- Auth Link لإضافة Authorization header تلقائياً
- Error Link لمعالجة الأخطاء
- Cache configuration

**المميزات:**
- حفظ Token في `localStorage` تلقائياً
- إعادة التوجيه لصفحة تسجيل الدخول عند انتهاء صلاحية Token
- معالجة أخطاء الشبكة والمصادقة

### 2. `graphql/queries.ts` ✨ جديد
**الوظيفة:** يحتوي على جميع استعلامات GraphQL:
- `GET_CURRENT_USER` - جلب المستخدم الحالي
- `GET_ALL_USERS` - جلب جميع المستخدمين
- `GET_ORDER` - جلب طلب محدد
- `GET_ALL_ORDERS` - جلب جميع الطلبات
- `SEARCH_ORDER` - البحث عن طلب برمز التتبع
- `GET_ALL_PRODUCTS` - جلب جميع المنتجات
- `GET_ALL_STORES` - جلب جميع المتاجر
- `GET_ALL_DELIVERY_COMPANIES` - جلب جميع شركات التوصيل

### 3. `graphql/mutations.ts` ✨ جديد
**الوظيفة:** يحتوي على جميع عمليات التعديل:
- **Auth:** `LOGIN`, `LOGOUT`, `REFRESH_TOKEN`
- **Users:** `CREATE_USER`, `UPDATE_USER`, `DELETE_USER`
- **Orders:** `CREATE_ORDER`, `UPDATE_ORDER`, `CHANGE_STATUS_ORDER`, `DELETE_ORDER`, إلخ
- **Products:** `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`

### 4. `services/apiService.ts` ✨ جديد
**الوظيفة:** طبقة خدمات منظمة وسهلة الاستخدام:

```typescript
// مثال على الاستخدام:
import { authService, orderService } from './services/apiService';

// تسجيل الدخول
const result = await authService.login(email, password);

// جلب الطلبات
const orders = await orderService.getAllOrders(companyId);
```

**الخدمات المتوفرة:**
- `authService` - المصادقة وإدارة المستخدم
- `userService` - إدارة المستخدمين
- `orderService` - إدارة الطلبات

### 5. `index.tsx` ✅ محدث
**التغييرات:**
- إضافة `ApolloProvider` لتغليف التطبيق
- ربط Apollo Client مع React

### 6. `vite.config.ts` ✅ محدث
**التغييرات:**
- إضافة دعم لمتغيرات البيئة `VITE_API_URL`

### 7. `components/LoginView.tsx` ✅ محدث
**التغييرات:**
- ربط مع `authService.login()`
- إضافة معالجة الأخطاء
- حفظ Token تلقائياً عند نجاح تسجيل الدخول

### 8. `package.json` ✅ محدث
**التغييرات:**
- إضافة `@apollo/client`
- إضافة `graphql`

## ⚙️ الإعدادات المطلوبة

### 1. تثبيت Dependencies

```bash
cd front
npm install
```

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في مجلد `front/`:

```env
# Backend API URL (افتراضي: http://localhost:8080/graphql)
VITE_API_URL=http://localhost:8080/graphql

# Gemini API Key (اختياري)
VITE_GEMINI_API_KEY=your_api_key_here
```

## 📖 طريقة الاستخدام

### تسجيل الدخول

```typescript
import { authService } from './services/apiService';

const result = await authService.login(email, password);
if (result.success) {
  // Token يتم حفظه تلقائياً
  const user = result.user;
}
```

### جلب البيانات

```typescript
import { orderService } from './services/apiService';

// جلب جميع الطلبات
const result = await orderService.getAllOrders(companyId, {
  pagination: { limit: 10, page: 1 },
  filter: [
    { field: 'status', operator: 'eq', value: 'pending' }
  ]
});

if (result.success) {
  const orders = result.orders;
  const total = result.total;
}
```

### إنشاء/تحديث البيانات

```typescript
import { orderService } from './services/apiService';

// إنشاء طلب جديد
const result = await orderService.createOrder({
  fullName: 'أحمد محمد',
  phone: '0550123456',
  idCompany: 'company_id',
  // ... باقي البيانات
});

if (result.success) {
  const newOrder = result.order;
}
```

## 🔐 المصادقة (Authentication)

### آلية العمل:
1. عند تسجيل الدخول، يتم حفظ Token في `localStorage` تلقائياً
2. Apollo Client يضيف Token في header: `Authorization: Bearer <token>`
3. عند انتهاء صلاحية Token، يتم إعادة التوجيه تلقائياً لصفحة تسجيل الدخول
4. Backend يستخدم Cookies للـ Refresh Token (`__rf`)

### Token Management:
- **Storage:** `localStorage.getItem('authToken')`
- **Header:** يتم إضافته تلقائياً في كل طلب
- **Refresh:** يمكن استخدام `authService.refreshToken()`

## 🔗 ربط Backend

### معلومات Backend:
- **URL:** `http://localhost:8080/graphql` (افتراضي)
- **Protocol:** GraphQL over HTTP
- **Authentication:** JWT Token في Authorization header
- **CORS:** مُعد للسماح بـ `http://localhost:3000`

### Endpoints المتاحة:
- **GraphQL:** `/graphql` - جميع الاستعلامات والعمليات
- **REST:** `/api/*` - بعض endpoints REST إضافية
- **Health Check:** `/health-check` - للتحقق من حالة الخادم

## 📝 ملاحظات مهمة

### 1. التوافق مع Backend Schema
- جميع Queries و Mutations متوافقة مع Backend Schema
- تم التحقق من أنواع البيانات (Types) مع Backend

### 2. Error Handling
- معالجة أخطاء الشبكة تلقائياً
- معالجة أخطاء المصادقة تلقائياً
- إعادة التوجيه عند انتهاء صلاحية Token

### 3. Cache Management
- Apollo Client يستخدم InMemoryCache
- يمكن تخصيص Cache Policies حسب الحاجة

### 4. TypeScript Support
- جميع الملفات مكتوبة بـ TypeScript
- Types متوفرة في `types.ts`

## 🚀 الخطوات التالية

1. ✅ تثبيت Dependencies
2. ✅ إعداد `.env.local`
3. ⏳ تحديث باقي Components لاستخدام API Services
4. ⏳ إضافة Loading States
5. ⏳ إضافة Error Boundaries
6. ⏳ إضافة Toast Notifications للرسائل

## 📚 المراجع

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Documentation](https://graphql.org/learn/)
- ملف `README_API_INTEGRATION.md` للتفاصيل التقنية

---

**تم إنشاء هذا الملف:** 2024
**آخر تحديث:** بعد ربط Frontend مع Backend

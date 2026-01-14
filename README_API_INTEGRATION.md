# دليل ربط الواجهة الأمامية مع الخلفية

## نظرة عامة

تم ربط الواجهة الأمامية (Frontend) مع الخلفية (Backend) باستخدام **Apollo Client** و **GraphQL**.

## البنية الهيكلية

### 1. إعدادات Apollo Client
**الملف:** `front/lib/apolloClient.ts`

- إعداد Apollo Client مع HTTP Link
- إضافة Authorization header تلقائياً من localStorage
- معالجة الأخطاء (Error Handling)
- إعدادات Cache

### 2. GraphQL Queries & Mutations
**المجلد:** `front/graphql/`

- **`queries.ts`**: جميع استعلامات GraphQL (GET operations)
- **`mutations.ts`**: جميع عمليات التعديل (CREATE, UPDATE, DELETE)

### 3. API Service Layer
**الملف:** `front/services/apiService.ts`

يحتوي على خدمات منظمة:
- `authService`: تسجيل الدخول، تسجيل الخروج، جلب المستخدم الحالي
- `userService`: إدارة المستخدمين
- `orderService`: إدارة الطلبات

## متغيرات البيئة

أنشئ ملف `.env.local` في مجلد `front/`:

```env
# Backend API URL
VITE_API_URL=http://localhost:8080/graphql

# Gemini API Key (إذا لزم الأمر)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## طريقة الاستخدام

### 1. تسجيل الدخول

```typescript
import { authService } from './services/apiService';

const result = await authService.login(email, password);
if (result.success) {
  // Token يتم حفظه تلقائياً في localStorage
  // يمكنك استخدام result.user
}
```

### 2. جلب البيانات

```typescript
import { orderService } from './services/apiService';

// جلب جميع الطلبات
const result = await orderService.getAllOrders(companyId, {
  pagination: { limit: 10, page: 1 }
});

if (result.success) {
  const orders = result.orders;
  const total = result.total;
}
```

### 3. إنشاء/تحديث البيانات

```typescript
import { orderService } from './services/apiService';

// إنشاء طلب جديد
const result = await orderService.createOrder(orderData);
if (result.success) {
  const newOrder = result.order;
}
```

## المصادقة (Authentication)

- يتم إرسال Token تلقائياً في header: `Authorization: Bearer <token>`
- Token يتم حفظه في `localStorage` عند تسجيل الدخول
- عند انتهاء صلاحية Token، يتم إعادة التوجيه تلقائياً لصفحة تسجيل الدخول

## الملفات المحدثة

1. ✅ `package.json` - إضافة Apollo Client dependencies
2. ✅ `lib/apolloClient.ts` - إعدادات Apollo Client
3. ✅ `graphql/queries.ts` - GraphQL Queries
4. ✅ `graphql/mutations.ts` - GraphQL Mutations
5. ✅ `services/apiService.ts` - API Service Layer
6. ✅ `index.tsx` - إضافة ApolloProvider
7. ✅ `vite.config.ts` - إضافة متغيرات البيئة
8. ✅ `components/LoginView.tsx` - ربط مع API

## الخطوات التالية

1. قم بتثبيت dependencies:
```bash
cd front
npm install
```

2. أنشئ ملف `.env.local` مع إعدادات Backend URL

3. قم بتحديث باقي Components لاستخدام API Services بدلاً من البيانات الوهمية

4. أضف Error Handling و Loading States في Components

## ملاحظات مهمة

- Backend يعمل على المنفذ `8080` افتراضياً
- CORS مُعد للسماح بـ `http://localhost:3000`
- Authentication يستخدم JWT tokens
- Cookies تُستخدم للـ Refresh Token (`__rf`)

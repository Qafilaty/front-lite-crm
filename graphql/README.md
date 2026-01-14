# GraphQL Queries & Mutations Structure

## 📁 هيكلة الملفات

تم تقسيم ملفات GraphQL بشكل منظم حسب النموذج (Model) ونوع العملية:

```
graphql/
├── queries/                    # جميع استعلامات GraphQL (GET)
│   ├── userQueries.ts          # استعلامات المستخدمين
│   ├── orderQueries.ts         # استعلامات الطلبات
│   ├── productQueries.ts       # استعلامات المنتجات
│   ├── storeQueries.ts         # استعلامات المتاجر
│   ├── deliveryCompanyQueries.ts # استعلامات شركات التوصيل
│   └── index.ts                # تصدير جميع الاستعلامات
│
└── mutations/                  # جميع عمليات GraphQL (POST, PUT, DELETE)
    ├── authMutations.ts        # عمليات المصادقة (تسجيل الخروج فقط)
    │                          # ملاحظة: LOGIN و REFRESH_TOKEN في queries/userQueries.ts
    ├── userMutations.ts        # عمليات المستخدمين
    ├── orderMutations.ts       # عمليات الطلبات
    ├── productMutations.ts     # عمليات المنتجات
    ├── storeMutations.ts       # عمليات المتاجر
    ├── deliveryCompanyMutations.ts # عمليات شركات التوصيل
    └── index.ts                # تصدير جميع العمليات
```

## 📖 طريقة الاستخدام

### استيراد Queries

```typescript
// استيراد جميع الاستعلامات من مكان واحد
import {
  GET_CURRENT_USER,
  GET_ALL_ORDERS,
  GET_PRODUCT,
} from '../graphql/queries';

// أو استيراد من ملف محدد
import { GET_CURRENT_USER } from '../graphql/queries/userQueries';
```

### استيراد Mutations

```typescript
// استيراد جميع العمليات من مكان واحد
import {
  LOGOUT,
  CREATE_ORDER,
  UPDATE_USER,
} from '../graphql/mutations';

// أو استيراد من ملف محدد
import { LOGOUT } from '../graphql/mutations/authMutations';
```

**ملاحظة مهمة:** 
- `LOGIN` و `REFRESH_TOKEN` موجودان في `queries/userQueries.ts` لأنهما Query وليس Mutation
- استخدم `import { LOGIN, REFRESH_TOKEN } from '../graphql/queries'` لاستيرادهما

## 🎯 المميزات

1. **تنظيم أفضل**: كل model في ملف منفصل
2. **سهولة الصيانة**: إيجاد وتعديل الاستعلامات أسهل
3. **قابلية التوسع**: إضافة استعلامات جديدة بسهولة
4. **تصدير مركزي**: جميع الاستعلامات متاحة من `index.ts`

## 📝 إضافة استعلامات جديدة

### إضافة Query جديد:

1. افتح الملف المناسب في `queries/` (مثلاً `orderQueries.ts`)
2. أضف الاستعلام الجديد
3. صدّره من `queries/index.ts`

### إضافة Mutation جديد:

1. افتح الملف المناسب في `mutations/` (مثلاً `orderMutations.ts`)
2. أضف العملية الجديدة
3. صدّره من `mutations/index.ts`

## 🔍 أمثلة

### مثال: إضافة Query جديد للطلبات

```typescript
// في queries/orderQueries.ts
export const GET_ORDERS_BY_STATUS = gql`
  query GetOrdersByStatus($idCompany: ID!, $status: String!) {
    allOrderByStatus(idCompany: $idCompany, status: $status) {
      id
      numberOrder
      status
    }
  }
`;

// في queries/index.ts
export { GET_ORDERS_BY_STATUS } from './orderQueries';
```

### مثال: إضافة Mutation جديد للمنتجات

```typescript
// في mutations/productMutations.ts
export const BULK_UPDATE_PRODUCTS = gql`
  mutation BulkUpdateProducts($ids: [ID!]!, $content: contentProduct!) {
    bulkUpdateProducts(ids: $ids, content: $content) {
      status
    }
  }
`;

// في mutations/index.ts
export { BULK_UPDATE_PRODUCTS } from './productMutations';
```

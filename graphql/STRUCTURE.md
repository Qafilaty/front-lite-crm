# هيكلة GraphQL - البنية الجديدة

## 📋 نظرة عامة

تم إعادة تنظيم ملفات GraphQL بشكل أفضل، حيث تم تقسيمها حسب النموذج (Model) ونوع العملية (Query/Mutation) لسهولة الصيانة والتنظيم.

## 🗂️ البنية الجديدة

```
graphql/
├── queries/                          # جميع استعلامات GraphQL (GET)
│   ├── userQueries.ts               # استعلامات المستخدمين
│   │   ├── GET_CURRENT_USER
│   │   ├── GET_ALL_USERS
│   │   └── GET_USER
│   │
│   ├── orderQueries.ts               # استعلامات الطلبات
│   │   ├── GET_ORDER
│   │   ├── GET_ALL_ORDERS
│   │   └── SEARCH_ORDER
│   │
│   ├── productQueries.ts            # استعلامات المنتجات
│   │   ├── GET_PRODUCT
│   │   └── GET_ALL_PRODUCTS
│   │
│   ├── storeQueries.ts              # استعلامات المتاجر
│   │   ├── GET_STORE
│   │   └── GET_ALL_STORES
│   │
│   ├── deliveryCompanyQueries.ts     # استعلامات شركات التوصيل
│   │   ├── GET_DELIVERY_COMPANY
│   │   └── GET_ALL_DELIVERY_COMPANIES
│   │
│   └── index.ts                     # تصدير مركزي لجميع الاستعلامات
│
└── mutations/                        # جميع عمليات GraphQL (POST, PUT, DELETE)
    ├── authMutations.ts              # عمليات المصادقة
    │   ├── LOGIN
    │   ├── LOGOUT
    │   └── REFRESH_TOKEN
    │
    ├── userMutations.ts              # عمليات المستخدمين
    │   ├── CREATE_USER
    │   ├── UPDATE_USER
    │   ├── DELETE_USER
    │   ├── UPDATE_MY_PASSWORD
    │   └── ACTIVE_USER
    │
    ├── orderMutations.ts             # عمليات الطلبات
    │   ├── CREATE_ORDER
    │   ├── UPDATE_ORDER
    │   ├── CHANGE_STATUS_ORDER
    │   ├── DELETE_ORDER
    │   ├── DELETE_MULTI_ORDER
    │   ├── RETURNED_MULTI_ORDER
    │   ├── RETURNED_MULTI_ORDER_BY_TRACKING_CODE
    │   ├── DELIVERED_MULTI_ORDER
    │   ├── ADD_FEEDBACK_TO_ORDER
    │   ├── UPDATE_FEEDBACK_TO_ORDER
    │   └── CHANGE_DELIVERY_TYPE_ORDER
    │
    ├── productMutations.ts           # عمليات المنتجات
    │   ├── CREATE_PRODUCT
    │   ├── UPDATE_PRODUCT
    │   ├── DELETE_PRODUCT
    │   ├── DELETE_MULTI_PRODUCT
    │   └── DELETE_VARIANTS_PROBABILITY_PRODUCT
    │
    ├── storeMutations.ts             # عمليات المتاجر
    │   ├── CREATE_STORE
    │   ├── UPDATE_STORE
    │   └── DELETE_STORE
    │
    ├── deliveryCompanyMutations.ts   # عمليات شركات التوصيل
    │   ├── CREATE_DELIVERY_COMPANY
    │   ├── UPDATE_DELIVERY_COMPANY
    │   ├── DELETE_DELIVERY_COMPANY
    │   └── ADD_ORDER_TO_DELIVERY_COMPANY
    │
    └── index.ts                      # تصدير مركزي لجميع العمليات
```

## ✨ المميزات

### 1. تنظيم أفضل
- كل model في ملف منفصل
- فصل واضح بين Queries و Mutations
- سهولة إيجاد الاستعلامات والعمليات

### 2. سهولة الصيانة
- تعديل استعلامات model معين دون التأثير على الباقي
- إضافة استعلامات جديدة بسهولة
- تقليل احتمالية التعارضات (conflicts) في Git

### 3. قابلية التوسع
- إضافة models جديدة بسهولة
- إضافة استعلامات/عمليات جديدة في الملف المناسب
- تصدير مركزي من `index.ts`

### 4. استيراد مرن
```typescript
// استيراد من index (موصى به)
import { GET_ALL_ORDERS, CREATE_ORDER } from '../graphql/queries';
import { LOGIN, UPDATE_USER } from '../graphql/mutations';

// أو استيراد مباشر من ملف محدد
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import { LOGIN } from '../graphql/mutations/authMutations';
```

## 📖 طريقة الاستخدام

### استيراد Queries

```typescript
// من index.ts (الطريقة الموصى بها)
import {
  GET_CURRENT_USER,
  GET_ALL_ORDERS,
  GET_PRODUCT,
} from '../graphql/queries';

// أو من ملف محدد
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
```

### استيراد Mutations

```typescript
// من index.ts (الطريقة الموصى بها)
import {
  LOGIN,
  CREATE_ORDER,
  UPDATE_USER,
} from '../graphql/mutations';

// أو من ملف محدد
import { LOGIN } from '../graphql/mutations/authMutations';
```

## 🔧 إضافة استعلامات/عمليات جديدة

### إضافة Query جديد:

1. افتح الملف المناسب في `queries/`
   - مثال: لإضافة query للطلبات → `orderQueries.ts`

2. أضف الاستعلام:
```typescript
export const GET_ORDERS_BY_STATUS = gql`
  query GetOrdersByStatus($idCompany: ID!, $status: String!) {
    allOrderByStatus(idCompany: $idCompany, status: $status) {
      id
      numberOrder
      status
    }
  }
`;
```

3. صدّره من `queries/index.ts`:
```typescript
export { GET_ORDERS_BY_STATUS } from './orderQueries';
```

### إضافة Mutation جديد:

1. افتح الملف المناسب في `mutations/`
   - مثال: لإضافة mutation للمنتجات → `productMutations.ts`

2. أضف العملية:
```typescript
export const BULK_UPDATE_PRODUCTS = gql`
  mutation BulkUpdateProducts($ids: [ID!]!, $content: contentProduct!) {
    bulkUpdateProducts(ids: $ids, content: $content) {
      status
    }
  }
`;
```

3. صدّره من `mutations/index.ts`:
```typescript
export { BULK_UPDATE_PRODUCTS } from './productMutations';
```

## 📝 ملاحظات مهمة

1. **استخدم index.ts للاستيراد**: هذا يضمن أن جميع الاستعلامات/العمليات متاحة من مكان واحد

2. **حافظ على التنظيم**: ضع كل query/mutation في الملف المناسب حسب model

3. **وثّق الاستعلامات الجديدة**: أضف تعليقات توضيحية عند الحاجة

4. **تأكد من التصدير**: لا تنس تصدير الاستعلامات/العمليات الجديدة من `index.ts`

## 🔄 التغييرات من البنية القديمة

### قبل:
```
graphql/
├── queries.ts    (جميع الاستعلامات في ملف واحد)
└── mutations.ts   (جميع العمليات في ملف واحد)
```

### بعد:
```
graphql/
├── queries/      (مقسمة حسب model)
└── mutations/     (مقسمة حسب model)
```

## ✅ الملفات المحدثة

- ✅ `services/apiService.ts` - تم تحديث الـ imports لاستخدام البنية الجديدة
- ✅ حذف `graphql/queries.ts` القديم
- ✅ حذف `graphql/mutations.ts` القديم
- ✅ إنشاء جميع الملفات الجديدة المنظمة

## 🎯 الفوائد

1. **كود أنظف**: كل model في مكانه
2. **صيانة أسهل**: إيجاد وتعديل الاستعلامات أسرع
3. **تعاون أفضل**: تقليل التعارضات في Git
4. **قابلية التوسع**: إضافة features جديدة بسهولة

---

**تاريخ التحديث:** بعد إعادة التنظيم  
**الحالة:** ✅ مكتمل وجاهز للاستخدام

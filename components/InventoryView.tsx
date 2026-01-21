import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import {
  Plus, Search, Edit3, Trash2,
  Box, Tag, Filter, ChevronLeft,
  ChevronRight, Copy, AlertCircle, ChevronDown, ChevronUp, PackageOpen, CheckCircle2
} from 'lucide-react';
import ProductModal from './ProductModal';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import EmptyState from './common/EmptyState';
import TableSkeleton from './common/TableSkeleton';
import toast from 'react-hot-toast';

interface InventoryViewProps {
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
  onAdd: (productData: any) => Promise<boolean>;
  onUpdate: (id: string, productData: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  isLoading?: boolean;
  onRefresh: () => Promise<void>;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  setInventory,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Computed ---

  const filteredProducts = useMemo(() => {
    return inventory.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all'
        ? true
        : filterStatus === 'active' ? p.status !== false
          : p.status === false;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, filterStatus]);

  // Helpers for display
  const getStockInfo = (p: Product) => {
    return p.quantity || 0;
  };

  const getPriceDisplay = (p: Product) => {
    if (p.variantsProbability && p.variantsProbability.length > 0) {
      const prices = p.variantsProbability.map(v => v.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) return <span className="font-bold text-slate-900">{min} ر.س</span>;
      return (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900">{min} - {max} ر.س</span>
          <span className="text-gray-400">حسب الخيار</span>
        </div>
      );
    }
    return <span className="font-bold text-slate-900">{p.price} ر.س</span>;
  };

  // --- Actions ---

  const handleProductSuccess = async (savedProduct: any) => {
    // Robust Refresh: Reload all data from server
    await onRefresh();
    setIsProductModalOpen(false);
    setSelectedProduct(undefined);
  };

  const openAddModal = () => {
    setSelectedProduct(undefined);
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    const success = await onDelete(productToDelete);

    if (success) {
      // Robust Refresh
      await onRefresh();
      toast.success('تم حذف المنتج بنجاح');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } else {
      toast.error('فشل حذف المنتج');
    }
    setIsDeleting(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedProductId(prev => prev === id ? null : id);
  };



  return (
    <div className="flex flex-col h-full" dir="rtl">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">إدارة المخزون</h2>
          <p className="text-slate-500 text-sm">إدارة وإضافة وتعديل المنتجات والمتغيرات الخاصة بها</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          إضافة منتج جديد
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث بالاسم أو SKU..."
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm text-gray-600 placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-gray-50 p-1 rounded-lg">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'active' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            نشط
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === 'draft' ? 'bg-white text-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            مسودة
          </button>
        </div>
        <button className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6">
          <TableSkeleton columns={6} rows={8} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Box}
          title={searchQuery ? "لا توجد نتائج" : "المخزون فارغ"}
          description={searchQuery ? "جرب كلمة بحث أخرى" : "ابدأ بإضافة منتجاتك"}
          actionLabel={!searchQuery ? "إضافة منتج" : undefined}
          onAction={!searchQuery ? openAddModal : undefined}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المنتج والقسم</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المخزون</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">السعر</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => {
                  const stock = getStockInfo(product);
                  const isLowStock = stock > 0 && stock < 10;
                  const isOutOfStock = stock === 0;
                  const isExpanded = expandedProductId === product.id;
                  const hasVariants = product.variants && product.variants.length > 0;

                  return (
                    <React.Fragment key={product.id}>
                      <tr
                        onClick={() => toggleExpand(product.id || '')}
                        className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-gray-50/80'}`}
                      >
                        <td className="px-6 py-4 relative">
                          <div className="flex items-center gap-4">
                            <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : 'rotate-0 group-hover:text-indigo-500'}`}>
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>

                            <div className="h-12 w-12 rounded-lg border border-gray-100 bg-gray-50 p-0.5 overflow-hidden shrink-0">
                              {product.thumbnail ? (
                                <img src={product.thumbnail} alt="" className="h-full w-full object-cover rounded-md" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300">
                                  <Box size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className={`font-bold text-sm mb-0.5 transition-colors ${isExpanded ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                                {product.name}
                              </h4>
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                <Tag size={10} />
                                {product.category || 'عام'}
                              </span>
                            </div>
                          </div>
                          {hasVariants && !isExpanded && (
                            <div className="absolute left-1/2 bottom-1 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-indigo-500 bg-white shadow-sm border px-2 py-0.5 rounded-full border-indigo-100">
                                {product.variantsProbability?.length} خيارات
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="group/sku flex items-center gap-1.5 text-xs font-mono font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(product.sku); }}
                            title="نسخ"
                          >
                            {product.sku || '---'}
                            <Copy size={10} className="opacity-0 group-hover/sku:opacity-100" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-slate-700'}`}>
                                {stock}
                              </span>
                              <span className="text-xs text-gray-400">قطعة</span>
                            </div>
                            {isLowStock && (
                              <span className="text-[10px] text-orange-600 flex items-center gap-1">
                                <AlertCircle size={10} /> مخزون منخفض
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="text-[10px] text-red-600 flex items-center gap-1">
                                <AlertCircle size={10} /> نفد المخزون
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getPriceDisplay(product)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status !== false ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                            {product.status !== false ? 'نشط' : 'مسودة'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => openEditModal(product, e)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                              title="تعديل"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={(e) => confirmDelete(product.id, e)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW FOR VARIANTS */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/20 shadow-inner">
                          <td colSpan={6} className="px-6 pb-6 pt-0">
                            <div className="relative">
                              {/* Connector Line */}
                              <div className="absolute top-0 right-8 w-px h-4 bg-gray-200"></div>
                              <div className="absolute top-4 right-8 w-4 h-px bg-gray-200"></div>

                              <div className="mr-12 mt-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {!hasVariants ? (
                                  <div className="p-6 text-center text-gray-400 flex flex-col items-center">
                                    <PackageOpen size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">هذا المنتج بسيط وليس له متغيرات (مثل اللون أو المقاس).</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                        <tr>
                                          <th className="px-4 py-3 font-medium text-xs">خيار المنتج</th>
                                          <th className="px-4 py-3 font-medium text-xs">SKU</th>
                                          <th className="px-4 py-3 font-medium text-xs">السعر</th>
                                          <th className="px-4 py-3 font-medium text-xs">التكلفة</th>
                                          <th className="px-4 py-3 font-medium text-xs">الكمية المتوفرة</th>
                                          <th className="px-4 py-3 font-medium text-xs text-center">الافتراضي</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {product.variantsProbability?.map((variant, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{variant.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{variant.sku}</td>
                                            <td className="px-4 py-3 text-slate-700 font-bold">{variant.price} ر.س</td>
                                            <td className="px-4 py-3 text-gray-500">{variant.cost} ر.س</td>
                                            <td className="px-4 py-3">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant.quantity > 5 ? 'bg-green-50 text-green-700' : variant.quantity > 0 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                                                {variant.quantity} قطعة
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              {variant.isDefault && (
                                                <div className="flex justify-center">
                                                  <CheckCircle2 size={16} className="text-indigo-600" />
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination - Placeholder for now or implement if data allows */}
          {inventory.length > 20 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <span className="text-xs text-gray-500">
                عرض <span className="font-bold text-slate-800">{filteredProducts.length}</span> من أصل <span className="font-bold text-slate-800">{inventory.length}</span> منتج
              </span>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-50" disabled>
                  <ChevronRight size={16} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/30">1</button>
                <button className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-slate-800 hover:bg-gray-50">
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={handleProductSuccess}
        product={selectedProduct}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="حذف المنتج"
        description="هل أنت متأكد من حذف هذا المنتج؟"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default InventoryView;

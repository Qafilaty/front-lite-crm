import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../components/common';
import { productService } from '../../../services/apiService';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { Product, ProductVariant } from '../../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  product?: Product | null;
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: 0,
    cost: 0,
    quantity: 0,
    weight: 0,
    status: 'active',
    note: '',
  });
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price || 0,
        cost: 0,
        quantity: product.stock || 0,
        weight: 0,
        status: 'active',
        note: '',
      });

      // Transform variants
      if (product.variants && product.variants.length > 0) {
        const transformedVariants = product.variants.map(v => ({
          name: v.name,
          sku: v.sku,
          price: v.price || product.price,
          cost: 0,
          quantity: v.stock || 0,
        }));
        setVariants(transformedVariants);
      }
    } else {
      // Reset for add mode
      setFormData({
        name: '',
        sku: '',
        price: 0,
        cost: 0,
        quantity: 0,
        weight: 0,
        status: 'active',
        note: '',
      });
      setVariants([]);
    }
  }, [product, mode, isOpen]);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: '',
        sku: '',
        price: formData.price,
        cost: formData.cost,
        quantity: 0,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.company?.id) {
      alert('خطأ: معرف الشركة غير موجود');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        price: Number(formData.price),
        cost: Number(formData.cost),
        quantity: Number(formData.quantity),
        weight: Number(formData.weight),
        status: formData.status,
        note: formData.note,
        idCompany: user.company.id,
        variantsProbability: variants.length > 0 ? variants.map(v => ({
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          cost: Number(v.cost),
          quantity: Number(v.quantity),
        })) : undefined,
      };

      let result;
      if (mode === 'add') {
        result = await productService.createProduct(productData);
      } else if (product) {
        result = await productService.updateProduct(product.id, productData);
      }

      if (result.success) {
        onSuccess();
        onClose();
        alert(mode === 'add' ? 'تم إضافة المنتج بنجاح!' : 'تم تحديث المنتج بنجاح!');
      } else {
        alert(result.error || 'حدث خطأ أثناء حفظ المنتج');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'إضافة منتج جديد' : 'تعديل المنتج'}
      description="قم بملء البيانات المطلوبة"
      size="lg"
      showCloseButton={!loading}
    >
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        {/* Product Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            اسم المنتج *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            placeholder="أدخل اسم المنتج"
          />
        </div>

        {/* SKU */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            SKU (رمز المنتج) *
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            placeholder="أدخل رمز SKU"
          />
        </div>

        {/* Price & Cost & Quantity */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              السعر *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
              min="0"
              step="0.01"
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              التكلفة
            </label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
              min="0"
              step="0.01"
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              الكمية *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              required
              min="0"
              disabled={loading || variants.length > 0}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Variants Section */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                المتغيرات (اختياري)
              </h4>
              <p className="text-[9px] text-slate-400 font-bold mt-1">
                مثل: الأحجام والألوان
              </p>
            </div>
            <Button
              type="button"
              onClick={addVariant}
              variant="secondary"
              size="sm"
              icon={Plus}
              disabled={loading}
            >
              إضافة متغير
            </Button>
          </div>

          {variants.map((variant, index) => (
            <div key={index} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-black text-slate-600">
                  متغير {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={loading}
                  className="text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => updateVariant(index, 'name', e.target.value)}
                  placeholder="اسم المتغير"
                  disabled={loading}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                />
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                  placeholder="SKU"
                  disabled={loading}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                />
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                  placeholder="السعر"
                  min="0"
                  step="0.01"
                  disabled={loading}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                />
                <input
                  type="number"
                  value={variant.quantity}
                  onChange={(e) => updateVariant(index, 'quantity', Number(e.target.value))}
                  placeholder="الكمية"
                  min="0"
                  disabled={loading}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            fullWidth
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={Save}
            fullWidth
          >
            {mode === 'add' ? 'إضافة المنتج' : 'حفظ التغييرات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

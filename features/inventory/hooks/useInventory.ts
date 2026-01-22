import { useState, useEffect, useCallback } from 'react';
import { productService } from '../../../services/apiService';
import type { Product } from '../../../types';

export const useInventory = (companyId: string | undefined) => {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [total, setTotal] = useState(0);

  const loadInventory = useCallback(async (page = 1, limit = 10, filters?: { search?: string; status?: boolean | null }) => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);

      const advancedFilter: any = {};
      if (filters?.search) {
        advancedFilter.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { sku: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (typeof filters?.status === 'boolean') {
        advancedFilter.status = filters.status;
      }

      const result = await productService.getAllProducts({
        pagination: { limit, page },
        advancedFilter
      });

      if (result.success && result.products) {
        const transformedProducts = result.products.map((p: any) => ({
          id: p.id,
          thumbnail: p.thumbnail,
          name: p.name || '',
          sku: p.sku || '',
          stock: p.quantity || 0,
          quantity: p.quantity || 0,
          price: p.variantsProbability?.[0]?.price || 0,
          cost: p.cost || 0, // Ensure cost is mapped
          category: 'عام',
          variantsProbability: p.variantsProbability || [], // Ensure this is passed
          variants: p.variantsProbability?.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.quantity || 0,
            price: v.price,
            cost: v.cost,
          })) || [],
          // Map raw variants if needed for modal
          rawVariants: p.variants || []
        }));
        setInventory(transformedProducts);
        setTotal(result.total || 0);
      } else {
        setError(result.error || 'فشل تحميل المنتجات');
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const deleteProduct = async (productId: string) => {
    try {
      const result = await productService.deleteProduct(productId);
      if (result.success) {
        setInventory(prev => prev.filter(p => p.id !== productId));
        return true;
      } else {
        throw new Error(result.error || 'فشل حذف المنتج');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  return {
    inventory,
    loading,
    error,
    loadInventory,
    deleteProduct,
    total,
  };
};

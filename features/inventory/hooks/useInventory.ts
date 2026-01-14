import { useState, useEffect, useCallback } from 'react';
import { productService } from '../../../services/apiService';
import type { Product } from '../../../types';

export const useInventory = (companyId: string | undefined) => {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await productService.getAllProducts(companyId, {
        pagination: { limit: 100, page: 1 }
      });
      
      if (result.success && result.products) {
        const transformedProducts = result.products.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          sku: p.sku || '',
          stock: p.quantityInStock || 0,
          price: p.variantsProbability?.[0]?.price || 0,
          category: 'عام',
          variants: p.variantsProbability?.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.quantityInStock || 0,
            price: v.price,
          })) || [],
        }));
        setInventory(transformedProducts);
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
  };
};

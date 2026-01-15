import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InventoryView from '../components/InventoryView';
import { productService } from '../services/apiService';
import type { Product } from '../types';

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    if (!user?.company?.id) return;

    try {
      setLoading(true);
      const result = await productService.getAllProducts(user.company.id, {
        pagination: { limit: 100, page: 1 }
      });

      if (result.success && result.products) {
        // Transform backend data to frontend format
        const transformedProducts: Product[] = result.products.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          sku: p.sku || '',
          category: 'عام', // Default category
          price: p.variantsProbability?.[0]?.price || p.price || 0,
          stock: p.quantityInStock || 0,
          variants: p.variantsProbability?.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.quantityInStock || 0,
            price: v.price,
          })) || [],
        }));
        setInventory(transformedProducts);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [user]);

  const handleAddProduct = async (productData: any) => {
    try {
      const result = await productService.createProduct({
        ...productData,
        idCompany: user?.company?.id,
      });

      if (result.success) {
        await loadInventory(); // Reload inventory
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  };

  const handleUpdateProduct = async (id: string, productData: any) => {
    try {
      const result = await productService.updateProduct(id, {
        ...productData,
        idCompany: user?.company?.id,
      });

      if (result.success) {
        await loadInventory(); // Reload inventory
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const result = await productService.deleteProduct(id);

      if (result.success) {
        await loadInventory(); // Reload inventory
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 font-bold">جاري تحميل المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <InventoryView
      inventory={inventory}
      setInventory={setInventory}
      onAdd={handleAddProduct}
      onUpdate={handleUpdateProduct}
      onDelete={handleDeleteProduct}
      isLoading={loading}
    />
  );
};

export default InventoryPage;

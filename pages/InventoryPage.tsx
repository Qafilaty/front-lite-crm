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
      const result = await productService.getAllProducts({
        pagination: { limit: 100, page: 1 }
      });

      if (result.success && result.products) {

        // Transform backend data to frontend format
        const transformedProducts: Product[] = result.products.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          sku: p.sku || '',
          category: 'عام', // Default category
          thumbnail: p.thumbnail || '',
          status: p.status !== false,
          note: p.note || '',
          price: p.variantsProbability?.[0]?.price || p.price || 0,
          cost: p.variantsProbability?.[0]?.cost || p.cost || 0,
          stock: p.quantityInStock || 0,

          // Map definitions if available
          variants: p.variants?.map((v: any) => ({
            name: v.name,
            type: v.type,
            value: v.value
          })) || [],

          // Map probabilities (actual variants)
          variantsProbability: p.variantsProbability?.map((v: any) => ({
            id: v.id || v._id,
            name: v.name,
            sku: v.sku,
            quantity: v.quantityInStock || v.quantity || 0,
            price: v.price,
            cost: v.cost,
            isDefault: v.isDefault
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



  return (
    <InventoryView
      inventory={inventory}
      setInventory={setInventory}
      onAdd={handleAddProduct}
      onUpdate={handleUpdateProduct}
      onDelete={handleDeleteProduct}
      isLoading={loading}
      onRefresh={loadInventory}
    />
  );
};

export default InventoryPage;

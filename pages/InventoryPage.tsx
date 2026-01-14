import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InventoryView from '../components/InventoryView';
import type { Product } from '../types';

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      if (!user?.company?.id) return;

      try {
        setLoading(true);
        // TODO: إضافة productService عند إنشائه
        // const result = await productService.getAllProducts(user.company.id);
        // if (result.success) {
        //   setInventory(result.products);
        // }
        
        // مؤقتاً: بيانات وهمية
        setInventory([]);
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [user]);

  const handleSetInventory = async (newInventory: Product[]) => {
    setInventory(newInventory);
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

  return <InventoryView inventory={inventory} setInventory={handleSetInventory} />;
};

export default InventoryPage;

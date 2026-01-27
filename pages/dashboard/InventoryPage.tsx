import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InventoryView from '../../components/InventoryView';
import { productService } from '../../services/apiService';
import type { Product } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const loadInventory = useCallback(async () => {
    if (!user?.company?.id) return;

    try {
      setLoading(true);

      const advancedFilter: any = {};

      // Status Filter
      if (filterStatus === 'active') advancedFilter.status = true;
      if (filterStatus === 'draft') advancedFilter.status = false;

      // Search Filter
      if (debouncedSearch) {
        advancedFilter.$or = [
          { name: { $regex: debouncedSearch, $options: 'i' } },
          { sku: { $regex: debouncedSearch, $options: 'i' } }
        ];
      }

      const result = await productService.getAllProducts({
        pagination: { limit: itemsPerPage, page: currentPage },
        advancedFilter: Object.keys(advancedFilter).length > 0 ? advancedFilter : undefined
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
          stock: p.quantity || 0,
          quantity: p.quantity || 0,

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
            quantity: v.quantity || 0,
            price: v.price,
            cost: v.cost,
            isDefault: v.isDefault
          })) || [],
        }));
        setInventory(transformedProducts);
        setTotalItems(result.total || 0);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, filterStatus, currentPage, itemsPerPage]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Handle Search Change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle Filter Change
  const handleFilterStatusChange = (status: 'all' | 'active' | 'draft') => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

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

      // Pagination & Filters
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalCount={totalItems}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}

      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      filterStatus={filterStatus}
      onFilterStatusChange={handleFilterStatusChange}
    />
  );
};

export default InventoryPage;

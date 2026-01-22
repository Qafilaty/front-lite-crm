import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from './hooks/useInventory';
import { ProductModal } from './components/ProductModal';
import InventoryView from '../../components/InventoryView';
import { ConfirmDialog } from '../../components/common';
import type { Product } from '../../types';

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const { inventory, loading, error, loadInventory, deleteProduct, total } = useInventory(user?.company?.id);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    setDeleteLoading(true);
    try {
      await deleteProduct(selectedProduct.id);
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      alert('تم حذف المنتج بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء حذف المنتج');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSuccess = () => {
    loadInventory();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 font-bold">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-rose-600 font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }


  React.useEffect(() => {
    loadInventory(page, limit, {
      search: debouncedSearch,
      status: filterStatus === 'all' ? null : filterStatus === 'active'
    });
  }, [loadInventory, page, limit, debouncedSearch, filterStatus]);

  return (
    <>
      <InventoryView
        inventory={inventory}
        setInventory={() => { }}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        // Pagination Props
        currentPage={page}
        totalCount={total}
        itemsPerPage={limit}
        onPageChange={setPage}
        onItemsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1); // Reset to first page when limit changes
        }}
        isLoading={loading}
        // Filter Props
        searchQuery={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setPage(1); }} // Reset to page 1 on search
        filterStatus={filterStatus}
        onFilterStatusChange={(status) => { setFilterStatus(status); setPage(1); }} // Reset to page 1 on filter
      />

      {/* Add Product Modal */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
        onSuccess={handleModalSuccess}
      />

      {/* Edit Product Modal */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        mode="edit"
        product={selectedProduct}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف المنتج "${selectedProduct?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف المنتج"
        loading={deleteLoading}
      />
    </>
  );
};

export default InventoryPage;
